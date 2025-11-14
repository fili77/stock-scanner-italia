import { useState } from 'react';
import { ITALIAN_STOCKS } from '@/config/italianStocks';
import { StockService } from '@/services/stockService';
import { scanForOpportunities, TradingOpportunity, ScannerResult } from '@/utils/opportunityScanner';
import { detectMarketRegime } from '@/utils/regimeDetection';
import { calculateTechnicalIndicators } from '@/utils/stockPrediction';
import { runBacktest, BacktestResult } from '@/utils/backtester';
import { StockData } from '@/types/stock';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Search, TrendingUp, Target, Shield, AlertTriangle, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function OpportunityScanner() {
  const [scanResult, setScanResult] = useState<ScannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [rawDataMap, setRawDataMap] = useState<Map<string, StockData[]>>(new Map());
  const [showRawData, setShowRawData] = useState(false);

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [showBacktestTrades, setShowBacktestTrades] = useState(false);

  const handleBacktest = async () => {
    setBacktestLoading(true);
    setError('');
    setBacktestResult(null);

    try {
      console.log('🔄 Inizio backtest storico (5 anni)...');

      // Scarica 5 anni di dati per tutti i titoli
      const historicalData = new Map<string, StockData[]>();

      const batchSize = 2;
      for (let i = 0; i < ITALIAN_STOCKS.length; i += batchSize) {
        const batch = ITALIAN_STOCKS.slice(i, i + batchSize);

        console.log(`📦 Scarico dati storici: batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ITALIAN_STOCKS.length / batchSize)}...`);

        const promises = batch.map(async (stock) => {
          try {
            // Scarica 5 anni di dati
            const data = await StockService.getHistoricalData(stock.symbol, '5y', '1d');
            if (data.length >= 200) {
              console.log(`✅ ${stock.symbol}: ${data.length} giorni`);
              historicalData.set(stock.symbol, data);
            } else {
              console.log(`⚠️ ${stock.symbol}: dati insufficienti (${data.length} giorni)`);
            }
          } catch (err) {
            console.warn(`❌ ${stock.symbol}: errore`, err);
          }
        });

        await Promise.all(promises);

        if (i + batchSize < ITALIAN_STOCKS.length) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      console.log(`📊 Dati scaricati: ${historicalData.size} titoli`);

      if (historicalData.size === 0) {
        throw new Error('Nessun dato storico disponibile');
      }

      // Calcola date start e end (5 anni fa -> oggi)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 5);

      console.log(`🔍 Eseguo backtest da ${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}...`);

      // Esegui backtest
      const result = await runBacktest(historicalData, startDate, endDate);

      console.log(`✅ Backtest completato:`, result);

      setBacktestResult(result);
    } catch (err) {
      console.error('Backtest error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante il backtest');
    } finally {
      setBacktestLoading(false);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      // Fetch data per tutti i titoli FTSE MIB
      const stockDataMap = new Map();
      const fundamentalsMap = new Map();
      const regimeMap = new Map();

      console.log('Inizio scansione di', ITALIAN_STOCKS.length, 'titoli...');

      // Fetch in parallelo (batches di 2 per evitare rate limiting)
      const batchSize = 2;
      for (let i = 0; i < ITALIAN_STOCKS.length; i += batchSize) {
        const batch = ITALIAN_STOCKS.slice(i, i + batchSize);

        console.log(`📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ITALIAN_STOCKS.length / batchSize)}...`);

        const promises = batch.map(async (stock) => {
          try {
            // Fetch historical data (3 mesi)
            console.log(`📥 Downloading ${stock.symbol}...`);
            const data = await StockService.getHistoricalData(stock.symbol, '3mo', '1d');
            if (data.length < 30) {
              console.log(`⚠️ ${stock.symbol}: Dati insufficienti (${data.length} giorni)`);
              return null;
            }

            console.log(`✅ ${stock.symbol}: ${data.length} giorni di dati`);
            stockDataMap.set(stock.symbol, data);

            // Fetch fundamentals (optional)
            try {
              const fundamentalData = await StockService.getFundamentals(stock.symbol);
              fundamentalsMap.set(stock.symbol, fundamentalData);
            } catch {
              // Continue senza fundamentals
            }

            // Detect regime
            const indicators = calculateTechnicalIndicators(data);
            const regime = detectMarketRegime(data, indicators);
            regimeMap.set(stock.symbol, regime.regime);

            return stock.symbol;
          } catch (err) {
            console.warn(`Failed to fetch ${stock.symbol}:`, err);
            return null;
          }
        });

        await Promise.all(promises);

        // Delay di 800ms tra i batch per evitare rate limiting
        if (i + batchSize < ITALIAN_STOCKS.length) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      console.log(`📊 Download completato: ${stockDataMap.size} titoli con dati validi`);
      console.log('🔍 Inizio analisi per cercare opportunità...');

      // Salva i dati raw per visualizzazione
      setRawDataMap(stockDataMap);

      // Run scanner
      const result = await scanForOpportunities(stockDataMap, fundamentalsMap, regimeMap);

      // Add stock names
      result.opportunities.forEach(opp => {
        const stockInfo = ITALIAN_STOCKS.find(s => s.symbol === opp.symbol);
        if (stockInfo) {
          opp.stockName = stockInfo.name;
        }
      });

      setScanResult(result);
    } catch (err) {
      console.error('Scanner error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante la scansione');
    } finally {
      setLoading(false);
    }
  };

  const getOpportunityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      volume_anomaly: '📊 Volume Anomaly',
      post_earnings: '📈 Post-Earnings Drift',
      pre_dividend: '💰 Pre-Dividend',
      correlation_breakdown: '🔗 Correlation Break',
      support_bounce: '⬆️ Support Bounce',
      resistance_break: '⬆️ Resistance Break',
    };
    return labels[type] || type;
  };

  const getEdgeStrengthColor = (strength: string) => {
    if (strength === 'strong') return 'text-green-700 bg-green-100';
    if (strength === 'medium') return 'text-yellow-700 bg-yellow-100';
    return 'text-gray-700 bg-gray-100';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Daily Opportunity Scanner</h1>
        <p className="text-muted-foreground">
          Scansiona automaticamente 30 titoli FTSE MIB per trovare opportunità con edge statisticamente significativo
        </p>
      </div>

      {/* Scan Button */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Scansione Giornaliera</h3>
            <p className="text-sm text-muted-foreground">
              Analizza tutti i titoli FTSE MIB per edge reali: volume anomalies, post-earnings drift, pre-dividend setups
            </p>
          </div>
          <Button
            onClick={handleScan}
            disabled={loading}
            size="lg"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Scansione in corso...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Avvia Scansione
              </>
            )}
          </Button>
        </div>

        {loading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              ⏳ Analisi di {ITALIAN_STOCKS.length} titoli in corso... Questo può richiedere 30-60 secondi.
            </p>
          </div>
        )}
      </Card>

      {/* Backtest Button */}
      <Card className="p-6 mb-6 border-2 border-purple-300 bg-purple-50">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-1 text-purple-900">📊 Backtest Storico (5 Anni)</h3>
            <p className="text-sm text-purple-800">
              Testa la strategia su 5 anni di dati storici. Scansiona 1 volta al mese (60 scansioni totali) e simula ogni operazione.
            </p>
          </div>
          <Button
            onClick={handleBacktest}
            disabled={backtestLoading || loading}
            size="lg"
            variant="outline"
            className="gap-2 border-purple-400 text-purple-900 hover:bg-purple-100"
          >
            {backtestLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Backtest in corso...
              </>
            ) : (
              <>
                <BarChart3 className="h-5 w-5" />
                Avvia Backtest
              </>
            )}
          </Button>
        </div>

        {backtestLoading && (
          <div className="mt-4 p-4 bg-purple-100 rounded-lg">
            <p className="text-sm text-purple-900">
              ⏳ Download di 5 anni di dati storici in corso... Questo può richiedere 3-5 minuti.
            </p>
          </div>
        )}
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {scanResult && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="p-6 border-2 border-blue-300 bg-blue-50">
            <h2 className="text-xl font-bold mb-3">📊 Risultati Scansione</h2>
            <div className="space-y-1">
              {scanResult.summary.map((line, idx) => (
                <p key={idx} className="text-sm">
                  {line}
                </p>
              ))}
            </div>
          </Card>

          {/* No Opportunities */}
          {scanResult.opportunities.length === 0 && (
            <Card className="p-8 text-center border-2 border-yellow-300 bg-yellow-50">
              <p className="text-2xl mb-2">💰</p>
              <h3 className="text-lg font-bold mb-2">STAY CASH</h3>
              <p className="text-sm text-muted-foreground">
                Nessuna opportunità con edge sufficiente trovata oggi.
                <br />
                Nel trading selettivo, la maggior parte dei giorni non si opera.
              </p>
            </Card>
          )}

          {/* Opportunities */}
          {scanResult.opportunities.map((opp, idx) => (
            <Card key={idx} className="p-6 border-2 border-green-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold">{opp.stockName}</h3>
                    <span className="text-sm text-muted-foreground">({opp.symbol})</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEdgeStrengthColor(opp.edgeStrength)}`}>
                      {opp.edgeStrength.toUpperCase()} EDGE
                    </span>
                  </div>
                  <p className="text-lg font-medium text-blue-700">{getOpportunityTypeLabel(opp.type)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-3xl font-bold text-green-700">{opp.totalScore.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">/100</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/50 p-3 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-medium text-muted-foreground">Expected Return</p>
                  </div>
                  <p className="text-lg font-bold text-green-700">+{opp.expectedReturn.toFixed(2)}%</p>
                </div>

                <div className="bg-white/50 p-3 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-medium text-muted-foreground">Risk/Reward</p>
                  </div>
                  <p className="text-lg font-bold">{opp.riskRewardRatio.toFixed(2)}:1</p>
                </div>

                <div className="bg-white/50 p-3 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <p className="text-xs font-medium text-muted-foreground">Confidence</p>
                  </div>
                  <p className="text-lg font-bold">{opp.confidence.toFixed(0)}%</p>
                </div>

                <div className="bg-white/50 p-3 rounded">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Holding Period</p>
                  <p className="text-lg font-bold">{opp.expectedHoldingPeriod} giorni</p>
                </div>
              </div>

              {/* Entry/Exit Levels */}
              <div className="bg-gray-50 p-4 rounded mb-4">
                <h4 className="font-semibold mb-3">Livelli Operativi</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Prezzo Corrente</p>
                    <p className="font-bold">€{opp.currentPrice.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entry</p>
                    <p className="font-bold text-blue-700">€{opp.entryPrice.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stop Loss</p>
                    <p className="font-bold text-red-700">€{opp.stopLoss.toFixed(3)}</p>
                    <p className="text-xs text-muted-foreground">
                      ({(((opp.stopLoss - opp.currentPrice) / opp.currentPrice) * 100).toFixed(2)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Take Profit</p>
                    <p className="font-bold text-green-700">€{opp.takeProfit.toFixed(3)}</p>
                    <p className="text-xs text-muted-foreground">
                      (+{(((opp.takeProfit - opp.currentPrice) / opp.currentPrice) * 100).toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Analisi Dettagliata</h4>
                <ul className="space-y-1">
                  {opp.details.map((detail, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Management */}
              <div className="bg-orange-50 border border-orange-200 p-4 rounded">
                <h4 className="font-semibold mb-2 text-orange-900">Risk Management</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Position Size (Kelly)</p>
                    <p className="font-bold">{opp.positionSize.toFixed(1)}% del portfolio</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Regime di Mercato</p>
                    <p className="font-bold capitalize">{opp.regime.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Disclaimer */}
          <Card className="p-6 bg-gray-50">
            <h3 className="font-semibold mb-2">⚠️ Note Importanti</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Queste sono opportunità identificate statisticamente, NON garanzie di profitto</li>
              <li>• Usa sempre stop loss e rispetta il position sizing suggerito</li>
              <li>• Nel trading selettivo, la maggior parte dei giorni (70%) NON si opera</li>
              <li>• Le opportunità sono ordinate per score (migliore prima)</li>
              <li>• Expected return è AL NETTO di costi di trading stimati (0.2% round-trip)</li>
            </ul>
          </Card>
        </div>
      )}

      {/* Backtest Results */}
      {backtestResult && (
        <div className="space-y-6 mt-6">
          {/* Summary Stats */}
          <Card className="p-6 border-2 border-purple-500 bg-purple-50">
            <h2 className="text-2xl font-bold mb-4 text-purple-900">📊 Risultati Backtest Storico</h2>
            <div className="bg-white p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Periodo: {backtestResult.startDate} → {backtestResult.endDate}
              </p>
              <p className="text-sm text-muted-foreground">
                Scansioni eseguite: {backtestResult.totalScans} (1 al mese)
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-purple-300">
                <p className="text-xs text-muted-foreground mb-1">Opportunità Trovate</p>
                <p className="text-3xl font-bold text-purple-900">{backtestResult.totalOpportunitiesFound}</p>
                <p className="text-xs text-muted-foreground mt-1">in 5 anni</p>
              </div>

              <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
                <p className="text-xs text-muted-foreground mb-1">Trade Eseguiti</p>
                <p className="text-3xl font-bold text-blue-900">{backtestResult.totalTrades}</p>
                <p className="text-xs text-muted-foreground mt-1">operazioni</p>
              </div>

              <div className={`bg-white p-4 rounded-lg border-2 ${backtestResult.winRate >= 50 ? 'border-green-300' : 'border-red-300'}`}>
                <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                <p className={`text-3xl font-bold ${backtestResult.winRate >= 50 ? 'text-green-700' : 'text-red-700'}`}>
                  {backtestResult.winRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {backtestResult.wins}W / {backtestResult.losses}L
                </p>
              </div>

              <div className={`bg-white p-4 rounded-lg border-2 ${backtestResult.avgReturnPerTrade >= 0 ? 'border-green-300' : 'border-red-300'}`}>
                <p className="text-xs text-muted-foreground mb-1">Return Medio</p>
                <p className={`text-3xl font-bold ${backtestResult.avgReturnPerTrade >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {backtestResult.avgReturnPerTrade >= 0 ? '+' : ''}{backtestResult.avgReturnPerTrade.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">per trade</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm font-semibold text-green-700 mb-1">Avg Win</p>
                <p className="text-2xl font-bold text-green-700">+{backtestResult.avgWin.toFixed(2)}%</p>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm font-semibold text-red-700 mb-1">Avg Loss</p>
                <p className="text-2xl font-bold text-red-700">-{backtestResult.avgLoss.toFixed(2)}%</p>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm font-semibold text-purple-900 mb-1">Profit Factor</p>
                <p className="text-2xl font-bold text-purple-900">{backtestResult.profitFactor.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">(profitti/perdite)</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-purple-400">
              <p className="text-sm font-semibold mb-2">💰 Rendimento Totale Stimato:</p>
              <p className={`text-4xl font-bold ${backtestResult.totalReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {backtestResult.totalReturn >= 0 ? '+' : ''}{backtestResult.totalReturn.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Assumendo position size del 5% per ogni trade e compounding dei profitti
              </p>
            </div>
          </Card>

          {/* Statistiche Aggiuntive */}
          <Card className="p-6 border-2 border-yellow-500 bg-yellow-50">
            <h3 className="text-xl font-bold mb-4 text-yellow-900">📈 Statistiche Avanzate</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-yellow-300">
                <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-700">-{backtestResult.maxDrawdown.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-1">perdita massima</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-yellow-300">
                <p className="text-xs text-muted-foreground mb-1">Holding Medio</p>
                <p className="text-2xl font-bold text-blue-700">{backtestResult.avgHoldingDays.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">giorni per trade</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-300">
                <p className="text-xs text-muted-foreground mb-1">Max Streak Wins</p>
                <p className="text-2xl font-bold text-green-700">{backtestResult.maxConsecutiveWins}</p>
                <p className="text-xs text-muted-foreground mt-1">vittorie consecutive</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-red-300">
                <p className="text-xs text-muted-foreground mb-1">Max Streak Losses</p>
                <p className="text-2xl font-bold text-red-700">{backtestResult.maxConsecutiveLosses}</p>
                <p className="text-xs text-muted-foreground mt-1">perdite consecutive</p>
              </div>
            </div>
          </Card>

          {/* Performance per Strategia */}
          {backtestResult.byStrategy && backtestResult.byStrategy.length > 0 && (
            <Card className="p-6 border-2 border-green-500 bg-green-50">
              <h3 className="text-xl font-bold mb-4 text-green-900">🎯 Performance per Strategia</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white rounded">
                  <thead>
                    <tr className="border-b-2 border-green-300">
                      <th className="text-left p-3">Strategia</th>
                      <th className="text-center p-3">Trade</th>
                      <th className="text-center p-3">Win Rate</th>
                      <th className="text-right p-3">Avg Return</th>
                      <th className="text-right p-3">Total Return</th>
                      <th className="text-right p-3">Profit Factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestResult.byStrategy.map((strat, idx) => (
                      <tr key={idx} className="border-b hover:bg-green-50">
                        <td className="p-3 font-semibold capitalize">{strat.strategy.replace(/_/g, ' ')}</td>
                        <td className="text-center p-3">{strat.totalTrades}</td>
                        <td className="text-center p-3">
                          <span className={`font-bold ${strat.winRate >= 50 ? 'text-green-700' : 'text-red-700'}`}>
                            {strat.winRate.toFixed(1)}%
                          </span>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {strat.wins}W/{strat.losses}L
                          </span>
                        </td>
                        <td className={`text-right p-3 font-bold ${strat.avgReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {strat.avgReturn >= 0 ? '+' : ''}{strat.avgReturn.toFixed(2)}%
                        </td>
                        <td className={`text-right p-3 font-bold ${strat.totalReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {strat.totalReturn >= 0 ? '+' : ''}{strat.totalReturn.toFixed(2)}%
                        </td>
                        <td className="text-right p-3 font-bold text-purple-700">
                          {strat.profitFactor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Performance per Anno */}
          {backtestResult.byYear && backtestResult.byYear.length > 0 && (
            <Card className="p-6 border-2 border-blue-500 bg-blue-50">
              <h3 className="text-xl font-bold mb-4 text-blue-900">📅 Performance per Anno</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white rounded">
                  <thead>
                    <tr className="border-b-2 border-blue-300">
                      <th className="text-left p-3">Anno</th>
                      <th className="text-center p-3">Trade</th>
                      <th className="text-center p-3">Win Rate</th>
                      <th className="text-right p-3">Total Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestResult.byYear.map((year, idx) => (
                      <tr key={idx} className="border-b hover:bg-blue-50">
                        <td className="p-3 font-bold">{year.year}</td>
                        <td className="text-center p-3">{year.totalTrades}</td>
                        <td className="text-center p-3">
                          <span className={`font-bold ${year.winRate >= 50 ? 'text-green-700' : 'text-red-700'}`}>
                            {year.winRate.toFixed(1)}%
                          </span>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {year.wins}W/{year.losses}L
                          </span>
                        </td>
                        <td className={`text-right p-3 font-bold text-lg ${year.totalReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {year.totalReturn >= 0 ? '+' : ''}{year.totalReturn.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Trades List */}
          {backtestResult.trades.length > 0 && (
            <Card className="p-6 border-2 border-gray-300">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowBacktestTrades(!showBacktestTrades)}
              >
                <h3 className="font-bold text-lg">
                  📋 Elenco Completo Trade ({backtestResult.trades.length}) - CLICCA QUI
                </h3>
                {showBacktestTrades ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>

              {showBacktestTrades && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b-2">
                        <th className="pb-2">Data</th>
                        <th className="pb-2">Titolo</th>
                        <th className="pb-2">Tipo</th>
                        <th className="text-right pb-2">Entry</th>
                        <th className="text-right pb-2">Exit</th>
                        <th className="text-right pb-2">Return</th>
                        <th className="text-center pb-2">Giorni</th>
                        <th className="text-center pb-2">Esito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backtestResult.trades.map((trade, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-2">{trade.date}</td>
                          <td className="py-2 font-medium">{trade.stockName}</td>
                          <td className="py-2 text-xs">{trade.type}</td>
                          <td className="text-right py-2">€{trade.entryPrice.toFixed(3)}</td>
                          <td className="text-right py-2">€{trade.exitPrice.toFixed(3)}</td>
                          <td className={`text-right py-2 font-bold ${trade.actualReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {trade.actualReturn >= 0 ? '+' : ''}{trade.actualReturn.toFixed(2)}%
                          </td>
                          <td className="text-center py-2">{trade.daysHeld}</td>
                          <td className="text-center py-2">
                            {trade.outcome === 'win' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">WIN</span>}
                            {trade.outcome === 'loss' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">LOSS</span>}
                            {trade.outcome === 'breakeven' && <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">B/E</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Dati Raw Scaricati */}
      {rawDataMap.size > 0 && (
        <Card className="p-6 mt-6 border-2 border-blue-500 bg-blue-50">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowRawData(!showRawData)}
          >
            <h3 className="font-bold text-xl text-blue-900">
              📊 DATI PREZZI SCARICATI ({rawDataMap.size} titoli) - CLICCA QUI
            </h3>
            {showRawData ? <ChevronUp className="h-6 w-6 text-blue-900" /> : <ChevronDown className="h-6 w-6 text-blue-900" />}
          </div>

          {showRawData && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-blue-900 mb-4 font-bold bg-white p-3 rounded">
                📈 Ultimi 5 giorni di prezzi per ogni titolo (riga in GIALLO = prezzo di OGGI):
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from(rawDataMap.entries()).map(([symbol, data]) => {
                  const stockInfo = ITALIAN_STOCKS.find(s => s.symbol === symbol);
                  const last5 = data.slice(-5);

                  return (
                    <div key={symbol} className="bg-white p-4 rounded border-2 border-blue-400 shadow-md">
                      <h4 className="font-bold text-base mb-3 text-blue-900">
                        {stockInfo?.name || symbol}
                        <span className="text-sm text-gray-600 ml-2">({symbol})</span>
                      </h4>

                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-blue-800 font-bold border-b-2 border-blue-300">
                            <th className="pb-2">Data</th>
                            <th className="text-right pb-2">Open</th>
                            <th className="text-right pb-2">High</th>
                            <th className="text-right pb-2">Low</th>
                            <th className="text-right pb-2">Close</th>
                            <th className="text-right pb-2">Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {last5.map((d, i) => (
                            <tr
                              key={i}
                              className={i === last5.length - 1 ? 'font-bold bg-yellow-200 border-2 border-yellow-400' : 'hover:bg-gray-50'}
                            >
                              <td className="py-1">{d.date}</td>
                              <td className="text-right py-1">€{d.open.toFixed(3)}</td>
                              <td className="text-right py-1">€{d.high.toFixed(3)}</td>
                              <td className="text-right py-1">€{d.low.toFixed(3)}</td>
                              <td className="text-right py-1 font-bold">€{d.close.toFixed(3)}</td>
                              <td className="text-right py-1">{(d.volume / 1000000).toFixed(2)}M</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mt-3 pt-3 border-t-2 border-blue-200 text-xs text-blue-800 font-bold">
                        ✅ Totale: {data.length} giorni di dati storici
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
