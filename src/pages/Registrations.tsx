import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProject } from '@/context/ProjectContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AddTankDialog } from '@/components/AddTankDialog'
import { Database, Droplets } from 'lucide-react'

export default function Registrations() {
  const { projectId } = useParams()
  const {
    currentProject,
    setCurrentProject,
    projects,
    wells,
    productionFields,
  } = useProject()

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === projectId)
      if (project && project.id !== currentProject?.id) {
        setCurrentProject(project)
      }
    }
  }, [projectId, projects, currentProject, setCurrentProject])

  if (!currentProject) {
    return <div className="p-8 text-center">Carregando projeto...</div>
  }

  const getProductionFieldName = (id: string) => {
    return productionFields.find((f) => f.id === id)?.name || 'N/A'
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastros</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie tanques e visualize os poços cadastrados no projeto{' '}
            {currentProject.name}.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Tanques</CardTitle>
              </div>
              <CardDescription>
                Lista de tanques associados a este projeto.
              </CardDescription>
            </div>
            <AddTankDialog className="w-auto" />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Campo de Produção</TableHead>
                    <TableHead>Poço</TableHead>
                    <TableHead>Geolocalização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProject.tanks.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum tanque cadastrado neste projeto.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentProject.tanks.map((tank) => (
                      <TableRow key={tank.id}>
                        <TableCell className="font-medium">
                          {tank.tag}
                        </TableCell>
                        <TableCell>{tank.productionField}</TableCell>
                        <TableCell>{tank.wellName || '-'}</TableCell>
                        <TableCell>{tank.geolocation || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              <CardTitle>Poços</CardTitle>
            </div>
            <CardDescription>
              Lista de todos os poços cadastrados disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Campo de Produção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wells.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum poço cadastrado no sistema.
                      </TableCell>
                    </TableRow>
                  ) : (
                    wells.map((well) => (
                      <TableRow key={well.id}>
                        <TableCell className="font-medium">
                          {well.name}
                        </TableCell>
                        <TableCell>
                          {getProductionFieldName(well.productionFieldId)}
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
    </div>
  )
}
