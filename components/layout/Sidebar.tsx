"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, User, Building2, Shield, FileSearch,
  Landmark, Receipt, AlertTriangle, Scale, BarChart3,
  FlaskConical, Settings, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/borrower-passport", label: "Borrower Passport", icon: User },
  { href: "/lender-pools", label: "Lender Pools", icon: Building2 },
  { href: "/risk-policies", label: "Risk Policies", icon: Shield },
  { href: "/credit-reviews", label: "Credit Reviews", icon: FileSearch },
  { href: "/loan-desk", label: "Loan Desk", icon: Landmark },
  { href: "/repayments", label: "Repayments", icon: Receipt },
  { href: "/defaults", label: "Defaults", icon: AlertTriangle },
  { href: "/appeals", label: "Appeals", icon: Scale },
  { href: "/transparency", label: "Transparency", icon: BarChart3 },
  { href: "/playground", label: "Playground", icon: FlaskConical },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="credit-rail w-56 shrink-0 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-white/8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ background: "#D6A84F" }}>
            <Zap size={13} className="text-black" />
          </div>
          <span className="font-heading font-bold text-[15px] tracking-tight" style={{ color: "#F4EFE6" }}>
            Credence
          </span>
        </Link>
        <p className="text-[10px] mt-1 font-financial" style={{ color: "rgba(244,239,230,0.4)" }}>
          CREDIT ARBITRATION
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-sm text-[13px] font-body transition-colors",
                active
                  ? "text-[#D6A84F] bg-white/6 font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/4"
              )}
            >
              <Icon size={14} strokeWidth={active ? 2.2 : 1.7} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/8">
        <p className="text-[9px] font-financial" style={{ color: "rgba(244,239,230,0.25)" }}>
          POWERED BY GENLAYER
        </p>
      </div>
    </aside>
  );
}
