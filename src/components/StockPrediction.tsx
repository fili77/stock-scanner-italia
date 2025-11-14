import { useState } from 'react';
import { StockData, StockPrediction as StockPredictionType } from '@/types/stock';
import { ITALIAN_STOCKS } from '@/config/italianStocks';
import { StockService } from '@/services/stockService';
import { predictStock } from '@/utils/stockPrediction';
import { analyzeFundamentals, combineRecommendations } from '@/utils/fundamentalAnalysis';
import StockChart from './StockChart';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2, TrendingUp, TrendingDown, Minus, AlertCircle, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Link } from 'react-router-dom';

export default function StockPrediction() {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [prediction, setPrediction] = useState<StockPredictionType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleAnalyze = async () => {
    if (!selectedStock) {
      setError('Seleziona un titolo');
      return;
    }

    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      // Fetch historical data (6 months of daily data)
      const data = await StockService.getHistoricalData(selectedStock, '6mo', '1d');

      if (data.length < 50) {
        throw new Error('Dati insufficienti per l\'analisi. Il titolo potrebbe essere troppo recente.');
      }

      setStockData(data);

      // Generate technical prediction
      const pred = predictStock(selectedStock, data);

      // Fetch and analyze fundamental data
      try {
        const fundamentalData = await StockService.getFundamentals(selectedStock);
        const stockInfo = ITALIAN_STOCKS.find(s => s.symbol === selectedStock);
        const sector = stockInfo?.sector || 'default';

        const fundamentalAnalysis = analyzeFundamentals(fundamentalData, sector);

        // Combine technical and fundamental recommendations
        const combined = combineRecommendations(
          pred.recommendation,
          fundamentalAnalysis.recommendation
        );

        // Add fundamentals to prediction
        pred.fundamentals = fundamentalAnalysis;
        pred.signals.fundamental = fundamentalAnalysis.signals;
        pred.combinedScore = combined.score;
        pred.recommendation = combined.recommendation;
      } catch (fundError) {
        console.warn('Could not fetch fundamentals:', fundError);
        // Continue without fundamentals
      }

      setPrediction(pred);
    } catch (err) {
      console.error('Error analyzing stock:', err);
      setError(err instanceof Error ? err.message : 'Errore durante l\'analisi del titolo');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'buy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'hold':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'sell':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'strong_sell':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'strong_buy':
        return 'ACQUISTO FORTE';
      case 'buy':
        return 'ACQUISTO';
      case 'hold':
        return 'MANTIENI';
      case 'sell':
        return 'VENDI';
      case 'strong_sell':
        return 'VENDITA FORTE';
      default:
        return rec.toUpperCase();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="h-6 w-6 text-green-600" />;
      case 'bearish':
        return <TrendingDown className="h-6 w-6 text-red-600" />;
      default:
        return <Minus className="h-6 w-6 text-yellow-600" />;
    }
  };

  const selectedStockInfo = ITALIAN_STOCKS.find(s => s.symbol === selectedStock);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Previsione Titoli Azionari Italiani</h1>
          <p className="text-muted-foreground">
            Analisi tecnica e previsione del prezzo per il giorno successivo
          </p>
        </div>
        <Link to="/backtesting">
          <Button variant="outline" className="gap-2">
            <Activity className="h-4 w-4" />
            Testa Affidabilità
          </Button>
        </Link>
      </div>

      {/* Stock Selection */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Seleziona Titolo</label>
            <Select value={selectedStock} onValueChange={setSelectedStock}>
              <SelectTrigger>
                <SelectValue placeholder="Scegli un titolo italiano..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {ITALIAN_STOCKS.map((stock) => (
                  <SelectItem key={stock.symbol} value={stock.symbol}>
                    {stock.name} ({stock.symbol}) - {stock.sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleAnalyze}
              disabled={loading || !selectedStock}
              className="w-full md:w-auto"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisi in corso...
                </>
              ) : (
                'Analizza e Prevedi'
              )}
            </Button>
          </div>
        </div>

        {selectedStockInfo && !loading && !prediction && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">{selectedStockInfo.name}</span> - {selectedStockInfo.sector}
              <br />
              <span className="text-muted-foreground">Indice: {selectedStockInfo.index}</span>
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

      {/* Prediction Results */}
      {prediction && stockData.length > 0 && (
        <div className="space-y-6">
          {/* Prediction Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Price */}
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Prezzo Attuale</p>
              <p className="text-3xl font-bold">€{prediction.currentPrice.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(stockData[stockData.length - 1].date).toLocaleDateString('it-IT')}
              </p>
            </Card>

            {/* Predicted Price */}
            <Card className="p-6 border-2 border-blue-500">
              <p className="text-sm text-muted-foreground mb-1">Previsione Domani</p>
              <p className="text-3xl font-bold text-blue-600">€{prediction.predictedPrice.toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-sm font-medium ${
                    prediction.predictedChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {prediction.predictedChange >= 0 ? '+' : ''}
                  €{prediction.predictedChange.toFixed(2)} ({prediction.predictedChangePercent.toFixed(2)}%)
                </span>
              </div>
            </Card>

            {/* Recommendation */}
            <Card className={`p-6 border-2 ${getRecommendationColor(prediction.recommendation)}`}>
              <p className="text-sm mb-1">Raccomandazione</p>
              <div className="flex items-center gap-2">
                {getTrendIcon(prediction.trend)}
                <p className="text-2xl font-bold">{getRecommendationText(prediction.recommendation)}</p>
              </div>
              <div className="mt-2">
                <p className="text-sm">Affidabilità: {prediction.confidence.toFixed(0)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-current h-2 rounded-full"
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Financial Events */}
          {prediction.signals.events && prediction.signals.events.length > 0 && (
            <Card className="p-6 border-2 border-yellow-300 bg-yellow-50">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Eventi Finanziari
              </h3>
              <ul className="space-y-2">
                {prediction.signals.events.map((signal, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="mt-1">→</span>
                    <span className="font-medium">{signal}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Support & Resistance */}
          {prediction.signals.supportResistance && prediction.signals.supportResistance.length > 0 && (
            <Card className="p-6 border-2 border-blue-300 bg-blue-50">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Supporti, Resistenze e Pivot Points
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prediction.signals.supportResistance.map((signal, idx) => (
                  <div key={idx} className="text-sm flex items-start gap-2 bg-white p-2 rounded">
                    <span className="mt-0.5">→</span>
                    <span className="font-medium">{signal}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Signals */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Segnali di Trading</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Technical Signals */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Analisi Tecnica</h4>
                <ul className="space-y-1">
                  {prediction.signals.technical.map((signal, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Momentum Signals */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Momentum</h4>
                <ul className="space-y-1">
                  {prediction.signals.momentum.map((signal, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Volume Signals */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Volume</h4>
                <ul className="space-y-1">
                  {prediction.signals.volume.map((signal, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fundamental Signals */}
              {prediction.signals.fundamental && prediction.signals.fundamental.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Analisi Fondamentale</h4>
                  <ul className="space-y-1">
                    {prediction.signals.fundamental.map((signal, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Fundamental Analysis Details */}
          {prediction.fundamentals && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analisi Fondamentale Dettagliata</h3>

              {/* Scores */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Valutazione</p>
                  <p className="text-2xl font-bold">{prediction.fundamentals.scores.valuation.toFixed(0)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${prediction.fundamentals.scores.valuation}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Redditività</p>
                  <p className="text-2xl font-bold">{prediction.fundamentals.scores.profitability.toFixed(0)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${prediction.fundamentals.scores.profitability}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Crescita</p>
                  <p className="text-2xl font-bold">{prediction.fundamentals.scores.growth.toFixed(0)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: `${prediction.fundamentals.scores.growth}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Solidità</p>
                  <p className="text-2xl font-bold">{prediction.fundamentals.scores.financialHealth.toFixed(0)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${prediction.fundamentals.scores.financialHealth}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Dividendo</p>
                  <p className="text-2xl font-bold">{prediction.fundamentals.scores.dividend.toFixed(0)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-yellow-500 h-1.5 rounded-full"
                      style={{ width: `${prediction.fundamentals.scores.dividend}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Complessivo</p>
                  <p className="text-2xl font-bold text-blue-600">{prediction.fundamentals.scores.overall.toFixed(0)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${prediction.fundamentals.scores.overall}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {prediction.fundamentals.data.peRatio && (
                  <div>
                    <p className="text-muted-foreground">P/E Ratio</p>
                    <p className="font-semibold">{prediction.fundamentals.data.peRatio.toFixed(2)}</p>
                  </div>
                )}
                {prediction.fundamentals.data.profitMargin && (
                  <div>
                    <p className="text-muted-foreground">Profit Margin</p>
                    <p className="font-semibold">{(prediction.fundamentals.data.profitMargin * 100).toFixed(1)}%</p>
                  </div>
                )}
                {prediction.fundamentals.data.returnOnEquity && (
                  <div>
                    <p className="text-muted-foreground">ROE</p>
                    <p className="font-semibold">{(prediction.fundamentals.data.returnOnEquity * 100).toFixed(1)}%</p>
                  </div>
                )}
                {prediction.fundamentals.data.debtToEquity && (
                  <div>
                    <p className="text-muted-foreground">Debt/Equity</p>
                    <p className="font-semibold">{prediction.fundamentals.data.debtToEquity.toFixed(2)}</p>
                  </div>
                )}
                {prediction.fundamentals.data.revenueGrowth && (
                  <div>
                    <p className="text-muted-foreground">Revenue Growth</p>
                    <p className="font-semibold">{(prediction.fundamentals.data.revenueGrowth * 100).toFixed(1)}%</p>
                  </div>
                )}
                {prediction.fundamentals.data.dividendYield && (
                  <div>
                    <p className="text-muted-foreground">Dividend Yield</p>
                    <p className="font-semibold">{(prediction.fundamentals.data.dividendYield * 100).toFixed(2)}%</p>
                  </div>
                )}
                {prediction.fundamentals.data.beta && (
                  <div>
                    <p className="text-muted-foreground">Beta</p>
                    <p className="font-semibold">{prediction.fundamentals.data.beta.toFixed(2)}</p>
                  </div>
                )}
                {prediction.fundamentals.data.marketCap && (
                  <div>
                    <p className="text-muted-foreground">Market Cap</p>
                    <p className="font-semibold">€{(prediction.fundamentals.data.marketCap / 1000000000).toFixed(2)}B</p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium">
                  Valutazione: <span className="capitalize">{prediction.fundamentals.rating.replace('_', ' ')}</span>
                </p>
              </div>
            </Card>
          )}

          {/* Charts */}
          <StockChart
            data={stockData}
            indicators={prediction.indicators}
            predictedPrice={prediction.predictedPrice}
            showIndicators={true}
          />

          {/* Disclaimer */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Disclaimer</AlertTitle>
            <AlertDescription>
              Queste previsioni sono generate da algoritmi di analisi tecnica e non costituiscono consulenza
              finanziaria. I risultati passati non garantiscono rendimenti futuri. Investire comporta rischi.
              Consulta sempre un professionista prima di prendere decisioni di investimento.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
