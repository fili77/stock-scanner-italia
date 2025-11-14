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
    fundamental?: string[];
    events?: string[]; // Earnings, dividends, etc.
    supportResistance?: string[]; // Support/Resistance levels
    globalMarkets?: string[]; // Global market correlations
  };
  indicators: TechnicalIndicators;
  fundamentals?: FundamentalAnalysis;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  combinedScore?: number; // Score che combina tecnica + fondamentale
}

export interface FundamentalData {
  // Valuation Metrics
  peRatio: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  evToEbitda: number | null;

  // Profitability
  profitMargin: number | null;
  operatingMargin: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;

  // Growth
  revenueGrowth: number | null;
  earningsGrowth: number | null;

  // Financial Health
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;

  // Dividend
  dividendYield: number | null;
  payoutRatio: number | null;

  // Per Share
  eps: number | null;
  bookValuePerShare: number | null;

  // Other
  marketCap: number | null;
  beta: number | null;
  sharesOutstanding: number | null;

  // Financial Events
  earningsDate: string | null; // Next earnings date
  exDividendDate: string | null; // Ex-dividend date
  dividendRate: number | null; // Annual dividend per share
}

export interface FundamentalAnalysis {
  data: FundamentalData;
  scores: {
    valuation: number; // 0-100
    profitability: number;
    growth: number;
    financialHealth: number;
    dividend: number;
    overall: number;
  };
  rating: 'undervalued' | 'fairly_valued' | 'overvalued';
  signals: string[];
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

export interface ItalianStock {
  symbol: string;
  name: string;
  sector: string;
  index: 'FTSE MIB' | 'FTSE Italia Mid Cap' | 'FTSE Italia Small Cap';
}
