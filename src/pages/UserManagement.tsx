import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { userService } from '@/services/userService'
import { UserProfile } from '@/lib/types'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { UsersTable } from '@/components/users/UsersTable'
import { CreateUserDialog } from '@/components/users/CreateUserDialog'
import { EditUserDialog } from '@/components/users/EditUserDialog'

export default function UserManagement() {
  const { user, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    // Redirect if not admin and auth is finished
    if (!authLoading && role !== 'admin') {
      navigate('/')
    }
  }, [role, authLoading, navigate])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await userService.listUsers()
      setUsers(data)
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers()
    }
  }, [role])

  const handleEditClick = (u: UserProfile) => {
    setEditingUser(u)
    setIsEditOpen(true)
  }

  const handleDeleteUser = async (userIdToDelete: string) => {
    if (!user) return
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      await userService.deleteUser(userIdToDelete, user.id)
      toast.success('Usuário excluído com sucesso.')
      fetchUsers()
    } catch (error: any) {
      toast.error('Erro ao excluir usuário: ' + error.message)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (role !== 'admin') return null

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Controle de acesso e contas de usuários do sistema.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Usuário
            </Button>
          </DialogTrigger>
          <CreateUserDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            currentUserId={user?.id || ''}
            onSuccess={fetchUsers}
          />
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable
            users={users}
            loading={loading}
            currentUserId={user?.id || ''}
            onEdit={handleEditClick}
            onDelete={handleDeleteUser}
          />
        </CardContent>
      </Card>

      <EditUserDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        user={editingUser}
        currentUserId={user?.id || ''}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
