import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-teacher.jpg";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import {
  BookOpen, GraduationCap, MessagesSquare, KeyRound, BarChart3, ShieldCheck,
  Globe, Sparkles, CheckCircle2, Send,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة معلّم — منصتك التعليمية الخاصة كمعلم" },
      {
        name: "description",
        content:
          "أنشئ منصتك التعليمية باسمك ودومينك: كورسات مرنة، امتحانات، إحصائيات، رسائل، أكواد اشتراك، ومساعدين بصلاحيات.",
      },
      { property: "og:title", content: "منصة معلّم — منصتك التعليمية الخاصة" },
      { property: "og:description", content: "كل ما يحتاجه المعلّم لبناء منصته الرقمية بأقل مجهود." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center">
          <BrandLogo className="h-10 w-10" wordmarkClassName="text-xl" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">المزايا</a>
          <a href="#pricing" className="hover:text-foreground">الأسعار</a>
          <a href="#contact" className="hover:text-foreground">تواصل</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-full"><Link to="/login">دخول</Link></Button>
          <Button asChild className="rounded-full"><Link to="/signup">ابدأ الآن</Link></Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div className="space-y-6 text-right">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4" /> منصتك التعليمية بهويتك أنت
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            امتلك <span className="text-primary">منصتك التعليمية</span> الخاصة كمعلم
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            دومين خاص بك، تحكّم كامل في كورساتك ودروسك وامتحاناتك، وإحصائيات دقيقة لكل طالب — كل هذا بلا تعقيد تقني.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="rounded-full text-base shadow-[var(--shadow-soft)]">
              <Link to="/signup">أنشئ حسابك الآن</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full text-base">
              <a href="#pricing">شاهد الأسعار</a>
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
            {["دومين وهوية مستقلة", "بنية كورسات مرنة", "امتحانات وإحصائيات"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /><span>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] blur-3xl" style={{ background: "var(--gradient-primary)", opacity: 0.25 }} />
          <img src={heroImg} alt="معلم يستخدم منصته الرقمية" className="mx-auto w-full max-w-lg rounded-[2rem] shadow-[var(--shadow-glow)]" />
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Globe, title: "منصة مستقلة بهويتك", desc: "دومين خاص بك واسم مستقل — طلابك يدخلون لمنصتك أنت وليس لمنصة عامة." },
  { icon: BookOpen, title: "بنية كورسات مرنة", desc: "قسّم كورسك إلى وحدات ودروس بأسماء حرّة، وأضف فيديوهات وملفات وامتحانات متعددة لكل درس." },
  { icon: GraduationCap, title: "نظام امتحانات كامل", desc: "اختيار من متعدد، صح/خطأ، ترتيب، مطابقة، أسئلة صورية وصوتية — مع تصحيح تلقائي فوري." },
  { icon: BarChart3, title: "إحصائيات تفصيلية", desc: "أداء الطلاب، أصعب الأسئلة، الطلاب في خطر، متوسط الدرجات، ونسبة النجاح — لكل امتحان ولكل طالب." },
  { icon: MessagesSquare, title: "رسائل مباشرة", desc: "تواصل خاص بينك وبين طلابك، مع إعلانات عامة وشريط تنبيهات مهم." },
  { icon: KeyRound, title: "أكواد اشتراك ذكية", desc: "ولّد أكواد ذات صلاحية، أو أضف الطالب مباشرة — الوصول للكورس دائم بعد التفعيل." },
  { icon: ShieldCheck, title: "مساعدون بصلاحيات", desc: "أنشئ حسابات لمساعديك وحدد صلاحياتهم بدقة — دون الوصول لأي بيانات شخصية للطلاب." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold md:text-4xl">كل ما تحتاجه لإدارة منصتك</h2>
        <p className="mt-4 text-muted-foreground">أدوات احترافية مصممة خصيصاً للمعلم العربي.</p>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <article key={title} className="group rounded-2xl border border-border bg-card p-8 text-right transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold">{title}</h3>
            <p className="leading-relaxed text-muted-foreground">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-4xl px-6 pb-12">
      <div className="rounded-3xl border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-3xl font-bold">أسعار بسيطة وواضحة</h2>
        <p className="mt-3 text-muted-foreground">خطط تبدأ من:</p>
        <div className="mt-6 flex items-baseline justify-center gap-2">
          <span className="font-display text-6xl font-bold text-primary">٤٩٩</span>
          <span className="text-xl text-muted-foreground">جنيه مصري / شهرياً</span>
        </div>
        <ul className="mx-auto mt-8 grid max-w-xl gap-3 text-right text-sm">
          {[
            "منصة مستقلة بدومين خاص",
            "عدد غير محدود من الكورسات والدروس",
            "نظام امتحانات كامل مع تصحيح تلقائي",
            "إحصائيات ورسائل ومساعدون",
            "دعم فني مباشر عبر تيليجرام",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /><span>{t}</span>
            </li>
          ))}
        </ul>
        <Button asChild size="lg" className="mt-8 rounded-full"><a href="#contact">تواصل للاشتراك</a></Button>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 pb-24">
      <div className="overflow-hidden rounded-3xl px-8 py-14 text-center text-primary-foreground shadow-[var(--shadow-glow)]" style={{ background: "var(--gradient-primary)" }}>
        <h2 className="font-display text-3xl font-bold md:text-4xl">جاهز لإطلاق منصتك؟</h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
          تواصل معنا مباشرة عبر تيليجرام لتفعيل حسابك وإعداد منصتك.
        </p>
        <a
          href="https://t.me/sayed_1234"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 font-semibold text-primary shadow transition hover:-translate-y-0.5"
        >
          <Send className="h-4 w-4" /> @sayed_1234
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} منصة معلّم. جميع الحقوق محفوظة.</p>
        <div className="flex gap-6">
          <a href="#features" className="hover:text-foreground">المزايا</a>
          <a href="#pricing" className="hover:text-foreground">الأسعار</a>
          <a href="#contact" className="hover:text-foreground">تواصل</a>
        </div>
      </div>
    </footer>
  );
}
