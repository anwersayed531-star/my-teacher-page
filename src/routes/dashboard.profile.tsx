import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/profile-page";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({
    meta: [
      { title: "الصفحة الشخصية للمعلّم — منصة معلّم" },
      { name: "description", content: "بيانات حساب المعلّم على منصة معلّم: الاسم ورقم الهاتف والنبذة والصلاحية." },
      { property: "og:title", content: "الصفحة الشخصية للمعلّم — منصة معلّم" },
      { property: "og:description", content: "إدارة بيانات حساب المعلّم على منصة معلّم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ProfilePage variant="teacher" />,
});
