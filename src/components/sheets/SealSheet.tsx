import { useEffect } from 'react'
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
import { Plus, Trash2, Save, Lock } from 'lucide-react'
import { SealRow } from '@/lib/types'

interface SealSheetProps {
  sheetId: string
}

export function SealSheet({ sheetId }: SealSheetProps) {
  const {
    sealData,
    setSealDataForSheet,
    loadSheetData,
    saveSheetData,
    currentProjectRole,
  } = useProject()

  const isViewer = currentProjectRole === 'viewer'

  useEffect(() => {
    loadSheetData(sheetId, 'seal')
  }, [sheetId, loadSheetData])

  const data = sealData[sheetId] || []

  const handleUpdate = (index: number, field: keyof SealRow, value: string) => {
    const newData = [...data]
    newData[index] = { ...newData[index], [field]: value }
    setSealDataForSheet(sheetId, newData)
  }

  const handleAdd = () => {
    setSealDataForSheet(sheetId, [
      ...data,
      {
        id: Date.now().toString(),
        tanque: '',
        data: '',
        hora: '',
        situacao: '',
        valvula_entrada_1: '',
        lacre_entrada_1: '',
        valvula_dreno: '',
        lacre_dreno: '',
        valvula_saida: '',
      },
    ])
  }

  const handleDelete = (index: number) => {
    setSealDataForSheet(
      sheetId,
      data.filter((_, i) => i !== index),
    )
  }

  const handleSave = async () => {
    await saveSheetData(sheetId, 'seal')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Relatório de Lacres
          </h2>
          <p className="text-muted-foreground">
            Controle de lacres de válvulas.
          </p>
        </div>
        {!isViewer ? (
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground text-sm border p-2 rounded-md bg-muted/20">
            <Lock className="h-4 w-4" /> Modo Leitura
          </div>
        )}
      </div>

      <div className="border rounded-md bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanque</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Válv. Entrada</TableHead>
              <TableHead>Lacre Ent.</TableHead>
              <TableHead>Válv. Dreno</TableHead>
              <TableHead>Lacre Dreno</TableHead>
              <TableHead>Válv. Saída</TableHead>
              {!isViewer && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={row.tanque}
                    onChange={(e) =>
                      handleUpdate(index, 'tanque', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={row.data}
                    onChange={(e) =>
                      handleUpdate(index, 'data', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={row.hora}
                    onChange={(e) =>
                      handleUpdate(index, 'hora', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.situacao}
                    onChange={(e) =>
                      handleUpdate(index, 'situacao', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.valvula_entrada_1}
                    onChange={(e) =>
                      handleUpdate(index, 'valvula_entrada_1', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.lacre_entrada_1}
                    onChange={(e) =>
                      handleUpdate(index, 'lacre_entrada_1', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.valvula_dreno}
                    onChange={(e) =>
                      handleUpdate(index, 'valvula_dreno', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.lacre_dreno}
                    onChange={(e) =>
                      handleUpdate(index, 'lacre_dreno', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.valvula_saida}
                    onChange={(e) =>
                      handleUpdate(index, 'valvula_saida', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                {!isViewer && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!isViewer && (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={handleAdd}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar Linha
        </Button>
      )}
    </div>
  )
}
