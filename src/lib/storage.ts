import { supabase } from "@/integrations/supabase/client";

export async function uploadStorageFile(bucket: "course-covers" | "lesson-files", file: File, path?: string) {
  const filePath = path ? `${path}/${file.name}` : `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl.publicUrl;
}
