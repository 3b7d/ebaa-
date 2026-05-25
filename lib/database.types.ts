export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "sales_employee" | "branch_supervisor" | "general_manager" | "admin";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: AppRole;
          branch_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role: AppRole;
          branch_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          role?: AppRole;
          branch_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          name: string;
          city: string;
          region: string | null;
          manager_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          region?: string | null;
          manager_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          region?: string | null;
          manager_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interest_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_sources: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          secondary_phone: string | null;
          city: string | null;
          district: string | null;
          email: string | null;
          source_id: string | null;
          assigned_employee_id: string | null;
          branch_id: string | null;
          current_status: string;
          purchase_probability: string | null;
          general_notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          secondary_phone?: string | null;
          city?: string | null;
          district?: string | null;
          email?: string | null;
          source_id?: string | null;
          assigned_employee_id?: string | null;
          branch_id?: string | null;
          current_status?: string;
          purchase_probability?: string | null;
          general_notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          secondary_phone?: string | null;
          city?: string | null;
          district?: string | null;
          email?: string | null;
          source_id?: string | null;
          assigned_employee_id?: string | null;
          branch_id?: string | null;
          current_status?: string;
          purchase_probability?: string | null;
          general_notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          id: string;
          customer_id: string;
          branch_id: string;
          sales_employee_id: string;
          visit_datetime: string;
          visit_type: string;
          interest_category_id: string | null;
          requested_product: string | null;
          budget_range: string | null;
          has_measurements: boolean;
          needs_second_visit: boolean;
          customer_status: string;
          purchase_probability: string | null;
          next_follow_up_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          branch_id: string;
          sales_employee_id: string;
          visit_datetime?: string;
          visit_type: string;
          interest_category_id?: string | null;
          requested_product?: string | null;
          budget_range?: string | null;
          has_measurements?: boolean;
          needs_second_visit?: boolean;
          customer_status?: string;
          purchase_probability?: string | null;
          next_follow_up_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          branch_id?: string;
          sales_employee_id?: string;
          visit_datetime?: string;
          visit_type?: string;
          interest_category_id?: string | null;
          requested_product?: string | null;
          budget_range?: string | null;
          has_measurements?: boolean;
          needs_second_visit?: boolean;
          customer_status?: string;
          purchase_probability?: string | null;
          next_follow_up_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      follow_ups: {
        Row: {
          id: string;
          customer_id: string;
          visit_id: string | null;
          assigned_employee_id: string;
          follow_up_type: string;
          scheduled_at: string;
          completed_at: string | null;
          result: string | null;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          visit_id?: string | null;
          assigned_employee_id: string;
          follow_up_type: string;
          scheduled_at: string;
          completed_at?: string | null;
          result?: string | null;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          visit_id?: string | null;
          assigned_employee_id?: string;
          follow_up_type?: string;
          scheduled_at?: string;
          completed_at?: string | null;
          result?: string | null;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          old_value: Json | null;
          new_value: Json | null;
          performed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          action: string;
          old_value?: Json | null;
          new_value?: Json | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          old_value?: Json | null;
          new_value?: Json | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          related_entity_type: string | null;
          related_entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read?: boolean;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      import_batches: {
        Row: {
          id: string;
          file_name: string;
          imported_by: string | null;
          total_rows: number;
          success_rows: number;
          failed_rows: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          imported_by?: string | null;
          total_rows?: number;
          success_rows?: number;
          failed_rows?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          file_name?: string;
          imported_by?: string | null;
          total_rows?: number;
          success_rows?: number;
          failed_rows?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: AppRole | null;
      };
      get_current_user_branch_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_manager: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_branch_supervisor: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_sales_employee: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Branch = Database["public"]["Tables"]["branches"]["Row"];
export type InterestCategory = Database["public"]["Tables"]["interest_categories"]["Row"];
export type LeadSource = Database["public"]["Tables"]["lead_sources"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Visit = Database["public"]["Tables"]["visits"]["Row"];
export type FollowUp = Database["public"]["Tables"]["follow_ups"]["Row"];
