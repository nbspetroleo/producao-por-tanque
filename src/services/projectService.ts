import { supabase } from '@/lib/supabase/client'
import { DbTank } from '@/lib/db-types'
import {
  Project,
  Tank,
  ProductionField,
  Well,
  TransferDestinationCategory,
  ProjectMember,
  ProjectRole,
  ProjectTeamRole,
} from '@/lib/types'
import { auditService } from './auditService'
import { v4 as uuidv4 } from 'uuid'

export const projectService = {
  // ... existing methods ...
  async getProjects(userId?: string): Promise<Project[]> {
    if (!userId) return []

    try {
      const [directMembersResponse, teamMembersResponse] = await Promise.all([
        supabase
          .from('project_members')
          .select(
            `
            role,
            project:projects (
              id,
              name,
              description,
              logo_url,
              created_at,
              updated_at
            )
          `,
          )
          .eq('user_id', userId),
        supabase.from('team_members').select('team_id').eq('user_id', userId),
      ])

      if (directMembersResponse.error) throw directMembersResponse.error
      if (teamMembersResponse.error) throw teamMembersResponse.error

      const teamIds = teamMembersResponse.data?.map((tm) => tm.team_id) || []

      let teamProjects: any[] = []
      if (teamIds.length > 0) {
        const { data: teamRoles, error: teamRolesError } = await supabase
          .from('project_team_roles')
          .select(
            `
            role,
            project:projects (
              id,
              name,
              description,
              logo_url,
              created_at,
              updated_at
            )
          `,
          )
          .in('team_id', teamIds)

        if (teamRolesError) throw teamRolesError
        if (teamRoles) teamProjects = teamRoles
      }

      const projectMap = new Map<string, any>()

      directMembersResponse.data?.forEach((m: any) => {
        if (m.project) {
          projectMap.set(m.project.id, { ...m.project, role: m.role })
        }
      })

      const rolePriority = { owner: 3, editor: 2, viewer: 1 }

      teamProjects.forEach((tp: any) => {
        if (tp.project) {
          const existing = projectMap.get(tp.project.id)
          const newRoleVal =
            rolePriority[tp.role as keyof typeof rolePriority] || 0
          const existingRoleVal = existing
            ? rolePriority[existing.role as keyof typeof rolePriority] || 0
            : 0

          if (!existing || newRoleVal > existingRoleVal) {
            projectMap.set(tp.project.id, { ...tp.project, role: tp.role })
          }
        }
      })

      const uniqueProjects = Array.from(projectMap.values())
      uniqueProjects.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      )

      const projectIds = uniqueProjects.map((p) => p.id)
      if (projectIds.length === 0) return []

      const { data: tanksData, error: tanksError } = await supabase
        .from('tanks')
        .select(`*, production_field:production_fields(*), well:wells(*)`)
        .in('project_id', projectIds)
        .order('tag', { ascending: true })

      if (tanksError) throw tanksError

      const tanks = tanksData as unknown as DbTank[]

      return uniqueProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        logoUrl: p.logo_url || null,
        role: p.role,
        tanks: (tanks || [])
          .filter((t: DbTank) => t.project_id === p.id)
          .map((t: DbTank) => ({
            id: t.id,
            tag: t.tag,
            productionField: t.production_field?.name || 'Desconhecido',
            productionFieldId: t.production_field_id,
            wellName: t.well?.name,
            wellId: t.well_id || undefined,
            geolocation: t.geolocation || '',
            sheets: [
              {
                id: `prod-${t.id}`,
                name: 'Registro de Operações',
                type: 'production',
              },
              {
                id: `cal-${t.id}`,
                name: 'Tabela Arqueação',
                type: 'calibration',
              },
              { id: `seal-${t.id}`, name: 'Registro de Lacres', type: 'seal' },
              {
                id: `reports-${t.id}`,
                name: 'Relatórios Consolidados',
                type: 'reports',
              },
            ],
          })),
      })) as Project[]
    } catch (error: any) {
      console.error(`FATAL ERROR in getProjects execution:`, error)
      throw error
    }
  },

  async createProject(
    name: string,
    description: string,
    userId: string,
  ): Promise<any> {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, description, created_by: userId } as any)
      .select()
      .single()

    if (error) throw error

    await auditService.createLog({
      userId,
      entityType: 'project',
      entityId: data.id,
      operationType: 'insert',
      reason: 'Criação de projeto',
      newValue: name,
      projectId: data.id,
    })

    return data
  },

  async uploadProjectLogo(
    projectId: string,
    file: File,
    userId: string,
  ): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `project-${projectId}-${uuidv4()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('project-logos')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('project-logos')
      .getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl

    const { error: dbError } = await supabase
      .from('projects')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', projectId)

    if (dbError) throw dbError

    await auditService.createLog({
      userId,
      projectId,
      entityType: 'project',
      entityId: projectId,
      operationType: 'update_project_logo',
      newValue: publicUrl,
      reason: 'Upload de logo do projeto',
    })

    return publicUrl
  },

  async removeProjectLogo(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq('id', projectId)

    if (error) throw error

    await auditService.createLog({
      userId,
      projectId,
      entityType: 'project',
      entityId: projectId,
      operationType: 'update_project_logo',
      newValue: 'NULL',
      reason: 'Remoção de logo do projeto',
    })
  },

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const { data: members, error } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const { data: allUsers } = await supabase.functions.invoke('list-users')

    // Fetch avatars
    const userIds = members.map((m: any) => m.user_id)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, avatar_url')
      .in('id', userIds)

    return members.map((m: any) => {
      const userProfile = allUsers?.find((u: any) => u.id === m.user_id)
      const profile = profiles?.find((p: any) => p.id === m.user_id)
      return {
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        email: userProfile?.email || 'Email not found',
        avatarUrl: profile?.avatar_url || null,
        role: m.role,
        createdAt: m.created_at,
      }
    })
  },

  async inviteMember(
    projectId: string,
    email: string,
    userId: string,
  ): Promise<void> {
    const { data, error } = await supabase.functions.invoke('invite-member', {
      body: { projectId, email },
    })

    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)

    await auditService.createLog({
      userId,
      projectId,
      entityType: 'project_member',
      entityId: projectId,
      operationType: 'add_member',
      newValue: email,
      reason: 'Convite de colaborador',
    })
  },

  async updateMemberRole(
    memberId: string,
    role: ProjectRole,
    userId: string,
  ): Promise<void> {
    const { data: member } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('id', memberId)
      .single()

    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('id', memberId)

    if (error) throw error

    await auditService.createLog({
      userId,
      projectId: member?.project_id,
      entityType: 'project_member',
      entityId: memberId,
      operationType: 'update_member_role',
      newValue: role,
      reason: 'Atualização de permissão',
    })
  },

  async removeMember(memberId: string, userId: string): Promise<void> {
    const { data: member } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('id', memberId)
      .single()

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error

    await auditService.createLog({
      userId,
      projectId: member?.project_id,
      entityType: 'project_member',
      entityId: memberId,
      operationType: 'remove_member',
      reason: 'Remoção de colaborador',
    })
  },

  async getProjectTeams(projectId: string): Promise<ProjectTeamRole[]> {
    const { data, error } = await supabase
      .from('project_team_roles')
      .select(`*, team:teams(name)`)
      .eq('project_id', projectId)

    if (error) throw error

    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      teamId: d.team_id,
      role: d.role,
      teamName: d.team?.name,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }))
  },

  async assignTeamToProject(
    projectId: string,
    teamId: string,
    role: ProjectRole,
    userId: string,
  ): Promise<void> {
    const { error } = await supabase.from('project_team_roles').insert({
      project_id: projectId,
      team_id: teamId,
      role,
    })

    if (error) throw error

    await auditService.createLog({
      userId,
      projectId,
      entityType: 'project_team_role',
      entityId: teamId,
      operationType: 'assign_team_to_project',
      reason: 'Atribuição de time ao projeto',
      newValue: role,
    })
  },

  async updateTeamProjectRole(
    id: string,
    role: ProjectRole,
    userId: string,
  ): Promise<void> {
    const { data } = await supabase
      .from('project_team_roles')
      .select('project_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('project_team_roles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    await auditService.createLog({
      userId,
      projectId: data?.project_id,
      entityType: 'project_team_role',
      entityId: id,
      operationType: 'update_project_team_role',
      reason: 'Atualização de permissão de time',
      newValue: role,
    })
  },

  async removeTeamFromProject(id: string, userId: string): Promise<void> {
    const { data } = await supabase
      .from('project_team_roles')
      .select('project_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('project_team_roles')
      .delete()
      .eq('id', id)

    if (error) throw error

    await auditService.createLog({
      userId,
      projectId: data?.project_id,
      entityType: 'project_team_role',
      entityId: id,
      operationType: 'remove_team_from_project',
      reason: 'Remoção de time do projeto',
    })
  },

  async createTank(
    projectId: string,
    tank: Omit<Tank, 'id' | 'sheets'>,
  ): Promise<DbTank> {
    const { data, error } = await supabase
      .from('tanks')
      .insert({
        project_id: projectId,
        tag: tank.tag,
        production_field_id: tank.productionFieldId,
        well_id: tank.wellId || null,
        geolocation: tank.geolocation,
      } as any)
      .select()
      .single()
    if (error) throw error
    return data as unknown as DbTank
  },

  async updateTank(
    tankId: string,
    updates: any,
    reason: string,
    userId: string,
  ): Promise<void> {
    const { data: tank } = await supabase
      .from('tanks')
      .select('project_id')
      .eq('id', tankId)
      .single()

    const { error: updateError } = await supabase
      .from('tanks')
      .update({
        tag: updates.tag,
        production_field_id: updates.productionFieldId,
        well_id: updates.wellId,
        geolocation: updates.geolocation,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', tankId)
    if (updateError) throw updateError

    await auditService.createLog({
      userId,
      projectId: tank?.project_id,
      entityType: 'tank',
      entityId: tankId,
      operationType: 'update_tank_tag',
      reason,
    })
  },

  async getProductionFields(projectId?: string): Promise<ProductionField[]> {
    let query = supabase.from('production_fields').select('*').order('name')
    if (projectId) {
      query = query.or(`project_id.eq.${projectId},project_id.is.null`)
    }
    const { data, error } = await query
    if (error) throw error
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      projectId: d.project_id,
    }))
  },

  async createProductionField(
    name: string,
    userId: string,
    projectId?: string,
  ): Promise<ProductionField> {
    const { data, error } = await supabase
      .from('production_fields')
      .insert({ name, project_id: projectId || null })
      .select()
      .single()
    if (error) throw error
    await auditService.createLog({
      userId,
      projectId,
      entityType: 'production_field',
      entityId: data.id,
      operationType: 'insert',
      newValue: name,
      reason: 'Criação de campo de produção',
    })
    return { id: data.id, name: data.name, projectId: data.project_id }
  },

  async updateProductionField(
    id: string,
    name: string,
    userId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('production_fields')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    await auditService.createLog({
      userId,
      entityType: 'production_field',
      entityId: id,
      operationType: 'update',
      newValue: name,
      reason: 'Atualização de campo de produção',
    })
  },

  async deleteProductionField(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('production_fields')
      .delete()
      .eq('id', id)
    if (error) throw error
    await auditService.createLog({
      userId,
      entityType: 'production_field',
      entityId: id,
      operationType: 'delete',
      reason: 'Exclusão de campo de produção',
    })
  },

  async getWells(): Promise<Well[]> {
    const { data, error } = await supabase
      .from('wells')
      .select('id, name, production_field_id')
      .order('name')
    if (error) throw error
    return data.map((w: any) => ({
      id: w.id,
      name: w.name,
      productionFieldId: w.production_field_id,
    }))
  },

  async createWell(
    name: string,
    productionFieldId: string,
    userId: string,
  ): Promise<Well> {
    const { data, error } = await supabase
      .from('wells')
      .insert({ name, production_field_id: productionFieldId })
      .select()
      .single()
    if (error) throw error
    await auditService.createLog({
      userId,
      entityType: 'well',
      entityId: data.id,
      operationType: 'insert',
      newValue: name,
      reason: 'Criação de poço',
    })
    return {
      id: data.id,
      name: data.name,
      productionFieldId: data.production_field_id,
    }
  },

  async deleteWell(id: string, userId: string): Promise<void> {
    const { error } = await supabase.from('wells').delete().eq('id', id)
    if (error) throw error
    await auditService.createLog({
      userId,
      entityType: 'well',
      entityId: id,
      operationType: 'delete',
      reason: 'Exclusão de poço',
    })
  },

  async getTransferDestinationCategories(
    projectId: string,
  ): Promise<TransferDestinationCategory[]> {
    const { data, error } = await supabase
      .from('transfer_destination_categories')
      .select('*')
      .eq('project_id', projectId)
      .order('name')
    if (error) throw error
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      projectId: c.project_id,
    }))
  },

  async createTransferDestinationCategory(
    projectId: string,
    name: string,
    userId: string,
  ): Promise<TransferDestinationCategory> {
    const { data, error } = await supabase
      .from('transfer_destination_categories')
      .insert({ project_id: projectId, name })
      .select()
      .single()
    if (error) throw error
    await auditService.createLog({
      userId,
      projectId,
      entityType: 'transfer_category',
      entityId: data.id,
      operationType: 'insert',
      newValue: name,
      reason: 'Criação de categoria de destino',
    })
    return { id: data.id, name: data.name, projectId: data.project_id }
  },

  async updateTransferDestinationCategory(
    id: string,
    name: string,
    userId: string,
  ): Promise<void> {
    const { data } = await supabase
      .from('transfer_destination_categories')
      .select('project_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('transfer_destination_categories')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    await auditService.createLog({
      userId,
      projectId: data?.project_id,
      entityType: 'transfer_category',
      entityId: id,
      operationType: 'update',
      newValue: name,
      reason: 'Atualização de categoria de destino',
    })
  },

  async deleteTransferDestinationCategory(
    id: string,
    userId: string,
  ): Promise<void> {
    const { data } = await supabase
      .from('transfer_destination_categories')
      .select('project_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('transfer_destination_categories')
      .delete()
      .eq('id', id)
    if (error) throw error
    await auditService.createLog({
      userId,
      projectId: data?.project_id,
      entityType: 'transfer_category',
      entityId: id,
      operationType: 'delete',
      reason: 'Exclusão de categoria de destino',
    })
  },

  async clearProjectData(projectId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      'clear-project-data',
      { body: { projectId } },
    )
    if (error) throw error
    if (data && data.error) throw new Error(data.error)
  },
}
