'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  FileText,
  Smartphone,
  LogOut,
  X,
  Home,
  Building2,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { removeToken } from '@/hooks/use-auth'
import { SubscriptionBanner } from '@/components/subscription-banner'

const SidebarContext = createContext<{
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}>({
  isMobileOpen: false,
  setIsMobileOpen: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Conversas',
    href: '/dashboard/conversations',
    icon: MessageSquare,
    badge: '12',
  },
  {
    title: 'Contatos',
    href: '/dashboard/contacts',
    icon: Users,
  },
  {
    title: 'Canais',
    href: '/dashboard/channels',
    icon: Smartphone,
  },
  {
    title: 'Equipes',
    href: '/dashboard/teams',
    icon: Building2,
  },
  {
    title: 'Relatórios',
    href: '/dashboard/reports',
    icon: BarChart3,
  },
  {
    title: 'Arquivos',
    href: '/dashboard/storage',
    icon: FileText,
  },
  {
    title: 'Auditoria',
    href: '/dashboard/audit',
    icon: Shield,
  },
]

const bottomNavItems: NavItem[] = [
  {
    title: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = () => {
    removeToken()
    router.push('/login')
    router.refresh()
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
    const Icon = item.icon

    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1">{item.title}</span>
        {item.badge && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen }}>
      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-sidebar md:hidden">
            <div className="flex h-16 items-center gap-4 border-b px-4">
              <h2 className="text-lg font-semibold">Omni SaaS</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
                className="ml-auto"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 px-4 py-4">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </nav>
              <Separator className="my-4" />
              <nav className="space-y-1">
                {bottomNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </nav>
            </ScrollArea>
            <div className="border-t p-4">
              <SubscriptionBanner />
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Usuário</p>
                  <p className="text-xs text-muted-foreground truncate">
                    usuario@email.com
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-4 border-b px-4">
          <h2 className="text-lg font-semibold">Omni SaaS</h2>
        </div>
        <ScrollArea className="flex-1 px-4 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
          <Separator className="my-4" />
          <nav className="space-y-1">
            {bottomNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </ScrollArea>
        <div className="border-t p-4">
          <SubscriptionBanner />
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src="" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Usuário</p>
              <p className="text-xs text-muted-foreground truncate">
                usuario@email.com
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
    </SidebarContext.Provider>
  )
}

