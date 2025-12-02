import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

interface WeightChartProps {
  data: Array<{
    date: string
    weight: number
    unit: 'kg' | 'lbs'
  }>
  goalWeight?: number
  height?: number
}

export default function WeightChart({ data, goalWeight, height = 200 }: WeightChartProps) {
  const chartData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  const minWeight = Math.min(...data.map(d => d.weight)) - 2
  const maxWeight = Math.max(...data.map(d => d.weight)) + 2

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload
      return (
        <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-slate-100">
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="text-sm text-emerald-600">
            {payload[0].value} {entry.unit}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis 
          dataKey="displayDate" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 12, fill: '#94A3B8' }}
        />
        <YAxis 
          domain={[minWeight, maxWeight]}
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        {goalWeight && (
          <ReferenceLine 
            y={goalWeight} 
            stroke="#F59E0B" 
            strokeDasharray="5 5" 
            label={{ value: 'Goal', fill: '#F59E0B', fontSize: 12 }}
          />
        )}
        <Line 
          type="monotone" 
          dataKey="weight" 
          stroke="#10B981" 
          strokeWidth={2}
          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#10B981' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}








