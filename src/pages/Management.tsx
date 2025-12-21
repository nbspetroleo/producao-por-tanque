import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductionFieldManager } from '@/components/settings/ProductionFieldManager'
import { WellManager } from '@/components/settings/WellManager'
import { TransferCategoryManager } from '@/components/settings/TransferCategoryManager'
import { useProject } from '@/context/ProjectContext'

export default function Management() {
  const { currentProject } = useProject()

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Gestão de Cadastro
      </h1>

      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2 justify-start">
          <TabsTrigger value="fields">Campos de Produção</TabsTrigger>
          <TabsTrigger value="wells">Poços</TabsTrigger>
          <TabsTrigger value="transfer-categories">
            Categorias de Destino
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fields">
          <ProductionFieldManager />
        </TabsContent>
        <TabsContent value="wells">
          <WellManager />
        </TabsContent>
        <TabsContent value="transfer-categories">
          {currentProject ? (
            <TransferCategoryManager />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-muted/10 text-muted-foreground">
              <p>Selecione um projeto para gerenciar categorias de destino.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
