import { supabase } from "@/integrations/supabase/client";

export async function uploadStorageFile(bucket: "course-covers" | "lesson-files", file: File, path?: string) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path ? `${path}/${Date.now()}_${safeName}` : `${Date.now()}_${safeName}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return `storage://${bucket}/${data.path}`;
}
