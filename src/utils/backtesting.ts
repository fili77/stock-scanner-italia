import { StockData, FundamentalAnalysis } from '@/types/stock';
import { predictStock } from './stockPrediction';

export interface BacktestResult {
  date: string;
  actualPrice: number;
  predictedPrice: number;
  actualChange: number;
  predictedChange: number;
  directionCorrect: boolean;
  absoluteError: number;
  percentageError: number;
}

export interface BacktestStatistics {
  totalPredictions: number;
  directionalAccuracy: number; // % of correct up/down predictions
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
  averageError: number;
  maxError: number;
  minError: number;
  profitableTradesPercent: number;
  simulatedReturn: number; // Return if following predictions
  buyHoldReturn: number; // Return if just holding
  outperformance: number; // Difference between simulated and buy-hold
  sharpeRatio: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

export interface BacktestReport {
  symbol: string;
  startDate: string;
  endDate: string;
  results: BacktestResult[];
  statistics: BacktestStatistics;
  fundamentals?: FundamentalAnalysis; // Optional fundamental data used in testing
}

/**
 * Perform backtesting on historical data
 * @param symbol Stock symbol
 * @param stockData Historical stock data
 * @param testDays Number of days to test (default: last 60 days)
 * @param minDataPoints Minimum data points needed for prediction (default: 60)
 * @param fundamentals Optional fundamental analysis (fetched once for efficiency)
 */
export function backtest(
  symbol: string,
  stockData: StockData[],
  testDays: number = 60,
  minDataPoints: number = 60,
  fundamentals?: FundamentalAnalysis
): BacktestReport {
  if (stockData.length < minDataPoints + testDays) {
    throw new Error(
      `Dati insufficienti per il backtesting. Richiesti: ${minDataPoints + testDays}, disponibili: ${stockData.length}`
    );
  }

  const results: BacktestResult[] = [];

  // Start from minDataPoints, test for testDays
  const startIdx = stockData.length - testDays - 1;

  for (let i = startIdx; i < stockData.length - 1; i++) {
    // Use data up to day i to make prediction
    const historicalData = stockData.slice(0, i + 1);

    try {
      // Make prediction (with optional fundamentals for efficiency)
      const prediction = predictStock(symbol, historicalData, fundamentals);

      // Get actual next day price
      const actualNextDay = stockData[i + 1];
      const currentDay = stockData[i];

      const actualChange = actualNextDay.close - currentDay.close;
      const predictedChange = prediction.predictedPrice - currentDay.close;

      const directionCorrect = (actualChange > 0 && predictedChange > 0) ||
                               (actualChange < 0 && predictedChange < 0) ||
                               (actualChange === 0 && predictedChange === 0);

      const absoluteError = Math.abs(actualNextDay.close - prediction.predictedPrice);
      const percentageError = (absoluteError / actualNextDay.close) * 100;

      results.push({
        date: actualNextDay.date,
        actualPrice: actualNextDay.close,
        predictedPrice: prediction.predictedPrice,
        actualChange,
        predictedChange,
        directionCorrect,
        absoluteError,
        percentageError,
      });
    } catch (error) {
      console.error(`Error making prediction for ${stockData[i].date}:`, error);
    }
  }

  const statistics = calculateStatistics(results, stockData.slice(startIdx));

  return {
    symbol,
    startDate: results[0]?.date || '',
    endDate: results[results.length - 1]?.date || '',
    results,
    statistics,
  };
}

/**
 * Calculate statistical metrics from backtest results
 */
function calculateStatistics(
  results: BacktestResult[],
  stockData: StockData[]
): BacktestStatistics {
  const n = results.length;

  if (n === 0) {
    return {
      totalPredictions: 0,
      directionalAccuracy: 0,
      mape: 0,
      rmse: 0,
      mae: 0,
      averageError: 0,
      maxError: 0,
      minError: 0,
      profitableTradesPercent: 0,
      simulatedReturn: 0,
      buyHoldReturn: 0,
      outperformance: 0,
      sharpeRatio: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
    };
  }

  // Directional Accuracy
  const correctDirections = results.filter(r => r.directionCorrect).length;
  const directionalAccuracy = (correctDirections / n) * 100;

  // MAPE (Mean Absolute Percentage Error)
  const mape = results.reduce((sum, r) => sum + r.percentageError, 0) / n;

  // RMSE (Root Mean Square Error)
  const mse = results.reduce((sum, r) => sum + Math.pow(r.absoluteError, 2), 0) / n;
  const rmse = Math.sqrt(mse);

  // MAE (Mean Absolute Error)
  const mae = results.reduce((sum, r) => sum + r.absoluteError, 0) / n;

  // Average, Max, Min errors
  const errors = results.map(r => r.absoluteError);
  const averageError = mae;
  const maxError = Math.max(...errors);
  const minError = Math.min(...errors);

  // Simulated Trading Results
  let capital = 10000; // Start with 10,000 EUR
  let shares = 0;
  const dailyReturns: number[] = [];
  let wins = 0;
  let losses = 0;
  let totalWin = 0;
  let totalLoss = 0;

  results.forEach((result, idx) => {
    const previousPrice = idx > 0 ? results[idx - 1].actualPrice : stockData[0].close;

    // Trading strategy: Buy if prediction is positive, sell if negative
    if (result.predictedChange > 0 && shares === 0) {
      // Buy
      shares = capital / previousPrice;
      capital = 0;
    } else if (result.predictedChange < 0 && shares > 0) {
      // Sell
      capital = shares * previousPrice;
      shares = 0;
    }

    // Calculate current portfolio value
    const portfolioValue = capital + (shares * result.actualPrice);
    const dailyReturn = idx > 0
      ? (portfolioValue - (10000 * (1 + dailyReturns.reduce((a, b) => a + b, 0)))) / 10000
      : 0;

    dailyReturns.push(dailyReturn);

    // Win/Loss tracking
    if (result.directionCorrect && Math.abs(result.actualChange) > 0.01) {
      const profit = (result.actualChange / (result.actualPrice - result.actualChange)) * 100;
      if (profit > 0) {
        wins++;
        totalWin += profit;
      } else {
        losses++;
        totalLoss += Math.abs(profit);
      }
    }
  });

  // Final portfolio value
  const finalValue = capital + (shares * results[results.length - 1].actualPrice);
  const simulatedReturn = ((finalValue - 10000) / 10000) * 100;

  // Buy and Hold Return
  const buyHoldReturn = ((results[results.length - 1].actualPrice - stockData[0].close) / stockData[0].close) * 100;

  // Outperformance
  const outperformance = simulatedReturn - buyHoldReturn;

  // Sharpe Ratio (assuming risk-free rate of 2% annual)
  const avgDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const stdDev = Math.sqrt(
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length
  );
  const riskFreeDaily = 0.02 / 252; // 2% annual / 252 trading days
  const sharpeRatio = stdDev > 0 ? ((avgDailyReturn - riskFreeDaily) / stdDev) * Math.sqrt(252) : 0;

  // Win Rate and Profit Factor
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgWin = wins > 0 ? totalWin / wins : 0;
  const avgLoss = losses > 0 ? totalLoss / losses : 0;
  const profitFactor = totalLoss > 0 ? totalWin / totalLoss : 0;
  const profitableTradesPercent = winRate;

  return {
    totalPredictions: n,
    directionalAccuracy,
    mape,
    rmse,
    mae,
    averageError,
    maxError,
    minError,
    profitableTradesPercent,
    simulatedReturn,
    buyHoldReturn,
    outperformance,
    sharpeRatio,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
  };
}

/**
 * Get performance rating based on metrics
 */
export function getPerformanceRating(stats: BacktestStatistics): {
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  message: string;
} {
  const score =
    (stats.directionalAccuracy >= 60 ? 25 : stats.directionalAccuracy >= 55 ? 15 : stats.directionalAccuracy >= 50 ? 5 : 0) +
    (stats.mape <= 2 ? 25 : stats.mape <= 3 ? 15 : stats.mape <= 5 ? 5 : 0) +
    (stats.outperformance > 0 ? 25 : 0) +
    (stats.sharpeRatio > 1 ? 25 : stats.sharpeRatio > 0.5 ? 15 : stats.sharpeRatio > 0 ? 5 : 0);

  if (score >= 75) {
    return {
      rating: 'excellent',
      color: 'text-green-700 bg-green-50 border-green-200',
      message: 'Eccellente - Il modello mostra alta affidabilità statistica',
    };
  } else if (score >= 50) {
    return {
      rating: 'good',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      message: 'Buono - Il modello è statisticamente affidabile',
    };
  } else if (score >= 25) {
    return {
      rating: 'fair',
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      message: 'Discreto - Il modello ha affidabilità limitata',
    };
  } else {
    return {
      rating: 'poor',
      color: 'text-red-700 bg-red-50 border-red-200',
      message: 'Scarso - Il modello necessita miglioramenti',
    };
  }
}

/**
 * Generate recommendations based on backtest results
 */
export function generateRecommendations(stats: BacktestStatistics): string[] {
  const recommendations: string[] = [];

  if (stats.directionalAccuracy < 55) {
    recommendations.push('⚠️ Accuratezza direzionale bassa - considera di affinare gli indicatori tecnici');
  }

  if (stats.mape > 5) {
    recommendations.push('⚠️ Errore percentuale alto - il modello potrebbe sovrastimare i movimenti');
  }

  if (stats.outperformance < 0) {
    recommendations.push('⚠️ Performance inferiore al buy-and-hold - strategia passiva più efficace');
  }

  if (stats.sharpeRatio < 0.5) {
    recommendations.push('⚠️ Sharpe Ratio basso - alto rischio rispetto ai rendimenti');
  }

  if (stats.profitFactor < 1) {
    recommendations.push('⚠️ Profit Factor < 1 - le perdite superano i profitti');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Il modello mostra buone performance statistiche');
    recommendations.push('✅ Continua a monitorare le performance nel tempo');
  }

  return recommendations;
}
