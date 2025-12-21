// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      alert_notifications: {
        Row: {
          alert_rule_id: string
          daily_report_id: string
          id: string
          is_read: boolean
          message: string
          triggered_at: string
        }
        Insert: {
          alert_rule_id: string
          daily_report_id: string
          id?: string
          is_read?: boolean
          message: string
          triggered_at?: string
        }
        Update: {
          alert_rule_id?: string
          daily_report_id?: string
          id?: string
          is_read?: boolean
          message?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'alert_notifications_alert_rule_id_fkey'
            columns: ['alert_rule_id']
            isOneToOne: false
            referencedRelation: 'alert_rules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'alert_notifications_daily_report_id_fkey'
            columns: ['daily_report_id']
            isOneToOne: false
            referencedRelation: 'daily_production_reports'
            referencedColumns: ['id']
          },
        ]
      }
      alert_rules: {
        Row: {
          condition: string
          created_at: string
          id: string
          metric_field: string
          name: string
          project_id: string
          threshold_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          condition: string
          created_at?: string
          id?: string
          metric_field: string
          name: string
          project_id: string
          threshold_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          condition?: string
          created_at?: string
          id?: string
          metric_field?: string
          name?: string
          project_id?: string
          threshold_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'alert_rules_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_value: string | null
          old_value: string | null
          operation_type: string
          project_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          operation_type: string
          project_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          operation_type?: string
          project_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      calibration_data: {
        Row: {
          created_at: string
          fcv: number | null
          height_mm: number
          id: string
          tank_id: string
          volume_m3: number
        }
        Insert: {
          created_at?: string
          fcv?: number | null
          height_mm: number
          id?: string
          tank_id: string
          volume_m3: number
        }
        Update: {
          created_at?: string
          fcv?: number | null
          height_mm?: number
          id?: string
          tank_id?: string
          volume_m3?: number
        }
        Relationships: [
          {
            foreignKeyName: 'calibration_data_tank_id_fkey'
            columns: ['tank_id']
            isOneToOne: false
            referencedRelation: 'tanks'
            referencedColumns: ['id']
          },
        ]
      }
      daily_production_reports: {
        Row: {
          calculated_well_production_m3: number | null
          closed_at: string | null
          closed_by: string | null
          corrected_oil_volume_m3: number | null
          created_at: string | null
          density_at_20c_gcm3: number | null
          drained_volume_m3: number | null
          emulsion_bsw_percent: number | null
          emulsion_water_volume_m3: number | null
          end_datetime: string
          fcv: number | null
          fe: number | null
          fluid_temp_c: number | null
          id: string
          report_date: string
          start_datetime: string
          status: string
          stock_variation: number | null
          tank_id: string
          temp_correction_factor_y: number | null
          total_bsw_percent: number | null
          transfer_observed_density_gcm3: number | null
          transferred_volume_m3: number | null
          uncorrected_oil_volume_m3: number | null
          updated_at: string | null
        }
        Insert: {
          calculated_well_production_m3?: number | null
          closed_at?: string | null
          closed_by?: string | null
          corrected_oil_volume_m3?: number | null
          created_at?: string | null
          density_at_20c_gcm3?: number | null
          drained_volume_m3?: number | null
          emulsion_bsw_percent?: number | null
          emulsion_water_volume_m3?: number | null
          end_datetime: string
          fcv?: number | null
          fe?: number | null
          fluid_temp_c?: number | null
          id?: string
          report_date: string
          start_datetime: string
          status?: string
          stock_variation?: number | null
          tank_id: string
          temp_correction_factor_y?: number | null
          total_bsw_percent?: number | null
          transfer_observed_density_gcm3?: number | null
          transferred_volume_m3?: number | null
          uncorrected_oil_volume_m3?: number | null
          updated_at?: string | null
        }
        Update: {
          calculated_well_production_m3?: number | null
          closed_at?: string | null
          closed_by?: string | null
          corrected_oil_volume_m3?: number | null
          created_at?: string | null
          density_at_20c_gcm3?: number | null
          drained_volume_m3?: number | null
          emulsion_bsw_percent?: number | null
          emulsion_water_volume_m3?: number | null
          end_datetime?: string
          fcv?: number | null
          fe?: number | null
          fluid_temp_c?: number | null
          id?: string
          report_date?: string
          start_datetime?: string
          status?: string
          stock_variation?: number | null
          tank_id?: string
          temp_correction_factor_y?: number | null
          total_bsw_percent?: number | null
          transfer_observed_density_gcm3?: number | null
          transferred_volume_m3?: number | null
          uncorrected_oil_volume_m3?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'daily_production_reports_tank_id_fkey'
            columns: ['tank_id']
            isOneToOne: false
            referencedRelation: 'tanks'
            referencedColumns: ['id']
          },
        ]
      }
      fcv_calculation_logs: {
        Row: {
          algorithm_version: string
          applied_norm: string
          calculated_at: string
          density_at_20c_gcm3: number
          fcv: number
          fluid_temp_c: number
          id: string
          observed_density_gcm3: number
          pressure_kpag: number
          reference_base: string
          user_id: string
        }
        Insert: {
          algorithm_version: string
          applied_norm?: string
          calculated_at?: string
          density_at_20c_gcm3: number
          fcv: number
          fluid_temp_c: number
          id?: string
          observed_density_gcm3: number
          pressure_kpag?: number
          reference_base?: string
          user_id: string
        }
        Update: {
          algorithm_version?: string
          applied_norm?: string
          calculated_at?: string
          density_at_20c_gcm3?: number
          fcv?: number
          fluid_temp_c?: number
          id?: string
          observed_density_gcm3?: number
          pressure_kpag?: number
          reference_base?: string
          user_id?: string
        }
        Relationships: []
      }
      fcv_data: {
        Row: {
          created_at: string
          id: string
          raw_data: Json
          tank_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          raw_data: Json
          tank_id: string
        }
        Update: {
          created_at?: string
          id?: string
          raw_data?: Json
          tank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fcv_data_tank_id_fkey'
            columns: ['tank_id']
            isOneToOne: false
            referencedRelation: 'tanks'
            referencedColumns: ['id']
          },
        ]
      }
      production_data: {
        Row: {
          corrected_oil_production: number | null
          created_at: string
          date: string | null
          gross_production: number | null
          id: string
          raw_data: Json
          tank_id: string
          total_water_production: number | null
          uncorrected_oil_production: number | null
        }
        Insert: {
          corrected_oil_production?: number | null
          created_at?: string
          date?: string | null
          gross_production?: number | null
          id?: string
          raw_data: Json
          tank_id: string
          total_water_production?: number | null
          uncorrected_oil_production?: number | null
        }
        Update: {
          corrected_oil_production?: number | null
          created_at?: string
          date?: string | null
          gross_production?: number | null
          id?: string
          raw_data?: Json
          tank_id?: string
          total_water_production?: number | null
          uncorrected_oil_production?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'production_data_tank_id_fkey'
            columns: ['tank_id']
            isOneToOne: false
            referencedRelation: 'tanks'
            referencedColumns: ['id']
          },
        ]
      }
      production_fields: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'production_fields_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database['public']['Enums']['project_role']
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: Database['public']['Enums']['project_role']
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database['public']['Enums']['project_role']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      project_team_roles: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database['public']['Enums']['project_role']
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: Database['public']['Enums']['project_role']
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database['public']['Enums']['project_role']
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_team_roles_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_team_roles_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seal_data: {
        Row: {
          created_at: string
          date: string | null
          id: string
          raw_data: Json
          tank_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          raw_data: Json
          tank_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          raw_data?: Json
          tank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'seal_data_tank_id_fkey'
            columns: ['tank_id']
            isOneToOne: false
            referencedRelation: 'tanks'
            referencedColumns: ['id']
          },
        ]
      }
      tank_operations: {
        Row: {
          bsw_percent: number | null
          comments: string | null
          created_at: string | null
          ctl: number | null
          daily_report_id: string | null
          density_observed_gcm3: number | null
          end_time: string
          fcv: number | null
          fe: number | null
          final_level_mm: number
          final_volume_m3: number | null
          id: string
          initial_level_mm: number
          initial_volume_m3: number | null
          oil_volume_m3: number | null
          start_time: string
          tank_id: string
          temp_ambient_c: number | null
          temp_fluid_c: number | null
          transfer_destination: string | null
          type: Database['public']['Enums']['operation_type']
          updated_at: string | null
          user_id: string
          volume_corrected_m3: number | null
          volume_m3: number | null
          water_volume_m3: number | null
        }
        Insert: {
          bsw_percent?: number | null
          comments?: string | null
          created_at?: string | null
          ctl?: number | null
          daily_report_id?: string | null
          density_observed_gcm3?: number | null
          end_time: string
          fcv?: number | null
          fe?: number | null
          final_level_mm: number
          final_volume_m3?: number | null
          id?: string
          initial_level_mm: number
          initial_volume_m3?: number | null
          oil_volume_m3?: number | null
          start_time: string
          tank_id: string
          temp_ambient_c?: number | null
          temp_fluid_c?: number | null
          transfer_destination?: string | null
          type: Database['public']['Enums']['operation_type']
          updated_at?: string | null
          user_id: string
          volume_corrected_m3?: number | null
          volume_m3?: number | null
          water_volume_m3?: number | null
        }
        Update: {
          bsw_percent?: number | null
          comments?: string | null
          created_at?: string | null
          ctl?: number | null
          daily_report_id?: string | null
          density_observed_gcm3?: number | null
          end_time?: string
          fcv?: number | null
          fe?: number | null
          final_level_mm?: number
          final_volume_m3?: number | null
          id?: string
          initial_level_mm?: number
          initial_volume_m3?: number | null
          oil_volume_m3?: number | null
          start_time?: string
          tank_id?: string
          temp_ambient_c?: number | null
          temp_fluid_c?: number | null
          transfer_destination?: string | null
          type?: Database['public']['Enums']['operation_type']
          updated_at?: string | null
          user_id?: string
          volume_corrected_m3?: number | null
          volume_m3?: number | null
          water_volume_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'tank_operations_daily_report_id_fkey'
            columns: ['daily_report_id']
            isOneToOne: false
            referencedRelation: 'daily_production_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tank_operations_tank_id_fkey'
            columns: ['tank_id']
            isOneToOne: false
            referencedRelation: 'tanks'
            referencedColumns: ['id']
          },
        ]
      }
      tanks: {
        Row: {
          created_at: string
          geolocation: string | null
          id: string
          production_field_id: string
          project_id: string
          tag: string
          updated_at: string | null
          well_id: string | null
        }
        Insert: {
          created_at?: string
          geolocation?: string | null
          id?: string
          production_field_id: string
          project_id: string
          tag: string
          updated_at?: string | null
          well_id?: string | null
        }
        Update: {
          created_at?: string
          geolocation?: string | null
          id?: string
          production_field_id?: string
          project_id?: string
          tag?: string
          updated_at?: string | null
          well_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tanks_production_field_id_fkey'
            columns: ['production_field_id']
            isOneToOne: false
            referencedRelation: 'production_fields'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tanks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tanks_well_id_fkey'
            columns: ['well_id']
            isOneToOne: false
            referencedRelation: 'wells'
            referencedColumns: ['id']
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: Database['public']['Enums']['team_role']
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database['public']['Enums']['team_role']
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database['public']['Enums']['team_role']
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teams_owner_user_id_fkey'
            columns: ['owner_user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      transfer_destination_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'transfer_destination_categories_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email_notification_preferences: Json
          id: string
          role: Database['public']['Enums']['user_role']
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_notification_preferences?: Json
          id: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_notification_preferences?: Json
          id?: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: []
      }
      wells: {
        Row: {
          created_at: string
          id: string
          name: string
          production_field_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          production_field_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          production_field_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'wells_production_field_id_fkey'
            columns: ['production_field_id']
            isOneToOne: false
            referencedRelation: 'production_fields'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_project: { Args: { _project_id: string }; Returns: boolean }
      import_calibration_data: {
        Args: { p_data: Json; p_tank_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_member_of_project: { Args: { _project_id: string }; Returns: boolean }
      is_member_of_team: { Args: { _team_id: string }; Returns: boolean }
      is_project_owner: { Args: { _project_id: string }; Returns: boolean }
      is_team_admin: { Args: { _team_id: string }; Returns: boolean }
      is_team_owner: { Args: { _team_id: string }; Returns: boolean }
    }
    Enums: {
      operation_type: 'production' | 'drainage' | 'transfer' | 'stock_variation'
      project_role: 'owner' | 'editor' | 'viewer'
      team_role: 'team_admin' | 'team_member'
      user_role: 'operator' | 'approver' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      operation_type: ['production', 'drainage', 'transfer', 'stock_variation'],
      project_role: ['owner', 'editor', 'viewer'],
      team_role: ['team_admin', 'team_member'],
      user_role: ['operator', 'approver', 'admin'],
    },
  },
} as const
