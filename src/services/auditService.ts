import { supabase } from '@/lib/supabase/client'
import { AuditLog } from '@/lib/types'

interface CreateLogParams {
  userId: string
  projectId?: string
  entityType:
    | 'tank'
    | 'calibration'
    | 'production_field'
    | 'well'
    | 'calibration_table'
    | 'operation'
    | 'report'
    | 'transfer_category'
    | 'alert_rule'
    | 'user'
    | 'project'
    | 'project_member'
    | 'team'
    | 'team_member'
    | 'project_team_role'
  entityId: string
  operationType:
    | 'update_tank_tag'
    | 'update_tank_production_field'
    | 'update_tank_well'
    | 'update_calibration'
    | 'import_calibration'
    | 'insert'
    | 'delete'
    | 'update'
    | 'batch_update'
    | 'close_report'
    | 'create_user'
    | 'delete_user'
    | 'update_user_role'
    | 'update_project_logo'
    | 'add_member'
    | 'remove_member'
    | 'update_member_role'
    | 'create_team'
    | 'update_team'
    | 'delete_team'
    | 'add_team_member'
    | 'remove_team_member'
    | 'update_team_member_role'
    | 'assign_team_to_project'
    | 'remove_team_from_project'
    | 'update_project_team_role'
  oldValue?: string
  newValue?: string
  reason: string
}

interface GetLogsParams {
  startDate?: Date
  endDate?: Date
  userId?: string
  operationType?: string
  projectId?: string
}

export const auditService = {
  async createLog(params: CreateLogParams) {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: params.userId,
      project_id: params.projectId || null,
      entity_type: params.entityType,
      entity_id: params.entityId,
      operation_type: params.operationType,
      old_value: params.oldValue,
      new_value: params.newValue,
      reason: params.reason,
    })

    if (error) {
      console.error('Failed to create audit log:', error)
    }
  },

  async getLogs(params: GetLogsParams = {}): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (params.startDate) {
      query = query.gte('created_at', params.startDate.toISOString())
    }
    if (params.endDate) {
      // End of day
      const endOfDay = new Date(params.endDate)
      endOfDay.setHours(23, 59, 59, 999)
      query = query.lte('created_at', endOfDay.toISOString())
    }
    if (params.userId && params.userId !== 'all') {
      query = query.eq('user_id', params.userId)
    }
    if (params.operationType && params.operationType !== 'all') {
      query = query.eq('operation_type', params.operationType)
    }
    if (params.projectId && params.projectId !== 'all') {
      query = query.eq('project_id', params.projectId)
    }

    const { data, error } = await query
    if (error) throw error

    return data.map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      projectId: log.project_id,
      entityType: log.entity_type,
      entityId: log.entity_id,
      operationType: log.operation_type,
      oldValue: log.old_value,
      newValue: log.new_value,
      reason: log.reason,
      createdAt: log.created_at,
    })) as AuditLog[]
  },

  async getDistinctUsers(): Promise<string[]> {
    const { data, error } = await supabase.from('audit_logs').select('user_id')

    if (error) throw error

    const users = new Set<string>()
    data?.forEach((log: { user_id: string }) => users.add(log.user_id))
    return Array.from(users)
  },

  async getDistinctOperationTypes(): Promise<string[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('operation_type')

    if (error) throw error

    const types = new Set<string>()
    data?.forEach((log: { operation_type: string }) =>
      types.add(log.operation_type),
    )
    return Array.from(types).sort()
  },
}
