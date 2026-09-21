import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-50">{children}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles: Record<string, string> = {
    primary: "bg-amber-500 text-slate-950 hover:bg-amber-400",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700",
    danger: "bg-red-700 text-white hover:bg-red-600",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800",
  };
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-amber-500 text-slate-950 hover:bg-amber-400",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700",
    danger: "bg-red-700 text-white hover:bg-red-600",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800",
  };
  return (
    <Link
      href={href}
      className={`inline-block rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ""}`} rows={props.rows ?? 3} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "amber" | "green" | "red" }) {
  const tones: Record<string, string> = {
    default: "bg-slate-800 text-slate-300",
    amber: "bg-amber-500/20 text-amber-400",
    green: "bg-emerald-500/20 text-emerald-400",
    red: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function CheckboxList({
  name,
  options,
  selected,
}: {
  name: string;
  options: { id: string; label: string }[];
  selected: string[];
}) {
  if (options.length === 0) {
    return <p className="text-sm italic text-slate-500">None created yet.</p>;
  }
  return (
    <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-slate-800 p-2">
      {options.map((opt) => (
        <label key={opt.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-800">
          <input
            type="checkbox"
            name={name}
            value={opt.id}
            defaultChecked={selected.includes(opt.id)}
            className="accent-amber-500"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export function StatGrid({
  stats,
  values,
}: {
  stats: readonly string[];
  values: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {stats.map((s) => (
        <label key={s} className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">{s}</span>
          <input
            type="number"
            name={`stat_${s}`}
            defaultValue={values[s] ?? 0}
            className={`${inputCls} px-2 py-1`}
          />
        </label>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{children}</p>;
}
