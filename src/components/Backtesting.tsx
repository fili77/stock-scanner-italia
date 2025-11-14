import { useState } from 'react';
import { ITALIAN_STOCKS } from '@/config/italianStocks';
import { StockService } from '@/services/stockService';
import { backtest, BacktestReport, getPerformanceRating, generateRecommendations } from '@/utils/backtesting';
import { analyzeFundamentals } from '@/utils/fundamentalAnalysis';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Activity, Target, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';

export default function Backtesting() {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [testDays, setTestDays] = useState<string>('60');
  const [report, setReport] = useState<BacktestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleRunBacktest = async () => {
    if (!selectedStock) {
      setError('Seleziona un titolo');
      return;
    }

    setLoading(true);
    setError('');
    setReport(null);

    try {
      // Fetch historical data (need more data for backtesting)
      const data = await StockService.getHistoricalData(selectedStock, '1y', '1d');

      if (data.length < parseInt(testDays) + 60) {
        throw new Error('Dati insufficienti per il backtesting');
      }

      // Fetch fundamentals once for efficiency (optional)
      let fundamentalAnalysis = undefined;
      try {
        const stockInfo = ITALIAN_STOCKS.find(s => s.symbol === selectedStock);
        const fundamentalData = await StockService.getFundamentals(selectedStock);
        fundamentalAnalysis = analyzeFundamentals(fundamentalData, stockInfo?.sector || 'General');
        console.log('Fundamentals fetched successfully for backtesting');
      } catch (fundError) {
        console.warn('Could not fetch fundamentals for backtesting, proceeding with technical analysis only:', fundError);
      }

      // Run backtest with optional fundamentals
      const backtestReport = backtest(selectedStock, data, parseInt(testDays), 60, fundamentalAnalysis);

      // Add fundamentals to report for display
      if (fundamentalAnalysis) {
        backtestReport.fundamentals = fundamentalAnalysis;
      }

      setReport(backtestReport);
    } catch (err) {
      console.error('Error running backtest:', err);
      setError(err instanceof Error ? err.message : 'Errore durante il backtesting');
    } finally {
      setLoading(false);
    }
  };

  const selectedStockInfo = ITALIAN_STOCKS.find(s => s.symbol === selectedStock);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Backtesting Previsioni</h1>
        <p className="text-muted-foreground">
          Testa l'affidabilità statistica delle previsioni su dati storici
        </p>
      </div>

      {/* Configuration */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Titolo</label>
            <Select value={selectedStock} onValueChange={setSelectedStock}>
              <SelectTrigger>
                <SelectValue placeholder="Scegli un titolo..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {ITALIAN_STOCKS.map((stock) => (
                  <SelectItem key={stock.symbol} value={stock.symbol}>
                    {stock.name} ({stock.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Giorni di Test</label>
            <Select value={testDays} onValueChange={setTestDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 giorni</SelectItem>
                <SelectItem value="60">60 giorni</SelectItem>
                <SelectItem value="90">90 giorni</SelectItem>
                <SelectItem value="120">120 giorni</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleRunBacktest}
              disabled={loading || !selectedStock}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Esegui Backtesting
                </>
              )}
            </Button>
          </div>
        </div>

        {selectedStockInfo && !loading && !report && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">{selectedStockInfo.name}</span>
              <br />
              <span className="text-muted-foreground">
                Verranno testati gli ultimi {testDays} giorni di previsioni su dati storici
              </span>
            </p>
          </div>
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {report && (
        <div className="space-y-6">
          {/* Performance Rating */}
          {(() => {
            const rating = getPerformanceRating(report.statistics);
            return (
              <Card className={`p-6 border-2 ${rating.color}`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-current/10">
                    {rating.rating === 'excellent' || rating.rating === 'good' ? (
                      <CheckCircle2 className="h-8 w-8" />
                    ) : (
                      <AlertCircle className="h-8 w-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">
                      Valutazione: {rating.rating === 'excellent' ? 'Eccellente' : rating.rating === 'good' ? 'Buono' : rating.rating === 'fair' ? 'Discreto' : 'Scarso'}
                    </h2>
                    <p className="text-sm mb-4">{rating.message}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        Periodo: {new Date(report.startDate).toLocaleDateString('it-IT')} - {new Date(report.endDate).toLocaleDateString('it-IT')}
                        ({report.statistics.totalPredictions} previsioni)
                      </p>
                      <p className="flex items-center gap-1">
                        {report.fundamentals ? (
                          <span className="text-green-700 font-medium">✓ Con analisi fondamentale</span>
                        ) : (
                          <span className="text-orange-700">• Solo analisi tecnica</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium">Accuratezza Direzionale</p>
              </div>
              <p className="text-3xl font-bold">{report.statistics.directionalAccuracy.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {report.statistics.directionalAccuracy >= 55 ? '✅ Ottimo' : report.statistics.directionalAccuracy >= 50 ? '⚠️ Accettabile' : '❌ Basso'}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-medium">MAPE</p>
              </div>
              <p className="text-3xl font-bold">{report.statistics.mape.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Errore percentuale medio</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium">Rendimento Simulato</p>
              </div>
              <p className={`text-3xl font-bold ${report.statistics.simulatedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {report.statistics.simulatedReturn >= 0 ? '+' : ''}{report.statistics.simulatedReturn.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                vs Buy&Hold: {report.statistics.buyHoldReturn.toFixed(2)}%
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-medium">Sharpe Ratio</p>
              </div>
              <p className="text-3xl font-bold">{report.statistics.sharpeRatio.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {report.statistics.sharpeRatio > 1 ? '✅ Eccellente' : report.statistics.sharpeRatio > 0.5 ? '⚠️ Buono' : '❌ Basso'}
              </p>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Metriche Dettagliate</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">RMSE</p>
                <p className="font-semibold">€{report.statistics.rmse.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">MAE</p>
                <p className="font-semibold">€{report.statistics.mae.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Errore Massimo</p>
                <p className="font-semibold">€{report.statistics.maxError.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Win Rate</p>
                <p className="font-semibold">{report.statistics.winRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Profit Factor</p>
                <p className="font-semibold">{report.statistics.profitFactor.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Outperformance</p>
                <p className={`font-semibold ${report.statistics.outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {report.statistics.outperformance >= 0 ? '+' : ''}{report.statistics.outperformance.toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>

          {/* Charts */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Confronto Previsioni vs Prezzi Reali</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={report.results.map(r => ({
                  date: new Date(r.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
                  actual: r.actualPrice,
                  predicted: r.predictedPrice,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" name="Prezzo Reale" strokeWidth={2} />
                <Line type="monotone" dataKey="predicted" stroke="#ef4444" name="Prezzo Previsto" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Scatter Plot: Prediction Error Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuzione Errori di Previsione</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="index"
                  name="Giorno"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="error"
                  name="Errore %"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Errore %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
                <Scatter
                  name="Errore di Previsione"
                  data={report.results.map((r, idx) => ({
                    index: idx + 1,
                    error: r.percentageError * (r.predictedPrice > r.actualPrice ? 1 : -1),
                  }))}
                  fill="#8b5cf6"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>

          {/* Recommendations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Raccomandazioni</h3>
            <ul className="space-y-2">
              {generateRecommendations(report.statistics).map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="mt-1">{rec.startsWith('✅') ? '✅' : '⚠️'}</span>
                  <span>{rec.replace(/^[✅⚠️]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Interpretation Guide */}
          <Card className="p-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-4">Come Interpretare i Risultati</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Accuratezza Direzionale &gt; 55%:</strong> Il modello prevede correttamente la direzione del movimento in oltre metà dei casi</p>
              <p><strong>MAPE &lt; 3%:</strong> L'errore percentuale medio è basso, indicando previsioni accurate</p>
              <p><strong>Sharpe Ratio &gt; 1:</strong> Buon rapporto rendimento/rischio</p>
              <p><strong>Outperformance &gt; 0:</strong> La strategia basata sulle previsioni batte il semplice buy-and-hold</p>
              <p><strong>Profit Factor &gt; 1:</strong> I profitti totali superano le perdite totali</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
