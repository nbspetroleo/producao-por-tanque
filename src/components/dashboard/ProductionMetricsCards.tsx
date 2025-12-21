import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Activity,
  Database,
  ArrowRightLeft,
  Droplets,
  TestTube,
  Percent,
} from 'lucide-react'

interface ProductionMetrics {
  wellProduction: number
  drained: number
  transferred: number
  waterProduction: number
  uncorrectedOil: number
  avgBsw: number
}

interface ProductionMetricsCardsProps {
  metrics: ProductionMetrics
}

export function ProductionMetricsCards({
  metrics,
}: ProductionMetricsCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
            Produção do Poço
          </CardTitle>
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-lg font-bold">
            {metrics.wellProduction.toFixed(2)} m³
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total no período selecionado
          </p>
        </CardContent>
      </Card>
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
            Total Drenado
          </CardTitle>
          <Database className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-lg font-bold">
            {metrics.drained.toFixed(2)} m³
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total no período selecionado
          </p>
        </CardContent>
      </Card>
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
            Total Transferido
          </CardTitle>
          <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-lg font-bold">
            {metrics.transferred.toFixed(2)} m³
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total no período selecionado
          </p>
        </CardContent>
      </Card>
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
            Produção de Água
          </CardTitle>
          <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-lg font-bold">
            {metrics.waterProduction.toFixed(2)} m³
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total no período selecionado
          </p>
        </CardContent>
      </Card>
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
            Produção de Óleo sem Correção
          </CardTitle>
          <TestTube className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-lg font-bold">
            {metrics.uncorrectedOil.toFixed(2)} m³
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total no período selecionado
          </p>
        </CardContent>
      </Card>
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
            BSW Total
          </CardTitle>
          <Percent className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-lg font-bold">{metrics.avgBsw.toFixed(2)} %</div>
          <p className="text-xs text-muted-foreground mt-1">
            Média no período selecionado
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
