import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'

interface HydrationChartProps {
  data: Array<{
    date: string
    amount: number
    goal: number
  }>
  height?: number
}

export default function HydrationChart({ data, height = 200 }: HydrationChartProps) {
  const chartData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    percentage: Math.round((d.amount / d.goal) * 100)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload
      return (
        <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-slate-100">
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="text-sm text-cyan-600">
            {entry.amount}ml / {entry.goal}ml
          </p>
          <p className="text-xs text-slate-500">
            {entry.percentage}% of goal
          </p>
        </div>
      )
    }
    return null
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 100) return '#06B6D4' // cyan-500
    if (percentage >= 75) return '#22D3EE' // cyan-400
    if (percentage >= 50) return '#67E8F9' // cyan-300
    return '#A5F3FC' // cyan-200
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis 
          dataKey="displayDate" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 12, fill: '#94A3B8' }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          tickFormatter={(value) => `${value / 1000}L`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine 
          y={chartData[0]?.goal || 2500} 
          stroke="#06B6D4" 
          strokeDasharray="5 5"
          strokeOpacity={0.5}
        />
        <Bar 
          dataKey="amount" 
          radius={[4, 4, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}








