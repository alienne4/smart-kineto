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
  { to: "/messages", label: "Messages", icon: "messages" }
];

const PATIENT_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "home", end: true },
  { to: "/programs", label: "My Programs", icon: "programs" },
  { to: "/assistant", label: "AI Assistant", icon: "assistant" },
  { to: "/progress", label: "Progress", icon: "progress" },
  { to: "/messages", label: "Messages", icon: "messages" },
  { to: "/profile", label: "Profile", icon: "profile" }
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Admin Home", icon: "admin", end: true },
  { to: "/admin/review", label: "Review Queue", icon: "review" },
  { to: "/admin/announcements", label: "News & Events", icon: "news" },
  { to: "/admin/users", label: "Users", icon: "patients" }
];

function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .listNotifications()
        .then((items) => {
          if (active) setUnread(items.filter((item) => !item.read_at).length);
        })
        .catch(() => {});

    load();
    const id = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <button className="bell" onClick={() => navigate("/notifications")} aria-label="Notifications">
      <IconMark name="bell" />
      {unread > 0 ? <span className="count">{unread > 9 ? "9+" : unread}</span> : null}
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const baseNav = user?.role === "PATIENT" ? PATIENT_NAV : TRAINER_NAV;
  const isAdmin = !!user?.is_admin;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">SK</div>
          <h1>SmartKineto</h1>
        </div>

        {baseNav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
            <span className="ico">
              <IconMark name={item.icon} />
            </span>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}

        {isAdmin ? (
          <>
            <div className="faint" style={{ padding: "16px 13px 6px", fontWeight: 900, letterSpacing: 1 }}>
              ADMIN
            </div>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
                <span className="ico">
                  <IconMark name={item.icon} />
                </span>
                <span className="label">{item.label}</span>
              </NavLink>
            ))}
          </>
        ) : null}

        <div className="nav-spacer" />
        <div className="sidebar-foot">
          <button className="nav-link" onClick={logout} style={{ width: "100%", border: 0, background: "transparent" }}>
            <span className="ico">
              <IconMark name="logout" />
            </span>
            <span className="label">Log out</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <h2>{greeting(user?.full_name)}</h2>
          <div className="topbar-actions">
            <NotificationBell />
            <Avatar name={user?.full_name || user?.email} size={38} />
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function greeting(name?: string) {
  const hour = new Date().getHours();
  const label = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${label}, ${name.split(" ")[0]}` : label;
}
