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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bug_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          page: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          page?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          page?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      caregivers: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          notify_app: boolean
          notify_email: boolean
          notify_whatsapp: boolean
          report_frequency: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notify_app?: boolean
          notify_email?: boolean
          notify_whatsapp?: boolean
          report_frequency?: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notify_app?: boolean
          notify_email?: boolean
          notify_whatsapp?: boolean
          report_frequency?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      exam_indicators: {
        Row: {
          created_at: string
          exam_result_id: string
          id: string
          indicator_name: string
          reference_max: number | null
          reference_min: number | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          exam_result_id: string
          id?: string
          indicator_name: string
          reference_max?: number | null
          reference_min?: number | null
          unit?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          exam_result_id?: string
          id?: string
          indicator_name?: string
          reference_max?: number | null
          reference_min?: number | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_indicators_exam_result_id_fkey"
            columns: ["exam_result_id"]
            isOneToOne: false
            referencedRelation: "exam_results"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_reminders: {
        Row: {
          created_at: string
          exam_name: string
          id: string
          interval_months: number
          last_exam_date: string
          next_reminder_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_name: string
          id?: string
          interval_months?: number
          last_exam_date: string
          next_reminder_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_name?: string
          id?: string
          interval_months?: number
          last_exam_date?: string
          next_reminder_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          created_at: string
          doctor_crm: string | null
          doctor_name: string | null
          exam_date: string
          exam_name: string
          file_mime: string | null
          file_url: string | null
          id: string
          image_url: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_crm?: string | null
          doctor_name?: string | null
          exam_date: string
          exam_name: string
          file_mime?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_crm?: string | null
          doctor_name?: string | null
          exam_date?: string
          exam_name?: string
          file_mime?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_links: {
        Row: {
          caregiver_user_id: string
          created_at: string
          id: string
          primary_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          caregiver_user_id: string
          created_at?: string
          id?: string
          primary_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          caregiver_user_id?: string
          created_at?: string
          id?: string
          primary_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          added_by_name: string | null
          added_by_user_id: string | null
          color: string
          created_at: string
          custom_frequency_hours: number | null
          deleted_at: string | null
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          name: string
          notes: string | null
          pause_until: string | null
          quantity: number
          start_date: string
          status: string
          stock_current: number | null
          stock_total: number | null
          times: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by_name?: string | null
          added_by_user_id?: string | null
          color: string
          created_at?: string
          custom_frequency_hours?: number | null
          deleted_at?: string | null
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          name: string
          notes?: string | null
          pause_until?: string | null
          quantity?: number
          start_date: string
          status?: string
          stock_current?: number | null
          stock_total?: number | null
          times?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by_name?: string | null
          added_by_user_id?: string | null
          color?: string
          created_at?: string
          custom_frequency_hours?: number | null
          deleted_at?: string | null
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          pause_until?: string | null
          quantity?: number
          start_date?: string
          status?: string
          stock_current?: number | null
          stock_total?: number | null
          times?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          plan_override: string | null
          referred_by: string | null
          signup_city: string | null
          signup_country: string | null
          signup_device: string | null
          signup_ip: string | null
          signup_region: string | null
          updated_at: string
          user_code: string
          user_id: string
          whatsapp_number: string | null
          whatsapp_plan_welcome_sent: string | null
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan_override?: string | null
          referred_by?: string | null
          signup_city?: string | null
          signup_country?: string | null
          signup_device?: string | null
          signup_ip?: string | null
          signup_region?: string | null
          updated_at?: string
          user_code: string
          user_id: string
          whatsapp_number?: string | null
          whatsapp_plan_welcome_sent?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan_override?: string | null
          referred_by?: string | null
          signup_city?: string | null
          signup_country?: string | null
          signup_device?: string | null
          signup_ip?: string | null
          signup_region?: string | null
          updated_at?: string
          user_code?: string
          user_id?: string
          whatsapp_number?: string | null
          whatsapp_plan_welcome_sent?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          coupon_code: string | null
          expires_at: string | null
          granted_at: string
          id: string
          referral_count: number
          reward_type: string
          sent_whatsapp: boolean
          sent_whatsapp_at: string | null
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          referral_count?: number
          reward_type?: string
          sent_whatsapp?: boolean
          sent_whatsapp_at?: string | null
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          referral_count?: number
          reward_type?: string
          sent_whatsapp?: boolean
          sent_whatsapp_at?: string | null
          used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: []
      }
      schedule_events: {
        Row: {
          color: string
          created_at: string
          dosage: string
          id: string
          medication_id: string
          medication_name: string
          notified: boolean
          scheduled_time: string
          taken: boolean
          taken_at: string | null
          too_late_notified: boolean
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          dosage: string
          id?: string
          medication_id: string
          medication_name: string
          notified?: boolean
          scheduled_time: string
          taken?: boolean
          taken_at?: string | null
          too_late_notified?: boolean
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          dosage?: string
          id?: string
          medication_id?: string
          medication_name?: string
          notified?: boolean
          scheduled_time?: string
          taken?: boolean
          taken_at?: string | null
          too_late_notified?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_events_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_caregiver_id_by_code: {
        Args: { p_user_code: string }
        Returns: string
      }
      get_user_id_by_code: { Args: { p_user_code: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "beta"
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
    Enums: {
      app_role: ["admin", "user", "beta"],
    },
  },
} as const
