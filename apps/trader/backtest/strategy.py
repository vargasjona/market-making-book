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

import datetime as dt
from decimal import Decimal

from nautilus_trader.common.enums import LogColor
from nautilus_trader.config import PositiveFloat
from nautilus_trader.config import PositiveInt
from nautilus_trader.config import StrategyConfig
from nautilus_trader.core.correctness import PyCondition
from nautilus_trader.examples.strategies.ema_cross_trailing_stop import (
    EMACrossTrailingStop,
)
from nautilus_trader.examples.strategies.ema_cross_trailing_stop import (
    EMACrossTrailingStopConfig,
)
from nautilus_trader.indicators import AverageTrueRange
from nautilus_trader.indicators import ExponentialMovingAverage
from nautilus_trader.model.data import Bar
from nautilus_trader.model.data import BarType
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import OrderType
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.model.instruments import Instrument
from nautilus_trader.trading.strategy import Strategy

# Re-exported so callers can `from backtest.strategy import ...`.
__all__ = [
    "DemoStrategy",
    "EMACrossBracketAlgo",
    "EMACrossBracketAlgoConfig",
    "EMACrossTrailingStop",
    "EMACrossTrailingStopConfig",
]


# This is a trivial demo strategy that simply counts all processed 1-minute bars.
class DemoStrategy(Strategy):
    def __init__(self, primary_bar_type: BarType):
        super().__init__()
        self.primary_bar_type = primary_bar_type
        self.bars_processed = 0
        self.start_time = None
        self.end_time = None

    def on_start(self):
        # Remember and log start time of strategy
        self.start_time = dt.datetime.now()
        self.log.info(f"Strategy started at: {self.start_time}")

        # Subscribe to bars
        self.subscribe_bars(self.primary_bar_type)

    def on_bar(self, bar: Bar):
        self.bars_processed += 1
        self.log.info(f"Processed bars: {self.bars_processed}", color=LogColor.YELLOW)

    def on_stop(self):
        # Remember and log end time of strategy
        self.end_time = dt.datetime.now()
        self.log.info(f"Strategy finished at: {self.end_time}", color=LogColor.GREEN)

        # Log count of processed bars
        self.log.info(f"Total bars processed: {self.bars_processed}", color=LogColor.BLUE)


class EMACrossBracketAlgoConfig(StrategyConfig, frozen=True):
    instrument_id: InstrumentId
    bar_type: BarType
    trade_size: Decimal
    atr_period: PositiveInt = 20
    fast_ema_period: PositiveInt = 10
    slow_ema_period: PositiveInt = 20
    bracket_distance_atr: PositiveFloat = 2.0  # Good for crypto volatility
    close_positions_on_stop: bool = True


class EMACrossBracketAlgo(Strategy):
    """
    EMA-cross entries with an ATR-sized bracket (stop-loss + take-profit).

    Fully bar-driven: entries are MARKET orders and the SL/TP prices are fixed
    at submission from ``bar.close ± ATR × bracket_distance_atr`` — so it needs
    no quote-tick data (unlike `EMACrossTrailingStop`).
    """

    def __init__(self, config: EMACrossBracketAlgoConfig) -> None:
        PyCondition.is_true(
            config.fast_ema_period < config.slow_ema_period,
            f"{config.fast_ema_period=} must be less than {config.slow_ema_period=}",
        )
        super().__init__(config)

        self.instrument: Instrument | None = None

        self.atr = AverageTrueRange(config.atr_period)
        self.fast_ema = ExponentialMovingAverage(config.fast_ema_period)
        self.slow_ema = ExponentialMovingAverage(config.slow_ema_period)

    def on_start(self) -> None:
        self.instrument = self.cache.instrument(self.config.instrument_id)
        if self.instrument is None:
            self.log.error(f"Could not find instrument for {self.config.instrument_id}")
            self.stop()
            return

        self.register_indicator_for_bars(self.config.bar_type, self.atr)
        self.register_indicator_for_bars(self.config.bar_type, self.fast_ema)
        self.register_indicator_for_bars(self.config.bar_type, self.slow_ema)

        self.subscribe_bars(self.config.bar_type)

    def on_bar(self, bar: Bar) -> None:
        if not self.indicators_initialized():
            self.log.info(
                f"Waiting for indicators to warm up "
                f"[{self.cache.bar_count(self.config.bar_type)} bars]",
                color=LogColor.BLUE,
            )
            return

        if bar.is_single_price():
            return

        # BUY
        if self.fast_ema.value >= self.slow_ema.value:
            if self.portfolio.is_flat(self.config.instrument_id):
                self.cancel_all_orders(self.config.instrument_id)
                self.buy(bar)
            elif self.portfolio.is_net_short(self.config.instrument_id):
                self.close_all_positions(self.config.instrument_id)
                self.cancel_all_orders(self.config.instrument_id)
                self.buy(bar)

        # SELL
        elif self.fast_ema.value < self.slow_ema.value:
            if self.portfolio.is_flat(self.config.instrument_id):
                self.cancel_all_orders(self.config.instrument_id)
                self.sell(bar)
            elif self.portfolio.is_net_long(self.config.instrument_id):
                self.close_all_positions(self.config.instrument_id)
                self.cancel_all_orders(self.config.instrument_id)
                self.sell(bar)

    def buy(self, bar: Bar) -> None:
        if not self.instrument:
            return

        distance = self.config.bracket_distance_atr * self.atr.value

        order_list = self.order_factory.bracket(
            instrument_id=self.config.instrument_id,
            order_side=OrderSide.BUY,
            quantity=self.instrument.make_qty(self.config.trade_size),
            entry_order_type=OrderType.MARKET,
            sl_trigger_price=self.instrument.make_price(bar.close - distance),
            tp_price=self.instrument.make_price(bar.close + distance),
        )

        self.submit_order_list(order_list)

    def sell(self, bar: Bar) -> None:
        if not self.instrument:
            return

        distance = self.config.bracket_distance_atr * self.atr.value

        order_list = self.order_factory.bracket(
            instrument_id=self.config.instrument_id,
            order_side=OrderSide.SELL,
            quantity=self.instrument.make_qty(self.config.trade_size),
            entry_order_type=OrderType.MARKET,
            sl_trigger_price=self.instrument.make_price(bar.close + distance),
            tp_price=self.instrument.make_price(bar.close - distance),
        )

        self.submit_order_list(order_list)

    def on_stop(self) -> None:
        self.cancel_all_orders(self.config.instrument_id)
        self.close_all_positions(self.config.instrument_id)
        self.unsubscribe_bars(self.config.bar_type)

    def on_reset(self) -> None:
        self.atr.reset()
        self.fast_ema.reset()
        self.slow_ema.reset()