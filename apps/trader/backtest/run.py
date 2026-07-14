#!/usr/bin/env python3
# -------------------------------------------------------------------------------------------------
#  Copyright (C) 2015-2026 Nautech Systems Pty Ltd. All rights reserved.
#  https://nautechsystems.io
#
#  Licensed under the GNU Lesser General Public License Version 3.0 (the "License");
#  You may not use this file except in compliance with the License.
#  You may obtain a copy of the License at https://www.gnu.org/licenses/lgpl-3.0.en.html
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
# -------------------------------------------------------------------------------------------------

from decimal import Decimal
from pathlib import Path

# Support both `uv run backtest/run.py` (direct) and `python -m backtest.run` (module).
try:
    from backtest.data import load_binance_bars
    from backtest.data import load_binance_bars_resampled
    from backtest.strategy import EMACrossBracketAlgo
    from backtest.strategy import EMACrossBracketAlgoConfig
except ModuleNotFoundError:
    from data import load_binance_bars  # type: ignore[no-redef]
    from data import load_binance_bars_resampled  # type: ignore[no-redef]
    from strategy import EMACrossBracketAlgo  # type: ignore[no-redef]
    from strategy import EMACrossBracketAlgoConfig  # type: ignore[no-redef]

from nautilus_trader.analysis import TearsheetBarsWithFillsChart
from nautilus_trader.analysis import TearsheetConfig
from nautilus_trader.analysis import TearsheetDrawdownChart
from nautilus_trader.analysis import TearsheetEquityChart
from nautilus_trader.analysis import TearsheetRunInfoChart
from nautilus_trader.analysis import TearsheetStatsTableChart
from nautilus_trader.analysis import create_tearsheet
from nautilus_trader.backtest.engine import BacktestEngine
from nautilus_trader.config import BacktestEngineConfig
from nautilus_trader.config import CacheConfig
from nautilus_trader.config import LoggingConfig
from nautilus_trader.model import TraderId
from nautilus_trader.model.currencies import USDT
from nautilus_trader.model.data import BarType
from nautilus_trader.model.enums import AccountType
from nautilus_trader.model.enums import OmsType
from nautilus_trader.model.identifiers import Venue
from nautilus_trader.model.objects import Money
from nautilus_trader.test_kit.providers import TestInstrumentProvider

if __name__ == "__main__":
    # Step 1: Configure and create backtest engine
    engine = BacktestEngine(
        config=BacktestEngineConfig(
            trader_id=TraderId("BACKTEST_TRADER-001"),
            logging=LoggingConfig(
                # 260k+ BTCUSDT bars: keep the console quiet (DEBUG would flood it).
                log_level="ERROR",
            ),
            # The cache defaults to keeping only the last 10,000 bars, so the tearsheet
            # candlestick would show just the final ~week. Raise it to hold the full
            # 6-month history (260,640 bars) so the whole Jan–Jun range is plotted.
            cache=CacheConfig(bar_capacity=1_000_000),
        )
    )

    # Step 2: Define exchange and add it to the engine.
    #   MARGIN account: the EMA-cross strategy goes both long AND short, which a
    #   spot CASH account can't do (selling BTC you don't hold => negative balance).
    #   MARGIN allows shorting, so the strategy can trade freely.
    BINANCE = Venue("BINANCE")
    engine.add_venue(
        venue=BINANCE,
        oms_type=OmsType.NETTING,  # Order Management System type
        account_type=AccountType.MARGIN,  # Allows short positions
        starting_balances=[Money(200, USDT)],  # Initial account balance
        base_currency=USDT,  # Single-currency margin account
        default_leverage=Decimal(1),  # No leverage
    )

    # Step 3: Create instrument definition and add it to the engine
    BTCUSDT_INSTRUMENT = TestInstrumentProvider.btcusdt_binance()
    engine.add_instrument(BTCUSDT_INSTRUMENT)

    # ==========================================================================================
    # POINT OF FOCUS: Loading bars from CSV
    # ------------------------------------------------------------------------------------------

    btc_data_dir = Path(__file__).parent / "btc"

    # Step 4a: Load the raw 1-minute klines. These feed the engine at full
    #   resolution so fills and the ATR bracket are simulated on fine-grained price
    #   action, even though the strategy's SIGNAL runs on a slower timeframe.
    BTCUSDT_1MIN_BARTYPE = BarType.from_str(
        f"{BTCUSDT_INSTRUMENT.id}-1-MINUTE-LAST-EXTERNAL",
    )
    btcusdt_1min_bars_list = load_binance_bars(
        btc_data_dir,
        BTCUSDT_INSTRUMENT,
        bar_type=BTCUSDT_1MIN_BARTYPE,
    )
    engine.add_data(btcusdt_1min_bars_list)

    # Step 4b: Load a 1-HOUR series — the strategy trades on THIS.
    #   Why: an EMA-cross on 1-minute bars fires ~7,000 trades/month, and the
    #   commissions alone (~$900k) dwarf any edge — a parameter sweep showed the
    #   1m config losing ~$912k while the same strategy on 1h bars was roughly
    #   break-even (~100x fewer trades, ~5x the win rate). Signal on 1h, not 1m.
    #   This same series also drives the tearsheet candlestick (fast to render).
    BTCUSDT_SIGNAL_RULE = "1h"
    btcusdt_1h_bars = load_binance_bars_resampled(
        btc_data_dir,
        BTCUSDT_INSTRUMENT,
        rule=BTCUSDT_SIGNAL_RULE,
    )
    BTCUSDT_1H_BARTYPE = btcusdt_1h_bars[0].bar_type
    BTCUSDT_CHART_BARTYPE = BTCUSDT_1H_BARTYPE
    engine.add_data(btcusdt_1h_bars)

    # ------------------------------------------------------------------------------------------
    # END OF POINT OF FOCUS
    # ==========================================================================================

    # Step 5: Create strategy and add it to the engine.
    #   EMACrossBracketAlgo is fully bar-driven: MARKET entries with an ATR-sized
    #   bracket (fixed SL/TP), so it trades on bar data alone — no quote ticks.
    #   It subscribes to the 1-HOUR bar type (see Step 4b for why).
    strategy_config = EMACrossBracketAlgoConfig(
        instrument_id=BTCUSDT_INSTRUMENT.id,
        bar_type=BTCUSDT_1H_BARTYPE,
        trade_size=Decimal("0.001"),  # ~$60 notional — sized for the 200 USDT account
        fast_ema_period=10,
        slow_ema_period=20,
        atr_period=20,
        bracket_distance_atr=2.0,
    )
    strategy = EMACrossBracketAlgo(config=strategy_config)
    engine.add_strategy(strategy)

    # Step 6: Run engine = Run backtest
    engine.run()

    # Step 7: Visualize results with the nautilus `[visualization]` package (Plotly).
    #   The tearsheet must be generated BEFORE `engine.dispose()` releases the data.
    #   `TearsheetConfig` declaratively selects which charts to render and the theme;
    #   the candlestick view is embedded via `TearsheetBarsWithFillsChart`.
    output_dir = Path(__file__).parent / "reports"
    output_dir.mkdir(exist_ok=True)

    tearsheet_config = TearsheetConfig(
        charts=[
            TearsheetRunInfoChart(),
            TearsheetStatsTableChart(),
            TearsheetEquityChart(),
            TearsheetDrawdownChart(),
            TearsheetBarsWithFillsChart(
                # Chart the downsampled 1-hour series for a fast, legible plot.
                bar_type=str(BTCUSDT_CHART_BARTYPE),
                title="BTC/USDT (Binance) - 1h bars with fills",
            ),
        ],
        theme="nautilus_dark",
    )

    tearsheet_path = output_dir / "tearsheet.html"
    create_tearsheet(
        engine=engine,
        output_path=str(tearsheet_path),
        title="EMACrossBracketAlgo Backtest — BTC/USDT",
        config=tearsheet_config,
    )

    print(f"\nTearsheet written to: {tearsheet_path}")

    # Step 8: Release system resources
    # For repeated backtest runs make sure to reset the engine
    engine.reset()

    # Good practice to dispose of the object    
    engine.dispose()
