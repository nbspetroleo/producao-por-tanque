import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductionFieldManager } from '@/components/settings/ProductionFieldManager'
import { WellManager } from '@/components/settings/WellManager'
import { TransferCategoryManager } from '@/components/settings/TransferCategoryManager'
import { GeneralSettings } from '@/components/settings/GeneralSettings'
import { CollaboratorManager } from '@/components/settings/CollaboratorManager'
import { useProject } from '@/context/ProjectContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle, Users } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/use-auth'

export default function Settings() {
  const { currentProject, clearProjectData, currentProjectRole } = useProject()
  const { role } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Only Owner can edit settings or manage collaborators
  const canEdit = currentProjectRole === 'owner'

  const handleDeleteData = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!currentProject) return

    setIsDeleting(true)
    try {
      await clearProjectData(currentProject.id)
      setIsDialogOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2 justify-start">
          <TabsTrigger value="fields">Campos de Produção</TabsTrigger>
          <TabsTrigger value="wells">Poços</TabsTrigger>
          <TabsTrigger value="transfer-categories">
            Categorias de Destino
          </TabsTrigger>
          {currentProject && (
            <TabsTrigger value="collaborators" className="gap-2">
              <Users className="h-4 w-4" /> Colaboradores
            </TabsTrigger>
          )}
          <TabsTrigger value="general">Geral</TabsTrigger>
        </TabsList>
        <TabsContent value="fields">
          <ProductionFieldManager />
        </TabsContent>
        <TabsContent value="wells">
          <WellManager />
        </TabsContent>
        <TabsContent value="transfer-categories">
          <TransferCategoryManager />
        </TabsContent>
        {currentProject && (
          <TabsContent value="collaborators">
            <CollaboratorManager />
          </TabsContent>
        )}
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
      </Tabs>

      {currentProject && canEdit && (
        <div className="mt-12">
          <Card className="border-destructive/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>Zona de Perigo</CardTitle>
              </div>
              <CardDescription>
                Ações críticas que afetam os dados do projeto atual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-destructive">
                    Limpar Dados do Projeto
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Exclui permanentemente todas as operações e relatórios deste
                    projeto.
                  </p>
                </div>

                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!currentProject}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpar Dados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Você tem certeza absoluta?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação não pode ser desfeita. Isso excluirá
                        permanentemente todos os registros de
                        <strong> operações de tanque</strong> e{' '}
                        <strong>relatórios de produção</strong> do projeto
                        <span className="font-semibold text-foreground">
                          {' '}
                          {currentProject?.name}
                        </span>
                        .
                        <br />
                        <br />
                        Os metadados (tanques, campos, poços, categorias) e
                        tabelas de arqueação serão mantidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Limpando...' : 'Sim, limpar dados'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
