export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  // Volume-based indicators
  obv: number;
  obvTrend: 'up' | 'down' | 'neutral';
  vwap: number;
  mfi: number;
  cmf: number;
  // Advanced indicators
  adx: number;
  stochasticK: number;
  stochasticD: number;
  atr: number;
}

export interface StockPrediction {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  predictedChange: number;
  predictedChangePercent: number;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  signals: {
    technical: string[];
    volume: string[];
    momentum: string[];
  };
  indicators: TechnicalIndicators;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

export interface ItalianStock {
  symbol: string;
  name: string;
  sector: string;
  index: 'FTSE MIB' | 'FTSE Italia Mid Cap' | 'FTSE Italia Small Cap';
}
