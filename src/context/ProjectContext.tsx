import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import {
  Project,
  ProductionRow,
  CalibrationRow,
  SealRow,
  Tank,
  ProductionField,
  Well,
  TransferDestinationCategory,
  BatchCalibrationOperations,
  TankOperation,
  DailyProductionReport,
  ProjectMember,
  ProjectRole,
} from '@/lib/types'
import { INITIAL_PRODUCTION_ROW } from '@/lib/initialData'
import {
  calculateProductionRow,
  calculateOperationData,
  consolidateDailyOperations,
  getProductionDayWindow,
  calculateDailyMetrics,
  getReportDateFromTimestamp,
} from '@/lib/calculations'
import { projectService } from '@/services/projectService'
import { sheetService } from '@/services/sheetService'
import { operationService } from '@/services/operationService'
import { reportService } from '@/services/reportService'
import { settingsService } from '@/services/settingsService'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { format, addDays, parseISO } from 'date-fns'
import { fcvLogService } from '@/services/fcvLogService'

interface RefreshOptions {
  showLoading?: boolean
  caller?: string
}

interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  currentProjectRole: ProjectRole | null
  setCurrentProject: (project: Project | null) => void
  isLoadingProjects: boolean
  projectsError: string | null
  refreshProjects: (options?: string | RefreshOptions) => Promise<void>

  // Metadata
  productionFields: ProductionField[]
  wells: Well[]
  transferDestinationCategories: TransferDestinationCategory[]
  refreshMetadata: () => Promise<void>

  // Collaboration
  members: ProjectMember[]
  isLoadingMembers: boolean
  fetchMembers: () => Promise<void>
  inviteMember: (email: string) => Promise<void>
  updateMemberRole: (memberId: string, role: ProjectRole) => Promise<void>
  removeMember: (memberId: string) => Promise<void>

  // Global Settings
  logoUrl: string | null
  refreshLogo: () => Promise<void>
  updateLogo: (file: File) => Promise<void>
  removeLogo: () => Promise<void>

  // Project Settings (Project specific logo)
  updateProjectLogo: (file: File) => Promise<void>
  removeProjectLogo: () => Promise<void>

  // Data Maps keyed by Sheet ID (or Tank ID for lookup)
  productionData: Record<string, ProductionRow[]>
  calibrationData: Record<string, CalibrationRow[]>
  calibrationLookupData: Record<string, CalibrationRow[]>
  loadTankCalibration: (tankId: string) => Promise<void>
  calibrationCounts: Record<string, number>
  sealData: Record<string, SealRow[]>

  // Operations Data
  tankOperations: Record<string, TankOperation[]>
  loadOperations: (tankId: string, date?: Date) => Promise<void>
  addOperation: (op: Omit<TankOperation, 'id'>) => Promise<void>
  updateOperation: (
    id: string,
    tankId: string,
    updates: Partial<Omit<TankOperation, 'id' | 'createdAt' | 'userId'>>,
  ) => Promise<void>
  deleteOperation: (id: string, tankId: string) => Promise<void>
  getLastClosedOperation: (tankId: string) => Promise<TankOperation | null>
  getLastOperationBefore: (
    tankId: string,
    date: string | Date,
    excludeOpId?: string,
  ) => Promise<TankOperation | null>
  getLastClosedReport: (tankId: string) => Promise<DailyProductionReport | null>
  getLastOperationByReportId: (
    reportId: string,
  ) => Promise<TankOperation | null>
  getContinuityLevel: (tankId: string, date: Date) => Promise<number | null>

  // Reports
  getReports: (tankId: string) => Promise<DailyProductionReport[]>
  getReportByDate: (
    tankId: string,
    date: Date,
  ) => Promise<DailyProductionReport | null>
  getReportsForTanksByDate: (
    tankIds: string[],
    date: Date,
  ) => Promise<DailyProductionReport[]>
  closeReport: (
    report: Omit<DailyProductionReport, 'id' | 'createdAt' | 'closedAt'>,
  ) => Promise<void>
  createDailyReport: (
    tankId: string,
    date: Date,
  ) => Promise<DailyProductionReport>
  isDateClosed: (tankId: string, date: Date) => Promise<boolean>
  closeDayAndStartNext: (tankId: string, date: Date) => Promise<void>

  // Loading States
  isSheetLoading: Record<string, boolean>

  // Actions
  addTank: (projectId: string, tank: Omit<Tank, 'id' | 'sheets'>) => void
  updateTank: (
    tankId: string,
    updates: Partial<
      Pick<Tank, 'tag' | 'productionFieldId' | 'wellId' | 'geolocation'>
    >,
    reason: string,
  ) => Promise<void>
  createProject: (name: string, description: string) => Promise<void>
  clearProjectData: (projectId: string) => Promise<void>

  // Metadata Actions
  createProductionField: (name: string) => Promise<void>
  updateProductionField: (id: string, name: string) => Promise<void>
  deleteProductionField: (id: string) => Promise<void>
  createWell: (name: string, productionFieldId: string) => Promise<void>
  deleteWell: (id: string) => Promise<void>
  createTransferDestinationCategory: (
    name: string,
  ) => Promise<TransferDestinationCategory>
  updateTransferDestinationCategory: (id: string, name: string) => Promise<void>
  deleteTransferDestinationCategory: (id: string) => Promise<void>

  // Production Actions
  updateProductionRow: (
    sheetId: string,
    index: number,
    field: keyof ProductionRow,
    value: any,
  ) => void
  addProductionRow: (sheetId: string) => void
  deleteProductionRow: (sheetId: string, index: number) => void
  recalculateProductionForDay: (tankId: string, date: Date) => Promise<void>

  // Calibration Actions
  setCalibrationDataForSheet: (sheetId: string, data: CalibrationRow[]) => void
  saveCalibrationDataWithReason: (
    sheetId: string,
    reason: string,
  ) => Promise<void>
  batchUpdateCalibration: (
    sheetId: string,
    operations: BatchCalibrationOperations,
    reason: string,
  ) => Promise<void>
  importCalibrationDataWithReason: (
    sheetId: string,
    file: File,
    reason: string,
  ) => Promise<number>
  exportCalibrationData: (sheetId: string) => Promise<void>
  deleteCalibrationTable: (sheetId: string, reason: string) => Promise<void>

  // Seal Actions
  setSealDataForSheet: (sheetId: string, data: SealRow[]) => void

  // Persistence
  loadSheetData: (
    sheetId: string,
    type: string,
    page?: number,
    pageSize?: number,
  ) => Promise<void>
  saveSheetData: (sheetId: string, type: string) => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

const getTankIdFromSheetId = (sheetId: string): string | undefined => {
  if (!sheetId) return undefined
  const parts = sheetId.split('-')
  if (parts.length < 2) return undefined
  const prefix = parts[0]
  const tankId = sheetId.substring(prefix.length + 1)
  return tankId
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [currentProjectRole, setCurrentProjectRole] =
    useState<ProjectRole | null>(null)

  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  const [productionFields, setProductionFields] = useState<ProductionField[]>(
    [],
  )
  const [wells, setWells] = useState<Well[]>([])
  const [transferDestinationCategories, setTransferDestinationCategories] =
    useState<TransferDestinationCategory[]>([])

  const [members, setMembers] = useState<ProjectMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const [productionData, setProductionData] = useState<
    Record<string, ProductionRow[]>
  >({})
  const [calibrationData, setCalibrationData] = useState<
    Record<string, CalibrationRow[]>
  >({})
  const [calibrationLookupData, setCalibrationLookupData] = useState<
    Record<string, CalibrationRow[]>
  >({})
  const [calibrationCounts, setCalibrationCounts] = useState<
    Record<string, number>
  >({})
  const [sealData, setSealData] = useState<Record<string, SealRow[]>>({})
  const [tankOperations, setTankOperations] = useState<
    Record<string, TankOperation[]>
  >({})

  const [isSheetLoading, setIsSheetLoading] = useState<Record<string, boolean>>(
    {},
  )

  const currentProjectRef = useRef(currentProject)
  useEffect(() => {
    currentProjectRef.current = currentProject
    // Update role when project changes
    if (currentProject) {
      setCurrentProjectRole(currentProject.role || 'viewer')
    } else {
      setCurrentProjectRole(null)
    }
  }, [currentProject])

  useEffect(() => {
    // If project changes, fetch members if needed (e.g., if user is owner)
    if (
      currentProject &&
      (currentProject.role === 'owner' || currentProject.role === 'editor')
    ) {
      // We can fetch members here or lazily in the UI
      // Since list-users is admin-ish, regular editors might not be able to see full list with emails?
      // Actually editors can't manage members, only owner can.
      // So let's only fetch if owner, or wait for explicit call from Settings page.
    }
  }, [currentProject])

  const refreshLogo = useCallback(async () => {
    try {
      const url = await settingsService.getSetting('company_logo_url')
      setLogoUrl(url)
    } catch (e) {
      console.error('Error loading logo:', e)
    }
  }, [])

  const updateLogo = useCallback(
    async (file: File) => {
      if (!user) return
      try {
        const url = await settingsService.uploadLogo(file, user.id)
        setLogoUrl(url)
        toast.success('Logo atualizado com sucesso!')
      } catch (e: any) {
        console.error('Error updating logo:', e)
        toast.error('Erro ao atualizar logo: ' + e.message)
        throw e
      }
    },
    [user],
  )

  const removeLogo = useCallback(async () => {
    if (!user) return
    try {
      await settingsService.removeLogo(user.id)
      setLogoUrl(null)
      toast.success('Logo removido com sucesso!')
    } catch (e: any) {
      console.error('Error removing logo:', e)
      toast.error('Erro ao remover logo: ' + e.message)
    }
  }, [user])

  const refreshMetadata = useCallback(async () => {
    if (!user) return
    try {
      const [pf, w] = await Promise.all([
        projectService.getProductionFields(currentProject?.id),
        projectService.getWells(),
      ])
      setProductionFields(pf)
      setWells(w)

      await refreshLogo()

      if (currentProject) {
        const categories =
          await projectService.getTransferDestinationCategories(
            currentProject.id,
          )
        setTransferDestinationCategories(categories)
      } else {
        setTransferDestinationCategories([])
      }
    } catch (error) {
      console.error('[ProjectProvider] Error loading metadata:', error)
    }
  }, [user, currentProject, refreshLogo])

  const refreshProjects = useCallback(
    async (optionsInput?: string | RefreshOptions) => {
      let options: RefreshOptions = {}
      if (typeof optionsInput === 'string') {
        options = { caller: optionsInput, showLoading: true }
      } else if (optionsInput) {
        options = optionsInput
      }

      const { showLoading = true } = options

      if (authLoading) return
      if (!user?.id) {
        setProjects([])
        setCurrentProject(null)
        setIsLoadingProjects(false)
        return
      }

      if (showLoading) setIsLoadingProjects(true)
      setProjectsError(null)

      try {
        const data = await projectService.getProjects(user.id)
        setProjects(data)

        const currentProj = currentProjectRef.current
        if (currentProj) {
          const updatedCurrent = data.find((p) => p.id === currentProj.id)
          if (updatedCurrent) {
            setCurrentProject(updatedCurrent)
          }
        }
      } catch (err: any) {
        const errorMessage =
          err.message || 'Erro desconhecido ao carregar projetos'
        setProjectsError(errorMessage)
        toast.error('Erro ao carregar projetos: ' + errorMessage)
        setProjects([])
      } finally {
        setIsLoadingProjects(false)
      }
    },
    [user?.id, authLoading],
  )

  useEffect(() => {
    if (!authLoading) {
      refreshProjects({ caller: 'ProjectProvider Effect' })
    }
  }, [refreshProjects, authLoading])

  useEffect(() => {
    refreshMetadata()
  }, [refreshMetadata])

  // Member Management
  const fetchMembers = useCallback(async () => {
    if (!currentProject) return
    setIsLoadingMembers(true)
    try {
      const data = await projectService.getMembers(currentProject.id)
      setMembers(data)
    } catch (error: any) {
      toast.error('Erro ao carregar membros: ' + error.message)
    } finally {
      setIsLoadingMembers(false)
    }
  }, [currentProject])

  const inviteMember = useCallback(
    async (email: string) => {
      if (!currentProject || !user) return
      try {
        await projectService.inviteMember(currentProject.id, email, user.id)
        toast.success('Membro convidado com sucesso!')
        fetchMembers()
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    [currentProject, user, fetchMembers],
  )

  const updateMemberRole = useCallback(
    async (memberId: string, role: ProjectRole) => {
      if (!user) return
      try {
        await projectService.updateMemberRole(memberId, role, user.id)
        toast.success('Permissão atualizada com sucesso.')
        fetchMembers()
      } catch (error: any) {
        toast.error('Erro ao atualizar permissão: ' + error.message)
        throw error
      }
    },
    [user, fetchMembers],
  )

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!user) return
      try {
        await projectService.removeMember(memberId, user.id)
        toast.success('Membro removido do projeto.')
        fetchMembers()
      } catch (error: any) {
        toast.error('Erro ao remover membro: ' + error.message)
        throw error
      }
    },
    [user, fetchMembers],
  )

  const createProject = useCallback(
    async (name: string, description: string) => {
      if (!user) return
      try {
        await projectService.createProject(name, description, user.id)
        await refreshProjects({ caller: 'createProject' })
        toast.success('Projeto criado com sucesso!')
      } catch (error: any) {
        toast.error('Erro ao criar projeto: ' + error.message)
      }
    },
    [user, refreshProjects],
  )

  const clearProjectData = useCallback(
    async (projectId: string) => {
      if (!user) return
      try {
        await projectService.clearProjectData(projectId)

        if (currentProject && currentProject.id === projectId) {
          const tankIds = currentProject.tanks.map((t) => t.id)
          setTankOperations((prev) => {
            const next = { ...prev }
            tankIds.forEach((id) => delete next[id])
            return next
          })
          setProductionData((prev) => {
            const next = { ...prev }
            tankIds.forEach((id) => delete next[`prod-${id}`])
            return next
          })
          setSealData((prev) => {
            const next = { ...prev }
            tankIds.forEach((id) => delete next[`seal-${id}`])
            return next
          })
        }
        toast.success('Dados do projeto limpos com sucesso!')
      } catch (error: any) {
        toast.error('Erro ao limpar dados do projeto: ' + error.message)
        throw error
      }
    },
    [user, currentProject],
  )

  const updateProjectLogo = useCallback(
    async (file: File) => {
      if (!user || !currentProject) return
      try {
        const url = await projectService.uploadProjectLogo(
          currentProject.id,
          file,
          user.id,
        )
        setCurrentProject((prev) => (prev ? { ...prev, logoUrl: url } : null))
        setProjects((prev) =>
          prev.map((p) =>
            p.id === currentProject.id ? { ...p, logoUrl: url } : p,
          ),
        )
        toast.success('Logo do projeto atualizado com sucesso!')
      } catch (e: any) {
        console.error('Error updating project logo:', e)
        toast.error('Erro ao atualizar logo: ' + e.message)
        throw e
      }
    },
    [user, currentProject],
  )

  const removeProjectLogo = useCallback(async () => {
    if (!user || !currentProject) return
    try {
      await projectService.removeProjectLogo(currentProject.id, user.id)
      setCurrentProject((prev) => (prev ? { ...prev, logoUrl: null } : null))
      setProjects((prev) =>
        prev.map((p) =>
          p.id === currentProject.id ? { ...p, logoUrl: null } : p,
        ),
      )
      toast.success('Logo do projeto removido com sucesso!')
    } catch (e: any) {
      console.error('Error removing project logo:', e)
      toast.error('Erro ao remover logo: ' + e.message)
    }
  }, [user, currentProject])

  const addTank = useCallback(
    async (projectId: string, tankDetails: Omit<Tank, 'id' | 'sheets'>) => {
      try {
        await projectService.createTank(projectId, tankDetails)
        await refreshProjects({ caller: 'addTank' })
        toast.success('Tanque adicionado com sucesso!')
      } catch (error: any) {
        toast.error('Erro ao adicionar tanque: ' + error.message)
      }
    },
    [refreshProjects],
  )

  const updateTank = useCallback(
    async (
      tankId: string,
      updates: Partial<
        Pick<Tank, 'tag' | 'productionFieldId' | 'wellId' | 'geolocation'>
      >,
      reason: string,
    ) => {
      if (!user) return
      try {
        await projectService.updateTank(tankId, updates, reason, user.id)
        await refreshProjects({ caller: 'updateTank' })
        toast.success('Tanque atualizado com sucesso!')
      } catch (error: any) {
        toast.error('Erro ao atualizar tanque: ' + error.message)
        throw error
      }
    },
    [user, refreshProjects],
  )

  const createProductionField = useCallback(
    async (name: string) => {
      if (!user) return
      try {
        await projectService.createProductionField(
          name,
          user.id,
          currentProject?.id,
        )
        await refreshMetadata()
        toast.success('Campo de produção criado!')
      } catch (error: any) {
        toast.error('Erro: ' + error.message)
        throw error
      }
    },
    [user, currentProject, refreshMetadata],
  )

  const updateProductionField = useCallback(
    async (id: string, name: string) => {
      if (!user) return
      try {
        await projectService.updateProductionField(id, name, user.id)
        await refreshMetadata()
        toast.success('Campo de produção atualizado!')
      } catch (error: any) {
        toast.error('Erro: ' + error.message)
        throw error
      }
    },
    [user, refreshMetadata],
  )

  const deleteProductionField = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await projectService.deleteProductionField(id, user.id)
        await refreshMetadata()
        toast.success('Campo de produção excluído!')
      } catch (error: any) {
        toast.error('Erro: ' + error.message)
        throw error
      }
    },
    [user, refreshMetadata],
  )

  const createWell = useCallback(
    async (name: string, productionFieldId: string) => {
      if (!user) return
      try {
        await projectService.createWell(name, productionFieldId, user.id)
        const w = await projectService.getWells()
        setWells(w)
        toast.success('Poço criado!')
      } catch (error: any) {
        toast.error('Erro: ' + error.message)
        throw error
      }
    },
    [user],
  )

  const deleteWell = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await projectService.deleteWell(id, user.id)
        const w = await projectService.getWells()
        setWells(w)
        toast.success('Poço excluído!')
      } catch (error: any) {
        toast.error('Erro: ' + error.message)
        throw error
      }
    },
    [user],
  )

  const createTransferDestinationCategory = useCallback(
    async (name: string) => {
      if (!user || !currentProject)
        throw new Error('Nenhum projeto selecionado')
      try {
        const newCategory =
          await projectService.createTransferDestinationCategory(
            currentProject.id,
            name,
            user.id,
          )
        setTransferDestinationCategories((prev) => [...prev, newCategory])
        toast.success('Categoria de destino criada!')
        return newCategory
      } catch (error: any) {
        toast.error('Erro: ' + error.message)
        throw error
      }
    },
    [user, currentProject],
  )

  const updateTransferDestinationCategory = useCallback(
    async (id: string, name: string) => {
      if (!user) return
      try {
        await projectService.updateTransferDestinationCategory(
          id,
          name,
          user.id,
        )
        setTransferDestinationCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name } : c)),
        )
        toast.success('Categoria de destino atualizada!')
      } catch (error: any) {
        toast.error('Erro: ' + error.message)
        throw error
      }
    },
    [user],
  )

  const deleteTransferDestinationCategory = useCallback(
    async (id: string) => {
      if (!user) return
      try {
        await projectService.deleteTransferDestinationCategory(id, user.id)
        setTransferDestinationCategories((prev) =>
          prev.filter((c) => c.id !== id),
        )
        toast.success('Categoria de destino excluída!')
      } catch (error: any) {
        toast.error('Erro: ' + error.message)
        throw error
      }
    },
    [user],
  )

  // ... loadSheetData, saveSheetData ...
  const loadSheetData = useCallback(
    async (sheetId: string, type: string, page?: number, pageSize?: number) => {
      const tankId = getTankIdFromSheetId(sheetId)
      if (!tankId) return

      setIsSheetLoading((prev) => ({ ...prev, [sheetId]: true }))

      try {
        if (type === 'production') {
          const data = await sheetService.getProductionData(tankId)
          setProductionData((prev) => ({
            ...prev,
            [sheetId]:
              data.length > 0
                ? data
                : [{ ...INITIAL_PRODUCTION_ROW, id: `row-${Date.now()}` }],
          }))
          const { data: fullCalData } =
            await sheetService.getCalibrationData(tankId)
          setCalibrationLookupData((prev) => ({
            ...prev,
            [tankId]: fullCalData,
          }))
          const ops = await operationService.getOperations(tankId)
          setTankOperations((prev) => ({ ...prev, [tankId]: ops }))
        } else if (type === 'calibration') {
          const { data, count } = await sheetService.getCalibrationData(
            tankId,
            page,
            pageSize,
          )
          setCalibrationData((prev) => ({ ...prev, [sheetId]: data }))
          setCalibrationCounts((prev) => ({ ...prev, [sheetId]: count }))
        } else if (type === 'seal') {
          const data = await sheetService.getSealData(tankId)
          setSealData((prev) => ({ ...prev, [sheetId]: data }))
        }
      } catch (error: any) {
        console.error('Error loading sheet data:', error)
        toast.error('Erro ao carregar dados da planilha.')
      } finally {
        setIsSheetLoading((prev) => ({ ...prev, [sheetId]: false }))
      }
    },
    [],
  )

  const saveSheetData = useCallback(
    async (sheetId: string, type: string) => {
      const tankId = getTankIdFromSheetId(sheetId)
      if (!tankId) return

      // Permission check
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para editar dados.')
        return
      }

      try {
        if (type === 'production') {
          const data = productionData[sheetId] || []
          await sheetService.saveProductionData(tankId, data)
        } else if (type === 'calibration') {
          const data = calibrationData[sheetId] || []
          await sheetService.saveCalibrationData(tankId, data)
        } else if (type === 'seal') {
          const data = sealData[sheetId] || []
          await sheetService.saveSealData(tankId, data)
        }
        toast.success('Dados salvos com sucesso!')
      } catch (error: any) {
        console.error('Error saving sheet data:', error)
        toast.error('Erro ao salvar dados: ' + error.message)
      }
    },
    [productionData, calibrationData, sealData, currentProjectRole],
  )

  const loadOperations = useCallback(async (tankId: string, date?: Date) => {
    try {
      const ops = await operationService.getOperations(tankId, date)
      setTankOperations((prev) => ({
        ...prev,
        [tankId]: ops,
      }))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const getLastClosedOperation = useCallback(async (tankId: string) => {
    return operationService.getLastClosedOperation(tankId)
  }, [])

  const getLastOperationBefore = useCallback(
    async (tankId: string, date: string | Date, excludeOpId?: string) => {
      return operationService.getLastOperationBefore(tankId, date, excludeOpId)
    },
    [],
  )

  const getLastClosedReport = useCallback(async (tankId: string) => {
    return reportService.getLastClosedReport(tankId)
  }, [])

  const getLastOperationByReportId = useCallback(async (reportId: string) => {
    return operationService.getLastOperationByReportId(reportId)
  }, [])

  const getContinuityLevel = useCallback(async (tankId: string, date: Date) => {
    try {
      const report = await reportService.getClosedReportByEndDate(tankId, date)
      if (!report) return null
      const op = await operationService.getLastOperationByReportId(report.id)
      if (!op) return null
      return op.finalLevelMm
    } catch (e) {
      console.error('Error fetching continuity level:', e)
      return null
    }
  }, [])

  const recalculateProductionForDay = useCallback(
    async (tankId: string, date: Date) => {
      try {
        const ops = await operationService.getOperations(tankId)
        setTankOperations((prev) => ({ ...prev, [tankId]: ops }))

        const sheetId = `prod-${tankId}`
        const currentRows = productionData[sheetId] || []
        const prevRow =
          currentRows.length > 0
            ? currentRows[currentRows.length - 1]
            : undefined

        const consolidatedRow = consolidateDailyOperations(date, ops, prevRow)

        const dateStr = format(date, 'yyyy-MM-dd')
        const existingIdx = currentRows.findIndex(
          (r) =>
            r.D_Data_fim_periodo && r.D_Data_fim_periodo.startsWith(dateStr),
        )

        let newRows = [...currentRows]
        if (existingIdx >= 0) {
          newRows[existingIdx] = {
            ...newRows[existingIdx],
            ...consolidatedRow,
            id: newRows[existingIdx].id,
          }
        } else {
          newRows.push(consolidatedRow)
        }

        newRows.sort(
          (a, b) =>
            new Date(a.D_Data_fim_periodo).getTime() -
            new Date(b.D_Data_fim_periodo).getTime(),
        )

        const calData = calibrationLookupData[tankId] || []
        for (let i = 0; i < newRows.length; i++) {
          const pRow = i > 0 ? newRows[i - 1] : undefined
          newRows[i] = calculateProductionRow(newRows[i], pRow, calData)
        }

        await sheetService.saveProductionData(tankId, newRows)
        setProductionData((prev) => ({
          ...prev,
          [sheetId]: newRows,
        }))
      } catch (err) {
        console.error('Error in recalculateProductionForDay:', err)
        throw err
      }
    },
    [productionData, calibrationLookupData],
  )

  const isDateClosed = useCallback(async (tankId: string, date: Date) => {
    try {
      const report = await reportService.getReportByDate(tankId, date)
      return !!report && report.status === 'closed'
    } catch (e) {
      return false
    }
  }, [])

  const addOperation = useCallback(
    async (op: Omit<TankOperation, 'id'>) => {
      if (!user) return
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para adicionar operações.')
        throw new Error('Permission denied')
      }

      try {
        let existingReport = await reportService.getReportForOperation(
          op.tankId,
          op.endTime,
        )

        if (!existingReport) {
          const opDate = getReportDateFromTimestamp(op.endTime)
          const { start, end } = getProductionDayWindow(opDate)
          const newReport: Omit<
            DailyProductionReport,
            'id' | 'createdAt' | 'closedAt' | 'closedBy'
          > = {
            tankId: op.tankId,
            reportDate: format(opDate, 'yyyy-MM-dd'),
            startDatetime: start.toISOString(),
            endDatetime: end.toISOString(),
            status: 'draft',
            stockVariation: 0,
            totalBswPercent: 0,
            drainedVolumeM3: 0,
            transferredVolumeM3: 0,
            uncorrectedOilVolumeM3: 0,
            emulsionWaterVolumeM3: 0,
            tempCorrectionFactorY: 1,
            correctedOilVolumeM3: 0,
            emulsionBswPercent: 0,
            fluidTempC: 0,
            fcv: 1,
            fe: 1,
            calculatedWellProductionM3: 0,
          }
          existingReport = await reportService.createDraftReport(
            newReport,
            user.id,
          )
        }

        if (existingReport.status === 'closed') {
          const reportDateStr = format(
            new Date(existingReport.reportDate + 'T12:00:00'),
            'dd/MM/yyyy',
          )
          toast.error(
            `O relatório de produção para ${reportDateStr} já está fechado.`,
          )
          throw new Error('Report closed')
        }

        const calData = calibrationLookupData[op.tankId] || []
        const calculatedOp = calculateOperationData(op, calData)
        calculatedOp.dailyReportId = existingReport.id

        const savedOp = await operationService.createOperation(
          calculatedOp,
          user.id,
        )

        setTankOperations((prev) => ({
          ...prev,
          [op.tankId]: [...(prev[op.tankId] || []), savedOp],
        }))

        const reportDate = new Date(existingReport.reportDate + 'T12:00:00')
        await recalculateProductionForDay(op.tankId, reportDate)

        toast.success('Operação adicionada e consolidada!')
      } catch (error: any) {
        if (
          error.message !== 'Report closed' &&
          error.message !== 'Permission denied'
        ) {
          toast.error('Erro ao adicionar operação: ' + error.message)
        }
        throw error
      }
    },
    [
      user,
      calibrationLookupData,
      recalculateProductionForDay,
      currentProjectRole,
    ],
  )

  const updateOperation = useCallback(
    async (
      id: string,
      tankId: string,
      updates: Partial<Omit<TankOperation, 'id' | 'createdAt' | 'userId'>>,
    ) => {
      if (!user) return
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para editar operações.')
        throw new Error('Permission denied')
      }

      try {
        const existingOp = tankOperations[tankId]?.find((o) => o.id === id)
        if (!existingOp) {
          toast.error('Operação não encontrada.')
          return
        }
        const mergedOp = { ...existingOp, ...updates }
        let existingReport = await reportService.getReportForOperation(
          tankId,
          mergedOp.endTime,
        )

        if (!existingReport) {
          const opDate = getReportDateFromTimestamp(mergedOp.endTime)
          const { start, end } = getProductionDayWindow(opDate)
          const newReport: Omit<
            DailyProductionReport,
            'id' | 'createdAt' | 'closedAt' | 'closedBy'
          > = {
            tankId,
            reportDate: format(opDate, 'yyyy-MM-dd'),
            startDatetime: start.toISOString(),
            endDatetime: end.toISOString(),
            status: 'draft',
            stockVariation: 0,
            totalBswPercent: 0,
            drainedVolumeM3: 0,
            transferredVolumeM3: 0,
            uncorrectedOilVolumeM3: 0,
            emulsionWaterVolumeM3: 0,
            tempCorrectionFactorY: 1,
            correctedOilVolumeM3: 0,
            emulsionBswPercent: 0,
            fluidTempC: 0,
            fcv: 1,
            fe: 1,
            calculatedWellProductionM3: 0,
          }
          existingReport = await reportService.createDraftReport(
            newReport,
            user.id,
          )
        }

        if (existingReport.status === 'closed') {
          toast.error('Relatório fechado.')
          return
        }

        updates.dailyReportId = existingReport.id
        const calData = calibrationLookupData[tankId] || []
        const calculatedOp = calculateOperationData(mergedOp, calData)

        const savedOp = await operationService.updateOperation(
          id,
          calculatedOp,
          user.id,
        )

        setTankOperations((prev) => ({
          ...prev,
          [tankId]: prev[tankId]?.map((o) => (o.id === id ? savedOp : o)) || [],
        }))

        const newReportDate = new Date(existingReport.reportDate + 'T12:00:00')
        await recalculateProductionForDay(tankId, newReportDate)

        toast.success('Operação atualizada e consolidada!')
      } catch (error: any) {
        if (error.message !== 'Permission denied') {
          toast.error('Erro ao atualizar operação: ' + error.message)
        }
        throw error
      }
    },
    [
      user,
      calibrationLookupData,
      tankOperations,
      recalculateProductionForDay,
      currentProjectRole,
    ],
  )

  const deleteOperation = useCallback(
    async (id: string, tankId: string) => {
      if (!user) return
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para excluir operações.')
        return
      }

      try {
        const op = tankOperations[tankId]?.find((o) => o.id === id)
        if (op) {
          const opStartDate = parseISO(op.startTime)
          const reportDate = getReportDateFromTimestamp(opStartDate)
          const closed = await isDateClosed(tankId, reportDate)
          if (closed) {
            toast.error(
              'Não é possível remover operações de um dia com relatório fechado.',
            )
            return
          }
        }
        await operationService.deleteOperation(id, user.id)
        setTankOperations((prev) => ({
          ...prev,
          [tankId]: prev[tankId]?.filter((o) => o.id !== id) || [],
        }))
        if (op) {
          const opStartDate = parseISO(op.startTime)
          const reportDate = getReportDateFromTimestamp(opStartDate)
          await recalculateProductionForDay(tankId, reportDate)
        }
        toast.success('Operação removida!')
      } catch (error: any) {
        toast.error('Erro ao remover operação: ' + error.message)
      }
    },
    [
      user,
      tankOperations,
      recalculateProductionForDay,
      isDateClosed,
      currentProjectRole,
    ],
  )

  // ... Reports ...
  const getReports = useCallback(async (tankId: string) => {
    return reportService.getReports(tankId)
  }, [])

  const getReportByDate = useCallback(async (tankId: string, date: Date) => {
    return reportService.getReportByDate(tankId, date)
  }, [])

  const getReportsForTanksByDate = useCallback(
    async (tankIds: string[], date: Date) => {
      const { data } = await reportService.getReportsByDateForTanks(
        tankIds,
        date,
      )
      return data
    },
    [],
  )

  const closeReport = useCallback(
    async (
      report: Omit<DailyProductionReport, 'id' | 'createdAt' | 'closedAt'>,
    ) => {
      if (!user) return
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para fechar relatórios.')
        throw new Error('Permission denied')
      }
      try {
        await reportService.closeReport(report, user.id)
        toast.success('Relatório de produção fechado com sucesso!')
      } catch (error: any) {
        toast.error('Erro ao fechar relatório: ' + error.message)
        throw error
      }
    },
    [user, currentProjectRole],
  )

  const createDailyReport = useCallback(
    async (tankId: string, date: Date) => {
      if (!user) throw new Error('Unauthorized')
      if (currentProjectRole === 'viewer') {
        throw new Error('Você não tem permissão para criar relatórios.')
      }
      const { start, end } = getProductionDayWindow(date)
      const report: Omit<
        DailyProductionReport,
        'id' | 'createdAt' | 'closedAt' | 'closedBy'
      > = {
        tankId,
        reportDate: format(date, 'yyyy-MM-dd'),
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
        status: 'draft',
        stockVariation: 0,
        totalBswPercent: 0,
        drainedVolumeM3: 0,
        transferredVolumeM3: 0,
        uncorrectedOilVolumeM3: 0,
        emulsionWaterVolumeM3: 0,
        tempCorrectionFactorY: 1,
        correctedOilVolumeM3: 0,
        emulsionBswPercent: 0,
        fluidTempC: 0,
        fcv: 1,
        fe: 1,
        calculatedWellProductionM3: 0,
      }
      return reportService.createDraftReport(report, user.id)
    },
    [user, currentProjectRole],
  )

  const closeDayAndStartNext = useCallback(
    async (tankId: string, date: Date) => {
      if (!user) return
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para fechar dias.')
        throw new Error('Permission denied')
      }
      try {
        const { start, end } = getProductionDayWindow(date)
        const ops = await operationService.getOperations(tankId)
        const dailyOps = ops.filter((op) => {
          const opStart = parseISO(op.startTime)
          const reportDate = getReportDateFromTimestamp(opStart)
          return format(reportDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        })
        const metrics = calculateDailyMetrics(dailyOps)
        const newReport: Omit<
          DailyProductionReport,
          'id' | 'createdAt' | 'closedAt'
        > = {
          tankId,
          reportDate: format(date, 'yyyy-MM-dd'),
          startDatetime: start.toISOString(),
          endDatetime: end.toISOString(),
          status: 'closed',
          stockVariation: metrics.stockVariation,
          drainedVolumeM3: metrics.drained,
          transferredVolumeM3: metrics.transferred,
          calculatedWellProductionM3: metrics.wellProduction,
          totalBswPercent: metrics.totalBswPercent,
          uncorrectedOilVolumeM3: metrics.uncorrectedOilVolume,
          emulsionWaterVolumeM3: metrics.emulsionWaterVolume,
          tempCorrectionFactorY: metrics.tempCorrectionFactorY,
          correctedOilVolumeM3: metrics.correctedOilVolume,
          emulsionBswPercent: metrics.emulsionBswPercent,
          fluidTempC: metrics.fluidTempC,
          fcv: metrics.fcv,
          fe: metrics.fe,
          densityAt20cGcm3: metrics.densityAt20cGcm3,
          transferObservedDensityGcm3: metrics.transferObservedDensityGcm3,
        }
        const createdReport = await reportService.closeReport(
          newReport,
          user.id,
        )
        const opIds = dailyOps.map((op) => op.id)
        await operationService.linkOperationsToReport(opIds, createdReport.id)

        const nextReportDate = addDays(date, 1)
        const { start: nextStart, end: nextEnd } =
          getProductionDayWindow(nextReportDate)
        const nextDraftReport = await reportService.createDraftReport(
          {
            tankId,
            reportDate: format(nextReportDate, 'yyyy-MM-dd'),
            startDatetime: nextStart.toISOString(),
            endDatetime: nextEnd.toISOString(),
            status: 'draft',
            stockVariation: 0,
            totalBswPercent: 0,
            drainedVolumeM3: 0,
            transferredVolumeM3: 0,
            uncorrectedOilVolumeM3: 0,
            emulsionWaterVolumeM3: 0,
            tempCorrectionFactorY: 1,
            correctedOilVolumeM3: 0,
            emulsionBswPercent: 0,
            fluidTempC: 0,
            fcv: 1,
            fe: 1,
            calculatedWellProductionM3: 0,
          },
          user.id,
        )

        const lastOp = dailyOps.sort(
          (a, b) =>
            new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
        )[0]

        const nextOp: Omit<TankOperation, 'id'> = {
          tankId,
          type: 'production',
          startTime: nextStart.toISOString(),
          endTime: nextEnd.toISOString(),
          initialLevelMm: lastOp ? lastOp.finalLevelMm : 0,
          finalLevelMm: lastOp ? lastOp.finalLevelMm : 0,
          bswPercent: lastOp ? lastOp.bswPercent : 0,
          tempFluidC: lastOp ? lastOp.tempFluidC : 0,
          tempAmbientC: lastOp ? lastOp.tempAmbientC : 0,
          densityObservedGcm3: lastOp ? lastOp.densityObservedGcm3 : 0,
          dailyReportId: nextDraftReport.id,
        }

        const calData = calibrationLookupData[tankId] || []
        const calculatedNextOp = calculateOperationData(nextOp, calData)
        await operationService.createOperation(calculatedNextOp, user.id)
        await recalculateProductionForDay(tankId, nextReportDate)
        toast.success('Dia fechado com sucesso! Boletim do próximo dia criado.')
      } catch (error: any) {
        console.error('Error closing day:', error)
        toast.error('Erro ao fechar dia: ' + error.message)
        throw error
      }
    },
    [
      user,
      calibrationLookupData,
      recalculateProductionForDay,
      currentProjectRole,
    ],
  )

  const loadTankCalibration = useCallback(async (tankId: string) => {
    try {
      const { data: fullCalData } =
        await sheetService.getCalibrationData(tankId)
      setCalibrationLookupData((prev) => ({
        ...prev,
        [tankId]: fullCalData,
      }))
    } catch (error) {
      console.error('Error refreshing calibration lookup:', error)
    }
  }, [])

  const saveCalibrationDataWithReason = useCallback(
    async (sheetId: string, reason: string) => {
      const tankId = getTankIdFromSheetId(sheetId)
      if (!tankId || !user) return
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para editar arqueação.')
        throw new Error('Permission denied')
      }
      try {
        const data = calibrationData[sheetId] || []
        await sheetService.saveCalibrationData(tankId, data, reason, user.id)
        await loadTankCalibration(tankId)
        toast.success('Tabela de arqueação salva com sucesso!')
      } catch (error: any) {
        console.error('Error saving calibration data:', error)
        toast.error('Erro ao salvar dados: ' + error.message)
        throw error
      }
    },
    [calibrationData, user, loadTankCalibration, currentProjectRole],
  )

  const batchUpdateCalibration = useCallback(
    async (
      sheetId: string,
      operations: BatchCalibrationOperations,
      reason: string,
    ) => {
      const tankId = getTankIdFromSheetId(sheetId)
      if (!tankId || !user) return
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para editar arqueação.')
        throw new Error('Permission denied')
      }
      try {
        await sheetService.batchUpdateCalibration(
          tankId,
          operations,
          reason,
          user.id,
        )
        await loadTankCalibration(tankId)
        toast.success('Alterações salvas com sucesso!')
      } catch (error: any) {
        console.error('Error batch updating calibration:', error)
        toast.error('Erro ao salvar alterações: ' + error.message)
        throw error
      }
    },
    [user, loadTankCalibration, currentProjectRole],
  )

  const importCalibrationDataWithReason = useCallback(
    async (sheetId: string, file: File, reason: string) => {
      const tankId = getTankIdFromSheetId(sheetId)
      if (!tankId || !user) return 0
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para importar arqueação.')
        throw new Error('Permission denied')
      }
      try {
        const count = await sheetService.importCalibrationData(
          tankId,
          file,
          reason,
          user.id,
        )
        await loadTankCalibration(tankId)
        return count
      } catch (error: any) {
        console.error('Error importing calibration data:', error)
        throw error
      }
    },
    [user, loadTankCalibration, currentProjectRole],
  )

  const exportCalibrationData = useCallback(
    async (sheetId: string) => {
      const tankId = getTankIdFromSheetId(sheetId)
      if (!tankId) return
      let tankTag = tankId
      const project = projects.find((p) => p.tanks.some((t) => t.id === tankId))
      const tank = project?.tanks.find((t) => t.id === tankId)
      if (tank) tankTag = tank.tag
      try {
        const blob = await sheetService.exportCalibrationData(tankId)
        if (!blob || !(blob instanceof Blob))
          throw new Error('Dados recebidos em formato inválido.')
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const cleanTag = tankTag.replace(/[^a-z0-9-_]/gi, '_')
        a.download = `calibration_data_${cleanTag}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Download iniciado!')
      } catch (error: any) {
        console.error('Error exporting data:', error)
        toast.error(error.message || 'Dados recebidos em formato inválido.')
      }
    },
    [projects],
  )

  const deleteCalibrationTable = useCallback(
    async (sheetId: string, reason: string) => {
      const tankId = getTankIdFromSheetId(sheetId)
      if (!tankId || !user) return
      if (currentProjectRole === 'viewer') {
        toast.error('Você não tem permissão para deletar arqueação.')
        throw new Error('Permission denied')
      }
      try {
        await sheetService.deleteCalibrationData(tankId, reason, user.id)
        setCalibrationData((prev) => ({ ...prev, [sheetId]: [] }))
        setCalibrationCounts((prev) => ({ ...prev, [sheetId]: 0 }))
        setCalibrationLookupData((prev) => ({ ...prev, [tankId]: [] }))
        toast.success('Tabela de arqueação deletada com sucesso!')
      } catch (error: any) {
        console.error('Error deleting calibration data:', error)
        toast.error('Erro ao deletar tabela: ' + error.message)
        throw error
      }
    },
    [user, currentProjectRole],
  )

  const updateProductionRow = useCallback(
    (
      sheetId: string,
      index: number,
      field: keyof ProductionRow,
      value: any,
    ) => {
      if (currentProjectRole === 'viewer') {
        toast.error('Modo leitura.')
        return
      }
      setProductionData((prev) => {
        const currentRows = prev[sheetId] || []
        const newData = [...currentRows]

        if (field === 'AB_FCV') {
          if (value === '' || value === null || value === undefined) {
            const { AB_FCV_Manual, ...rest } = newData[index]
            newData[index] = rest as ProductionRow
          } else {
            newData[index] = { ...newData[index], AB_FCV_Manual: value }
          }
        } else {
          newData[index] = { ...newData[index], [field]: value }
        }

        const tankId = getTankIdFromSheetId(sheetId)
        const currentCalData = tankId ? calibrationLookupData[tankId] || [] : []

        for (let i = index; i < newData.length; i++) {
          const prevRow = i > 0 ? newData[i - 1] : undefined
          const newRow = calculateProductionRow(
            newData[i],
            prevRow,
            currentCalData,
          )

          // Logging FCV calculation if inputs changed and FCV is valid
          if (
            (field === 'X_Temp_Fluido' ||
              field === 'Z_Densidade_Lab_20C' ||
              field === 'AA_T_Observada_C') &&
            user
          ) {
            const fcv =
              typeof newRow.AB_FCV === 'number'
                ? newRow.AB_FCV
                : parseFloat(String(newRow.AB_FCV))
            const density =
              typeof newRow.Z_Densidade_Lab_20C === 'number'
                ? newRow.Z_Densidade_Lab_20C
                : parseFloat(String(newRow.Z_Densidade_Lab_20C))
            const temp =
              typeof newRow.AA_T_Observada_C === 'number'
                ? newRow.AA_T_Observada_C
                : parseFloat(String(newRow.AA_T_Observada_C))

            if (!isNaN(density) && !isNaN(temp) && !isNaN(fcv) && density > 0) {
              fcvLogService.logCalculation({
                userId: user.id,
                fluidTempC: temp,
                observedDensityGcm3: density,
                densityAt20cGcm3: density / fcv,
                fcv: fcv,
              })
            }
          }

          newData[i] = newRow
        }
        return { ...prev, [sheetId]: newData }
      })
    },
    [calibrationLookupData, user, currentProjectRole],
  )

  const addProductionRow = useCallback(
    (sheetId: string) => {
      if (currentProjectRole === 'viewer') {
        toast.error('Modo leitura.')
        return
      }
      setProductionData((prev) => {
        const currentRows = prev[sheetId] || []
        const lastRow = currentRows[currentRows.length - 1]
        const newRow: ProductionRow = {
          ...INITIAL_PRODUCTION_ROW,
          id: `row-${Date.now()}`,
        }
        if (lastRow && lastRow.E_Altura_Liq_Final_mm !== '') {
          newRow.B_Altura_Liq_Inicial_mm = lastRow.E_Altura_Liq_Final_mm
        }
        const tankId = getTankIdFromSheetId(sheetId)
        const currentCalData = tankId ? calibrationLookupData[tankId] || [] : []
        const calculatedNewRow = calculateProductionRow(
          newRow,
          lastRow,
          currentCalData,
        )
        return { ...prev, [sheetId]: [...currentRows, calculatedNewRow] }
      })
    },
    [calibrationLookupData, currentProjectRole],
  )

  const deleteProductionRow = useCallback(
    (sheetId: string, index: number) => {
      if (currentProjectRole === 'viewer') {
        toast.error('Modo leitura.')
        return
      }
      setProductionData((prev) => {
        const currentRows = prev[sheetId] || []
        const newData = currentRows.filter((_, i) => i !== index)
        const tankId = getTankIdFromSheetId(sheetId)
        const currentCalData = tankId ? calibrationLookupData[tankId] || [] : []
        for (let i = index; i < newData.length; i++) {
          const prevRow = i > 0 ? newData[i - 1] : undefined
          newData[i] = calculateProductionRow(
            newData[i],
            prevRow,
            currentCalData,
          )
        }
        return { ...prev, [sheetId]: newData }
      })
    },
    [calibrationLookupData, currentProjectRole],
  )

  const setCalibrationDataForSheet = useCallback(
    (sheetId: string, data: CalibrationRow[]) => {
      if (currentProjectRole === 'viewer') {
        return
      }
      setCalibrationData((prev) => ({ ...prev, [sheetId]: data }))
    },
    [currentProjectRole],
  )

  const setSealDataForSheet = useCallback(
    (sheetId: string, data: SealRow[]) => {
      if (currentProjectRole === 'viewer') {
        return
      }
      setSealData((prev) => ({ ...prev, [sheetId]: data }))
    },
    [currentProjectRole],
  )

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        currentProjectRole,
        setCurrentProject,
        isLoadingProjects,
        projectsError,
        refreshProjects,
        productionFields,
        wells,
        transferDestinationCategories,
        refreshMetadata,
        members,
        isLoadingMembers,
        fetchMembers,
        inviteMember,
        updateMemberRole,
        removeMember,
        logoUrl,
        refreshLogo,
        updateLogo,
        removeLogo,
        updateProjectLogo,
        removeProjectLogo,
        productionData,
        calibrationData,
        calibrationLookupData,
        loadTankCalibration,
        calibrationCounts,
        sealData,
        tankOperations,
        loadOperations,
        addOperation,
        updateOperation,
        deleteOperation,
        getLastClosedOperation,
        getLastOperationBefore,
        getLastClosedReport,
        getLastOperationByReportId,
        getContinuityLevel,
        isSheetLoading,
        addTank,
        updateTank,
        createProject,
        clearProjectData,
        createProductionField,
        updateProductionField,
        deleteProductionField,
        createWell,
        deleteWell,
        createTransferDestinationCategory,
        updateTransferDestinationCategory,
        deleteTransferDestinationCategory,
        updateProductionRow,
        addProductionRow,
        deleteProductionRow,
        recalculateProductionForDay,
        setCalibrationDataForSheet,
        saveCalibrationDataWithReason,
        batchUpdateCalibration,
        importCalibrationDataWithReason,
        exportCalibrationData,
        deleteCalibrationTable,
        setSealDataForSheet,
        loadSheetData,
        saveSheetData,
        getReports,
        getReportByDate,
        getReportsForTanksByDate,
        closeReport,
        createDailyReport,
        isDateClosed,
        closeDayAndStartNext,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (!context)
    throw new Error('useProject must be used within a ProjectProvider')
  return context
}
