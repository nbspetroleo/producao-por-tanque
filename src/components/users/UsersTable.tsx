import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { UserProfile, UserRole } from '@/lib/types'

interface UsersTableProps {
  users: UserProfile[]
  loading: boolean
  currentUserId: string
  onEdit: (user: UserProfile) => void
  onDelete: (userId: string) => void
}

export function UsersTable({
  users,
  loading,
  currentUserId,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-600 hover:bg-red-700">Admin</Badge>
      case 'approver':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">Aprovador</Badge>
        )
      case 'operator':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Operador</Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                <div className="flex justify-center items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>{getRoleBadge(u.role)}</TableCell>
                <TableCell>
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(u)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={u.id === currentUserId} // Prevent self-delete
                      onClick={() => onDelete(u.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
