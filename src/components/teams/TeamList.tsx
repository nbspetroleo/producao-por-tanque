import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Users } from 'lucide-react'
import { Team } from '@/lib/types'

interface TeamListProps {
  teams: Team[]
  loading: boolean
  onEdit: (team: Team) => void
  onDelete: (id: string) => void
  onManageMembers: (team: Team) => void
}

export function TeamList({
  teams,
  loading,
  onEdit,
  onDelete,
  onManageMembers,
}: TeamListProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando times...
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-md bg-muted/10">
        Nenhum time encontrado. Crie um novo time para começar.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell>
                {new Date(team.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onManageMembers(team)}
                    title="Gerenciar Membros"
                  >
                    <Users className="h-4 w-4 mr-2" /> Membros
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(team)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(team.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
