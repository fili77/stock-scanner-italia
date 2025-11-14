import { StockData } from '@/types/stock';

export interface GlobalMarketIndex {
  symbol: string;
  name: string;
  region: 'asia' | 'europe' | 'usa' | 'commodity';
  timezone: string;
  closingTime: string; // Ora di chiusura in UTC
  openingTime: string; // Ora di apertura in UTC
}

export interface CorrelationData {
  index: string;
  indexName: string;
  correlation: number; // -1 to 1
  strength: 'molto forte' | 'forte' | 'moderata' | 'debole' | 'nulla';
  lastChange: number; // % change dell'indice nell'ultima sessione
  region: string;
  timezoneAdvantage: boolean; // True se l'indice ha già chiuso/aperto
}

export interface MarketCorrelationAnalysis {
  topCorrelations: CorrelationData[];
  sectorCorrelations: CorrelationData[];
  signals: string[];
  predictedImpact: number; // -10 to +10, impatto previsto in %
  confidence: number; // 0-100
}

/**
 * Indici globali da monitorare
 */
export const GLOBAL_INDICES: Record<string, GlobalMarketIndex> = {
  // USA
  'SPX': {
    symbol: '^GSPC',
    name: 'S&P 500',
    region: 'usa',
    timezone: 'America/New_York',
    openingTime: '14:30', // 9:30 EST = 14:30 UTC
    closingTime: '21:00', // 16:00 EST = 21:00 UTC
  },
  'NASDAQ': {
    symbol: '^IXIC',
    name: 'NASDAQ Composite',
    region: 'usa',
    timezone: 'America/New_York',
    openingTime: '14:30',
    closingTime: '21:00',
  },
  'DJI': {
    symbol: '^DJI',
    name: 'Dow Jones',
    region: 'usa',
    timezone: 'America/New_York',
    openingTime: '14:30',
    closingTime: '21:00',
  },

  // Europa
  'DAX': {
    symbol: '^GDAXI',
    name: 'DAX',
    region: 'europe',
    timezone: 'Europe/Berlin',
    openingTime: '08:00',
    closingTime: '17:30',
  },
  'FTSE': {
    symbol: '^FTSE',
    name: 'FTSE 100',
    region: 'europe',
    timezone: 'Europe/London',
    openingTime: '08:00',
    closingTime: '16:30',
  },
  'CAC': {
    symbol: '^FCHI',
    name: 'CAC 40',
    region: 'europe',
    timezone: 'Europe/Paris',
    openingTime: '08:00',
    closingTime: '17:30',
  },

  // Asia
  'NIKKEI': {
    symbol: '^N225',
    name: 'Nikkei 225',
    region: 'asia',
    timezone: 'Asia/Tokyo',
    openingTime: '00:00', // 9:00 JST = 00:00 UTC
    closingTime: '06:00', // 15:00 JST = 06:00 UTC
  },
  'HSI': {
    symbol: '^HSI',
    name: 'Hang Seng',
    region: 'asia',
    timezone: 'Asia/Hong_Kong',
    openingTime: '01:30',
    closingTime: '08:00',
  },

  // Commodities (24h, ma usiamo orari principali)
  'WTI': {
    symbol: 'CL=F',
    name: 'WTI Crude Oil',
    region: 'commodity',
    timezone: 'America/New_York',
    openingTime: '00:00',
    closingTime: '23:59',
  },
  'BRENT': {
    symbol: 'BZ=F',
    name: 'Brent Crude Oil',
    region: 'commodity',
    timezone: 'Europe/London',
    openingTime: '00:00',
    closingTime: '23:59',
  },
};

/**
 * Correlazioni specifiche per settore
 */
export const SECTOR_CORRELATIONS: Record<string, string[]> = {
  'Energy': ['SPX', 'WTI', 'BRENT'],
  'Financials': ['SPX', 'DAX', 'FTSE'],
  'Technology': ['NASDAQ', 'SPX'],
  'Industrials': ['DJI', 'DAX', 'SPX'],
  'Consumer': ['SPX', 'DAX', 'NASDAQ'],
  'Utilities': ['SPX', 'DAX'],
  'Healthcare': ['SPX', 'NASDAQ'],
  'Materials': ['SPX', 'DJI'],
  'Telecommunications': ['SPX', 'DAX'],
  'Real Estate': ['SPX', 'FTSE'],
  'General': ['SPX', 'DAX', 'FTSE'], // Default
};

/**
 * Correlazioni specifiche per titoli italiani noti
 */
export const STOCK_SPECIFIC_CORRELATIONS: Record<string, string[]> = {
  'ENI.MI': ['WTI', 'BRENT', 'SPX'],
  'ENEL.MI': ['SPX', 'DAX'],
  'ISP.MI': ['DAX', 'FTSE', 'SPX'], // Intesa Sanpaolo
  'UCG.MI': ['DAX', 'FTSE', 'SPX'], // UniCredit
  'STMMI.MI': ['NASDAQ', 'SPX'], // STMicroelectronics
  'RACE.MI': ['NASDAQ', 'SPX'], // Ferrari
  'TIT.MI': ['SPX', 'DAX'], // Telecom Italia
  'LDO.MI': ['WTI', 'BRENT', 'SPX'], // Saipem
};

/**
 * Calcola la correlazione di Pearson tra due serie di rendimenti
 */
function calculateCorrelation(returns1: number[], returns2: number[]): number {
  if (returns1.length !== returns2.length || returns1.length === 0) {
    return 0;
  }

  const n = returns1.length;
  const mean1 = returns1.reduce((a, b) => a + b, 0) / n;
  const mean2 = returns2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let variance1 = 0;
  let variance2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;

    numerator += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(variance1 * variance2);

  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Calcola i rendimenti giornalieri
 */
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] !== 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  return returns;
}

/**
 * Determina la forza della correlazione
 */
function getCorrelationStrength(correlation: number): 'molto forte' | 'forte' | 'moderata' | 'debole' | 'nulla' {
  const abs = Math.abs(correlation);
  if (abs >= 0.8) return 'molto forte';
  if (abs >= 0.6) return 'forte';
  if (abs >= 0.4) return 'moderata';
  if (abs >= 0.2) return 'debole';
  return 'nulla';
}

/**
 * Verifica se un mercato ha timezone advantage (ha già chiuso/aperto prima di Milano)
 */
function hasTimezoneAdvantage(region: string): boolean {
  // Asia chiude prima dell'apertura europea
  if (region === 'asia') return true;

  // Europa apre contemporaneamente (no advantage)
  if (region === 'europe') return false;

  // USA apre dopo Europa (no advantage per previsioni mattutine)
  if (region === 'usa') return false;

  // Commodities 24h (sempre disponibili)
  if (region === 'commodity') return true;

  return false;
}

/**
 * Analizza correlazioni con mercati globali (versione sincrona)
 */
export function analyzeGlobalCorrelationsSync(
  symbol: string,
  sector: string,
  stockData: StockData[],
  indexDataMap: Map<string, StockData[]>
): MarketCorrelationAnalysis {
  const signals: string[] = [];
  const topCorrelations: CorrelationData[] = [];
  const sectorCorrelations: CorrelationData[] = [];

  // Determina quali indici monitorare
  let indicesToCheck = SECTOR_CORRELATIONS[sector] || SECTOR_CORRELATIONS['General'];

  // Aggiungi correlazioni specifiche del titolo se disponibili
  if (STOCK_SPECIFIC_CORRELATIONS[symbol]) {
    indicesToCheck = [
      ...new Set([...indicesToCheck, ...STOCK_SPECIFIC_CORRELATIONS[symbol]]),
    ];
  }

  // Calcola rendimenti del titolo
  const stockPrices = stockData.map(d => d.close);
  const stockReturns = calculateReturns(stockPrices);

  // Calcola correlazioni con ogni indice
  for (const indexKey of indicesToCheck) {
    const indexInfo = GLOBAL_INDICES[indexKey];
    if (!indexInfo) continue;

    const indexData = indexDataMap.get(indexKey);
    if (!indexData || indexData.length < 30) continue;

    // Allinea le date (usa solo date comuni)
    const commonDates = alignDataByDate(stockData, indexData);
    if (commonDates.stockPrices.length < 30) continue;

    // Calcola correlazione
    const stockAlignedReturns = calculateReturns(commonDates.stockPrices);
    const indexAlignedReturns = calculateReturns(commonDates.indexPrices);

    const correlation = calculateCorrelation(stockAlignedReturns, indexAlignedReturns);
    const strength = getCorrelationStrength(correlation);

    // Skip correlazioni molto deboli
    if (Math.abs(correlation) < 0.2) continue;

    // Calcola ultimo movimento dell'indice
    const lastChange =
      indexData.length >= 2
        ? ((indexData[indexData.length - 1].close - indexData[indexData.length - 2].close) /
            indexData[indexData.length - 2].close) *
          100
        : 0;

    const correlationData: CorrelationData = {
      index: indexKey,
      indexName: indexInfo.name,
      correlation: correlation,
      strength: strength,
      lastChange: lastChange,
      region: indexInfo.region,
      timezoneAdvantage: hasTimezoneAdvantage(indexInfo.region),
    };

    topCorrelations.push(correlationData);

    // Aggiungi a correlazioni settoriali se appropriato
    if (SECTOR_CORRELATIONS[sector]?.includes(indexKey)) {
      sectorCorrelations.push(correlationData);
    }
  }

  // Ordina per correlazione assoluta (più forte prima)
  topCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // Genera segnali
  let predictedImpact = 0;
  let totalWeight = 0;

  for (const corr of topCorrelations.slice(0, 5)) {
    // Top 5 correlazioni
    const absCorr = Math.abs(corr.correlation);

    // Segnale base
    const direction = corr.correlation > 0 ? 'positiva' : 'negativa';
    signals.push(
      `${getRegionEmoji(corr.region)} ${corr.indexName}: correlazione ${corr.strength} (${(corr.correlation * 100).toFixed(0)}%, ${direction})`
    );

    // Movimento dell'indice
    if (Math.abs(corr.lastChange) > 0.5) {
      const movementDirection = corr.lastChange > 0 ? 'rialzo' : 'ribasso';
      signals.push(
        `  → Ultima sessione: ${movementDirection} ${Math.abs(corr.lastChange).toFixed(2)}%`
      );

      // Calcola impatto atteso
      if (corr.timezoneAdvantage) {
        // Peso maggiore per mercati che hanno già chiuso
        const weight = absCorr * 1.5;
        const impact = corr.correlation * corr.lastChange * 0.5; // 50% transmission

        predictedImpact += impact * weight;
        totalWeight += weight;

        signals.push(`  → ⏰ Mercato già chiuso - impatto previsto: ${impact > 0 ? '+' : ''}${impact.toFixed(2)}%`);
      } else {
        // Peso standard per altri mercati
        const weight = absCorr;
        const impact = corr.correlation * corr.lastChange * 0.3; // 30% transmission

        predictedImpact += impact * weight;
        totalWeight += weight;
      }
    }

    // Strength indicator
    if (absCorr >= 0.8) {
      signals.push(`  → ⚠️ Correlazione molto forte - movimenti significativi attesi`);
    }
  }

  // Normalizza impatto predetto
  if (totalWeight > 0) {
    predictedImpact = predictedImpact / totalWeight;
  }

  // Segnali di sintesi
  if (Math.abs(predictedImpact) > 0.5) {
    const direction = predictedImpact > 0 ? 'rialzista' : 'ribassista';
    signals.unshift(
      `🌍 Mercati globali indicano sentiment ${direction} (impatto: ${predictedImpact > 0 ? '+' : ''}${predictedImpact.toFixed(2)}%)`
    );
  }

  // Analisi correlazioni asiatiche (timezone advantage)
  const asianCorrelations = topCorrelations.filter(c => c.region === 'asia' && Math.abs(c.correlation) > 0.4);
  if (asianCorrelations.length > 0) {
    const avgAsianChange =
      asianCorrelations.reduce((sum, c) => sum + c.lastChange, 0) / asianCorrelations.length;

    if (Math.abs(avgAsianChange) > 1) {
      signals.push(
        `🌏 Mercati asiatici ${avgAsianChange > 0 ? 'positivi' : 'negativi'} (${avgAsianChange.toFixed(2)}%) - influenza apertura europea`
      );
    }
  }

  // Confidence basato su numero e forza delle correlazioni
  const strongCorrelations = topCorrelations.filter(c => Math.abs(c.correlation) > 0.6).length;
  const confidence = Math.min(30 + strongCorrelations * 15, 90); // Max 90%

  return {
    topCorrelations: topCorrelations.slice(0, 8), // Top 8
    sectorCorrelations: sectorCorrelations.slice(0, 5), // Top 5 settoriali
    signals,
    predictedImpact,
    confidence,
  };
}

/**
 * Allinea due serie di dati per data
 */
function alignDataByDate(
  stockData: StockData[],
  indexData: StockData[]
): { stockPrices: number[]; indexPrices: number[] } {
  const stockMap = new Map<string, number>();
  const indexMap = new Map<string, number>();

  stockData.forEach(d => stockMap.set(d.date, d.close));
  indexData.forEach(d => indexMap.set(d.date, d.close));

  const commonDates = [...stockMap.keys()].filter(date => indexMap.has(date));
  commonDates.sort();

  const stockPrices = commonDates.map(date => stockMap.get(date)!);
  const indexPrices = commonDates.map(date => indexMap.get(date)!);

  return { stockPrices, indexPrices };
}

/**
 * Emoji per regione
 */
function getRegionEmoji(region: string): string {
  switch (region) {
    case 'asia':
      return '🌏';
    case 'europe':
      return '🇪🇺';
    case 'usa':
      return '🇺🇸';
    case 'commodity':
      return '🛢️';
    default:
      return '🌍';
  }
}

/**
 * Calcola adjustment per previsione basato su correlazioni globali
 */
export function calculateGlobalMarketAdjustment(
  correlation: MarketCorrelationAnalysis,
  currentTrend: 'bullish' | 'bearish' | 'neutral'
): { adjustment: number; reason: string } {
  const { predictedImpact, confidence } = correlation;

  // Se impatto basso, nessun adjustment
  if (Math.abs(predictedImpact) < 0.3) {
    return { adjustment: 0, reason: '' };
  }

  // Adjustment pesato per confidence
  const adjustment = (predictedImpact / 100) * (confidence / 100);

  // Verifica allineamento con trend corrente
  const impactDirection = predictedImpact > 0 ? 'bullish' : 'bearish';
  const aligned = impactDirection === currentTrend;

  let reason = '';
  if (aligned) {
    reason = `Mercati globali confermano trend ${currentTrend} (${predictedImpact > 0 ? '+' : ''}${predictedImpact.toFixed(2)}%)`;
  } else {
    reason = `Mercati globali in controtendenza (${predictedImpact > 0 ? '+' : ''}${predictedImpact.toFixed(2)}%)`;
  }

  return { adjustment, reason };
}
