import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "./ui";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const TRAINER_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/exercises", label: "Exercises", icon: "🏋️" },
  { to: "/programs", label: "Programs", icon: "📋" },
  { to: "/patients", label: "Patients", icon: "👥" },
  { to: "/messages", label: "Messages", icon: "💬" },
];

const PATIENT_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/programs", label: "My Programs", icon: "🏃" },
  { to: "/assistant", label: "AI Assistant", icon: "🤖" },
  { to: "/progress", label: "Progress", icon: "📈" },
  { to: "/messages", label: "Messages", icon: "💬" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Admin Home", icon: "📊", end: true },
  { to: "/admin/review", label: "Review Queue", icon: "✅" },
  { to: "/admin/announcements", label: "News & Events", icon: "📰" },
  { to: "/admin/users", label: "Users", icon: "🗂️" },
];

function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .listNotifications()
        .then((l) => active && setUnread(l.filter((n) => !n.read_at).length))
        .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);
  return (
    <button className="bell" onClick={() => navigate("/notifications")} title="Notifications">
      🔔{unread > 0 && <span className="count">{unread > 9 ? "9+" : unread}</span>}
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = !!user?.is_admin;
  const baseNav = user?.role === "PATIENT" ? PATIENT_NAV : TRAINER_NAV;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">SK</div>
          <h1>SmartKineto</h1>
        </div>
        {baseNav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
            <span className="ico">{n.icon}</span>
            <span className="label">{n.label}</span>
          </NavLink>
        ))}
        {isAdmin && (
          <>
            <div className="faint" style={{ padding: "16px 13px 6px", letterSpacing: 1 }}>ADMIN</div>
            {ADMIN_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
                <span className="ico">{n.icon}</span>
                <span className="label">{n.label}</span>
              </NavLink>
            ))}
          </>
        )}
        <div className="nav-spacer" />
        <div className="sidebar-foot">
          <div className="nav-link" onClick={logout} style={{ cursor: "pointer" }}>
            <span className="ico">🚪</span>
            <span className="label">Log out</span>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h2>{greeting(user?.full_name)}</h2>
          <div className="topbar-actions">
            <NotificationBell />
            <Avatar name={user?.full_name} size={38} />
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function greeting(name?: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${g}, ${name.split(" ")[0]}` : g;
}
