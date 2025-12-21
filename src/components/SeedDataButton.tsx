import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Database } from 'lucide-react'
import { seedDatabase } from '@/lib/seed'
import { useAuth } from '@/hooks/use-auth'
import { useProject } from '@/context/ProjectContext'
import { projectService } from '@/services/projectService'

export function SeedDataButton() {
  const { user } = useAuth()
  const { projects, setCurrentProject } = useProject()
  const [loading, setLoading] = useState(false)

  // Only show if no projects exist
  if (projects.length > 0) return null

  const handleSeed = async () => {
    if (!user) return
    setLoading(true)
    const success = await seedDatabase(user.id)
    if (success) {
      // Refresh projects in context
      // We need to manually trigger a refresh since context doesn't expose a refresh method directly
      // But we can use the service and set state if we exposed setProjects,
      // or just reload the page which is simpler for this one-off action
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/10">
      <Database className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Banco de Dados Vazio</h3>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
        Parece que você ainda não tem projetos. Deseja carregar os dados de
        exemplo para começar?
      </p>
      <Button onClick={handleSeed} disabled={loading}>
        {loading ? 'Migrando Dados...' : 'Carregar Dados de Exemplo'}
      </Button>
    </div>
  )
}
