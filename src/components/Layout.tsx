import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Outlet } from 'react-router-dom'
import Header from '@/components/Header'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto bg-background">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
