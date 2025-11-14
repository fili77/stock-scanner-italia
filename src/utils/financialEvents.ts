import { FundamentalData } from '@/types/stock';

export interface FinancialEventSignals {
  events: string[];
  adjustmentFactor: number; // Fattore di aggiustamento per la previsione (-0.2 a +0.2)
  volatilityWarning: boolean;
}

/**
 * Analizza gli eventi finanziari imminenti (earnings, dividendi)
 * e genera segnali appropriati
 */
export function analyzeFinancialEvents(fundamentals: FundamentalData): FinancialEventSignals {
  const signals: string[] = [];
  let adjustmentFactor = 0;
  let volatilityWarning = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Analizza data earnings (semestrali/trimestrali)
  if (fundamentals.earningsDate) {
    const earningsDate = parseDate(fundamentals.earningsDate);
    if (earningsDate) {
      const daysUntilEarnings = getDaysDifference(today, earningsDate);

      if (daysUntilEarnings >= 0 && daysUntilEarnings <= 7) {
        signals.push(
          `🗓️ Pubblicazione risultati tra ${daysUntilEarnings} giorni (${formatDate(earningsDate)})`
        );
        volatilityWarning = true;

        // Maggiore volatilità attesa nei giorni vicini alle earnings
        if (daysUntilEarnings <= 2) {
          signals.push('⚠️ Alta volatilità attesa: earnings imminenti');
          adjustmentFactor -= 0.05; // Riduci leggermente la confidenza
        } else if (daysUntilEarnings <= 5) {
          signals.push('⚠️ Volatilità aumentata prima delle earnings');
          adjustmentFactor -= 0.03;
        }
      } else if (daysUntilEarnings >= -2 && daysUntilEarnings < 0) {
        signals.push('📊 Risultati appena pubblicati: attendere stabilizzazione');
        volatilityWarning = true;
        adjustmentFactor -= 0.08; // Maggiore incertezza post-earnings
      }
    }
  }

  // Analizza stacco dividendo
  if (fundamentals.exDividendDate) {
    const exDivDate = parseDate(fundamentals.exDividendDate);
    if (exDivDate) {
      const daysUntilExDiv = getDaysDifference(today, exDivDate);

      if (daysUntilExDiv >= 0 && daysUntilExDiv <= 5) {
        const divAmount = fundamentals.dividendRate || 0;
        const divYield = fundamentals.dividendYield || 0;

        signals.push(
          `💰 Stacco dividendo tra ${daysUntilExDiv} giorni (${formatDate(exDivDate)})`
        );

        if (divAmount > 0) {
          signals.push(`💵 Dividendo annuale: €${divAmount.toFixed(4)}/azione`);
        }

        if (divYield > 0) {
          signals.push(`📈 Dividend yield: ${(divYield * 100).toFixed(2)}%`);
        }

        // Il giorno dello stacco, il prezzo tipicamente scende del dividendo
        if (daysUntilExDiv === 0) {
          signals.push('📉 Oggi: stacco dividendo - calo prezzo atteso');
          adjustmentFactor -= divYield * 0.5; // Aggiusta per calo atteso
        } else if (daysUntilExDiv === 1) {
          signals.push('✅ Ultima giornata per acquisire diritto al dividendo');
          adjustmentFactor += 0.02; // Leggero rialzo pre-stacco
        } else if (daysUntilExDiv <= 3) {
          signals.push('👀 Possibile accumulo pre-stacco dividendo');
          adjustmentFactor += 0.01;
        }
      } else if (daysUntilExDiv === -1) {
        signals.push('📉 Stacco dividendo avvenuto ieri: prezzo aggiustato');
        volatilityWarning = true;
      }
    }
  }

  // Analizza qualità del dividendo
  if (fundamentals.dividendYield && fundamentals.dividendYield > 0) {
    const divYield = fundamentals.dividendYield * 100;
    const payoutRatio = fundamentals.payoutRatio || 0;

    if (divYield > 6 && payoutRatio < 0.8) {
      signals.push(`💎 Dividendo elevato (${divYield.toFixed(2)}%) e sostenibile`);
    } else if (divYield > 4) {
      signals.push(`💰 Buon dividendo (${divYield.toFixed(2)}%)`);
    }

    // Warning su dividendi troppo alti (possibile taglio)
    if (payoutRatio > 1) {
      signals.push('⚠️ Payout ratio > 100%: dividendo a rischio');
      volatilityWarning = true;
    } else if (payoutRatio > 0.8) {
      signals.push('⚠️ Payout ratio elevato: monitorare sostenibilità');
    }
  }

  // Nessun evento imminente
  if (signals.length === 0) {
    signals.push('✓ Nessun evento finanziario imminente');
  }

  return {
    events: signals,
    adjustmentFactor: Math.max(-0.2, Math.min(0.2, adjustmentFactor)), // Clamp tra -0.2 e +0.2
    volatilityWarning,
  };
}

/**
 * Parse date string in vari formati
 */
function parseDate(dateStr: string): Date | null {
  try {
    // Prova formato ISO
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Prova formato DD-MMM-YYYY (es: "15-Feb-2024")
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = parseInt(parts[2]);

      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Calcola differenza in giorni tra due date
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formatta data in formato leggibile italiano
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Determina se è un periodo di "quiet period" pre-earnings
 * (periodo in cui le aziende non possono fare comunicazioni)
 */
export function isQuietPeriod(fundamentals: FundamentalData): boolean {
  if (!fundamentals.earningsDate) return false;

  const today = new Date();
  const earningsDate = parseDate(fundamentals.earningsDate);

  if (!earningsDate) return false;

  const daysUntilEarnings = getDaysDifference(today, earningsDate);

  // Quiet period tipicamente 2-4 settimane prima earnings
  return daysUntilEarnings >= 0 && daysUntilEarnings <= 28;
}

/**
 * Calcola il calo atteso del prezzo il giorno dello stacco dividendo
 */
export function calculateExpectedDividendDrop(
  currentPrice: number,
  fundamentals: FundamentalData
): number {
  if (!fundamentals.exDividendDate || !fundamentals.dividendRate) {
    return 0;
  }

  const exDivDate = parseDate(fundamentals.exDividendDate);
  if (!exDivDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilExDiv = getDaysDifference(today, exDivDate);

  // Se è il giorno dello stacco
  if (daysUntilExDiv === 0) {
    // Il prezzo tipicamente scende del valore del dividendo trimestrale
    const quarterlyDividend = fundamentals.dividendRate / 4; // Assumiamo dividendo trimestrale
    return -quarterlyDividend;
  }

  return 0;
}
