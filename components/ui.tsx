import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "cyan" | "secondary" | "ghost" | "danger";

const buttonBase =
  "label-caps inline-flex items-center justify-center gap-2 rounded-full transition active:scale-[0.98] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-[var(--brand-violet)] text-white hover:bg-[var(--brand-purple)]",
  cyan: "bg-[var(--brand-cyan)] text-[var(--brand-purple-deep)] hover:brightness-95",
  secondary:
    "bg-[var(--brand-purple-soft)] text-[var(--brand-purple-deep)] hover:brightness-95",
  ghost:
    "border-2 border-[var(--line)] bg-white text-[var(--brand-purple)] hover:border-[var(--brand-violet)]",
  danger: "bg-[var(--danger)] text-white hover:brightness-110",
};

const buttonSizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-base",
  lg: "px-7 py-4 text-lg",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: keyof typeof buttonSizes = "md",
) {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`;
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: keyof typeof buttonSizes;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className}`}>
      {children}
    </Link>
  );
}

export function Pill({
  children,
  color,
  className = "",
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`label-caps inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${className}`}
      style={
        color
          ? { background: `${color}1a`, color }
          : { background: "var(--brand-purple-soft)", color: "var(--brand-purple-deep)" }
      }
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function ProgressBar({
  pct,
  onDark = false,
}: {
  pct: number;
  onDark?: boolean;
}) {
  return (
    <div
      className={`h-3 w-full overflow-hidden rounded-full ${
        onDark ? "bg-white/20" : "bg-[var(--brand-purple-soft)]"
      }`}
    >
      <div
        className="h-full rounded-full bg-[var(--brand-cyan)] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export function Kicker({
  children,
  onDark = false,
}: {
  children: ReactNode;
  onDark?: boolean;
}) {
  return (
    <span className={`kicker ${onDark ? "kicker-on-dark" : ""}`}>{children}</span>
  );
}

export function SectionTitle({
  children,
  right,
  kicker,
}: {
  children: ReactNode;
  right?: ReactNode;
  kicker?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {kicker && <Kicker>{kicker}</Kicker>}
        <h2 className="mt-1 font-display text-xl font-extrabold text-[var(--brand-purple-deep)]">
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}
