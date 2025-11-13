import axios from 'axios';
import { StockData, StockQuote } from '@/types/stock';

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance';
const YAHOO_FINANCE_API_V7 = 'https://query1.finance.yahoo.com/v7/finance';

export class StockService {
  /**
   * Fetch historical stock data
   * @param symbol Stock symbol (e.g., 'ENI.MI' for Eni on Milan exchange)
   * @param period Period of data ('1mo', '3mo', '6mo', '1y', '2y', '5y')
   * @param interval Data interval ('1d', '1wk', '1mo')
   */
  static async getHistoricalData(
    symbol: string,
    period: string = '6mo',
    interval: string = '1d'
  ): Promise<StockData[]> {
    try {
      const url = `${YAHOO_FINANCE_API}/chart/${symbol}`;
      const params = {
        period1: this.getPeriodTimestamp(period),
        period2: Math.floor(Date.now() / 1000),
        interval,
        events: 'history',
      };

      const response = await axios.get(url, { params });
      const result = response.data.chart.result[0];

      if (!result || !result.timestamp) {
        throw new Error('No data available for this symbol');
      }

      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      const adjClose = result.indicators.adjclose?.[0]?.adjclose || [];

      const stockData: StockData[] = timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: quotes.open[index] || 0,
        high: quotes.high[index] || 0,
        low: quotes.low[index] || 0,
        close: quotes.close[index] || 0,
        volume: quotes.volume[index] || 0,
        adjustedClose: adjClose[index] || quotes.close[index] || 0,
      }));

      return stockData.filter(data => data.close > 0);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw new Error(`Failed to fetch data for ${symbol}`);
    }
  }

  /**
   * Get current stock quote
   */
  static async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const url = `${YAHOO_FINANCE_API_V7}/quote`;
      const params = { symbols: symbol };

      const response = await axios.get(url, { params });
      const quote = response.data.quoteResponse.result[0];

      if (!quote) {
        throw new Error('No quote data available');
      }

      return {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap,
      };
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
  }

  /**
   * Get multiple quotes at once
   */
  static async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    try {
      const url = `${YAHOO_FINANCE_API_V7}/quote`;
      const params = { symbols: symbols.join(',') };

      const response = await axios.get(url, { params });
      const quotes = response.data.quoteResponse.result || [];

      return quotes.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap,
      }));
    } catch (error) {
      console.error('Error fetching multiple quotes:', error);
      throw new Error('Failed to fetch quotes');
    }
  }

  /**
   * Convert period string to timestamp
   */
  private static getPeriodTimestamp(period: string): number {
    const now = Math.floor(Date.now() / 1000);
    const periods: Record<string, number> = {
      '1mo': 30 * 24 * 60 * 60,
      '3mo': 90 * 24 * 60 * 60,
      '6mo': 180 * 24 * 60 * 60,
      '1y': 365 * 24 * 60 * 60,
      '2y': 730 * 24 * 60 * 60,
      '5y': 1825 * 24 * 60 * 60,
    };

    return now - (periods[period] || periods['6mo']);
  }

  /**
   * Check if market is open (simplified - Milan exchange hours)
   */
  static isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Weekend
    if (day === 0 || day === 6) return false;

    // Milan Stock Exchange: 9:00 - 17:30 CET
    const currentTime = hours * 60 + minutes;
    const marketOpen = 9 * 60; // 9:00
    const marketClose = 17 * 60 + 30; // 17:30

    return currentTime >= marketOpen && currentTime <= marketClose;
  }
}
