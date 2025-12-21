import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import SheetPage from './pages/SheetPage'
import Dashboard from './pages/Dashboard'
import OperationsHistory from './pages/OperationsHistory'
import Registrations from './pages/Registrations'
import FcvCalculation from './pages/FcvCalculation'
import Settings from './pages/Settings'
import Management from './pages/Management'
import AuditLogs from './pages/AuditLogs'
import Alerts from './pages/Alerts'
import UserManagement from './pages/UserManagement'
import Teams from './pages/Teams'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { ProjectProvider } from '@/context/ProjectContext'
import { Loader2 } from 'lucide-react'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando aplicação...
          </p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            element={
              <ProtectedRoute>
                <ProjectProvider>
                  <Layout />
                </ProjectProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/management" element={<Management />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/teams" element={<Teams />} />
            <Route
              path="/project/:projectId/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/project/:projectId/operations-history"
              element={<OperationsHistory />}
            />
            <Route
              path="/project/:projectId/registrations"
              element={<Registrations />}
            />
            <Route
              path="/project/:projectId/fcv-calculation"
              element={<FcvCalculation />}
            />
            <Route path="/project/:projectId/alerts" element={<Alerts />} />
            <Route
              path="/project/:projectId/sheet/:sheetId"
              element={<SheetPage />}
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
