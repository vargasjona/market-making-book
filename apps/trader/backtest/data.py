# -------------------------------------------------------------------------------------------------
#  Utility for loading Binance BTCUSDT 1-minute klines (as downloaded from Binance Vision).
# -------------------------------------------------------------------------------------------------
"""
Read Binance monthly kline CSV files into Nautilus `Bar` objects.

Binance kline CSVs are headerless with 12 columns:
    0 open_time, 1 open, 2 high, 3 low, 4 close, 5 volume,
    6 close_time, 7 quote_volume, 8 trades, 9 taker_buy_base,
    10 taker_buy_quote, 11 ignore

`open_time` in these files is in microseconds since the Unix epoch.

Three layers are exposed:
    `load_binance_klines(...)` -> pd.DataFrame  (OHLCV, timestamp index)
    `load_binance_bars(...)`   -> list[Bar]     (ready for engine.add_data)
    `resample_ohlcv(...)`      -> pd.DataFrame  (downsample e.g. 1m -> 1h for plotting)
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

from pathlib import Path

import pandas as pd
from nautilus_trader.model.data import BarType
from nautilus_trader.persistence.wranglers import BarDataWrangler

if TYPE_CHECKING:
    from nautilus_trader.model.data import Bar
    from nautilus_trader.model.instruments import Instrument

# Binance kline column layout (headerless CSV).
_BINANCE_KLINE_COLUMNS = [
    "open_time",
    "open",
    "high",
    "low",
    "close",
    "volume",
    "close_time",
    "quote_volume",
    "trades",
    "taker_buy_base",
    "taker_buy_quote",
    "ignore",
]

# Columns required by `BarDataWrangler` (timestamp is used as the index).
_OHLCV_COLUMNS = ["open", "high", "low", "close", "volume"]


def load_binance_klines(
    source: str | Path,
    *,
    timestamp_unit: str = "us",
) -> pd.DataFrame:
    """
    Load one or more Binance kline CSV files into a `BarDataWrangler`-ready DataFrame.

    Parameters
    ----------
    source : str | Path
        A single CSV file, or a directory containing monthly ``*.csv`` kline files.
        When a directory is given, all ``*.csv`` files are concatenated in sorted order.
    timestamp_unit : str, default "us"
        Epoch unit of the ``open_time`` column ("us" microseconds, "ms" milliseconds).

    Returns
    -------
    pd.DataFrame
        Columns ``open, high, low, close, volume`` indexed by a UTC ``timestamp``,
        sorted ascending with duplicate timestamps removed.
    """
    source = Path(source)
    if source.is_dir():
        files = sorted(source.glob("*.csv"))
        if not files:
            raise FileNotFoundError(f"No CSV files found in directory: {source}")
    elif source.is_file():
        files = [source]
    else:
        raise FileNotFoundError(f"Source path does not exist: {source}")

    frames = [
        pd.read_csv(file, header=None, names=_BINANCE_KLINE_COLUMNS) for file in files
    ]
    df = pd.concat(frames, ignore_index=True)

    # Build the datetime index required by `BarDataWrangler`.
    df["timestamp"] = pd.to_datetime(df["open_time"], unit=timestamp_unit, utc=True)
    df = df[["timestamp", *_OHLCV_COLUMNS]].set_index("timestamp")

    # Guard against overlaps/gaps across monthly files.
    df = df[~df.index.duplicated(keep="first")].sort_index()
    return df


def load_binance_bars(
    source: str | Path,
    instrument: Instrument,
    *,
    bar_type: str | BarType | None = None,
    timestamp_unit: str = "us",
) -> list[Bar]:
    """
    Load Binance kline CSV(s) directly into Nautilus `Bar` objects.

    Wraps `load_binance_klines` (DataFrame) with a `BarDataWrangler`, which builds
    one `Bar` per row — handling `Price`/`Quantity` precision and nanosecond
    timestamps — so the result can be passed straight to `engine.add_data`.

    Parameters
    ----------
    source : str | Path
        A single CSV file, or a directory of monthly ``*.csv`` kline files.
    instrument : Instrument
        The Nautilus instrument the bars belong to (e.g. ``btcusdt_binance()``).
    bar_type : str | BarType, optional
        The bar type. Defaults to ``{instrument.id}-1-MINUTE-LAST-EXTERNAL``.
    timestamp_unit : str, default "us"
        Epoch unit of the ``open_time`` column ("us" microseconds, "ms" milliseconds).

    Returns
    -------
    list[Bar]
    """
    df = load_binance_klines(source, timestamp_unit=timestamp_unit)

    if bar_type is None:
        bar_type = BarType.from_str(f"{instrument.id}-1-MINUTE-LAST-EXTERNAL")
    elif isinstance(bar_type, str):
        bar_type = BarType.from_str(bar_type)

    wrangler = BarDataWrangler(bar_type=bar_type, instrument=instrument)
    return wrangler.process(df)


# OHLCV aggregation rules for downsampling to a coarser interval.
_OHLCV_AGG = {
    "open": "first",
    "high": "max",
    "low": "min",
    "close": "last",
    "volume": "sum",
}


def resample_ohlcv(df: pd.DataFrame, rule: str = "1h") -> pd.DataFrame:
    """
    Downsample an OHLCV DataFrame to a coarser interval for fast plotting.

    Aggregates each bucket with the standard candlestick rules (open=first,
    high=max, low=min, close=last, volume=sum). Use this to shrink e.g. 260k
    1-minute bars into ~4k hourly (or ~180 daily) candles so the Plotly chart
    renders quickly, without touching the 1-minute data fed to the engine.

    Parameters
    ----------
    df : pd.DataFrame
        OHLCV DataFrame indexed by a datetime timestamp (as returned by
        `load_binance_klines`).
    rule : str, default "1h"
        A pandas offset alias for the target interval (e.g. "1h", "4h", "1D").

    Returns
    -------
    pd.DataFrame
        Resampled OHLCV, with empty buckets dropped.
    """
    resampled = df.resample(rule).agg(_OHLCV_AGG)
    return resampled.dropna(subset=["open"])


def load_binance_bars_resampled(
    source: str | Path,
    instrument: Instrument,
    *,
    rule: str = "1h",
    timestamp_unit: str = "us",
) -> list[Bar]:
    """
    Load Binance kline CSV(s), downsample them, and return Nautilus `Bar` objects.

    Convenience wrapper around `load_binance_klines` + `resample_ohlcv` +
    `BarDataWrangler`, intended for building a lightweight, chart-only bar series
    (e.g. hourly) alongside the full-resolution bars used by the engine.

    The bar type is derived from `rule`, e.g. rule="1h" ->
    ``{instrument.id}-1-HOUR-LAST-EXTERNAL``.

    Parameters
    ----------
    source : str | Path
        A single CSV file, or a directory of monthly ``*.csv`` kline files.
    instrument : Instrument
        The Nautilus instrument the bars belong to.
    rule : str, default "1h"
        Pandas offset alias for the target interval ("1h", "4h", "1D").
    timestamp_unit : str, default "us"
        Epoch unit of the ``open_time`` column.

    Returns
    -------
    list[Bar]
    """
    df = load_binance_klines(source, timestamp_unit=timestamp_unit)
    df = resample_ohlcv(df, rule=rule)

    # Map the pandas rule to a Nautilus bar-type spec (step + aggregation unit).
    step, unit = _rule_to_bar_spec(rule)
    bar_type = BarType.from_str(f"{instrument.id}-{step}-{unit}-LAST-EXTERNAL")

    wrangler = BarDataWrangler(bar_type=bar_type, instrument=instrument)
    return wrangler.process(df)


# Map pandas offset aliases to Nautilus (step, aggregation-unit) bar-type parts.
_RULE_TO_BAR_UNIT = {
    "min": "MINUTE",
    "t": "MINUTE",
    "h": "HOUR",
    "d": "DAY",
    "w": "WEEK",
}


def _rule_to_bar_spec(rule: str) -> tuple[int, str]:
    """
    Convert a pandas offset alias (e.g. "1h", "4h", "15min", "1D") into the
    ``(step, unit)`` pair used by a Nautilus bar-type string.
    """
    match = re.fullmatch(r"(\d*)\s*([a-zA-Z]+)", rule.strip())
    if match is None:
        raise ValueError(f"Unsupported resample rule: {rule!r}")
    step = int(match.group(1)) if match.group(1) else 1
    unit_key = match.group(2).lower()
    if unit_key not in _RULE_TO_BAR_UNIT:
        raise ValueError(f"Unsupported resample unit in rule: {rule!r}")
    return step, _RULE_TO_BAR_UNIT[unit_key]

