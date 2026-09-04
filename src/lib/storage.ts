import { supabase } from "@/integrations/supabase/client";

export type SchoolBucket = "teacher-photos" | "course-covers" | "lesson-files";

/**
 * يرفع ملفًا إلى التخزين ويُرجع مرجعًا بالشكل `bucket/path`.
 * المراجع دي تتحوّل لروابط مؤقتة عند العرض عبر resolveMedia.
 */
export async function uploadStorageFile(bucket: SchoolBucket, file: File, folder?: string) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${folder ? `${folder}/` : ""}${Date.now()}_${safeName}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return `${bucket}/${data.path}`;
}

/** يحوّل مرجع تخزين (bucket/path) إلى رابط قابل للعرض، ويترك الروابط الخارجية كما هي. */
export async function resolveMedia(value: string | null | undefined): Promise<string> {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const [bucket, ...rest] = value.split("/");
  if (!bucket || rest.length === 0) return "";
  const { data } = await supabase.storage.from(bucket).createSignedUrl(rest.join("/"), 60 * 60 * 4);
  return data?.signedUrl ?? "";
}
