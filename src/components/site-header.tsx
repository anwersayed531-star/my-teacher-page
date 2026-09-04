import { Link } from "@tanstack/react-router";
import { GraduationCap, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GRADES } from "@/lib/grades";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold text-primary">مدرسة</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground md:flex">
          {GRADES.map((g) => (
            <Link
              key={g.slug}
              to="/grades/$grade"
              params={{ grade: g.slug }}
              activeProps={{ className: "text-foreground" }}
              className="hover:text-foreground"
            >
              {g.short}
            </Link>
          ))}
        </nav>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/me">
            <UserRound className="h-4 w-4" /> ملفي
          </Link>
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 py-8 text-center text-sm text-muted-foreground">
      <p>مدرسة — منصة تعليمية لطلاب المرحلة الثانوية. المحتوى كله مجاني ومفتوح.</p>
      <p className="mt-2">
        <Link to="/login" className="hover:text-foreground">دخول الإدارة</Link>
      </p>
    </footer>
  );
}
