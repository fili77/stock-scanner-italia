import { useState } from 'react';
import { ITALIAN_STOCKS } from '@/config/italianStocks';
import { StockService } from '@/services/stockService';
import { scanForOpportunities, TradingOpportunity, ScannerResult } from '@/utils/opportunityScanner';
import { detectMarketRegime } from '@/utils/regimeDetection';
import { calculateTechnicalIndicators } from '@/utils/stockPrediction';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Loader2, Search, TrendingUp, Target, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type DownloadProgress = {
  current: number;
  total: number;
  currentStock: string;
  succeeded: string[];
  failed: string[];
};

export default function OpportunityScanner() {
  const [scanResult, setScanResult] = useState<ScannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError('');
    setScanResult(null);
    setDownloadProgress({
      current: 0,
      total: ITALIAN_STOCKS.length,
      currentStock: '',
      succeeded: [],
      failed: []
    });

    try {
      const stockDataMap = new Map();
      const fundamentalsMap = new Map();
      const regimeMap = new Map();

      console.log('🚀 Inizio scansione di', ITALIAN_STOCKS.length, 'titoli...');

      // Fetch in parallelo (batches di 5)
      const batchSize = 5;
      let processedCount = 0;

      for (let i = 0; i < ITALIAN_STOCKS.length; i += batchSize) {
        const batch = ITALIAN_STOCKS.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map(async (stock) => {
            setDownloadProgress(prev => prev ? {
              ...prev,
              currentStock: stock.symbol,
              current: processedCount + 1
            } : null);

            try {
              console.log(`📥 Downloading ${stock.symbol}...`);

              // Fetch historical data (3 mesi)
              const data = await StockService.getHistoricalData(stock.symbol, '3mo', '1d');

              if (!data || data.length === 0) {
                throw new Error('Nessun dato ricevuto');
              }

              if (data.length < 30) {
                throw new Error(`Dati insufficienti: ${data.length} giorni (minimo 30)`);
              }

              console.log(`✅ ${stock.symbol}: ${data.length} giorni di dati`);
              stockDataMap.set(stock.symbol, data);

              // Fetch fundamentals (optional)
              try {
                const fundamentalData = await StockService.getFundamentals(stock.symbol);
                if (fundamentalData) {
                  fundamentalsMap.set(stock.symbol, fundamentalData);
                  console.log(`✅ ${stock.symbol}: fundamentals OK`);
                }
              } catch {
                console.log(`⚠️ ${stock.symbol}: fundamentals non disponibili`);
              }

              // Detect regime
              const indicators = calculateTechnicalIndicators(data);
              const regime = detectMarketRegime(data, indicators);
              regimeMap.set(stock.symbol, regime.regime);
              console.log(`✅ ${stock.symbol}: regime = ${regime.regime}`);

              return { symbol: stock.symbol, success: true };
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : 'Errore sconosciuto';
              console.error(`❌ ${stock.symbol}: ${errorMsg}`);
              return { symbol: stock.symbol, success: false, error: errorMsg };
            }
          })
        );

        // Update progress with results
        batchResults.forEach((result, idx) => {
          processedCount++;
          const stock = batch[idx];

          if (result.status === 'fulfilled' && result.value.success) {
            setDownloadProgress(prev => prev ? {
              ...prev,
              current: processedCount,
              succeeded: [...prev.succeeded, stock.symbol]
            } : null);
          } else {
            const errorMsg = result.status === 'rejected'
              ? 'Network error'
              : (result.value as any).error || 'Unknown error';

            setDownloadProgress(prev => prev ? {
              ...prev,
              current: processedCount,
              failed: [...prev.failed, `${stock.symbol} (${errorMsg})`]
            } : null);
          }
        });

        // Small delay between batches
        if (i + batchSize < ITALIAN_STOCKS.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`📊 Download completato: ${stockDataMap.size} titoli con dati validi`);

      // Check if we have enough data
      if (stockDataMap.size === 0) {
        throw new Error('❌ NESSUN DATO SCARICATO! Impossibile procedere con la scansione. Verifica la connessione internet o riprova più tardi.');
      }

      if (stockDataMap.size < 10) {
        console.warn(`⚠️ Solo ${stockDataMap.size} titoli hanno dati validi`);
      }

      console.log('🔍 Inizio analisi opportunità...');

      // Run scanner
      const result = await scanForOpportunities(stockDataMap, fundamentalsMap, regimeMap);

      // Add stock names
      result.opportunities.forEach(opp => {
        const stockInfo = ITALIAN_STOCKS.find(s => s.symbol === opp.symbol);
        if (stockInfo) {
          opp.stockName = stockInfo.name;
        }
      });

      console.log(`✅ Scansione completata: ${result.opportunities.length} opportunità trovate`);
      setScanResult(result);

    } catch (err) {
      console.error('💥 Errore scanner:', err);
      setError(err instanceof Error ? err.message : 'Errore durante la scansione');
    } finally {
      setLoading(false);
      setDownloadProgress(null);
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

        {/* Download Progress */}
        {downloadProgress && (
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  📥 Download dati di mercato: {downloadProgress.current}/{downloadProgress.total}
                </p>
                <p className="text-sm text-muted-foreground">
                  {downloadProgress.currentStock && `Caricamento ${downloadProgress.currentStock}...`}
                </p>
              </div>
              <Progress
                value={(downloadProgress.current / downloadProgress.total) * 100}
                className="h-2"
              />
            </div>

            {/* Success/Fail Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800">
                    Successi: {downloadProgress.succeeded.length}
                  </p>
                </div>
                {downloadProgress.succeeded.length > 0 && (
                  <div className="text-xs text-green-700 max-h-20 overflow-y-auto">
                    {downloadProgress.succeeded.slice(-5).join(', ')}
                    {downloadProgress.succeeded.length > 5 && '...'}
                  </div>
                )}
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium text-red-800">
                    Errori: {downloadProgress.failed.length}
                  </p>
                </div>
                {downloadProgress.failed.length > 0 && (
                  <div className="text-xs text-red-700 max-h-20 overflow-y-auto">
                    {downloadProgress.failed.slice(0, 3).map(f => f.split(' (')[0]).join(', ')}
                    {downloadProgress.failed.length > 3 && '...'}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              💡 Apri la Console del browser (F12) per vedere il log dettagliato di ogni titolo
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
    </div>
  );
}
