import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Mic, History, FileText, Briefcase, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/interview/new', label: 'New Interview', icon: Mic },
  { to: '/sessions',   label: 'Sessions',         icon: History },
  { to: '/resumes',    label: 'Resumes',           icon: FileText },
  { to: '/jobs',       label: 'Job Descriptions',  icon: Briefcase },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/[0.06] bg-surface-50">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
          <span className="text-sm font-semibold tracking-tight">
            Shadow<span className="text-brand-400">Recruit</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-brand-600/15 text-brand-300 font-medium'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-white/70 truncate">{user?.full_name}</p>
            <p className="text-xs text-white/30 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}