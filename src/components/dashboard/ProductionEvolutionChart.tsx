import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// Custom Label Component for Chart Lines
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomChartLabel = ({ x, y, stroke, value }: any) => {
  if (value === null || value === undefined) return null
  return (
    <text
      x={x}
      y={y}
      dy={-10}
      fill={stroke}
      fontSize={10}
      textAnchor="middle"
      fontWeight={600}
    >
      {Number(value).toFixed(2)}
    </text>
  )
}

interface VisibleMetrics {
  wellProduction: boolean
  drained: boolean
  transferred: boolean
  waterProduction: boolean
  uncorrectedOil: boolean
}

interface ProductionEvolutionChartProps {
  data: any[]
  config: ChartConfig
  granularity: 'day' | 'month' | 'year'
  visibleMetrics: VisibleMetrics
  onMetricToggle: (metric: keyof VisibleMetrics) => void
}

export function ProductionEvolutionChart({
  data,
  config,
  granularity,
  visibleMetrics,
  onMetricToggle,
}: ProductionEvolutionChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Evolução da Produção</CardTitle>
        <CardDescription>
          Acompanhamento das métricas ao longo do tempo ({granularity}).
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {/* Controls for Chart Visibility */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 p-4 border rounded-md bg-muted/20 items-center">
          <span className="text-sm font-semibold text-muted-foreground mr-2">
            Visualizar:
          </span>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="wellProduction"
              checked={visibleMetrics.wellProduction}
              onCheckedChange={() => onMetricToggle('wellProduction')}
            />
            <Label htmlFor="wellProduction" className="cursor-pointer">
              Prod. Poço
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="drained"
              checked={visibleMetrics.drained}
              onCheckedChange={() => onMetricToggle('drained')}
            />
            <Label htmlFor="drained" className="cursor-pointer">
              Drenagem
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="transferred"
              checked={visibleMetrics.transferred}
              onCheckedChange={() => onMetricToggle('transferred')}
            />
            <Label htmlFor="transferred" className="cursor-pointer">
              Transferência
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="waterProduction"
              checked={visibleMetrics.waterProduction}
              onCheckedChange={() => onMetricToggle('waterProduction')}
            />
            <Label htmlFor="waterProduction" className="cursor-pointer">
              Prod. Água
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="uncorrectedOil"
              checked={visibleMetrics.uncorrectedOil}
              onCheckedChange={() => onMetricToggle('uncorrectedOil')}
            />
            <Label htmlFor="uncorrectedOil" className="cursor-pointer">
              Óleo s/ Corr.
            </Label>
          </div>
        </div>

        <ChartContainer config={config} className="h-[400px] w-full">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              label={{
                value: 'Período',
                position: 'insideBottom',
                offset: -10,
                fontSize: 12,
                fill: 'var(--muted-foreground)',
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              label={{
                value: 'Volume (m³)',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                fontSize: 12,
                fill: 'var(--muted-foreground)',
                style: { textAnchor: 'middle' },
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {visibleMetrics.wellProduction && (
              <Line
                type="monotone"
                dataKey="wellProduction"
                stroke="var(--color-wellProduction)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name="Prod. Poço"
                label={<CustomChartLabel />}
              />
            )}
            {visibleMetrics.drained && (
              <Line
                type="monotone"
                dataKey="drained"
                stroke="var(--color-drained)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name="Drenagem"
                label={<CustomChartLabel />}
              />
            )}
            {visibleMetrics.transferred && (
              <Line
                type="monotone"
                dataKey="transferred"
                stroke="var(--color-transferred)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name="Transferência"
                label={<CustomChartLabel />}
              />
            )}
            {visibleMetrics.waterProduction && (
              <Line
                type="monotone"
                dataKey="waterProduction"
                stroke="var(--color-waterProduction)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name="Prod. Água"
                label={<CustomChartLabel />}
              />
            )}
            {visibleMetrics.uncorrectedOil && (
              <Line
                type="monotone"
                dataKey="uncorrectedOil"
                stroke="var(--color-uncorrectedOil)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name="Óleo s/ Corr."
                label={<CustomChartLabel />}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
