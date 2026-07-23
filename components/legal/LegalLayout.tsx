import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { colors } from "@/components/theme/ThemeProvider";

/** Shared shell for the static legal/support pages (terms, privacy, help) — these
 *  are public routes (no auth) so Google OAuth review and app-store review can
 *  reach them directly, and the root layout's `overflow-hidden` on <body> (meant
 *  for the app shell) is overridden here since this content needs to scroll. */
export function LegalLayout({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`h-[100dvh] overflow-y-auto ${colors.bgApp}`}>
      <div className="mx-auto max-w-[640px] px-5 py-10 md:py-14">
        <Link
          href="/"
          className={`mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium ${colors.textSecondary} hover:${colors.textPrimary}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to bubbly
        </Link>

        <h1 className={`text-2xl font-semibold tracking-tight md:text-3xl ${colors.textPrimary}`}>{title}</h1>
        {effectiveDate && (
          <p className={`mt-1.5 text-[12px] ${colors.textSecondary}`}>Effective {effectiveDate}</p>
        )}

        <div className={`mt-8 space-y-7 text-[14px] leading-relaxed ${colors.textPrimary}`}>{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      <div className="[&_p]:opacity-90 [&_li]:opacity-90 space-y-2.5">{children}</div>
    </section>
  );
}
