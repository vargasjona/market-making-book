from decimal import Decimal
from pathlib import Path
from nautilus_trader.config import StrategyConfig
from nautilus_trader.indicators import ExponentialMovingAverage
from nautilus_trader.model.data import Bar
from nautilus_trader.model.data import BarType
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.trading.strategy import Strategy

import numpy as np
import pandas as pd
from nautilus_trader.backtest.engine import BacktestEngine
from nautilus_trader.config import BacktestEngineConfig
from nautilus_trader.config import LoggingConfig
from nautilus_trader.model.currencies import USD
from nautilus_trader.model.enums import AccountType
from nautilus_trader.model.enums import OmsType
from nautilus_trader.model.identifiers import Venue
from nautilus_trader.model.objects import Money
from nautilus_trader.persistence.wranglers import BarDataWrangler
from nautilus_trader.test_kit.providers import TestInstrumentProvider

class EMACrossConfig(StrategyConfig, frozen=True):
    instrument_id: InstrumentId
    bar_type: BarType
    trade_size: Decimal
    fast_ema_period: int = 10
    slow_ema_period: int = 20

class EMACross(Strategy):
    def __init__(self, config: EMACrossConfig):
        super().__init__(config)
        self.fast_ema = ExponentialMovingAverage(config.fast_ema_period)
        self.slow_ema = ExponentialMovingAverage(config.slow_ema_period)
    def on_start(self):
        self.register_indicator_for_bars(self.config.bar_type, self.fast_ema)
        self.register_indicator_for_bars(self.config.bar_type, self.slow_ema)
        self.subscribe_bars(self.config.bar_type)
    def on_bar(self, bar: Bar):
        if not self.indicators_initialized():
            return
        if self.fast_ema.value >= self.slow_ema.value:
            if self.portfolio.is_flat(self.config.instrument_id):
                self.buy()
            elif self.portfolio.is_net_short(self.config.instrument_id):
                self.close_all_positions(self.config.instrument_id)
                self.buy()
        elif self.fast_ema.value < self.slow_ema.value:
            if self.portfolio.is_flat(self.config.instrument_id):
                self.sell()
            elif self.portfolio.is_net_long(self.config.instrument_id):
                self.close_all_positions(self.config.instrument_id)
                self.sell()
    def buy(self):
        instrument = self.cache.instrument(self.config.instrument_id)
        order = self.order_factory.market(
            self.config.instrument_id,
            OrderSide.BUY,
            instrument.make_qty(self.config.trade_size),
        )
        self.submit_order(order)
    def sell(self):
        instrument = self.cache.instrument(self.config.instrument_id)
        order = self.order_factory.market(
            self.config.instrument_id,
            OrderSide.SELL,
            instrument.make_qty(self.config.trade_size),
        )
        self.submit_order(order)
    def on_stop(self):
        self.close_all_positions(self.config.instrument_id)

def main():
        # Create a EUR/USD instrument on the SIM venue
    EURUSD = TestInstrumentProvider.default_fx_ccy("EUR/USD")
    # Generate synthetic 1-minute bars (random walk around 1.10)
    rng = np.random.default_rng(42)
    n = 10_000
    price = 1.10 + np.cumsum(rng.normal(0, 0.0002, n))
    spread = np.abs(rng.normal(0, 0.0003, n))
    bars_df = pd.DataFrame(
        {
            "open": price,
            "high": price + spread,
            "low": price - spread,
            "close": price + rng.normal(0, 0.00005, n),
        },
        index=pd.date_range("2024-01-01", periods=n, freq="1min", tz="UTC"),
    )
    bars_df["high"] = bars_df[["open", "high", "close"]].max(axis=1)
    bars_df["low"] = bars_df[["open", "low", "close"]].min(axis=1)
    bar_type = BarType.from_str("EUR/USD.SIM-1-MINUTE-LAST-EXTERNAL")
    bars = BarDataWrangler(bar_type, EURUSD).process(bars_df)

    engine = BacktestEngine(
        config=BacktestEngineConfig(
            logging=LoggingConfig(log_level="ERROR"),
        ),
    )

    # Add a simulated FX venue
    SIM = Venue("SIM")
    engine.add_venue(
        venue=SIM,
        oms_type=OmsType.NETTING,
        account_type=AccountType.MARGIN,
        starting_balances=[Money(1_000_000, USD)],
        base_currency=USD,
        default_leverage=Decimal(1),
    )

    # Add instrument, data, and strategy
    engine.add_instrument(EURUSD)
    engine.add_data(bars)

    strategy = EMACross(
        EMACrossConfig(
            instrument_id=EURUSD.id,
            bar_type=bar_type,
            trade_size=Decimal(100000),
        ),
    )
    engine.add_strategy(strategy)

    # Run the backtest
    engine.run()

    # Review results
    reports_dir = Path(__file__).parent / "reports"
    reports_dir.mkdir(exist_ok=True)

    account = engine.trader.generate_account_report(SIM)
    positions = engine.trader.generate_positions_report()
    fills = engine.trader.generate_order_fills_report()

    # Save the full reports to CSV so the terminal isn't flooded
    account.to_csv(reports_dir / "account.csv")
    positions.to_csv(reports_dir / "positions.csv")
    fills.to_csv(reports_dir / "order_fills.csv")

    # Print a short, readable summary instead of thousands of rows
    def to_float(series: pd.Series) -> pd.Series:
        # Report values look like "-19.40 USD"; keep only the numeric part.
        return pd.to_numeric(
            series.astype(str).str.replace(r"[^0-9.\-]", "", regex=True),
            errors="coerce",
        )

    starting_balance = 1_000_000.0
    final_balance = (
        to_float(account["total"]).iloc[-1] if not account.empty else starting_balance
    )
    total_pnl = final_balance - starting_balance
    realized_pnl = (
        to_float(positions["realized_pnl"]).sum() if "realized_pnl" in positions else 0.0
    )

    print("\n=== Backtest summary ===")
    print(f"Starting balance : {starting_balance:,.2f} USD")
    print(f"Final balance    : {final_balance:,.2f} USD")
    print(f"Total P&L        : {total_pnl:,.2f} USD")
    print(f"Realized P&L     : {realized_pnl:,.2f} USD")
    print(f"Positions (round-trips): {len(positions)}")
    print(f"Order fills            : {len(fills)}")
    print(f"\nFull reports written to: {reports_dir}")


if __name__ == "__main__":
    main()
