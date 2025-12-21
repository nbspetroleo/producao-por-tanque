import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error('Erro ao enviar email: ' + error.message)
      } else {
        setSubmitted(true)
        toast.success('Email de recuperação enviado!')
      }
    } catch (error: any) {
      toast.error('Erro inesperado: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifique seu email</CardTitle>
            <CardDescription>
              Se um conta existir com o email <strong>{email}</strong>, um link
              de recuperação foi enviado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Clique no link enviado para redefinir sua senha. O link expira em
              breve.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/login">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Esqueceu a senha?</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-primary flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
