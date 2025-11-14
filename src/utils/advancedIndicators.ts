import { StockData } from '@/types/stock';

/**
 * On-Balance Volume (OBV)
 * Misura la pressione di accumulazione/distribuzione basata sul volume
 */
export function calculateOBV(stockData: StockData[]): number[] {
  const obv: number[] = [stockData[0]?.volume || 0];

  for (let i = 1; i < stockData.length; i++) {
    const prevClose = stockData[i - 1].close;
    const currentClose = stockData[i].close;
    const volume = stockData[i].volume;

    if (currentClose > prevClose) {
      obv.push(obv[i - 1] + volume);
    } else if (currentClose < prevClose) {
      obv.push(obv[i - 1] - volume);
    } else {
      obv.push(obv[i - 1]);
    }
  }

  return obv;
}

/**
 * Volume Weighted Average Price (VWAP)
 * Prezzo medio ponderato per volume - importante per identificare valore
 */
export function calculateVWAP(stockData: StockData[]): number {
  let totalVolume = 0;
  let totalPriceVolume = 0;

  // Usa ultimi 20 giorni per VWAP
  const data = stockData.slice(-20);

  for (const day of data) {
    const typicalPrice = (day.high + day.low + day.close) / 3;
    totalPriceVolume += typicalPrice * day.volume;
    totalVolume += day.volume;
  }

  return totalVolume > 0 ? totalPriceVolume / totalVolume : data[data.length - 1].close;
}

/**
 * Money Flow Index (MFI)
 * RSI pesato per volume - mostra pressione acquisto/vendita
 */
export function calculateMFI(stockData: StockData[], period: number = 14): number {
  if (stockData.length < period + 1) return 50;

  const data = stockData.slice(-period - 1);
  let positiveFlow = 0;
  let negativeFlow = 0;

  for (let i = 1; i < data.length; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    const prevTypicalPrice = (data[i - 1].high + data[i - 1].low + data[i - 1].close) / 3;
    const moneyFlow = typicalPrice * data[i].volume;

    if (typicalPrice > prevTypicalPrice) {
      positiveFlow += moneyFlow;
    } else if (typicalPrice < prevTypicalPrice) {
      negativeFlow += moneyFlow;
    }
  }

  if (negativeFlow === 0) return 100;
  const moneyRatio = positiveFlow / negativeFlow;
  return 100 - (100 / (1 + moneyRatio));
}

/**
 * Accumulation/Distribution Line (A/D)
 * Misura flusso di denaro cumulativo in/out
 */
export function calculateAD(stockData: StockData[]): number[] {
  const ad: number[] = [0];

  for (let i = 1; i < stockData.length; i++) {
    const high = stockData[i].high;
    const low = stockData[i].low;
    const close = stockData[i].close;
    const volume = stockData[i].volume;

    const clv = high !== low ? ((close - low) - (high - close)) / (high - low) : 0;
    ad.push(ad[i - 1] + clv * volume);
  }

  return ad;
}

/**
 * Chaikin Money Flow (CMF)
 * Misura pressione acquisto/vendita su un periodo
 */
export function calculateCMF(stockData: StockData[], period: number = 20): number {
  if (stockData.length < period) return 0;

  const data = stockData.slice(-period);
  let sumMoneyFlowVolume = 0;
  let sumVolume = 0;

  for (const day of data) {
    const high = day.high;
    const low = day.low;
    const close = day.close;
    const volume = day.volume;

    const moneyFlowMultiplier = high !== low ? ((close - low) - (high - close)) / (high - low) : 0;
    const moneyFlowVolume = moneyFlowMultiplier * volume;

    sumMoneyFlowVolume += moneyFlowVolume;
    sumVolume += volume;
  }

  return sumVolume > 0 ? sumMoneyFlowVolume / sumVolume : 0;
}

/**
 * Average Directional Index (ADX)
 * Misura forza del trend (non direzione)
 */
export function calculateADX(stockData: StockData[], period: number = 14): number {
  if (stockData.length < period + 1) return 0;

  const data = stockData.slice(-period - 1);
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  // Calculate +DM, -DM, and TR
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevHigh = data[i - 1].high;
    const prevLow = data[i - 1].low;
    const prevClose = data[i - 1].close;

    const highDiff = high - prevHigh;
    const lowDiff = prevLow - low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trueRange);
  }

  // Smooth the values
  const smoothPlusDM = plusDM.reduce((a, b) => a + b, 0) / plusDM.length;
  const smoothMinusDM = minusDM.reduce((a, b) => a + b, 0) / minusDM.length;
  const smoothTR = tr.reduce((a, b) => a + b, 0) / tr.length;

  if (smoothTR === 0) return 0;

  const plusDI = (smoothPlusDM / smoothTR) * 100;
  const minusDI = (smoothMinusDM / smoothTR) * 100;

  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
  return isNaN(dx) ? 0 : dx;
}

/**
 * Stochastic Oscillator
 * Mostra momentum e possibili inversioni
 */
export function calculateStochastic(
  stockData: StockData[],
  period: number = 14
): { k: number; d: number } {
  if (stockData.length < period) return { k: 50, d: 50 };

  const data = stockData.slice(-period);
  const close = data[data.length - 1].close;

  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);

  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);

  const k = highestHigh !== lowestLow
    ? ((close - lowestLow) / (highestHigh - lowestLow)) * 100
    : 50;

  // %D is 3-period SMA of %K (simplified)
  const d = k; // In a full implementation, calculate SMA of last 3 K values

  return { k, d };
}

/**
 * Average True Range (ATR)
 * Misura volatilità
 */
export function calculateATR(stockData: StockData[], period: number = 14): number {
  if (stockData.length < period + 1) return 0;

  const data = stockData.slice(-period - 1);
  const trueRanges: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
}

/**
 * Detect price-volume divergences
 * Importante segnale di possibile inversione
 */
export function detectDivergence(stockData: StockData[]): {
  priceTrend: 'up' | 'down' | 'neutral';
  volumeTrend: 'up' | 'down' | 'neutral';
  hasDivergence: boolean;
  type: 'bullish' | 'bearish' | 'none';
} {
  if (stockData.length < 20) {
    return { priceTrend: 'neutral', volumeTrend: 'neutral', hasDivergence: false, type: 'none' };
  }

  const recent = stockData.slice(-20);
  const prices = recent.map(d => d.close);
  const volumes = recent.map(d => d.volume);

  // Calculate trends using simple linear regression slope
  const priceTrend = calculateTrendDirection(prices);
  const volumeTrend = calculateTrendDirection(volumes);

  // Divergence: price e volume vanno in direzioni opposte
  const hasDivergence = (priceTrend === 'up' && volumeTrend === 'down') ||
                        (priceTrend === 'down' && volumeTrend === 'up');

  let type: 'bullish' | 'bearish' | 'none' = 'none';
  if (priceTrend === 'down' && volumeTrend === 'up') {
    type = 'bullish'; // Prezzo scende ma volume aumenta = possibile rimbalzo
  } else if (priceTrend === 'up' && volumeTrend === 'down') {
    type = 'bearish'; // Prezzo sale ma volume diminuisce = possibile inversione
  }

  return { priceTrend, volumeTrend, hasDivergence, type };
}

function calculateTrendDirection(values: number[]): 'up' | 'down' | 'neutral' {
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  if (slope > 0.01) return 'up';
  if (slope < -0.01) return 'down';
  return 'neutral';
}

/**
 * Check for volume breakout
 * Volume spike = possibile movimento importante
 */
export function isVolumeBreakout(stockData: StockData[]): {
  isBreakout: boolean;
  multiplier: number;
  direction: 'up' | 'down';
} {
  if (stockData.length < 20) {
    return { isBreakout: false, multiplier: 1, direction: 'up' };
  }

  const recent = stockData.slice(-20);
  const avgVolume = recent.slice(0, -1).reduce((sum, d) => sum + d.volume, 0) / (recent.length - 1);
  const currentVolume = recent[recent.length - 1].volume;
  const multiplier = currentVolume / avgVolume;

  const currentClose = recent[recent.length - 1].close;
  const prevClose = recent[recent.length - 2].close;
  const direction = currentClose > prevClose ? 'up' : 'down';

  return {
    isBreakout: multiplier > 2, // Volume è 2x la media
    multiplier,
    direction,
  };
}
