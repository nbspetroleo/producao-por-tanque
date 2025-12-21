import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Check,
  ChevronsUpDown,
  ChevronRight,
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings2,
  History,
  FileSpreadsheet,
  LogOut,
  User,
  ShieldCheck,
  Database,
  Calculator,
  Bell,
  Users,
  Notebook,
  Group,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useProject } from '@/context/ProjectContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AppSidebar() {
  const { user, role, avatarUrl, signOut } = useAuth()
  const { projects, currentProject, setCurrentProject, logoUrl } = useProject()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeProject, setActiveProject] = useState(currentProject)
  const { state } = useSidebar()

  useEffect(() => {
    setActiveProject(currentProject)
  }, [currentProject])

  const handleProjectChange = (project: any) => {
    setCurrentProject(project)
    navigate(`/project/${project.id}/dashboard`)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const projectLogo = activeProject?.logoUrl
  const displayLogo = projectLogo || logoUrl

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200"
                >
                  {displayLogo ? (
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-lg overflow-hidden bg-white/95 shadow-sm transition-all duration-300',
                        state === 'collapsed'
                          ? 'size-8 aspect-square p-0.5'
                          : projectLogo
                            ? 'h-10 w-full max-w-full p-1 object-contain'
                            : 'h-10 w-full max-w-[180px] p-1',
                      )}
                    >
                      <img
                        src={displayLogo}
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <GalleryVerticalEnd className="size-4" />
                    </div>
                  )}

                  {(!projectLogo || state === 'collapsed') && (
                    <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                      <span className="truncate font-semibold">
                        {activeProject
                          ? activeProject.name
                          : 'Selecione Projeto'}
                      </span>
                      {!displayLogo && (
                        <span className="truncate text-xs">RTM NBS</span>
                      )}
                    </div>
                  )}

                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Projetos
                </DropdownMenuLabel>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectChange(project)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border overflow-hidden">
                      {project.logoUrl ? (
                        <img
                          src={project.logoUrl}
                          alt={project.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <GalleryVerticalEnd className="size-4 shrink-0" />
                      )}
                    </div>
                    {project.name}
                    {activeProject?.id === project.id && (
                      <Check className="ml-auto size-4" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <GalleryVerticalEnd className="size-4 shrink-0" />
                  </div>
                  Ver todos os projetos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {activeProject && (
          <SidebarGroup>
            <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes('/dashboard')}
                  tooltip="Dashboard"
                >
                  <Link to={`/project/${activeProject.id}/dashboard`}>
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes('/operations-history')}
                  tooltip="Histórico"
                >
                  <Link to={`/project/${activeProject.id}/operations-history`}>
                    <History />
                    <span>Histórico</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes('/registrations')}
                  tooltip="Cadastros"
                >
                  <Link to={`/project/${activeProject.id}/registrations`}>
                    <Database />
                    <span>Cadastros</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes('/fcv-calculation')}
                  tooltip="Cálculo do FCV"
                >
                  <Link to={`/project/${activeProject.id}/fcv-calculation`}>
                    <Calculator />
                    <span>Cálculo do FCV</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes('/alerts')}
                  tooltip="Alertas"
                >
                  <Link to={`/project/${activeProject.id}/alerts`}>
                    <Bell />
                    <span>Alertas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Colaboração</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname.includes('/teams')}
                tooltip="Times"
              >
                <Link to="/teams">
                  <Group />
                  <span>Times</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {(role === 'admin' || role === 'approver') && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes('/management')}
                  tooltip="Gestão de Cadastro"
                >
                  <Link to="/management">
                    <Notebook />
                    <span>Gestão de Cadastro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes('/user-management')}
                  tooltip="Gestão de Usuários"
                >
                  <Link to="/user-management">
                    <Users />
                    <span>Gestão de Usuários</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {activeProject ? (
          <SidebarGroup>
            <SidebarGroupLabel>Tanques</SidebarGroupLabel>
            <SidebarMenu>
              {activeProject.tanks.map((tank) => (
                <Collapsible
                  key={tank.id}
                  asChild
                  defaultOpen={false}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        size="sm"
                        tooltip={
                          tank.wellName
                            ? `${tank.tag} (${tank.wellName})`
                            : tank.tag
                        }
                      >
                        <FileSpreadsheet />
                        <span>
                          {tank.tag}
                          {tank.wellName && ` (${tank.wellName})`}
                        </span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {tank.sheets.map((sheet) => (
                          <SidebarMenuSubItem key={sheet.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname.includes(sheet.id)}
                            >
                              <Link
                                to={`/project/${activeProject.id}/sheet/${sheet.id}`}
                              >
                                <span>{sheet.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            Selecione um projeto para ver as opções.
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={avatarUrl || ''}
                      alt={user?.email || 'User'}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.email?.split('@')[0]}
                    </span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={avatarUrl || ''}
                        alt={user?.email || 'User'}
                      />
                      <AvatarFallback className="rounded-lg">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.email?.split('@')[0]}
                      </span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings2 className="mr-2 size-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/audit-logs')}>
                  <ShieldCheck className="mr-2 size-4" />
                  Auditoria
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
