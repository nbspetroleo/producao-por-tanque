import { supabase } from '@/lib/supabase/client'
import { UserProfile, UserRole, UserNotificationPreferences } from '@/lib/types'
import { auditService } from './auditService'
import { v4 as uuidv4 } from 'uuid'

export const userService = {
  async listUsers(): Promise<UserProfile[]> {
    // 1. Fetch auth users via edge function
    const { data: authUsers, error } =
      await supabase.functions.invoke('list-users')
    if (error) throw error

    // 2. Fetch profiles for details (roles, avatars)
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      // Continue with just auth data if possible, but role will be default
    }

    // 3. Merge data
    return authUsers.map((u: any) => {
      const profile = profiles?.find((p: any) => p.id === u.id)
      return {
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        updatedAt: profile?.updated_at || u.created_at,
        role: (profile?.role as UserRole) || 'operator',
        avatarUrl: profile?.avatar_url || null,
        emailNotificationPreferences: profile?.email_notification_preferences,
      }
    })
  },

  async createUser(
    email: string,
    role: UserRole,
    adminUserId: string,
  ): Promise<void> {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { email, role },
    })

    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)

    await auditService.createLog({
      userId: adminUserId,
      entityType: 'user',
      entityId: data?.user?.id || 'unknown',
      operationType: 'create_user',
      newValue: `Email: ${email}, Role: ${role}`,
      reason: 'Criação de novo usuário pelo admin',
    })
  },

  async deleteUser(userIdToDelete: string, adminUserId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId: userIdToDelete },
    })

    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)

    await auditService.createLog({
      userId: adminUserId,
      entityType: 'user',
      entityId: userIdToDelete,
      operationType: 'delete_user',
      reason: 'Exclusão de usuário pelo admin',
    })
  },

  async updateUserRole(
    userIdToUpdate: string,
    newRole: UserRole,
    adminUserId: string,
  ): Promise<void> {
    // 1. Get old role for audit
    const { data: oldProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userIdToUpdate)
      .single()

    // 2. Update role
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userIdToUpdate)

    if (error) throw error

    // 3. Audit
    await auditService.createLog({
      userId: adminUserId,
      entityType: 'user',
      entityId: userIdToUpdate,
      operationType: 'update_user_role',
      oldValue: oldProfile?.role,
      newValue: newRole,
      reason: 'Atualização de nível hierárquico pelo admin',
    })
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return {
      id: data.id,
      role: data.role as UserRole,
      avatarUrl: data.avatar_url,
      emailNotificationPreferences:
        data.email_notification_preferences as UserNotificationPreferences,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  async updatePreferences(
    userId: string,
    preferences: UserNotificationPreferences,
  ): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        email_notification_preferences: preferences as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `profile-${uuidv4()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // 1. Upload to avatars bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) throw uploadError

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl

    // 3. Update profile
    const { error: dbError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (dbError) throw dbError

    return publicUrl
  },

  async removeAvatar(userId: string): Promise<void> {
    // We update the DB first. File cleanup could be done but not strictly required by prompt unless "Delete" policy is used.
    // The policy "Users can delete their own avatar" exists, so we can try to delete if we knew the path.
    // But we only have the public URL in DB. We would need to parse it to get the path.
    // For simplicity and safety, we just nullify the URL in DB.
    // In a real app, we might want to list files in folder and delete them.

    // 1. List files to delete (optional cleanup)
    try {
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(`${userId}`)
      if (files && files.length > 0) {
        const filesToRemove = files.map((f) => `${userId}/${f.name}`)
        await supabase.storage.from('avatars').remove(filesToRemove)
      }
    } catch (e) {
      console.warn('Failed to clean up old avatar files', e)
    }

    // 2. Update DB
    const { error } = await supabase
      .from('user_profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error
  },
}
