import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Bell,
  Shield,
  Music,
  ListMusic,
  PartyPopper,
  ClipboardList,
  UserCog,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  name: string
  /** Short label for the bottom tab bar */
  short?: string
  href: string
  icon: LucideIcon
  badge?: boolean
}

export const mainNavigation: NavItem[] = [
  { name: 'Mi Panel', short: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tabla Semanal', short: 'Semana', href: '/dashboard/weekly-schedule', icon: ListMusic },
  { name: 'Repertorio', short: 'Repertorio', href: '/dashboard/songs', icon: Music },
  { name: 'Eventos', short: 'Eventos', href: '/dashboard/special-events', icon: PartyPopper },
  { name: 'Mi Calendario', short: 'Calendario', href: '/dashboard/events', icon: Calendar },
  { name: 'Equipo', href: '/dashboard/users', icon: Users },
  { name: 'Avisos', short: 'Avisos', href: '/dashboard/notifications', icon: Bell, badge: true },
  { name: 'Mi Perfil', href: '/dashboard/profile', icon: Settings },
]

export const adminNavigation: NavItem[] = [
  { name: 'Panel Admin', href: '/admin', icon: Shield },
  { name: 'Eventos', href: '/admin/events', icon: Calendar },
  { name: 'Asignaciones', href: '/admin/assignments', icon: ClipboardList },
  { name: 'Usuarios', href: '/admin/users', icon: UserCog },
]

/** Tabs shown in the phone bottom bar; everything else lives under "Más" */
export const bottomTabHrefs = [
  '/dashboard',
  '/dashboard/weekly-schedule',
  '/dashboard/songs',
  '/dashboard/notifications',
]

// An event's detail lives at /dashboard/events/[id] (notifications link there) but belongs to "Eventos"
const eventDetail = /^\/dashboard\/events\/[^/]+$/

export function isNavActive(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/admin') return pathname === href
  if (eventDetail.test(pathname)) return href === '/dashboard/special-events'
  return pathname === href || pathname.startsWith(`${href}/`)
}

const titleOverrides: { match: RegExp; title: string }[] = [
  { match: /^\/admin\/events\/new$/, title: 'Nuevo Evento' },
  { match: /^\/admin\/events\/[^/]+$/, title: 'Editar Evento' },
  { match: /^\/dashboard\/events\/[^/]+$/, title: 'Evento especial' },
  { match: /^\/dashboard\/special-events\/new$/, title: 'Nuevo Evento' },
  { match: /^\/dashboard\/special-events\/[^/]+\/edit$/, title: 'Editar Evento' },
]

/** Title for the compact phone header */
export function getRouteTitle(pathname: string) {
  const override = titleOverrides.find((o) => o.match.test(pathname))
  if (override) return override.title
  const all = [...mainNavigation, ...adminNavigation]
  const exact = all.find((i) => i.href === pathname)
  if (exact) return exact.name
  const prefix = all
    .filter((i) => pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return prefix?.name ?? 'Alabanza IBG'
}
