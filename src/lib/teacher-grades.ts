import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TeacherGrade {
  id: string;
  grade: string;
  sort_order: number;
}

/** الصفوف التي يدرّسها المعلّم — متاحة للقراءة للزوار (صفحة إنشاء حساب الطالب). */
export function useTeacherGrades() {
  const [grades, setGrades] = useState<TeacherGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("teacher_grades")
      .select("id, grade, sort_order")
      .order("sort_order", { ascending: true });
    if (error) setError(error.message);
    setGrades(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addGrade = useCallback(
    async (grade: string) => {
      const { data: auth } = await supabase.auth.getUser();
      const teacherId = auth.user?.id;
      if (!teacherId) return { error: "لازم تسجّل دخول الأول." };
      const { error } = await supabase
        .from("teacher_grades")
        .insert({ teacher_id: teacherId, grade, sort_order: grades.length });
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [grades.length, refresh],
  );

  const removeGrade = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("teacher_grades").delete().eq("id", id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh],
  );

  return { grades, gradeNames: grades.map((g) => g.grade), loading, error, refresh, addGrade, removeGrade };
}
