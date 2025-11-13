import { StockData, TechnicalIndicators } from '@/types/stock';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { Card } from './ui/card';

interface StockChartProps {
  data: StockData[];
  indicators?: TechnicalIndicators;
  predictedPrice?: number;
  showIndicators?: boolean;
}

export default function StockChart({ data, indicators, predictedPrice, showIndicators = true }: StockChartProps) {
  // Prepare chart data
  const chartData = data.slice(-60).map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
    price: parseFloat(item.close.toFixed(2)),
    volume: item.volume,
    high: item.high,
    low: item.low,
  }));

  // Add predicted price as last point
  if (predictedPrice) {
    const lastDate = new Date(data[data.length - 1].date);
    lastDate.setDate(lastDate.getDate() + 1);
    chartData.push({
      date: lastDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      price: parseFloat(predictedPrice.toFixed(2)),
      volume: 0,
      high: parseFloat(predictedPrice.toFixed(2)),
      low: parseFloat(predictedPrice.toFixed(2)),
    });
  }

  const currentPrice = data[data.length - 1].close;
  const priceChange = ((currentPrice - data[data.length - 2]?.close) / data[data.length - 2]?.close) * 100;

  return (
    <div className="space-y-4">
      {/* Price Chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Andamento Prezzo</h3>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-2xl font-bold">€{currentPrice.toFixed(2)}</span>
            <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`€${value.toFixed(2)}`, 'Prezzo']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorPrice)"
            />
            {predictedPrice && (
              <ReferenceLine
                x={chartData[chartData.length - 1].date}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: 'Previsione', position: 'top', fill: '#ef4444' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Technical Indicators */}
      {showIndicators && indicators && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Indicatori Tecnici</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* RSI */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">RSI (14)</p>
              <p className="text-xl font-bold">{indicators.rsi.toFixed(2)}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    indicators.rsi > 70
                      ? 'bg-red-500'
                      : indicators.rsi < 30
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${indicators.rsi}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {indicators.rsi > 70 ? 'Ipercomprato' : indicators.rsi < 30 ? 'Ipervenduto' : 'Neutrale'}
              </p>
            </div>

            {/* MACD */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">MACD</p>
              <p className="text-xl font-bold">{indicators.macd.toFixed(3)}</p>
              <p className="text-xs">Signal: {indicators.macdSignal.toFixed(3)}</p>
              <p className={`text-xs font-medium ${indicators.macdHistogram > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {indicators.macdHistogram > 0 ? '↑ Bullish' : '↓ Bearish'}
              </p>
            </div>

            {/* SMA */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">SMA</p>
              <p className="text-sm">20: €{indicators.sma20.toFixed(2)}</p>
              <p className="text-sm">50: €{indicators.sma50.toFixed(2)}</p>
              <p className={`text-xs font-medium ${indicators.sma20 > indicators.sma50 ? 'text-green-600' : 'text-red-600'}`}>
                {indicators.sma20 > indicators.sma50 ? 'Golden Cross' : 'Death Cross'}
              </p>
            </div>

            {/* Bollinger Bands */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bollinger Bands</p>
              <p className="text-xs">Upper: €{indicators.bollingerUpper.toFixed(2)}</p>
              <p className="text-xs">Middle: €{indicators.bollingerMiddle.toFixed(2)}</p>
              <p className="text-xs">Lower: €{indicators.bollingerLower.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {currentPrice > indicators.bollingerUpper
                  ? 'Sopra banda'
                  : currentPrice < indicators.bollingerLower
                  ? 'Sotto banda'
                  : 'In range'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Volume Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Volume</h3>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData.slice(0, -1)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Volume']}
            />
            <Area type="monotone" dataKey="volume" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
