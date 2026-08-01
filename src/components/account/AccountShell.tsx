import { Link, useLocation } from "@tanstack/react-router";
import { FileText, LayoutDashboard, Settings } from "lucide-react";
import type { ReactNode } from "react";

const links = [
  { to: "/cont", label: "Prezentare", icon: LayoutDashboard },
  { to: "/cont/rapoarte", label: "Oferte și analize", icon: FileText },
  { to: "/cont/setari", label: "Cont și securitate", icon: Settings },
] as const;

export function AccountShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const location = useLocation();
  return (
    <div className="account-shell">
      <aside className="account-nav" aria-label="Navigare cont">
        <div className="account-nav__brand">Contul tău</div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={active ? "is-active" : undefined}
              >
                <Icon aria-hidden="true" /> <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <p>Rapoartele sunt private și rămân asociate sesiunii sau contului tău.</p>
      </aside>
      <main className="account-main">
        <header className="account-header">
          <div>
            <div className="product-kicker">{eyebrow}</div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {action}
        </header>
        {children}
      </main>
    </div>
  );
}
