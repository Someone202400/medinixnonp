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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      caregivers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notifications_enabled: boolean | null
          phone_number: string | null
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notifications_enabled?: boolean | null
          phone_number?: string | null
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notifications_enabled?: boolean | null
          phone_number?: string | null
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          medication_id: string
          notes: string | null
          priority_level: string | null
          scheduled_time: string
          special_instructions: string | null
          status: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          medication_id: string
          notes?: string | null
          priority_level?: string | null
          scheduled_time: string
          special_instructions?: string | null
          status?: string
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          medication_id?: string
          notes?: string | null
          priority_level?: string | null
          scheduled_time?: string
          special_instructions?: string | null
          status?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean | null
          created_at: string | null
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          name: string
          notes: string | null
          start_date: string
          times: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          name: string
          notes?: string | null
          start_date: string
          times: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          times?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          attempt_count: number | null
          channel: string
          created_at: string
          delivered_at: string | null
          delivery_status: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          metadata: Json | null
          notification_id: string
          user_id: string
        }
        Insert: {
          attempt_count?: number | null
          channel: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          notification_id: string
          user_id: string
        }
        Update: {
          attempt_count?: number | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          notification_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          adherence_reports: boolean | null
          caregiver_id: string | null
          created_at: string
          critical_override: boolean | null
          email_notifications_enabled: boolean | null
          emergency_alerts: boolean | null
          id: string
          medication_reminders: boolean | null
          notification_frequency: string | null
          preferred_channels: Json | null
          push_notifications_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_notifications_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adherence_reports?: boolean | null
          caregiver_id?: string | null
          created_at?: string
          critical_override?: boolean | null
          email_notifications_enabled?: boolean | null
          emergency_alerts?: boolean | null
          id?: string
          medication_reminders?: boolean | null
          notification_frequency?: string | null
          preferred_channels?: Json | null
          push_notifications_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adherence_reports?: boolean | null
          caregiver_id?: string | null
          created_at?: string
          critical_override?: boolean | null
          email_notifications_enabled?: boolean | null
          emergency_alerts?: boolean | null
          id?: string
          medication_reminders?: boolean | null
          notification_frequency?: string | null
          preferred_channels?: Json | null
          push_notifications_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          caregiver_id: string | null
          channels: Json | null
          created_at: string | null
          id: string
          message: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          caregiver_id?: string | null
          channels?: Json | null
          created_at?: string | null
          id?: string
          message: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          caregiver_id?: string | null
          channels?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          language: string | null
          notification_preferences: Json | null
          phone_number: string | null
          push_notifications_enabled: boolean | null
          updated_at: string | null
          weekly_reports_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          language?: string | null
          notification_preferences?: Json | null
          phone_number?: string | null
          push_notifications_enabled?: boolean | null
          updated_at?: string | null
          weekly_reports_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          phone_number?: string | null
          push_notifications_enabled?: boolean | null
          updated_at?: string | null
          weekly_reports_enabled?: boolean | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      symptom_questionnaires: {
        Row: {
          activity_limitations: string[] | null
          age: number | null
          associated_symptoms: string[] | null
          completed_at: string | null
          created_at: string
          gender: string | null
          id: string
          medical_history: Json | null
          pain_radiation: boolean | null
          pain_type: string[] | null
          primary_symptom_location: string | null
          questionnaire_data: Json | null
          recent_events: string[] | null
          session_id: string
          severity_rating: number | null
          symptom_duration: string | null
          symptom_progression: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_limitations?: string[] | null
          age?: number | null
          associated_symptoms?: string[] | null
          completed_at?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          medical_history?: Json | null
          pain_radiation?: boolean | null
          pain_type?: string[] | null
          primary_symptom_location?: string | null
          questionnaire_data?: Json | null
          recent_events?: string[] | null
          session_id: string
          severity_rating?: number | null
          symptom_duration?: string | null
          symptom_progression?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_limitations?: string[] | null
          age?: number | null
          associated_symptoms?: string[] | null
          completed_at?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          medical_history?: Json | null
          pain_radiation?: boolean | null
          pain_type?: string[] | null
          primary_symptom_location?: string | null
          questionnaire_data?: Json | null
          recent_events?: string[] | null
          session_id?: string
          severity_rating?: number | null
          symptom_duration?: string | null
          symptom_progression?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      symptom_sessions: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          id: number
          symptoms: string[] | null
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          id?: never
          symptoms?: string[] | null
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          id?: never
          symptoms?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          id: number
          key: string
          language: string
          value: string
        }
        Insert: {
          id?: number
          key: string
          language: string
          value: string
        }
        Update: {
          id?: number
          key?: string
          language?: string
          value?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          adherence_percentage: number
          created_at: string
          id: string
          medications_taken: number
          report_data: Json | null
          total_medications: number
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          adherence_percentage?: number
          created_at?: string
          id?: string
          medications_taken?: number
          report_data?: Json | null
          total_medications?: number
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          adherence_percentage?: number
          created_at?: string
          id?: string
          medications_taken?: number
          report_data?: Json | null
          total_medications?: number
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
