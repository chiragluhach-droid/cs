"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";

// Desktop: left sidebar. Mobile: sticky top bar + bottom tab bar.
export default function SideNav({ items, footer, mobileExtra, profileHref, home = "/" }) {
  const path = usePathname();
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };
  const isOn = (href) => href === path || (href !== items[0][0] && path.startsWith(href));
  return (
    <>
      <aside className="side">
        <div className="brand" style={{ padding: "4px 8px 22px" }}><Logo href={home} /></div>
        {items.map(([href, emoji, label, badge]) => (
          <Link key={href} href={href} className={`nav ${isOn(href) ? "on" : ""}`}>
            <span className="em">{emoji}</span>
            <span>{label}</span>
            {badge ? <span className="pill pink" style={{ marginLeft: "auto", padding: "1px 8px", color: "var(--ink)" }}>{badge}</span> : null}
          </Link>
        ))}
        <div className="side-foot">
          {footer}
          {profileHref && (
            <Link href={profileHref} className={`nav ${path === profileHref ? "on" : ""}`}>
              <span className="em">🙋</span><span>profile</span>
            </Link>
          )}
          <button onClick={logout} className="btn ghost sm" style={{ justifyContent: "flex-start" }}>↩ log out</button>
        </div>
      </aside>

      <header className="mtop">
        <Logo href={home} size={26} />
        <div className="row" style={{ gap: 8 }}>
          {mobileExtra}
          {profileHref && (
            <Link href={profileHref} className="icon-btn" aria-label="Profile" style={path === profileHref ? { background: "var(--lime)" } : undefined}>🙋</Link>
          )}
          <button onClick={logout} className="icon-btn" aria-label="Log out">↩</button>
        </div>
      </header>

      <nav className="mtabs" aria-label="Main">
        {items.map(([href, emoji, label, badge]) => (
          <Link key={href} href={href} className={isOn(href) ? "on" : ""} aria-current={isOn(href) ? "page" : undefined}>
            <span className="ic">
              {emoji}
              {badge ? <span className="badge">{badge > 9 ? "9+" : badge}</span> : null}
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
