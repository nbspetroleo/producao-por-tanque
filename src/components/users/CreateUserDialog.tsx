import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { UserRole } from '@/lib/types'
import { userService } from '@/services/userService'
import { toast } from 'sonner'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
  onSuccess: () => void
}

export function CreateUserDialog({
  open,
  onOpenChange,
  currentUserId,
  onSuccess,
}: CreateUserDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('operator')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateUser = async () => {
    if (!email) return
    setIsSubmitting(true)
    try {
      await userService.createUser(email, role, currentUserId)
      toast.success('Usuário criado com sucesso! Email de convite enviado.')
      setEmail('')
      setRole('operator')
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error('Erro ao criar usuário: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            O usuário receberá um email para definir sua senha.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Função (Role)</Label>
            <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operador</SelectItem>
                <SelectItem value="approver">Aprovador</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateUser} disabled={isSubmitting || !email}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
              </>
            ) : (
              'Criar Usuário'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
