import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Avatar, IconMark } from "./ui";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const TRAINER_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "home", end: true },
  { to: "/exercises", label: "Exercises", icon: "exercises" },
  { to: "/programs", label: "Programs", icon: "programs" },
  { to: "/patients", label: "Patients", icon: "patients" },
  { to: "/messages", label: "Messages", icon: "messages" },
];

const PATIENT_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "home", end: true },
  { to: "/programs", label: "My Programs", icon: "programs" },
  { to: "/assistant", label: "AI Assistant", icon: "assistant" },
  { to: "/progress", label: "Progress", icon: "progress" },
  { to: "/messages", label: "Messages", icon: "messages" },
  { to: "/profile", label: "Profile", icon: "profile" },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Admin Home", icon: "admin", end: true },
  { to: "/admin/review", label: "Review Queue", icon: "review" },
  { to: "/admin/announcements", label: "News & Events", icon: "news" },
  { to: "/admin/users", label: "Users", icon: "patients" },
];

function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .listNotifications()
        .then((items) => active && setUnread(items.filter((item) => !item.read_at).length))
        .catch(() => {});
    load();
    const id = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <button className="bell" onClick={() => navigate("/notifications")} title="Notifications" aria-label="Notifications">
      <IconMark name="bell" />
      {unread > 0 && <span className="count">{unread > 9 ? "9+" : unread}</span>}
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = !!user?.is_admin;
  const baseNav = user?.role === "PATIENT" ? PATIENT_NAV : TRAINER_NAV;
  const roleLabel = user?.role === "PATIENT" ? "Patient" : user?.role === "TRAINER" ? "Trainer" : "Member";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">SK</div>
          <h1>SmartKinetoFit</h1>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-mono)" }}>
          <div style={{ fontSize: 10, color: "var(--text)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {user?.full_name || "—"}
          </div>
          <div style={{ fontSize: 9, color: "var(--faint)", letterSpacing: "0.08em", marginTop: 2, textTransform: "uppercase" }}>{roleLabel}</div>
        </div>
        <div style={{ flex: 1, paddingTop: 4 }}>
          {baseNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
              <span className="ico">
                <IconMark name={item.icon} size="sm" />
              </span>
              <span className="label">{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <div className="nav-section">Admin</div>
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
                  <span className="ico">
                    <IconMark name={item.icon} size="sm" />
                  </span>
                  <span className="label">{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </div>
        <div className="sidebar-foot">
          <button className="nav-link nav-button" onClick={logout} style={{ padding: 0 }}>
            <span className="ico">
              <IconMark name="logout" size="sm" />
            </span>
            <span className="label">Log out</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h2>{greeting(user?.full_name)}</h2>
          <div className="topbar-actions">
            <NotificationBell />
            <Avatar name={user?.full_name || user?.email} size={36} />
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
  const hour = new Date().getHours();
  const label = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${label}, ${name.split(" ")[0]}` : label;
}
