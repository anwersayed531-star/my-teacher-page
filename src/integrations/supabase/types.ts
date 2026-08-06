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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string
          grade: string | null
          id: string
          kind: string
          teacher_id: string
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          grade?: string | null
          id?: string
          kind?: string
          teacher_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          grade?: string | null
          id?: string
          kind?: string
          teacher_id?: string
          title?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          grade_level: string
          id: string
          is_paid: boolean
          is_published: boolean
          price: number | null
          students_count: number
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string
          id?: string
          is_paid?: boolean
          is_published?: boolean
          price?: number | null
          students_count?: number
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string
          id?: string
          is_paid?: boolean
          is_published?: boolean
          price?: number | null
          students_count?: number
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          source: string
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          source?: string
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          source?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          answers: Json
          earned: number | null
          exam_id: string
          id: string
          score_pct: number | null
          student_id: string
          submitted_at: string
          time_sec: number | null
          total: number | null
        }
        Insert: {
          answers?: Json
          earned?: number | null
          exam_id: string
          id?: string
          score_pct?: number | null
          student_id: string
          submitted_at?: string
          time_sec?: number | null
          total?: number | null
        }
        Update: {
          answers?: Json
          earned?: number | null
          exam_id?: string
          id?: string
          score_pct?: number | null
          student_id?: string
          submitted_at?: string
          time_sec?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          created_by: string | null
          duration_min: number
          id: string
          is_published: boolean
          lesson_id: string
          passing_pct: number
          questions: Json
          shuffle_answers: boolean
          shuffle_questions: boolean
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          is_published?: boolean
          lesson_id: string
          passing_pct?: number
          questions?: Json
          shuffle_answers?: boolean
          shuffle_questions?: boolean
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          is_published?: boolean
          lesson_id?: string
          passing_pct?: number
          questions?: Json
          shuffle_answers?: boolean
          shuffle_questions?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_files: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string | null
          lesson_id: string
          name: string
          public_url: string | null
          size: number | null
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string | null
          lesson_id: string
          name: string
          public_url?: string | null
          size?: number | null
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string | null
          lesson_id?: string
          name?: string
          public_url?: string | null
          size?: number | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_files_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          id: string
          sort_order: number
          title: string
          unit_id: string
        }
        Insert: {
          id?: string
          sort_order?: number
          title: string
          unit_id: string
        }
        Update: {
          id?: string
          sort_order?: number
          title?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          grade: string | null
          id: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          grade?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          grade?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          grade: string | null
          id: string
          phone: string | null
          student_code: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          grade?: string | null
          id: string
          phone?: string | null
          student_code?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          grade?: string | null
          id?: string
          phone?: string | null
          student_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          target_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_codes: {
        Row: {
          code: string
          course_id: string
          created_at: string
          disabled: boolean
          duration_days: number
          expires_at: string | null
          id: string
          teacher_id: string
          used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          course_id: string
          created_at?: string
          disabled?: boolean
          duration_days?: number
          expires_at?: string | null
          id?: string
          teacher_id: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          course_id?: string
          created_at?: string
          disabled?: boolean
          duration_days?: number
          expires_at?: string | null
          id?: string
          teacher_id?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_codes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_grades: {
        Row: {
          created_at: string
          grade: string
          id: string
          sort_order: number
          teacher_id: string
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          sort_order?: number
          teacher_id: string
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          sort_order?: number
          teacher_id?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          course_id: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      video_comments: {
        Row: {
          author_id: string
          created_at: string
          id: string
          text: string
          timestamp_sec: number | null
          video_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          text: string
          timestamp_sec?: number | null
          video_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          text?: string
          timestamp_sec?: number | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          duration_sec: number | null
          id: string
          lesson_id: string
          sort_order: number
          title: string
          url: string
        }
        Insert: {
          duration_sec?: number | null
          id?: string
          lesson_id: string
          sort_order?: number
          title: string
          url: string
        }
        Update: {
          duration_sec?: number | null
          id?: string
          lesson_id?: string
          sort_order?: number
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_course: { Args: { _course_id: string }; Returns: boolean }
      can_view_lesson: { Args: { _lesson_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_enrolled: { Args: { _course_id: string }; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      my_grade: { Args: never; Returns: string }
      platform_teacher: {
        Args: never
        Returns: {
          full_name: string
          id: string
        }[]
      }
      redeem_code: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      app_role: "teacher" | "student" | "assistant"
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
      app_role: ["teacher", "student", "assistant"],
    },
  },
} as const
