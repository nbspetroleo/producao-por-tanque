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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Pencil, Globe, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductionField } from '@/lib/types'
import { toast } from 'sonner'

export function ProductionFieldManager() {
  const {
    productionFields,
    createProductionField,
    updateProductionField,
    deleteProductionField,
    currentProject,
  } = useProject()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<ProductionField | null>(null)
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sort fields by name alphabetically for better UX
  const sortedFields = [...productionFields].sort((a, b) => {
    return a.name.localeCompare(b.name)
  })

  const handleOpenCreate = () => {
    setEditingField(null)
    setName('')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (field: ProductionField) => {
    setEditingField(field)
    setName(field.name)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    // Frontend Validation: Check against currently loaded fields (Global + Current Project)
    const existing = productionFields.find(
      (f) =>
        f.name.toLowerCase() === trimmedName.toLowerCase() &&
        f.id !== editingField?.id,
    )

    if (existing) {
      if (!existing.projectId) {
        toast.error('Este nome já está em uso por um campo de produção global.')
      } else {
        toast.error('Este nome já existe neste projeto.')
      }
      return
    }

    setIsSubmitting(true)
    try {
      if (editingField) {
        await updateProductionField(editingField.id, trimmedName)
      } else {
        await createProductionField(trimmedName)
      }
      setIsDialogOpen(false)
      setName('')
      setEditingField(null)
    } catch (error: any) {
      // Backend Validation: Catch unique constraint errors (e.g. from other projects)
      // Note: projectService now throws specific error messages for uniqueness
      // ProjectContext catches and toasts, so we don't need to toast again here unless we want to override
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (
      confirm(
        'Tem certeza que deseja excluir este campo de produção? Esta ação não pode ser desfeita.',
      )
    ) {
      try {
        await deleteProductionField(id)
      } catch (e) {
        // Error handled in context
      }
    }
  }

  if (!currentProject) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Selecione um projeto para gerenciar campos de produção.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Gerenciar Campos de Produção</CardTitle>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Campo
        </Button>
      </CardHeader>
      <CardContent className="mt-4">
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFields.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum campo de produção encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedFields.map((field) => {
                  const isGlobal = !field.projectId
                  return (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">
                        {field.name}
                      </TableCell>
                      <TableCell>
                        {isGlobal ? (
                          <Badge variant="secondary" className="gap-1">
                            <Globe className="h-3 w-3" /> Global
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            Projeto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {isGlobal ? (
                            <div
                              className="flex items-center text-muted-foreground px-3"
                              title="Campos globais não podem ser editados neste nível"
                            >
                              <Lock className="h-4 w-4" />
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(field)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(field.id)}
                                className="text-destructive hover:text-destructive/90"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Editar Campo' : 'Novo Campo de Produção'}
            </DialogTitle>
            <DialogDescription>
              {editingField
                ? 'Atualize o nome do campo de produção.'
                : 'Insira o nome do novo campo de produção para este projeto.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Campo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Campo Beta"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
