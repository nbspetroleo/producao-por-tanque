import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProject } from '@/context/ProjectContext'
import { operationService } from '@/services/operationService'
import { TankOperation, OperationType } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/DateRangePicker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DateRange } from 'react-day-picker'
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns'
import { Filter, Loader2, FilterX, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OperationsHistory() {
  const { projectId } = useParams()
  const { currentProject, setCurrentProject, projects } = useProject()
  const [isLoading, setIsLoading] = useState(false)
  const [operations, setOperations] = useState<TankOperation[]>([])

  // Filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedTankIds, setSelectedTankIds] = useState<string[]>([])

  // Initialize project and selected tanks
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === projectId)
      if (project && project.id !== currentProject?.id) {
        setCurrentProject(project)
      }
    }
  }, [projectId, projects, currentProject, setCurrentProject])

  // Initial tank selection
  useEffect(() => {
    if (currentProject && selectedTankIds.length === 0) {
      setSelectedTankIds(currentProject.tanks.map((t) => t.id))
    }
  }, [currentProject, selectedTankIds.length])

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentProject || selectedTankIds.length === 0) {
        setOperations([])
        return
      }

      setIsLoading(true)
      try {
        let typesToFetch: OperationType[] | undefined

        if (selectedType === 'all') {
          // Fetch all relevant types
          typesToFetch = [
            'production',
            'stock_variation',
            'transfer',
            'drainage',
          ]
        } else {
          typesToFetch = [selectedType as OperationType]
        }

        const ops = await operationService.getOperationsByTankIds(
          selectedTankIds,
          dateRange?.from,
          dateRange?.to,
          typesToFetch,
        )
        setOperations(ops)
      } catch (error) {
        console.error('Error fetching operations history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentProject, selectedTankIds, dateRange, selectedType])

  const handleTankToggle = (tankId: string) => {
    setSelectedTankIds((prev) =>
      prev.includes(tankId)
        ? prev.filter((id) => id !== tankId)
        : [...prev, tankId],
    )
  }

  const handleSelectAllTanks = () => {
    if (currentProject) {
      setSelectedTankIds(currentProject.tanks.map((t) => t.id))
    }
  }

  const handleClearTanks = () => {
    setSelectedTankIds([])
  }

  const getTankTag = (tankId: string) => {
    return currentProject?.tanks.find((t) => t.id === tankId)?.tag || tankId
  }

  const clearFilters = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    })
    setSelectedType('all')
    if (currentProject) {
      setSelectedTankIds(currentProject.tanks.map((t) => t.id))
    }
  }

  const handleExportCSV = () => {
    if (!operations.length) return

    const headers = [
      'Data Início',
      'Data Fim',
      'Tanque',
      'Tipo',
      'Destino',
      'Nível Ini. (mm)',
      'Nível Fim (mm)',
      'Vol. Ini. (m³)',
      'Vol. Fim (m³)',
      'Vol. Líq. (m³)',
      'Vol. Óleo (m³)',
      'Vol. Água (m³)',
      'Vol. Corr. (m³)',
      'BSW (%)',
      'Dens. Obs.',
      'Temp. Fluido',
      'FCV',
      'FE',
      'CTL',
      'Comentários',
    ]

    const csvContent = operations.map((op) => {
      const typeLabel =
        op.type === 'production'
          ? 'Produção (Legado)'
          : op.type === 'stock_variation'
            ? 'Estoque'
            : op.type === 'transfer'
              ? 'Transferência'
              : op.type === 'drainage'
                ? 'Drenagem'
                : op.type

      const row = [
        format(parseISO(op.startTime), 'dd/MM/yyyy HH:mm'),
        format(parseISO(op.endTime), 'dd/MM/yyyy HH:mm'),
        getTankTag(op.tankId),
        typeLabel,
        op.transferDestination || '',
        op.initialLevelMm,
        op.finalLevelMm,
        op.initialVolumeM3?.toFixed(3),
        op.finalVolumeM3?.toFixed(3),
        op.volumeM3?.toFixed(3),
        op.oilVolumeM3?.toFixed(3),
        op.waterVolumeM3?.toFixed(3),
        op.volumeCorrectedM3?.toFixed(3),
        op.bswPercent?.toFixed(2),
        op.densityObservedGcm3?.toFixed(4),
        op.tempFluidC?.toFixed(1),
        op.fcv?.toFixed(6),
        op.fe?.toFixed(4),
        op.ctl?.toFixed(6),
        op.comments,
      ]

      return row
        .map((cell) => {
          if (cell === null || cell === undefined) return ''
          const str = String(cell)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    })

    const csvString = [headers.join(','), ...csvContent].join('\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `historico_operacoes_${currentProject?.id || 'projeto'}_${format(
        new Date(),
        'yyyyMMdd_HHmm',
      )}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!currentProject)
    return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Histórico Detalhado de Operações
          </h1>
          <p className="text-muted-foreground">
            Registro completo de operações de Estoque, Transferência e Drenagem.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            size="sm"
            disabled={isLoading || operations.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button variant="outline" onClick={clearFilters} size="sm">
            <FilterX className="mr-2 h-4 w-4" /> Limpar Filtros
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <DateRangePicker
                date={dateRange}
                setDate={setDateRange}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Operação</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="stock_variation">Estoque</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="drainage">Drenagem</SelectItem>
                  <SelectItem value="production">Produção (Legado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanques</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>{selectedTankIds.length} Tanques Selecionados</span>
                    <Filter className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar Tanques</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={
                      selectedTankIds.length === currentProject.tanks.length &&
                      currentProject.tanks.length > 0
                    }
                    onCheckedChange={(checked) =>
                      checked ? handleSelectAllTanks() : handleClearTanks()
                    }
                  >
                    Todos os Tanques
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {currentProject.tanks.map((tank) => (
                    <DropdownMenuCheckboxItem
                      key={tank.id}
                      checked={selectedTankIds.includes(tank.id)}
                      onCheckedChange={() => handleTankToggle(tank.id)}
                    >
                      {tank.tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Data Início</TableHead>
                  <TableHead className="min-w-[100px]">Data Fim</TableHead>
                  <TableHead>Tanque</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Nível Ini. (mm)</TableHead>
                  <TableHead className="text-right">Nível Fim (mm)</TableHead>
                  <TableHead className="text-right">Vol. Líq. (m³)</TableHead>
                  <TableHead className="text-right">Vol. Óleo (m³)</TableHead>
                  <TableHead className="text-right">Vol. Água (m³)</TableHead>
                  <TableHead className="text-right">Vol. Corr. (m³)</TableHead>
                  <TableHead className="text-right">BSW (%)</TableHead>
                  <TableHead className="text-right">Dens. Obs.</TableHead>
                  <TableHead className="text-right">Temp. Fluido</TableHead>
                  <TableHead className="text-right">FCV</TableHead>
                  <TableHead className="text-right">FE</TableHead>
                  <TableHead className="text-right">CTL</TableHead>
                  <TableHead className="min-w-[200px]">Comentários</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={19} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando operações...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : operations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={19}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhuma operação encontrada para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  operations.map((op) => (
                    <TableRow key={op.id} className="text-xs whitespace-nowrap">
                      <TableCell>
                        {format(parseISO(op.startTime), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(op.endTime), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getTankTag(op.tankId)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            (op.type === 'production' ||
                              op.type === 'stock_variation') &&
                              'bg-green-100 text-green-800',
                            op.type === 'transfer' &&
                              'bg-orange-100 text-orange-800',
                            op.type === 'drainage' &&
                              'bg-blue-100 text-blue-800',
                          )}
                        >
                          {op.type === 'production'
                            ? 'Prod. (Legado)'
                            : op.type === 'stock_variation'
                              ? 'Estoque'
                              : op.type === 'transfer'
                                ? 'Transf.'
                                : 'Drenagem'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {op.transferDestination ? (
                          <span
                            className="truncate max-w-[100px] block"
                            title={op.transferDestination}
                          >
                            {op.transferDestination}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.initialLevelMm}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.finalLevelMm}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {op.volumeM3?.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.oilVolumeM3?.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.waterVolumeM3?.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {op.volumeCorrectedM3?.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.bswPercent?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.densityObservedGcm3?.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.tempFluidC?.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.fcv?.toFixed(6)}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.fe?.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        {op.ctl?.toFixed(6)}
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={op.comments || ''}
                      >
                        {op.comments}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
