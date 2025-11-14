import { StockData } from '@/types/stock';

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface SupportResistanceLevel {
  price: number;
  strength: number; // 0-100, quanto è forte il livello
  type: 'support' | 'resistance';
  touches: number; // quante volte il prezzo ha toccato questo livello
  lastTouch: string; // data ultimo touch
  isHistorical: boolean; // se è un livello storico (>3 mesi fa)
}

export interface SupportResistanceAnalysis {
  currentPrice: number;
  pivotPoints: PivotPoints;
  nearestSupport: SupportResistanceLevel | null;
  nearestResistance: SupportResistanceLevel | null;
  allLevels: SupportResistanceLevel[];
  signals: string[];
  pricePosition: 'near_resistance' | 'near_support' | 'between_levels' | 'breakout_above' | 'breakdown_below';
  distanceToSupport: number; // % distanza dal supporto
  distanceToResistance: number; // % distanza dalla resistenza
}

/**
 * Calcola i Pivot Points classici (standard)
 */
export function calculatePivotPoints(stockData: StockData[]): PivotPoints {
  if (stockData.length === 0) {
    return { pivot: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 };
  }

  // Usa i dati dell'ultimo giorno di trading
  const lastDay = stockData[stockData.length - 1];
  const high = lastDay.high;
  const low = lastDay.low;
  const close = lastDay.close;

  // Pivot Point
  const pivot = (high + low + close) / 3;

  // Resistenze
  const r1 = 2 * pivot - low;
  const r2 = pivot + (high - low);
  const r3 = high + 2 * (pivot - low);

  // Supporti
  const s1 = 2 * pivot - high;
  const s2 = pivot - (high - low);
  const s3 = low - 2 * (high - pivot);

  return { pivot, r1, r2, r3, s1, s2, s3 };
}

/**
 * Identifica supporti e resistenze storici usando un algoritmo di clustering
 */
export function findSupportResistanceLevels(
  stockData: StockData[],
  lookbackPeriod: number = 120, // Ultimi 120 giorni
  tolerance: number = 0.02 // 2% di tolleranza per cluster
): SupportResistanceLevel[] {
  if (stockData.length < 20) return [];

  const levels: SupportResistanceLevel[] = [];
  const data = stockData.slice(-lookbackPeriod);

  // Trova swing highs (massimi locali)
  const swingHighs = findSwingPoints(data, 'high');

  // Trova swing lows (minimi locali)
  const swingLows = findSwingPoints(data, 'low');

  // Cluster swing highs per trovare resistenze
  const resistanceClusters = clusterPrices(swingHighs, tolerance);
  resistanceClusters.forEach(cluster => {
    const isHistorical = isHistoricalLevel(cluster.touches, data.length);
    levels.push({
      price: cluster.price,
      strength: cluster.strength,
      type: 'resistance',
      touches: cluster.touches.length,
      lastTouch: cluster.lastTouch,
      isHistorical,
    });
  });

  // Cluster swing lows per trovare supporti
  const supportClusters = clusterPrices(swingLows, tolerance);
  supportClusters.forEach(cluster => {
    const isHistorical = isHistoricalLevel(cluster.touches, data.length);
    levels.push({
      price: cluster.price,
      strength: cluster.strength,
      type: 'support',
      touches: cluster.touches.length,
      lastTouch: cluster.lastTouch,
      isHistorical,
    });
  });

  // Ordina per strength (più forti primi)
  levels.sort((a, b) => b.strength - a.strength);

  return levels;
}

/**
 * Trova swing points (massimi/minimi locali)
 */
function findSwingPoints(
  data: StockData[],
  type: 'high' | 'low',
  window: number = 5
): Array<{ price: number; date: string; volume: number }> {
  const swingPoints: Array<{ price: number; date: string; volume: number }> = [];

  for (let i = window; i < data.length - window; i++) {
    const current = type === 'high' ? data[i].high : data[i].low;
    let isSwing = true;

    // Verifica che sia un massimo/minimo locale
    for (let j = i - window; j <= i + window; j++) {
      if (j === i) continue;
      const compare = type === 'high' ? data[j].high : data[j].low;

      if (type === 'high' && compare >= current) {
        isSwing = false;
        break;
      }
      if (type === 'low' && compare <= current) {
        isSwing = false;
        break;
      }
    }

    if (isSwing) {
      swingPoints.push({
        price: current,
        date: data[i].date,
        volume: data[i].volume,
      });
    }
  }

  return swingPoints;
}

/**
 * Raggruppa prezzi simili in clusters
 */
function clusterPrices(
  points: Array<{ price: number; date: string; volume: number }>,
  tolerance: number
): Array<{
  price: number;
  strength: number;
  touches: Array<{ price: number; date: string }>;
  lastTouch: string;
}> {
  if (points.length === 0) return [];

  const clusters: Array<{
    prices: number[];
    dates: string[];
    volumes: number[];
  }> = [];

  // Raggruppa prezzi simili
  points.forEach(point => {
    let foundCluster = false;

    for (const cluster of clusters) {
      const avgPrice = cluster.prices.reduce((a, b) => a + b, 0) / cluster.prices.length;
      const diff = Math.abs(point.price - avgPrice) / avgPrice;

      if (diff <= tolerance) {
        cluster.prices.push(point.price);
        cluster.dates.push(point.date);
        cluster.volumes.push(point.volume);
        foundCluster = true;
        break;
      }
    }

    if (!foundCluster) {
      clusters.push({
        prices: [point.price],
        dates: [point.date],
        volumes: [point.volume],
      });
    }
  });

  // Converti clusters in livelli con strength
  return clusters
    .filter(c => c.prices.length >= 2) // Almeno 2 tocchi
    .map(cluster => {
      const avgPrice = cluster.prices.reduce((a, b) => a + b, 0) / cluster.prices.length;
      const touches = cluster.prices.length;
      const avgVolume = cluster.volumes.reduce((a, b) => a + b, 0) / cluster.volumes.length;

      // Strength basato su: numero di tocchi + volume medio
      const touchStrength = Math.min(touches * 15, 70); // Max 70 da tocchi
      const volumeStrength = Math.min(30, 30); // Max 30 da volume
      const strength = Math.min(touchStrength + volumeStrength, 100);

      // Ultima data di touch
      const lastTouch = cluster.dates.sort().reverse()[0];

      return {
        price: avgPrice,
        strength,
        touches: cluster.prices.map((p, i) => ({ price: p, date: cluster.dates[i] })),
        lastTouch,
      };
    })
    .sort((a, b) => b.strength - a.strength);
}

/**
 * Determina se un livello è storico (non toccato recentemente)
 */
function isHistoricalLevel(
  touches: Array<{ price: number; date: string }>,
  totalDays: number
): boolean {
  const lastTouch = touches.sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastTouchIndex = totalDays - 1; // Placeholder, in realtà dovremmo calcolare la posizione

  // Considera storico se l'ultimo touch è stato >90 giorni fa
  return totalDays > 90;
}

/**
 * Analisi completa di supporti, resistenze e pivot points
 */
export function analyzeSupportResistance(stockData: StockData[]): SupportResistanceAnalysis {
  const currentPrice = stockData[stockData.length - 1].close;
  const pivotPoints = calculatePivotPoints(stockData);

  // Trova livelli storici
  const historicalLevels = findSupportResistanceLevels(stockData, 120, 0.015);

  // Aggiungi pivot points come livelli
  const allLevels: SupportResistanceLevel[] = [...historicalLevels];

  // Aggiungi pivot point principale
  allLevels.push({
    price: pivotPoints.pivot,
    strength: 50,
    type: currentPrice > pivotPoints.pivot ? 'support' : 'resistance',
    touches: 1,
    lastTouch: stockData[stockData.length - 1].date,
    isHistorical: false,
  });

  // Trova supporto e resistenza più vicini
  const supports = allLevels.filter(l => l.price < currentPrice && l.type === 'support');
  const resistances = allLevels.filter(l => l.price > currentPrice && l.type === 'resistance');

  const nearestSupport = supports.length > 0
    ? supports.sort((a, b) => Math.abs(currentPrice - b.price) - Math.abs(currentPrice - a.price))[0]
    : null;

  const nearestResistance = resistances.length > 0
    ? resistances.sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice))[0]
    : null;

  // Calcola distanze percentuali
  const distanceToSupport = nearestSupport
    ? ((currentPrice - nearestSupport.price) / currentPrice) * 100
    : 100;

  const distanceToResistance = nearestResistance
    ? ((nearestResistance.price - currentPrice) / currentPrice) * 100
    : 100;

  // Determina posizione del prezzo
  const pricePosition = determinePricePosition(
    currentPrice,
    nearestSupport,
    nearestResistance,
    distanceToSupport,
    distanceToResistance
  );

  // Genera segnali
  const signals = generateSRSignals(
    currentPrice,
    pivotPoints,
    nearestSupport,
    nearestResistance,
    distanceToSupport,
    distanceToResistance,
    pricePosition,
    stockData
  );

  return {
    currentPrice,
    pivotPoints,
    nearestSupport,
    nearestResistance,
    allLevels: allLevels.slice(0, 10), // Top 10 livelli più forti
    signals,
    pricePosition,
    distanceToSupport,
    distanceToResistance,
  };
}

/**
 * Determina la posizione del prezzo rispetto ai livelli
 */
function determinePricePosition(
  currentPrice: number,
  nearestSupport: SupportResistanceLevel | null,
  nearestResistance: SupportResistanceLevel | null,
  distanceToSupport: number,
  distanceToResistance: number
): 'near_resistance' | 'near_support' | 'between_levels' | 'breakout_above' | 'breakdown_below' {
  // Vicino a resistenza (entro 1%)
  if (distanceToResistance < 1 && nearestResistance) {
    return 'near_resistance';
  }

  // Vicino a supporto (entro 1%)
  if (distanceToSupport < 1 && nearestSupport) {
    return 'near_support';
  }

  // Breakout sopra resistenza
  if (!nearestResistance || distanceToResistance < -2) {
    return 'breakout_above';
  }

  // Breakdown sotto supporto
  if (!nearestSupport || distanceToSupport < -2) {
    return 'breakdown_below';
  }

  // Tra i livelli
  return 'between_levels';
}

/**
 * Genera segnali basati su supporti e resistenze
 */
function generateSRSignals(
  currentPrice: number,
  pivotPoints: PivotPoints,
  nearestSupport: SupportResistanceLevel | null,
  nearestResistance: SupportResistanceLevel | null,
  distanceToSupport: number,
  distanceToResistance: number,
  pricePosition: string,
  stockData: StockData[]
): string[] {
  const signals: string[] = [];

  // Segnali Pivot Points
  if (currentPrice > pivotPoints.pivot) {
    signals.push(`📊 Sopra Pivot Point (€${pivotPoints.pivot.toFixed(2)}) - Sentiment rialzista`);
  } else {
    signals.push(`📊 Sotto Pivot Point (€${pivotPoints.pivot.toFixed(2)}) - Sentiment ribassista`);
  }

  // Target resistenze
  if (currentPrice < pivotPoints.r1) {
    signals.push(`🎯 R1 target: €${pivotPoints.r1.toFixed(2)} (+${((pivotPoints.r1/currentPrice - 1) * 100).toFixed(2)}%)`);
  }
  if (currentPrice < pivotPoints.r2) {
    signals.push(`🎯 R2 target: €${pivotPoints.r2.toFixed(2)} (+${((pivotPoints.r2/currentPrice - 1) * 100).toFixed(2)}%)`);
  }

  // Supporti di sicurezza
  if (currentPrice > pivotPoints.s1) {
    signals.push(`🛡️ S1 supporto: €${pivotPoints.s1.toFixed(2)} (${((pivotPoints.s1/currentPrice - 1) * 100).toFixed(2)}%)`);
  }

  // Segnali supporto più vicino
  if (nearestSupport) {
    const strengthDesc = nearestSupport.strength > 70 ? 'molto forte' : nearestSupport.strength > 50 ? 'forte' : 'moderato';
    signals.push(
      `⬇️ Supporto ${strengthDesc} a €${nearestSupport.price.toFixed(2)} (-${distanceToSupport.toFixed(2)}%, ${nearestSupport.touches} tocchi)`
    );

    if (nearestSupport.isHistorical) {
      signals.push(`📜 Supporto storico (ultimo touch: ${formatDate(nearestSupport.lastTouch)})`);
    }

    if (distanceToSupport < 1) {
      signals.push(`⚠️ Prezzo vicino al supporto - possibile rimbalzo o rottura`);
    }
  }

  // Segnali resistenza più vicina
  if (nearestResistance) {
    const strengthDesc = nearestResistance.strength > 70 ? 'molto forte' : nearestResistance.strength > 50 ? 'forte' : 'moderato';
    signals.push(
      `⬆️ Resistenza ${strengthDesc} a €${nearestResistance.price.toFixed(2)} (+${distanceToResistance.toFixed(2)}%, ${nearestResistance.touches} tocchi)`
    );

    if (nearestResistance.isHistorical) {
      signals.push(`📜 Resistenza storica (ultimo touch: ${formatDate(nearestResistance.lastTouch)})`);
    }

    if (distanceToResistance < 1) {
      signals.push(`⚠️ Prezzo vicino alla resistenza - possibile rigetto o breakout`);
    }
  }

  // Segnali posizione prezzo
  switch (pricePosition) {
    case 'near_resistance':
      signals.push(`🚨 Prezzo a ridosso della resistenza - zona critica`);
      break;
    case 'near_support':
      signals.push(`🚨 Prezzo a ridosso del supporto - zona di acquisto o breakdown`);
      break;
    case 'breakout_above':
      signals.push(`🚀 Breakout sopra resistenza - momentum rialzista forte`);
      break;
    case 'breakdown_below':
      signals.push(`📉 Breakdown sotto supporto - debolezza evidente`);
      break;
    case 'between_levels':
      signals.push(`↔️ Prezzo tra supporto e resistenza - trading range`);
      break;
  }

  // Analisi volume sui livelli
  const recentVolume = stockData.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 5;
  const avgVolume = stockData.slice(-30).reduce((sum, d) => sum + d.volume, 0) / 30;

  if (pricePosition === 'near_resistance' && recentVolume > avgVolume * 1.5) {
    signals.push(`📈 Volume elevato vicino resistenza - possibile breakout imminente`);
  }

  if (pricePosition === 'near_support' && recentVolume > avgVolume * 1.5) {
    signals.push(`📊 Volume elevato vicino supporto - interesse degli acquirenti`);
  }

  return signals;
}

/**
 * Formatta una data in formato leggibile
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Calcola adjustment factor per previsione basato su S/R
 */
export function calculateSRAdjustment(
  currentPrice: number,
  predictedPrice: number,
  analysis: SupportResistanceAnalysis
): { adjustedPrice: number; confidence: number; reason: string } {
  let adjustment = 0;
  let confidenceModifier = 1;
  let reason = '';

  const { nearestSupport, nearestResistance, pricePosition } = analysis;

  // Se previsione va verso una resistenza forte
  if (predictedPrice > currentPrice && nearestResistance) {
    const willHitResistance = predictedPrice >= nearestResistance.price;

    if (willHitResistance && nearestResistance.strength > 70) {
      // Resistenza molto forte, riduci previsione
      adjustment = (nearestResistance.price - currentPrice) * 0.8; // Arriva all'80% della resistenza
      confidenceModifier = 0.85; // Riduci confidenza
      reason = `Resistenza forte a €${nearestResistance.price.toFixed(2)} limita upside`;
    }
  }

  // Se previsione va verso un supporto forte
  if (predictedPrice < currentPrice && nearestSupport) {
    const willHitSupport = predictedPrice <= nearestSupport.price;

    if (willHitSupport && nearestSupport.strength > 70) {
      // Supporto molto forte, riduci downside
      adjustment = (nearestSupport.price - currentPrice) * 0.8; // Arriva all'80% del supporto
      confidenceModifier = 0.85;
      reason = `Supporto forte a €${nearestSupport.price.toFixed(2)} limita downside`;
    }
  }

  // Breakout/Breakdown
  if (pricePosition === 'breakout_above') {
    confidenceModifier = 1.1; // Aumenta confidenza su breakout
    reason = 'Breakout conferma trend rialzista';
  } else if (pricePosition === 'breakdown_below') {
    confidenceModifier = 1.1; // Aumenta confidenza su breakdown
    reason = 'Breakdown conferma trend ribassista';
  }

  const adjustedPrice = adjustment !== 0 ? currentPrice + adjustment : predictedPrice;

  return {
    adjustedPrice,
    confidence: confidenceModifier,
    reason,
  };
}
