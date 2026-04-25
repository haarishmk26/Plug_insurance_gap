import Link from "next/link";
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Plus,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients/new", label: "New client", icon: Plus },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Rova
            </p>
            <p className="text-base font-semibold">Broker portal</p>
          </div>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="size-4 text-emerald-700" aria-hidden="true" />
            District Cover
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <ClipboardList className="size-3" aria-hidden="true" />
              ACORD
            </span>
            <span className="flex items-center gap-1">
              <FileText className="size-3" aria-hidden="true" />
              PDF
            </span>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <span className="font-semibold">Rova</span>
            </Link>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-slate-500">
                Insurance readiness workspace
              </p>
            </div>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus className="size-4" aria-hidden="true" />
              New client
            </Link>
          </div>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
