import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/profile-page";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "الصفحة الشخصية للطالب — منصة معلّم" },
      { name: "description", content: "بيانات حساب الطالب على منصة معلّم: الاسم والصف الدراسي ورقم الهاتف." },
      { property: "og:title", content: "الصفحة الشخصية للطالب — منصة معلّم" },
      { property: "og:description", content: "إدارة بيانات حساب الطالب على منصة معلّم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ProfilePage variant="student" />,
});
