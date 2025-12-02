import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, 
  ResponsiveContainer, Tooltip
} from 'recharts'

interface MoodChartProps {
  data: {
    mood: number
    energy: number
    focus: number
    sleep: number
    stress: number
  }
  height?: number
}

export default function MoodChart({ data, height = 250 }: MoodChartProps) {
  const chartData = [
    { subject: 'Mood', value: data.mood, fullMark: 10 },
    { subject: 'Energy', value: data.energy, fullMark: 10 },
    { subject: 'Focus', value: data.focus, fullMark: 10 },
    { subject: 'Sleep', value: data.sleep, fullMark: 10 },
    { subject: 'Stress', value: 10 - data.stress, fullMark: 10 }, // Invert stress
  ]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
        <PolarGrid stroke="#E2E8F0" />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ fontSize: 12, fill: '#64748B' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Radar 
          name="Today" 
          dataKey="value" 
          stroke="#8B5CF6" 
          fill="#8B5CF6" 
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}








