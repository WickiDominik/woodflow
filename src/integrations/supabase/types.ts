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
      element_status_verlauf: {
        Row: {
          element_id: string
          geaendert_am: string
          geaendert_von: string | null
          id: number
          status: Database["public"]["Enums"]["element_status"]
        }
        Insert: {
          element_id: string
          geaendert_am?: string
          geaendert_von?: string | null
          id?: never
          status: Database["public"]["Enums"]["element_status"]
        }
        Update: {
          element_id?: string
          geaendert_am?: string
          geaendert_von?: string | null
          id?: never
          status?: Database["public"]["Enums"]["element_status"]
        }
        Relationships: [
          {
            foreignKeyName: "element_status_verlauf_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "elemente"
            referencedColumns: ["id"]
          },
        ]
      }
      elemente: {
        Row: {
          baugruppe: string
          bauuntergruppe: string
          breite_mm: number | null
          cadwork_guid: string | null
          geschoss: string | null
          hoehe_mm: number | null
          id: string
          laenge_mm: number | null
          projekt_id: string
          quelle: string
          status: Database["public"]["Enums"]["element_status"]
          typ: string | null
          updated_at: string
        }
        Insert: {
          baugruppe: string
          bauuntergruppe: string
          breite_mm?: number | null
          cadwork_guid?: string | null
          geschoss?: string | null
          hoehe_mm?: number | null
          id?: string
          laenge_mm?: number | null
          projekt_id: string
          quelle?: string
          status?: Database["public"]["Enums"]["element_status"]
          typ?: string | null
          updated_at?: string
        }
        Update: {
          baugruppe?: string
          bauuntergruppe?: string
          breite_mm?: number | null
          cadwork_guid?: string | null
          geschoss?: string | null
          hoehe_mm?: number | null
          id?: string
          laenge_mm?: number | null
          projekt_id?: string
          quelle?: string
          status?: Database["public"]["Enums"]["element_status"]
          typ?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elemente_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekte"
            referencedColumns: ["id"]
          },
        ]
      }
      meilensteine: {
        Row: {
          bemerkung: string | null
          erledigt_am: string | null
          erledigt_von: string | null
          id: string
          projekt_id: string
          soll_datum: string | null
          typ: Database["public"]["Enums"]["meilenstein_typ"]
        }
        Insert: {
          bemerkung?: string | null
          erledigt_am?: string | null
          erledigt_von?: string | null
          id?: string
          projekt_id: string
          soll_datum?: string | null
          typ: Database["public"]["Enums"]["meilenstein_typ"]
        }
        Update: {
          bemerkung?: string | null
          erledigt_am?: string | null
          erledigt_von?: string | null
          id?: string
          projekt_id?: string
          soll_datum?: string | null
          typ?: Database["public"]["Enums"]["meilenstein_typ"]
        }
        Relationships: [
          {
            foreignKeyName: "meilensteine_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekte"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      projekte: {
        Row: {
          beschreibung: string | null
          created_at: string
          id: string
          name: string
          nextcloud_pfad: string | null
          nummer: string
          ort: string | null
          produktionsstart: string | null
          status: Database["public"]["Enums"]["status_ampel"]
          timbar_url: string | null
          updated_at: string
          windream_pfad: string | null
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string
          id?: string
          name: string
          nextcloud_pfad?: string | null
          nummer: string
          ort?: string | null
          produktionsstart?: string | null
          status?: Database["public"]["Enums"]["status_ampel"]
          timbar_url?: string | null
          updated_at?: string
          windream_pfad?: string | null
        }
        Update: {
          beschreibung?: string | null
          created_at?: string
          id?: string
          name?: string
          nextcloud_pfad?: string | null
          nummer?: string
          ort?: string | null
          produktionsstart?: string | null
          status?: Database["public"]["Enums"]["status_ampel"]
          timbar_url?: string | null
          updated_at?: string
          windream_pfad?: string | null
        }
        Relationships: []
      }
      qm_punkte: {
        Row: {
          bereich: Database["public"]["Enums"]["bereich"]
          beschreibung: string
          created_at: string
          datum: string
          element_id: string | null
          erstellt_von: string | null
          id: string
          prioritaet: Database["public"]["Enums"]["qm_prioritaet"]
          projekt_id: string
          status: Database["public"]["Enums"]["qm_status"]
        }
        Insert: {
          bereich: Database["public"]["Enums"]["bereich"]
          beschreibung: string
          created_at?: string
          datum?: string
          element_id?: string | null
          erstellt_von?: string | null
          id?: string
          prioritaet?: Database["public"]["Enums"]["qm_prioritaet"]
          projekt_id: string
          status?: Database["public"]["Enums"]["qm_status"]
        }
        Update: {
          bereich?: Database["public"]["Enums"]["bereich"]
          beschreibung?: string
          created_at?: string
          datum?: string
          element_id?: string | null
          erstellt_von?: string | null
          id?: string
          prioritaet?: Database["public"]["Enums"]["qm_prioritaet"]
          projekt_id?: string
          status?: Database["public"]["Enums"]["qm_status"]
        }
        Relationships: [
          {
            foreignKeyName: "qm_punkte_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "elemente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qm_punkte_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekte"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rollen: {
        Row: {
          id: string
          rolle: Database["public"]["Enums"]["app_rolle"]
          user_id: string
        }
        Insert: {
          id?: string
          rolle: Database["public"]["Enums"]["app_rolle"]
          user_id: string
        }
        Update: {
          id?: string
          rolle?: Database["public"]["Enums"]["app_rolle"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_rolle: {
        Args: {
          _rollen: Database["public"]["Enums"]["app_rolle"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_rolle: {
        Args: {
          _rolle: Database["public"]["Enums"]["app_rolle"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_rolle: "admin" | "projektleitung" | "avor" | "produktion" | "montage"
      bereich: "AVOR" | "Produktion" | "Montage" | "Fertigstellung"
      element_status:
        | "geplant"
        | "freigegeben"
        | "abbund"
        | "zusammenbau"
        | "weinmann"
        | "verladen"
        | "montiert"
        | "abgenommen"
      meilenstein_typ:
        | "bta"
        | "details"
        | "kontrollplaene"
        | "ausfuehrungsplaene"
        | "material_bestellt"
        | "planung_abgeschlossen"
        | "produktionsstart"
        | "aufrichte"
        | "abnahme"
      qm_prioritaet: "Hoch" | "Mittel" | "Niedrig"
      qm_status: "Offen" | "In Bearbeitung" | "Freigegeben"
      status_ampel: "green" | "yellow" | "red"
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
      app_rolle: ["admin", "projektleitung", "avor", "produktion", "montage"],
      bereich: ["AVOR", "Produktion", "Montage", "Fertigstellung"],
      element_status: [
        "geplant",
        "freigegeben",
        "abbund",
        "zusammenbau",
        "weinmann",
        "verladen",
        "montiert",
        "abgenommen",
      ],
      meilenstein_typ: [
        "bta",
        "details",
        "kontrollplaene",
        "ausfuehrungsplaene",
        "material_bestellt",
        "planung_abgeschlossen",
        "produktionsstart",
        "aufrichte",
        "abnahme",
      ],
      qm_prioritaet: ["Hoch", "Mittel", "Niedrig"],
      qm_status: ["Offen", "In Bearbeitung", "Freigegeben"],
      status_ampel: ["green", "yellow", "red"],
    },
  },
} as const
