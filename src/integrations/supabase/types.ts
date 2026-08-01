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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_kind: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_kind?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_kind?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          admin_notify_email: string | null
          business_address: string | null
          business_cui: string | null
          business_email: string | null
          business_name: string | null
          email_from: string | null
          email_reply_to: string | null
          emails_enabled: boolean
          id: number
          price_settings_version: number
          report_price_lei: number
          retention_days: number
          stripe_environment: string
          updated_at: string
        }
        Insert: {
          admin_notify_email?: string | null
          business_address?: string | null
          business_cui?: string | null
          business_email?: string | null
          business_name?: string | null
          email_from?: string | null
          email_reply_to?: string | null
          emails_enabled?: boolean
          id?: number
          price_settings_version?: number
          report_price_lei?: number
          retention_days?: number
          stripe_environment?: string
          updated_at?: string
        }
        Update: {
          admin_notify_email?: string | null
          business_address?: string | null
          business_cui?: string | null
          business_email?: string | null
          business_name?: string | null
          email_from?: string | null
          email_reply_to?: string | null
          emails_enabled?: boolean
          id?: number
          price_settings_version?: number
          report_price_lei?: number
          retention_days?: number
          stripe_environment?: string
          updated_at?: string
        }
        Relationships: []
      }
      calculation_settings: {
        Row: {
          annual_degradation_pct: number
          annual_maintenance_lei: number
          base_system_loss_pct: number
          battery_dod_pct: number
          battery_replacement_year: number
          battery_round_trip_efficiency_pct: number
          created_at: string
          default_export_value_lei_per_kwh: number
          default_import_tariff_lei_per_kwh: number
          discount_rate_pct: number
          electricity_price_escalation_pct: number
          id: string
          inverter_replacement_year: number
          is_active: boolean
          max_daily_cycles: number
          notes: string | null
          panel_area_m2: number
          panel_wattage: number
          tariff_effective_date: string | null
          tariff_source: string | null
          version: number
        }
        Insert: {
          annual_degradation_pct?: number
          annual_maintenance_lei?: number
          base_system_loss_pct?: number
          battery_dod_pct?: number
          battery_replacement_year?: number
          battery_round_trip_efficiency_pct?: number
          created_at?: string
          default_export_value_lei_per_kwh?: number
          default_import_tariff_lei_per_kwh?: number
          discount_rate_pct?: number
          electricity_price_escalation_pct?: number
          id?: string
          inverter_replacement_year?: number
          is_active?: boolean
          max_daily_cycles?: number
          notes?: string | null
          panel_area_m2?: number
          panel_wattage?: number
          tariff_effective_date?: string | null
          tariff_source?: string | null
          version: number
        }
        Update: {
          annual_degradation_pct?: number
          annual_maintenance_lei?: number
          base_system_loss_pct?: number
          battery_dod_pct?: number
          battery_replacement_year?: number
          battery_round_trip_efficiency_pct?: number
          created_at?: string
          default_export_value_lei_per_kwh?: number
          default_import_tariff_lei_per_kwh?: number
          discount_rate_pct?: number
          electricity_price_escalation_pct?: number
          id?: string
          inverter_replacement_year?: number
          is_active?: boolean
          max_daily_cycles?: number
          notes?: string | null
          panel_area_m2?: number
          panel_wattage?: number
          tariff_effective_date?: string | null
          tariff_source?: string | null
          version?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          id: string
          ip_hash: string | null
          message: string
          name: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          id?: string
          ip_hash?: string | null
          message: string
          name: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          id?: string
          ip_hash?: string | null
          message?: string
          name?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      energy_snapshots: {
        Row: {
          fetched_at: string
          id: string
          payload: Json
          source: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          payload: Json
          source?: string
        }
        Update: {
          fetched_at?: string
          id?: string
          payload?: Json
          source?: string
        }
        Relationships: []
      }
      market_benchmark_sources: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          name: string
          notes: string | null
          publisher: string | null
          retrieved_at: string | null
          source_type: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          name: string
          notes?: string | null
          publisher?: string | null
          retrieved_at?: string | null
          source_type?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          name?: string
          notes?: string | null
          publisher?: string | null
          retrieved_at?: string | null
          source_type?: string | null
          url?: string | null
        }
        Relationships: []
      }
      market_offers: {
        Row: {
          ac_dc_protections_included: boolean | null
          battery_nominal_kwh: number | null
          battery_usable_kwh: number | null
          county: string | null
          created_at: string
          equipment: Json | null
          id: string
          installation_included: boolean | null
          is_active: boolean
          is_verified: boolean
          lei_per_kwp: number | null
          notes: string | null
          phase: string | null
          prosumer_docs_included: boolean | null
          retrieved_at: string | null
          roof_type: string | null
          source_id: string | null
          supplier: string | null
          system_kwp: number
          system_type: string | null
          total_price_lei: number
          transport_included: boolean | null
          updated_at: string
          vat_included: boolean | null
        }
        Insert: {
          ac_dc_protections_included?: boolean | null
          battery_nominal_kwh?: number | null
          battery_usable_kwh?: number | null
          county?: string | null
          created_at?: string
          equipment?: Json | null
          id?: string
          installation_included?: boolean | null
          is_active?: boolean
          is_verified?: boolean
          lei_per_kwp?: number | null
          notes?: string | null
          phase?: string | null
          prosumer_docs_included?: boolean | null
          retrieved_at?: string | null
          roof_type?: string | null
          source_id?: string | null
          supplier?: string | null
          system_kwp: number
          system_type?: string | null
          total_price_lei: number
          transport_included?: boolean | null
          updated_at?: string
          vat_included?: boolean | null
        }
        Update: {
          ac_dc_protections_included?: boolean | null
          battery_nominal_kwh?: number | null
          battery_usable_kwh?: number | null
          county?: string | null
          created_at?: string
          equipment?: Json | null
          id?: string
          installation_included?: boolean | null
          is_active?: boolean
          is_verified?: boolean
          lei_per_kwp?: number | null
          notes?: string | null
          phase?: string | null
          prosumer_docs_included?: boolean | null
          retrieved_at?: string | null
          roof_type?: string | null
          source_id?: string | null
          supplier?: string | null
          system_kwp?: number
          system_type?: string | null
          total_price_lei?: number
          transport_included?: boolean | null
          updated_at?: string
          vat_included?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "market_offers_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "market_benchmark_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_analyses: {
        Row: {
          amount_paid_lei: number | null
          benchmark_dataset_version: string | null
          calculation_version: number | null
          category_scores: Json | null
          created_at: string
          free_result: Json | null
          full_report: Json | null
          id: string
          is_paid: boolean
          market_comparison: Json | null
          offer_id: string
          overall_score: number | null
          paid_at: string | null
          recommendation_session_id: string | null
          refunded_at: string | null
          scoring_rules_version: number | null
          status: Database["public"]["Enums"]["analysis_status"]
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid_lei?: number | null
          benchmark_dataset_version?: string | null
          calculation_version?: number | null
          category_scores?: Json | null
          created_at?: string
          free_result?: Json | null
          full_report?: Json | null
          id?: string
          is_paid?: boolean
          market_comparison?: Json | null
          offer_id: string
          overall_score?: number | null
          paid_at?: string | null
          recommendation_session_id?: string | null
          refunded_at?: string | null
          scoring_rules_version?: number | null
          status?: Database["public"]["Enums"]["analysis_status"]
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid_lei?: number | null
          benchmark_dataset_version?: string | null
          calculation_version?: number | null
          category_scores?: Json | null
          created_at?: string
          free_result?: Json | null
          full_report?: Json | null
          id?: string
          is_paid?: boolean
          market_comparison?: Json | null
          offer_id?: string
          overall_score?: number | null
          paid_at?: string | null
          recommendation_session_id?: string | null
          refunded_at?: string | null
          scoring_rules_version?: number | null
          status?: Database["public"]["Enums"]["analysis_status"]
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_analyses_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_analyses_recommendation_session_id_fkey"
            columns: ["recommendation_session_id"]
            isOneToOne: false
            referencedRelation: "recommendation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_extractions: {
        Row: {
          contradictions: Json | null
          created_at: string
          failure_message: string | null
          field_confidence: Json | null
          field_evidence: Json | null
          id: string
          manually_corrected: boolean
          model: string | null
          normalized_result: Json | null
          offer_id: string
          overall_confidence: string | null
          progress_message: string | null
          prompt_version: string | null
          raw_result: Json | null
          status: Database["public"]["Enums"]["extraction_status"]
          token_cost_input: number | null
          token_cost_output: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contradictions?: Json | null
          created_at?: string
          failure_message?: string | null
          field_confidence?: Json | null
          field_evidence?: Json | null
          id?: string
          manually_corrected?: boolean
          model?: string | null
          normalized_result?: Json | null
          offer_id: string
          overall_confidence?: string | null
          progress_message?: string | null
          prompt_version?: string | null
          raw_result?: Json | null
          status?: Database["public"]["Enums"]["extraction_status"]
          token_cost_input?: number | null
          token_cost_output?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contradictions?: Json | null
          created_at?: string
          failure_message?: string | null
          field_confidence?: Json | null
          field_evidence?: Json | null
          id?: string
          manually_corrected?: boolean
          model?: string | null
          normalized_result?: Json | null
          offer_id?: string
          overall_confidence?: string | null
          progress_message?: string | null
          prompt_version?: string | null
          raw_result?: Json | null
          status?: Database["public"]["Enums"]["extraction_status"]
          token_cost_input?: number | null
          token_cost_output?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_extractions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_files: {
        Row: {
          checksum: string | null
          created_at: string
          delete_after: string | null
          file_size_bytes: number
          id: string
          mime_type: string
          offer_id: string
          original_filename: string
          storage_path: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          delete_after?: string | null
          file_size_bytes: number
          id?: string
          mime_type: string
          offer_id: string
          original_filename: string
          storage_path: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          checksum?: string | null
          created_at?: string
          delete_after?: string | null
          file_size_bytes?: number
          id?: string
          mime_type?: string
          offer_id?: string
          original_filename?: string
          storage_path?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_files_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          analysis_status: Database["public"]["Enums"]["analysis_status"] | null
          battery_present: boolean | null
          created_at: string
          currency: string | null
          extraction_status:
            | Database["public"]["Enums"]["extraction_status"]
            | null
          id: string
          manual_inputs: Json | null
          offer_date: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          phase: string | null
          source_method: Database["public"]["Enums"]["offer_source_method"]
          status: Database["public"]["Enums"]["offer_status"]
          supplier_name: string | null
          system_kwp: number | null
          total_price_lei: number | null
          updated_at: string
          user_id: string
          vat_included: boolean | null
        }
        Insert: {
          analysis_status?:
            | Database["public"]["Enums"]["analysis_status"]
            | null
          battery_present?: boolean | null
          created_at?: string
          currency?: string | null
          extraction_status?:
            | Database["public"]["Enums"]["extraction_status"]
            | null
          id?: string
          manual_inputs?: Json | null
          offer_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          phase?: string | null
          source_method: Database["public"]["Enums"]["offer_source_method"]
          status?: Database["public"]["Enums"]["offer_status"]
          supplier_name?: string | null
          system_kwp?: number | null
          total_price_lei?: number | null
          updated_at?: string
          user_id: string
          vat_included?: boolean | null
        }
        Update: {
          analysis_status?:
            | Database["public"]["Enums"]["analysis_status"]
            | null
          battery_present?: boolean | null
          created_at?: string
          currency?: string | null
          extraction_status?:
            | Database["public"]["Enums"]["extraction_status"]
            | null
          id?: string
          manual_inputs?: Json | null
          offer_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          phase?: string | null
          source_method?: Database["public"]["Enums"]["offer_source_method"]
          status?: Database["public"]["Enums"]["offer_status"]
          supplier_name?: string | null
          system_kwp?: number | null
          total_price_lei?: number | null
          updated_at?: string
          user_id?: string
          vat_included?: boolean | null
        }
        Relationships: []
      }
      ownership_transfers: {
        Row: {
          analyses_moved: number
          created_at: string
          extractions_moved: number
          files_moved: number
          from_user_id: string
          id: string
          ip_address: string | null
          offers_moved: number
          payments_moved: number
          reason: string | null
          sessions_moved: number
          status: string
          to_user_id: string
        }
        Insert: {
          analyses_moved?: number
          created_at?: string
          extractions_moved?: number
          files_moved?: number
          from_user_id: string
          id?: string
          ip_address?: string | null
          offers_moved?: number
          payments_moved?: number
          reason?: string | null
          sessions_moved?: number
          status?: string
          to_user_id: string
        }
        Update: {
          analyses_moved?: number
          created_at?: string
          extractions_moved?: number
          files_moved?: number
          from_user_id?: string
          id?: string
          ip_address?: string | null
          offers_moved?: number
          payments_moved?: number
          reason?: string | null
          sessions_moved?: number
          status?: string
          to_user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_expected_lei: number
          amount_paid_lei: number | null
          analysis_id: string
          created_at: string
          currency: string
          expired_at: string | null
          failed_at: string | null
          id: string
          idempotency_key: string | null
          last_error: string | null
          livemode: boolean | null
          paid_at: string | null
          price_settings_version: number | null
          refund_amount_lei: number | null
          refunded_at: string | null
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_expected_lei: number
          amount_paid_lei?: number | null
          analysis_id: string
          created_at?: string
          currency?: string
          expired_at?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          livemode?: boolean | null
          paid_at?: string | null
          price_settings_version?: number | null
          refund_amount_lei?: number | null
          refunded_at?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_expected_lei?: number
          amount_paid_lei?: number | null
          analysis_id?: string
          created_at?: string
          currency?: string
          expired_at?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          livemode?: boolean | null
          paid_at?: string | null
          price_settings_version?: number | null
          refund_amount_lei?: number | null
          refunded_at?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "offer_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          deletion_requested_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_anonymous: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          deletion_requested_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_anonymous?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          deletion_requested_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_anonymous?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pvgis_cache: {
        Row: {
          annual_kwh: number
          aspect: number
          cache_key: string
          fetched_at: string
          id: string
          kwp: number
          lat: number
          lng: number
          loss: number
          monthly_kwh: Json
          source: string
          tilt: number
        }
        Insert: {
          annual_kwh: number
          aspect: number
          cache_key: string
          fetched_at?: string
          id?: string
          kwp: number
          lat: number
          lng: number
          loss: number
          monthly_kwh: Json
          source?: string
          tilt: number
        }
        Update: {
          annual_kwh?: number
          aspect?: number
          cache_key?: string
          fetched_at?: string
          id?: string
          kwp?: number
          lat?: number
          lng?: number
          loss?: number
          monthly_kwh?: Json
          source?: string
          tilt?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket_start: string
          count: number
          endpoint: string
          id: string
          user_id: string | null
        }
        Insert: {
          bucket_start: string
          count?: number
          endpoint: string
          id?: string
          user_id?: string | null
        }
        Update: {
          bucket_start?: string
          count?: number
          endpoint?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recommendation_sessions: {
        Row: {
          annual_consumption_kwh: number | null
          assumptions_version: number | null
          calculation_version: number | null
          created_at: string
          id: string
          inputs: Json
          monthly_consumption_kwh: Json | null
          resolved_lat: number | null
          resolved_lng: number | null
          scenarios: Json | null
          selected_scenario_id: string | null
          status: Database["public"]["Enums"]["recommendation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_consumption_kwh?: number | null
          assumptions_version?: number | null
          calculation_version?: number | null
          created_at?: string
          id?: string
          inputs?: Json
          monthly_consumption_kwh?: Json | null
          resolved_lat?: number | null
          resolved_lng?: number | null
          scenarios?: Json | null
          selected_scenario_id?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_consumption_kwh?: number | null
          assumptions_version?: number | null
          calculation_version?: number | null
          created_at?: string
          id?: string
          inputs?: Json
          monthly_consumption_kwh?: Json | null
          resolved_lat?: number | null
          resolved_lng?: number | null
          scenarios?: Json | null
          selected_scenario_id?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          thresholds: Json
          version: number
          weights: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          thresholds?: Json
          version: number
          weights: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          thresholds?: Json
          version?: number
          weights?: Json
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          event_type: string
          id: string
          livemode: boolean
          payment_id: string | null
          processed_at: string | null
          received_at: string
          safe_error: string | null
          status: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          livemode: boolean
          payment_id?: string | null
          processed_at?: string | null
          received_at?: string
          safe_error?: string | null
          status?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          livemode?: boolean
          payment_id?: string | null
          processed_at?: string | null
          received_at?: string
          safe_error?: string | null
          status?: string
          stripe_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      consume_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_per_minute: number
          p_user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      transfer_ownership: {
        Args: { dest_user_id: string; source_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      analysis_status: "pending" | "ready" | "failed"
      app_role: "user" | "admin"
      extraction_status: "pending" | "success" | "partial" | "failed"
      offer_source_method: "upload" | "manual"
      offer_status:
        | "draft"
        | "uploaded"
        | "extracting"
        | "needs_review"
        | "analyzing"
        | "analyzed"
        | "paid"
        | "failed"
      payment_status:
        | "pending"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "refunded"
      recommendation_status: "draft" | "complete"
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
      analysis_status: ["pending", "ready", "failed"],
      app_role: ["user", "admin"],
      extraction_status: ["pending", "success", "partial", "failed"],
      offer_source_method: ["upload", "manual"],
      offer_status: [
        "draft",
        "uploaded",
        "extracting",
        "needs_review",
        "analyzing",
        "analyzed",
        "paid",
        "failed",
      ],
      payment_status: [
        "pending",
        "succeeded",
        "failed",
        "cancelled",
        "refunded",
      ],
      recommendation_status: ["draft", "complete"],
    },
  },
} as const
