import { useRef, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProject } from '@/context/ProjectContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Trash2,
  Save,
  Upload,
  Download,
  Loader2,
  FileSpreadsheet,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { CalibrationRow } from '@/lib/types'
import { ReasonDialog } from '@/components/ReasonDialog'

interface CalibrationSheetProps {
  sheetId: string
}

const ITEMS_PER_PAGE = 100

export function CalibrationSheet({ sheetId }: CalibrationSheetProps) {
  const {
    calibrationData,
    calibrationCounts,
    isSheetLoading,
    loadSheetData,
    batchUpdateCalibration,
    importCalibrationDataWithReason,
    exportCalibrationData,
    deleteCalibrationTable,
    currentProjectRole,
  } = useProject()
  const [searchParams, setSearchParams] = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<
    'save' | 'import' | 'delete' | null
  >(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Local state for editing
  const [localData, setLocalData] = useState<CalibrationRow[]>([])
  const [edits, setEdits] = useState<Map<string, CalibrationRow>>(new Map())
  const [deletes, setDeletes] = useState<Set<string>>(new Set())
  const [adds, setAdds] = useState<CalibrationRow[]>([])

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const totalCount = calibrationCounts[sheetId] || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))
  const isLoading = isSheetLoading[sheetId]

  const isViewer = currentProjectRole === 'viewer'

  // Load data when page or sheetId changes
  useEffect(() => {
    loadSheetData(sheetId, 'calibration', currentPage, ITEMS_PER_PAGE)
  }, [sheetId, currentPage, loadSheetData])

  // Sync local data with context data when loaded
  useEffect(() => {
    if (calibrationData[sheetId]) {
      setLocalData(calibrationData[sheetId])
      setEdits(new Map())
      setDeletes(new Set())
      setAdds([])
    }
  }, [calibrationData, sheetId])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      if (edits.size > 0 || deletes.size > 0 || adds.length > 0) {
        if (
          !confirm(
            'Você tem alterações não salvas. Deseja sair e perder as alterações?',
          )
        ) {
          return
        }
      }
      setSearchParams({ page: page.toString() })
    }
  }

  const handleUpdate = (
    index: number,
    field: 'altura_mm' | 'volume_m3' | 'fcv',
    value: string,
  ) => {
    const newData = [...localData]
    const updatedRow = {
      ...newData[index],
      [field]: parseFloat(value) || 0,
    }
    newData[index] = updatedRow
    setLocalData(newData)

    if (!updatedRow.id.startsWith('temp-')) {
      setEdits((prev) => new Map(prev).set(updatedRow.id, updatedRow))
    } else {
      setAdds((prev) =>
        prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)),
      )
    }
  }

  const handleAdd = () => {
    const lastRow = localData[localData.length - 1]
    const nextHeight = lastRow ? lastRow.altura_mm + 10 : 0
    const nextVolume = lastRow ? lastRow.volume_m3 : 0
    const nextFCV = lastRow ? (lastRow.fcv ?? 1.0) : 1.0

    const newRow: CalibrationRow = {
      id: `temp-${Date.now()}`,
      altura_mm: nextHeight,
      volume_m3: nextVolume,
      fcv: nextFCV,
    }

    setLocalData([...localData, newRow])
    setAdds((prev) => [...prev, newRow])
  }

  const handleDelete = (index: number) => {
    const rowToDelete = localData[index]
    const newData = localData.filter((_, i) => i !== index)
    setLocalData(newData)

    if (rowToDelete.id.startsWith('temp-')) {
      setAdds((prev) => prev.filter((r) => r.id !== rowToDelete.id))
    } else {
      setDeletes((prev) => new Set(prev).add(rowToDelete.id))
      if (edits.has(rowToDelete.id)) {
        const newEdits = new Map(edits)
        newEdits.delete(rowToDelete.id)
        setEdits(newEdits)
      }
    }
  }

  const handleSaveClick = () => {
    if (edits.size === 0 && deletes.size === 0 && adds.length === 0) {
      toast.info('Nenhuma alteração para salvar.')
      return
    }
    setPendingAction('save')
    setReasonDialogOpen(true)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleDeleteTableClick = () => {
    setPendingAction('delete')
    setReasonDialogOpen(true)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPendingAction('import')
    setReasonDialogOpen(true)
    event.target.value = ''
  }

  const handleExportClick = async () => {
    if (totalCount === 0) {
      toast.error('Não há dados para exportar.')
      return
    }
    await exportCalibrationData(sheetId)
  }

  const handleReasonConfirm = async (reason: string) => {
    if (pendingAction === 'save') {
      setIsSaving(true)
      try {
        await batchUpdateCalibration(
          sheetId,
          {
            updates: Array.from(edits.values()),
            deletes: Array.from(deletes),
            inserts: adds.map(({ id, ...rest }) => rest as any),
          },
          reason,
        )
        await loadSheetData(sheetId, 'calibration', currentPage, ITEMS_PER_PAGE)
        setReasonDialogOpen(false)
      } catch (error) {
        // Error handled in context
      } finally {
        setIsSaving(false)
        setPendingAction(null)
      }
    } else if (pendingAction === 'import' && selectedFile) {
      setIsImporting(true)
      const toastId = toast.loading('Importando dados para o banco de dados...')
      try {
        const count = await importCalibrationDataWithReason(
          sheetId,
          selectedFile,
          reason,
        )
        toast.success(`${count} registros importados com sucesso!`, {
          id: toastId,
        })
        setSearchParams({ page: '1' })
        await loadSheetData(sheetId, 'calibration', 1, ITEMS_PER_PAGE)
        setReasonDialogOpen(false)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao importar arquivo',
          { id: toastId, duration: 5000 },
        )
      } finally {
        setIsImporting(false)
        setPendingAction(null)
        setSelectedFile(null)
      }
    } else if (pendingAction === 'delete') {
      setIsSaving(true)
      try {
        await deleteCalibrationTable(sheetId, reason)
        setReasonDialogOpen(false)
      } catch (error) {
        // handled in context
      } finally {
        setIsSaving(false)
        setPendingAction(null)
      }
    }
  }

  const getDialogProps = () => {
    if (pendingAction === 'delete') {
      return {
        title: 'Deseja deletar a Tabela de Arqueação?',
        description: '',
        confirmLabel: 'Sim',
        cancelLabel: 'Não',
      }
    }
    if (pendingAction === 'save') {
      return {
        title: 'Salvar Alterações de Calibração',
        description: `Você está prestes a salvar: ${adds.length} inserções, ${edits.size} edições e ${deletes.size} exclusões.`,
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
      }
    }
    return {
      title: 'Importar Dados de Calibração',
      description:
        'Você está prestes a importar novos dados de calibração, o que substituirá os dados existentes. Certifique-se que o arquivo contenha as colunas Altura, Volume e FCV. Por favor, informe o motivo.',
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
    }
  }

  const dialogProps = getDialogProps()
  const hasChanges = edits.size > 0 || deletes.size > 0 || adds.length > 0

  return (
    <div className="space-y-4 max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Tabela Arqueação
          </h2>
          <p className="text-muted-foreground">
            Tabela de calibração do tanque (Altura x Volume x FCV).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            onClick={handleExportClick}
            disabled={isLoading || totalCount === 0}
            title="Baixar CSV"
          >
            <Download className="mr-2 h-4 w-4" /> Baixar Dados (CSV)
          </Button>
          {!isViewer && (
            <>
              <Button
                variant="outline"
                onClick={() => toast.info('Download do modelo iniciado...')}
                title="Baixar Modelo"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Modelo
              </Button>
              <Button
                variant="outline"
                onClick={handleImportClick}
                disabled={isImporting || isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? 'Importando...' : 'Importar Excel'}
              </Button>
              <Button
                onClick={handleSaveClick}
                disabled={isSaving || !hasChanges || isLoading}
              >
                <Save className="mr-2 h-4 w-4" />{' '}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTableClick}
                disabled={isSaving || isLoading || totalCount === 0}
              >
                Deletar Tabela
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 border rounded-md bg-white shadow-sm overflow-hidden flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Carregando dados...
              </p>
            </div>
          </div>
        )}

        <div className="bg-muted/50 border-b">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%] pl-8">Altura (mm)</TableHead>
                <TableHead className="w-[35%]">Volume (m³)</TableHead>
                <TableHead className="w-[20%]">FCV</TableHead>
                {!isViewer && <TableHead className="w-[10%]"></TableHead>}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <ScrollArea className="flex-1">
          <Table>
            <TableBody>
              {localData.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={isViewer ? 3 : 4}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 opacity-50" />
                      <p>Nenhum dado disponível.</p>
                      {!isViewer && (
                        <p className="text-sm">
                          Adicione manualmente ou importe um arquivo Excel.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                localData.map((row, index) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="w-[35%] pl-8">
                      <Input
                        type="number"
                        value={row.altura_mm}
                        onChange={(e) =>
                          handleUpdate(index, 'altura_mm', e.target.value)
                        }
                        className="h-8"
                        disabled={isViewer}
                      />
                    </TableCell>
                    <TableCell className="w-[35%]">
                      <Input
                        type="number"
                        value={row.volume_m3}
                        onChange={(e) =>
                          handleUpdate(index, 'volume_m3', e.target.value)
                        }
                        className="h-8"
                        disabled={isViewer}
                      />
                    </TableCell>
                    <TableCell className="w-[20%]">
                      <Input
                        type="number"
                        value={row.fcv ?? 1.0}
                        step="0.000001"
                        min={0}
                        onChange={(e) =>
                          handleUpdate(index, 'fcv', e.target.value)
                        }
                        className="h-8"
                        disabled={isViewer}
                      />
                    </TableCell>
                    {!isViewer && (
                      <TableCell className="w-[10%]">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="py-2 border-t bg-gray-50 flex justify-between items-center px-4">
        {isViewer && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" /> Modo Leitura
          </div>
        )}
        <div className="flex-1 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {currentPage > 2 && (
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(1)}>
                    1
                  </PaginationLink>
                </PaginationItem>
              )}
              {currentPage > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationLink isActive>{currentPage}</PaginationLink>
              </PaginationItem>

              {currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              {currentPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        <div className="text-right text-xs text-muted-foreground w-20">
          {totalCount} registros
        </div>
      </div>

      {!isViewer && (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={handleAdd}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar Linha
        </Button>
      )}

      <ReasonDialog
        open={reasonDialogOpen}
        onOpenChange={setReasonDialogOpen}
        onConfirm={handleReasonConfirm}
        loading={isSaving || isImporting}
        title={dialogProps.title}
        description={dialogProps.description}
        confirmLabel={dialogProps.confirmLabel}
        cancelLabel={dialogProps.cancelLabel}
      />
    </div>
  )
}
