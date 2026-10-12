// Simple, transparent indicator analysis. No database, no stored state.
// Each indicator votes +1 (bullish), -1 (bearish) or 0 (neutral).
// BUY needs score >= 3, SELL needs score <= -3, otherwise NO TRADE.

function ema(values, period) {
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const out = new Array(period - 1).fill(null);
  out.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) avgGain += d;
    else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function macdHistogram(closes) {
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const macdLine = [];
  for (let i = 0; i < closes.length; i++) {
    if (e12[i] != null && e26[i] != null) macdLine.push(e12[i] - e26[i]);
  }
  if (macdLine.length < 9) return null;
  const signal = ema(macdLine, 9);
  const last = macdLine.length - 1;
  return macdLine[last] - signal[last];
}

function analyze(closes) {
  const price = closes[closes.length - 1];
  const ema9 = ema(closes, 9).at(-1);
  const ema21 = ema(closes, 21).at(-1);
  const r = rsi(closes, 14);
  const hist = macdHistogram(closes);

  if (ema9 == null || ema21 == null || r == null || hist == null) {
    return { direction: 'NO TRADE', score: 0, reasons: ['Not enough candle data'] };
  }

  let score = 0;
  const reasons = [];

  if (ema9 > ema21) { score += 1; reasons.push('EMA9 above EMA21 (uptrend)'); }
  else { score -= 1; reasons.push('EMA9 below EMA21 (downtrend)'); }

  if (price > ema21) { score += 1; reasons.push('Price above EMA21'); }
  else { score -= 1; reasons.push('Price below EMA21'); }

  if (r > 55) { score += 1; reasons.push(`RSI ${r.toFixed(1)} (bullish momentum)`); }
  else if (r < 45) { score -= 1; reasons.push(`RSI ${r.toFixed(1)} (bearish momentum)`); }
  else { reasons.push(`RSI ${r.toFixed(1)} (neutral)`); }

  if (hist > 0) { score += 1; reasons.push('MACD histogram positive'); }
  else if (hist < 0) { score -= 1; reasons.push('MACD histogram negative'); }

  let direction = 'NO TRADE';
  if (score >= 3) direction = 'BUY';
  else if (score <= -3) direction = 'SELL';
  else reasons.push('Indicators disagree, no clear edge');

  return { direction, score, reasons, price };
}

module.exports = { analyze };
