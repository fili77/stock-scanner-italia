import { FundamentalData, FundamentalAnalysis } from '@/types/stock';

/**
 * Analyze fundamental data and generate scores
 */
export function analyzeFundamentals(
  data: FundamentalData,
  sector: string
): FundamentalAnalysis {
  const scores = {
    valuation: calculateValuationScore(data, sector),
    profitability: calculateProfitabilityScore(data),
    growth: calculateGrowthScore(data),
    financialHealth: calculateFinancialHealthScore(data),
    dividend: calculateDividendScore(data),
    overall: 0,
  };

  // Calculate overall score (weighted average)
  scores.overall =
    scores.valuation * 0.30 +
    scores.profitability * 0.25 +
    scores.growth * 0.20 +
    scores.financialHealth * 0.15 +
    scores.dividend * 0.10;

  const rating = determineRating(scores.overall, data);
  const signals = generateFundamentalSignals(data, scores);
  const recommendation = generateFundamentalRecommendation(scores, rating);

  return {
    data,
    scores,
    rating,
    signals,
    recommendation,
  };
}

/**
 * Calculate valuation score (0-100)
 */
function calculateValuationScore(data: FundamentalData, sector: string): number {
  let score = 50; // Start neutral

  // Benchmark P/E ratios by sector (Italian market averages)
  const sectorPEBenchmarks: Record<string, number> = {
    Banking: 8,
    Energy: 10,
    Utilities: 12,
    'Automotive': 10,
    Technology: 20,
    'Financial Services': 12,
    Insurance: 10,
    'Luxury Goods': 25,
    Telecommunications: 15,
    Industrial: 15,
    default: 15,
  };

  const benchmarkPE = sectorPEBenchmarks[sector] || sectorPEBenchmarks.default;

  // P/E Ratio (peso 40%)
  if (data.peRatio !== null && data.peRatio > 0) {
    if (data.peRatio < benchmarkPE * 0.7) {
      score += 20; // Molto sottovalutato
    } else if (data.peRatio < benchmarkPE) {
      score += 10; // Sottovalutato
    } else if (data.peRatio > benchmarkPE * 1.5) {
      score -= 20; // Molto sopravvalutato
    } else if (data.peRatio > benchmarkPE * 1.2) {
      score -= 10; // Sopravvalutato
    }
  }

  // PEG Ratio (peso 20%)
  if (data.pegRatio !== null) {
    if (data.pegRatio < 1) {
      score += 10; // Sottovalutato rispetto alla crescita
    } else if (data.pegRatio > 2) {
      score -= 10; // Sopravvalutato rispetto alla crescita
    }
  }

  // P/B Ratio (peso 20%)
  if (data.priceToBook !== null) {
    if (data.priceToBook < 1) {
      score += 10; // Sotto valore contabile
    } else if (data.priceToBook > 3) {
      score -= 5; // Molto sopra valore contabile
    }
  }

  // P/S Ratio (peso 10%)
  if (data.priceToSales !== null) {
    if (data.priceToSales < 1) {
      score += 5;
    } else if (data.priceToSales > 5) {
      score -= 5;
    }
  }

  // EV/EBITDA (peso 10%)
  if (data.evToEbitda !== null) {
    if (data.evToEbitda < 8) {
      score += 5;
    } else if (data.evToEbitda > 15) {
      score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate profitability score (0-100)
 */
function calculateProfitabilityScore(data: FundamentalData): number {
  let score = 0;

  // Profit Margin (peso 35%)
  if (data.profitMargin !== null) {
    if (data.profitMargin > 0.20) score += 35; // >20%
    else if (data.profitMargin > 0.15) score += 28;
    else if (data.profitMargin > 0.10) score += 20;
    else if (data.profitMargin > 0.05) score += 10;
    else if (data.profitMargin > 0) score += 5;
  }

  // Operating Margin (peso 25%)
  if (data.operatingMargin !== null) {
    if (data.operatingMargin > 0.20) score += 25;
    else if (data.operatingMargin > 0.15) score += 20;
    else if (data.operatingMargin > 0.10) score += 15;
    else if (data.operatingMargin > 0.05) score += 8;
    else if (data.operatingMargin > 0) score += 3;
  }

  // ROE (peso 25%)
  if (data.returnOnEquity !== null) {
    if (data.returnOnEquity > 0.20) score += 25; // >20%
    else if (data.returnOnEquity > 0.15) score += 20;
    else if (data.returnOnEquity > 0.10) score += 15;
    else if (data.returnOnEquity > 0.05) score += 8;
    else if (data.returnOnEquity > 0) score += 3;
  }

  // ROA (peso 15%)
  if (data.returnOnAssets !== null) {
    if (data.returnOnAssets > 0.10) score += 15;
    else if (data.returnOnAssets > 0.05) score += 10;
    else if (data.returnOnAssets > 0.02) score += 5;
    else if (data.returnOnAssets > 0) score += 2;
  }

  return Math.min(100, score);
}

/**
 * Calculate growth score (0-100)
 */
function calculateGrowthScore(data: FundamentalData): number {
  let score = 0;

  // Revenue Growth (peso 50%)
  if (data.revenueGrowth !== null) {
    if (data.revenueGrowth > 0.20) score += 50; // >20%
    else if (data.revenueGrowth > 0.15) score += 40;
    else if (data.revenueGrowth > 0.10) score += 30;
    else if (data.revenueGrowth > 0.05) score += 20;
    else if (data.revenueGrowth > 0) score += 10;
    else if (data.revenueGrowth < -0.10) score -= 20; // Decrescita
  }

  // Earnings Growth (peso 50%)
  if (data.earningsGrowth !== null) {
    if (data.earningsGrowth > 0.20) score += 50;
    else if (data.earningsGrowth > 0.15) score += 40;
    else if (data.earningsGrowth > 0.10) score += 30;
    else if (data.earningsGrowth > 0.05) score += 20;
    else if (data.earningsGrowth > 0) score += 10;
    else if (data.earningsGrowth < -0.10) score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate financial health score (0-100)
 */
function calculateFinancialHealthScore(data: FundamentalData): number {
  let score = 50; // Start neutral

  // Debt to Equity (peso 40%)
  if (data.debtToEquity !== null) {
    if (data.debtToEquity < 0.5) {
      score += 20; // Poco indebitamento
    } else if (data.debtToEquity < 1.0) {
      score += 10; // Indebitamento moderato
    } else if (data.debtToEquity > 2.0) {
      score -= 20; // Alto indebitamento
    } else if (data.debtToEquity > 1.5) {
      score -= 10;
    }
  }

  // Current Ratio (peso 30%)
  if (data.currentRatio !== null) {
    if (data.currentRatio > 2.0) {
      score += 15; // Ottima liquidità
    } else if (data.currentRatio > 1.5) {
      score += 10; // Buona liquidità
    } else if (data.currentRatio < 1.0) {
      score -= 15; // Problemi di liquidità
    }
  }

  // Quick Ratio (peso 30%)
  if (data.quickRatio !== null) {
    if (data.quickRatio > 1.5) {
      score += 15;
    } else if (data.quickRatio > 1.0) {
      score += 10;
    } else if (data.quickRatio < 0.5) {
      score -= 15;
    } else if (data.quickRatio < 0.8) {
      score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate dividend score (0-100)
 */
function calculateDividendScore(data: FundamentalData): number {
  let score = 0;

  if (data.dividendYield === null || data.dividendYield <= 0) {
    return 50; // Neutral if no dividend
  }

  // Dividend Yield (peso 60%)
  if (data.dividendYield > 0.06) {
    score += 60; // >6% yield
  } else if (data.dividendYield > 0.04) {
    score += 48; // 4-6%
  } else if (data.dividendYield > 0.02) {
    score += 36; // 2-4%
  } else {
    score += 20; // <2%
  }

  // Payout Ratio (peso 40%)
  if (data.payoutRatio !== null) {
    if (data.payoutRatio > 0 && data.payoutRatio < 0.6) {
      score += 40; // Sostenibile
    } else if (data.payoutRatio >= 0.6 && data.payoutRatio < 0.8) {
      score += 25; // Moderato
    } else if (data.payoutRatio >= 0.8) {
      score += 10; // Rischioso
    }
  }

  return Math.min(100, score);
}

/**
 * Determine valuation rating
 */
function determineRating(
  overallScore: number,
  data: FundamentalData
): 'undervalued' | 'fairly_valued' | 'overvalued' {
  // Check if data is mostly null
  const nullCount = Object.values(data).filter(v => v === null).length;
  if (nullCount > Object.keys(data).length * 0.5) {
    return 'fairly_valued'; // Default if insufficient data
  }

  if (overallScore >= 70) return 'undervalued';
  if (overallScore <= 40) return 'overvalued';
  return 'fairly_valued';
}

/**
 * Generate fundamental signals
 */
function generateFundamentalSignals(
  data: FundamentalData,
  scores: FundamentalAnalysis['scores']
): string[] {
  const signals: string[] = [];

  // Valuation signals
  if (data.peRatio !== null && data.peRatio > 0) {
    if (data.peRatio < 10) {
      signals.push(`💰 P/E basso (${data.peRatio.toFixed(1)}) - possibile sottovalutazione`);
    } else if (data.peRatio > 30) {
      signals.push(`⚠️ P/E alto (${data.peRatio.toFixed(1)}) - possibile sopravvalutazione`);
    }
  }

  // Profitability signals
  if (data.profitMargin !== null) {
    if (data.profitMargin > 0.15) {
      signals.push(`✅ Alta redditività (${(data.profitMargin * 100).toFixed(1)}% profit margin)`);
    } else if (data.profitMargin < 0) {
      signals.push(`❌ Azienda in perdita`);
    }
  }

  // Growth signals
  if (data.revenueGrowth !== null) {
    if (data.revenueGrowth > 0.15) {
      signals.push(`📈 Forte crescita ricavi (+${(data.revenueGrowth * 100).toFixed(1)}%)`);
    } else if (data.revenueGrowth < 0) {
      signals.push(`📉 Calo ricavi (${(data.revenueGrowth * 100).toFixed(1)}%)`);
    }
  }

  // Financial health signals
  if (data.debtToEquity !== null) {
    if (data.debtToEquity < 0.5) {
      signals.push(`💪 Basso indebitamento (D/E: ${data.debtToEquity.toFixed(2)})`);
    } else if (data.debtToEquity > 2.0) {
      signals.push(`⚠️ Alto indebitamento (D/E: ${data.debtToEquity.toFixed(2)})`);
    }
  }

  // Dividend signals
  if (data.dividendYield !== null && data.dividendYield > 0) {
    if (data.dividendYield > 0.05) {
      signals.push(`💵 Dividend yield interessante (${(data.dividendYield * 100).toFixed(2)}%)`);
    }
  }

  // ROE signal
  if (data.returnOnEquity !== null) {
    if (data.returnOnEquity > 0.15) {
      signals.push(`⭐ Ottimo ROE (${(data.returnOnEquity * 100).toFixed(1)}%)`);
    }
  }

  // Overall assessment
  if (scores.overall >= 70) {
    signals.push('🎯 Fondamentali solidi - azienda di qualità');
  } else if (scores.overall <= 40) {
    signals.push('⚠️ Fondamentali deboli - cautela');
  }

  return signals;
}

/**
 * Generate fundamental recommendation
 */
function generateFundamentalRecommendation(
  scores: FundamentalAnalysis['scores'],
  rating: 'undervalued' | 'fairly_valued' | 'overvalued'
): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' {
  const overall = scores.overall;

  if (rating === 'undervalued') {
    if (overall >= 75 && scores.growth >= 60) return 'strong_buy';
    if (overall >= 65) return 'buy';
    return 'hold';
  }

  if (rating === 'overvalued') {
    if (overall <= 35) return 'strong_sell';
    if (overall <= 45) return 'sell';
    return 'hold';
  }

  // fairly_valued
  if (overall >= 70) return 'buy';
  if (overall <= 40) return 'sell';
  return 'hold';
}

/**
 * Combine technical and fundamental recommendations
 */
export function combineRecommendations(
  technicalRec: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell',
  fundamentalRec: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell',
  technicalWeight: number = 0.6, // Peso tecnica 60%
  fundamentalWeight: number = 0.4 // Peso fondamentale 40%
): { recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'; score: number } {
  const recToScore: Record<string, number> = {
    strong_sell: -2,
    sell: -1,
    hold: 0,
    buy: 1,
    strong_buy: 2,
  };

  const technicalScore = recToScore[technicalRec];
  const fundamentalScore = recToScore[fundamentalRec];

  const combinedScore = technicalScore * technicalWeight + fundamentalScore * fundamentalWeight;

  let recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';

  if (combinedScore >= 1.5) recommendation = 'strong_buy';
  else if (combinedScore >= 0.5) recommendation = 'buy';
  else if (combinedScore <= -1.5) recommendation = 'strong_sell';
  else if (combinedScore <= -0.5) recommendation = 'sell';
  else recommendation = 'hold';

  return { recommendation, score: combinedScore };
}
