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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          clinic_id: string
          created_at: string
          ends_at: string
          id: string
          patient_id: string
          reason: string | null
          starts_at: string
          status: string
        }
        Insert: {
          clinic_id?: string
          created_at?: string
          ends_at: string
          id?: string
          patient_id: string
          reason?: string | null
          starts_at: string
          status?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          patient_id?: string
          reason?: string | null
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          clinic_id: string
          created_at: string
          full_name: string
          id: string
          phone: string
          preferred: string | null
          status: string
        }
        Insert: {
          clinic_id?: string
          created_at?: string
          full_name: string
          id?: string
          phone: string
          preferred?: string | null
          status?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          preferred?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          address: string | null
          booking_enabled: boolean
          clinic_name: string
          doctor_name: string
          id: string
          matricule: string | null
          owner_id: string
          phone: string | null
          signature_data: string | null
          stamp_data: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          booking_enabled?: boolean
          clinic_name?: string
          doctor_name?: string
          id?: string
          matricule?: string | null
          owner_id: string
          phone?: string | null
          signature_data?: string | null
          stamp_data?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          booking_enabled?: boolean
          clinic_name?: string
          doctor_name?: string
          id?: string
          matricule?: string | null
          owner_id?: string
          phone?: string | null
          signature_data?: string | null
          stamp_data?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          expense_date: string
          id: string
          label: string
        }
        Insert: {
          amount: number
          clinic_id?: string
          created_at?: string
          expense_date?: string
          id?: string
          label: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          expense_date?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          min_quantity: number
          name: string
          quantity: number
          unit: string | null
        }
        Insert: {
          clinic_id?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name: string
          quantity?: number
          unit?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name?: string
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          birth_date: string | null
          clinic_id: string
          cnam_number: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          share_token: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          clinic_id?: string
          cnam_number?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          share_token?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          clinic_id?: string
          cnam_number?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          items: Json
          notes: string | null
          patient_id: string
        }
        Insert: {
          clinic_id?: string
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          patient_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          clinic_id: string
          created_at: string
          details: string | null
          id: string
          patient_id: string
          status: string
          treatment_type: string
        }
        Insert: {
          clinic_id?: string
          created_at?: string
          details?: string | null
          id?: string
          patient_id: string
          status?: string
          treatment_type: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          details?: string | null
          id?: string
          patient_id?: string
          status?: string
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clinic_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          amount_paid: number
          clinic_id: string
          cnam_eligible: boolean
          cost: number
          created_at: string
          details: string | null
          id: string
          medications: string | null
          patient_id: string
          tooth: string | null
          treatment: string
          visit_date: string
        }
        Insert: {
          amount_paid?: number
          clinic_id?: string
          cnam_eligible?: boolean
          cost?: number
          created_at?: string
          details?: string | null
          id?: string
          medications?: string | null
          patient_id: string
          tooth?: string | null
          treatment: string
          visit_date?: string
        }
        Update: {
          amount_paid?: number
          clinic_id?: string
          cnam_eligible?: boolean
          cost?: number
          created_at?: string
          details?: string | null
          id?: string
          medications?: string | null
          patient_id?: string
          tooth?: string | null
          treatment?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clinic_accepts_booking: { Args: { c: string }; Returns: boolean }
      current_clinic: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      public_clinic: {
        Args: { c: string }
        Returns: {
          address: string
          clinic_name: string
          doctor_name: string
          id: string
          phone: string
        }[]
      }
    }
    Enums: {
      app_role: "doctor" | "secretary"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["doctor", "secretary"],
    },
  },
} as const
