import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, Building2, TrendingUp,
  CheckSquare, Calendar, Package, FileText, Megaphone,
  BarChart2, Settings, Bell, Search, LogOut, ChevronLeft,
  Activity, Zap, Menu, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GlobalSearch from '../GlobalSearch';

const navGroups = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/calendar',  icon: Calendar,        label: 'Calendar' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { to: '/leads',    icon: Zap,         label: 'Leads' },
      { to: '/contacts', icon: UserCheck,   label: 'Contacts' },
      { to: '/accounts', icon: Building2,   label: 'Accounts' },
      { to: '/deals',    icon: TrendingUp,  label: 'Deals' },
    ],
  },
  {
    title: 'Activities',
    items: [
      { to: '/tasks',      icon: CheckSquare, label: 'Tasks' },
      { to: '/activities', icon: Activity,    label: 'Activities' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { to: '/products',  icon: Package,   label: 'Products' },
      { to: '/quotes',    icon: FileText,  label: 'Quotes' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { to: '/reports', icon: BarChart2, label: 'Reports' },
    ],
  },
];

function AvatarInitials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`avatar avatar-${size}`} style={{ background: color, color: '#fff' }}>
      {initials}
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">S</div>
          {!collapsed && <span className="logo-text">SVF CRM</span>}
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="nav-section">
              {!collapsed && <div className="nav-section-title">{group.title}</div>}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  data-tooltip={collapsed ? item.label : undefined}
                >
                  <span className="nav-icon"><item.icon size={17} /></span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar bottom */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            data-tooltip={collapsed ? 'Settings' : undefined}
          >
            <span className="nav-icon"><Settings size={17} /></span>
            {!collapsed && <span>Settings</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#f87171' }}
            data-tooltip={collapsed ? 'Logout' : undefined}
          >
            <span className="nav-icon"><LogOut size={17} /></span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Global Search */}
          <div style={{ flex: 1, maxWidth: 400 }}>
            <div className="search-wrapper" onClick={() => setShowSearch(true)} style={{ cursor: 'pointer' }}>
              <Search size={15} className="search-icon" />
              <input
                readOnly
                className="search-input"
                placeholder="Search leads, contacts, deals..."
                style={{ cursor: 'pointer', width: '100%' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
            <button className="btn btn-ghost btn-icon" aria-label="Notifications">
              <Bell size={18} />
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                className="btn btn-ghost"
                style={{ gap: 8, padding: '4px 8px' }}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <AvatarInitials name={user?.fullName || 'User'} size="sm" />
                {!collapsed && (
                  <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.fullName}
                  </span>
                )}
              </button>
              {showUserMenu && (
                <div className="dropdown" style={{ minWidth: 200 }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.fullName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {user?.membership?.organization?.name}
                    </div>
                  </div>
                  <button className="dropdown-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                    <Settings size={15} /> Settings
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-body">
          <Outlet />
        </main>
      </div>

      {/* Global Search modal */}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
    </div>
  );
}
