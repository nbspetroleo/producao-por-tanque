import { useState } from 'react'
import { useProject } from '@/context/ProjectContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Pencil, Save, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TransferCategoryManager() {
  const {
    transferDestinationCategories,
    createTransferDestinationCategory,
    updateTransferDestinationCategory,
    deleteTransferDestinationCategory,
  } = useProject()
  const [newName, setNewName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    setIsSubmitting(true)
    try {
      await createTransferDestinationCategory(newName.trim())
      setNewName('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      await deleteTransferDestinationCategory(id)
    }
  }

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    try {
      await updateTransferDestinationCategory(id, editName.trim())
      setEditingId(null)
      setEditName('')
    } catch (e) {
      // Error handled by context/toast
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Categorias de Destino de Transferência</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nome da nova categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={isSubmitting || !newName}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferDestinationCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma categoria cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                transferDestinationCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {editingId === category.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="max-w-sm"
                        />
                      ) : (
                        category.name
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === category.id ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => saveEdit(category.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEdit}
                            className="text-gray-500 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              startEdit(category.id, category.name)
                            }
                            className="text-gray-500 hover:text-gray-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
