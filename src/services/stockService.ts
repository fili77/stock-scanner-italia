import axios from 'axios';
import { StockData, StockQuote, FundamentalData } from '@/types/stock';

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance';
const YAHOO_FINANCE_API_V7 = 'https://query1.finance.yahoo.com/v7/finance';
const YAHOO_FINANCE_API_V10 = 'https://query1.finance.yahoo.com/v10/finance';

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
   * Get fundamental data for a stock
   */
  static async getFundamentals(symbol: string): Promise<FundamentalData> {
    try {
      const url = `${YAHOO_FINANCE_API_V10}/quoteSummary/${symbol}`;
      const params = {
        modules: 'defaultKeyStatistics,financialData,summaryDetail,price,calendarEvents',
      };

      const response = await axios.get(url, { params });
      const result = response.data.quoteSummary.result[0];

      if (!result) {
        throw new Error('No fundamental data available');
      }

      const keyStats = result.defaultKeyStatistics || {};
      const financialData = result.financialData || {};
      const summaryDetail = result.summaryDetail || {};
      const priceData = result.price || {};
      const calendarEvents = result.calendarEvents || {};

      // Extract earnings date
      const earningsDate = calendarEvents.earnings?.earningsDate?.[0]?.fmt || null;

      // Extract ex-dividend date
      const exDividendDate = calendarEvents.exDividendDate?.fmt || summaryDetail.exDividendDate?.fmt || null;

      // Extract dividend rate
      const dividendRate = summaryDetail.dividendRate?.raw || null;

      return {
        // Valuation
        peRatio: keyStats.trailingPE?.raw || keyStats.forwardPE?.raw || null,
        pegRatio: keyStats.pegRatio?.raw || null,
        priceToBook: keyStats.priceToBook?.raw || null,
        priceToSales: keyStats.priceToSalesTrailing12Months?.raw || null,
        evToEbitda: keyStats.enterpriseToEbitda?.raw || null,

        // Profitability
        profitMargin: financialData.profitMargins?.raw || null,
        operatingMargin: financialData.operatingMargins?.raw || null,
        returnOnEquity: financialData.returnOnEquity?.raw || null,
        returnOnAssets: financialData.returnOnAssets?.raw || null,

        // Growth
        revenueGrowth: financialData.revenueGrowth?.raw || null,
        earningsGrowth: financialData.earningsGrowth?.raw || null,

        // Financial Health
        debtToEquity: financialData.debtToEquity?.raw || null,
        currentRatio: financialData.currentRatio?.raw || null,
        quickRatio: financialData.quickRatio?.raw || null,

        // Dividend
        dividendYield: summaryDetail.dividendYield?.raw || summaryDetail.trailingAnnualDividendYield?.raw || null,
        payoutRatio: summaryDetail.payoutRatio?.raw || null,

        // Per Share
        eps: keyStats.trailingEps?.raw || null,
        bookValuePerShare: keyStats.bookValue?.raw || null,

        // Other
        marketCap: priceData.marketCap?.raw || null,
        beta: keyStats.beta?.raw || null,
        sharesOutstanding: keyStats.sharesOutstanding?.raw || null,

        // Financial Events
        earningsDate,
        exDividendDate,
        dividendRate,
      };
    } catch (error) {
      console.error('Error fetching fundamentals:', error);
      // Return empty data instead of throwing
      return {
        peRatio: null,
        pegRatio: null,
        priceToBook: null,
        priceToSales: null,
        evToEbitda: null,
        profitMargin: null,
        operatingMargin: null,
        returnOnEquity: null,
        returnOnAssets: null,
        revenueGrowth: null,
        earningsGrowth: null,
        debtToEquity: null,
        currentRatio: null,
        quickRatio: null,
        dividendYield: null,
        payoutRatio: null,
        eps: null,
        bookValuePerShare: null,
        marketCap: null,
        beta: null,
        sharesOutstanding: null,
        earningsDate: null,
        exDividendDate: null,
        dividendRate: null,
      };
    }
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
