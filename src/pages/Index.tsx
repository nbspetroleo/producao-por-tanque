import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProject } from '@/context/ProjectContext'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Plus,
  LayoutDashboard,
  AlertTriangle,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

// Skeleton for Project Card
function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 rounded-xl border p-6 shadow-sm bg-card animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="mt-auto pt-4">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export default function Index() {
  const {
    projects,
    createProject,
    setCurrentProject,
    isLoadingProjects,
    projectsError,
    refreshProjects,
  } = useProject()
  const navigate = useNavigate()
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const hasProjectsOnMount = useRef(projects.length > 0)

  useEffect(() => {
    refreshProjects({
      showLoading: !hasProjectsOnMount.current,
      caller: 'IndexPage Mount',
    })
  }, [refreshProjects])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    await createProject(newProjectName, newProjectDesc)
    setNewProjectName('')
    setNewProjectDesc('')
    setIsDialogOpen(false)
  }

  const handleOpenProject = (project: any) => {
    setCurrentProject(project)
    navigate(`/project/${project.id}/dashboard`)
  }

  const isInitialLoading = isLoadingProjects && projects.length === 0

  const renderContent = () => {
    if (isInitialLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      )
    }

    if (projectsError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed border-destructive/50 bg-destructive/5 text-muted-foreground animate-fade-in">
          <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
          <p className="text-lg font-medium text-destructive">
            Erro ao carregar projetos
          </p>
          <p className="text-sm max-w-md text-center mb-4">{projectsError}</p>
          <Button
            variant="outline"
            onClick={() =>
              refreshProjects({ showLoading: true, caller: 'Retry Button' })
            }
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      )
    }

    if (projects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 border rounded-lg border-dashed text-muted-foreground bg-muted/10 animate-fade-in">
          <FolderOpen className="h-12 w-12 opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            Nenhum projeto encontrado
          </h3>
          <p className="text-sm max-w-sm text-center mb-6">
            Você ainda não possui projetos. Crie um novo projeto para começar a
            gerenciar sua produção.
          </p>
          <Button
            variant="outline"
            onClick={() =>
              refreshProjects({
                showLoading: true,
                caller: 'Empty State Refresh',
              })
            }
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar Lista
          </Button>
        </div>
      )
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="flex flex-col hover:border-primary/50 transition-all hover:shadow-md relative overflow-hidden"
          >
            {project.role !== 'owner' && (
              <div className="absolute top-0 right-0 p-2">
                <Badge
                  variant="outline"
                  className="text-xs bg-muted/50 border-muted"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {project.role === 'editor' ? 'Editor' : 'Viewer'}
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                {project.name}
              </CardTitle>
              <CardDescription className="line-clamp-2 min-h-[2.5em]">
                {project.description || 'Sem descrição'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto pt-4">
              <Button
                className="w-full"
                onClick={() => handleOpenProject(project)}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Abrir Dashboard
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus projetos de produção e arqueação.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
              <DialogDescription>
                Dê um nome e uma descrição para o seu novo projeto.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: Projeto Alpha"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Input
                  id="description"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="col-span-3"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                Criar Projeto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {renderContent()}
    </div>
  )
}
