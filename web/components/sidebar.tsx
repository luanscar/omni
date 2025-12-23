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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { removeToken } from '@/hooks/use-auth'
import { SubscriptionBanner } from '@/components/subscription-banner'
import { AvatarImageWithStorage } from '@/components/avatar-image'
import { useMe } from '@/lib/api/modules/auth'
import { useUnreadMessagesStore } from '@/lib/store/unread-messages'

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
  const { data: currentUser } = useMe()
  const totalUnreadCount = useUnreadMessagesStore((state) => state.totalUnreadCount)

  const handleLogout = () => {
    removeToken()
    router.push('/login')
    router.refresh()
  }

  // Helper function para verificar se um item está ativo
  const isItemActive = (href: string, currentPath: string | null) => {
    if (!currentPath) return false
    
    // Se for exatamente igual, está ativo
    if (currentPath === href) return true
    
    // Para /dashboard, só ativa se for exatamente /dashboard (não permite sub-rotas)
    if (href === '/dashboard') return false
    
    // Para outras rotas, verifica se o pathname começa com href + '/'
    return currentPath.startsWith(href + '/')
  }

  // Desktop NavLink - apenas ícone com tooltip
  const DesktopNavLink = ({ item }: { item: NavItem }) => {
    const isActive = isItemActive(item.href, pathname)
    const Icon = item.icon
    // Mostrar badge apenas para Conversas se houver mensagens não lidas
    const showBadge = item.href === '/dashboard/conversations' && totalUnreadCount > 0
    const badgeValue = item.href === '/dashboard/conversations' ? totalUnreadCount : item.badge

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              'group relative flex items-center justify-center h-10 w-10 rounded-full transition-all duration-200',
              'hover:bg-sidebar-accent/50',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
            )}
          >
            {/* Ícone com badge */}
            <div className="relative flex items-center justify-center">
              <Icon className="h-5 w-5" />
              {showBadge && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-sm border-2 border-sidebar">
                  {badgeValue && Number(badgeValue) > 99 ? '99+' : badgeValue}
                </span>
              )}
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p>{item.title}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Mobile NavLink - ícone + texto
  const MobileNavLink = ({ item }: { item: NavItem }) => {
    const isActive = isItemActive(item.href, pathname)
    const Icon = item.icon
    // Mostrar badge apenas para Conversas se houver mensagens não lidas
    const showBadge = item.href === '/dashboard/conversations' && totalUnreadCount > 0
    const badgeValue = item.href === '/dashboard/conversations' ? totalUnreadCount : item.badge

    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'group relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'hover:bg-sidebar-accent/50',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
        )}
      >
        {/* Ícone com badge */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <Icon className="h-5 w-5" />
          {showBadge && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-sm border-2 border-sidebar">
              {badgeValue && Number(badgeValue) > 99 ? '99+' : badgeValue}
            </span>
          )}
        </div>
        <span className="flex-1">{item.title}</span>
      </Link>
    )
  }

  return (
    <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen }}>
      <TooltipProvider delayDuration={0}>
        {/* Mobile Sidebar */}
        {isMobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-sidebar md:hidden">
              <div className="flex h-14 items-center gap-4 border-b px-4">
                <h2 className="text-base font-semibold">Omni SaaS</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileOpen(false)}
                  className="ml-auto h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1.5">
                  {navItems.map((item) => (
                    <MobileNavLink key={item.href} item={item} />
                  ))}
                </nav>
                <Separator className="my-4" />
                <nav className="space-y-1.5">
                  {bottomNavItems.map((item) => (
                    <MobileNavLink key={item.href} item={item} />
                  ))}
                </nav>
              </ScrollArea>
              <div className="border-t p-4 space-y-3">
                <SubscriptionBanner />
                <div className="flex items-center gap-3">
                  <AvatarImageWithStorage
                    src={currentUser?.avatarUrl}
                    alt={currentUser?.name || 'Usuário'}
                    fallback={currentUser?.name?.slice(0, 2).toUpperCase() || 'U'}
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{currentUser?.name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentUser?.email || 'usuario@email.com'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleLogout}
                  size="sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden h-screen w-16 flex-col border-r bg-sidebar md:flex">
          <div className="flex h-14 items-center justify-center border-b">
            <div className="h-8 w-8 rounded bg-primary/20" />
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col items-center py-4 px-2 space-y-1.5">
              <nav className="w-full flex flex-col items-center space-y-1.5">
                {navItems.map((item) => (
                  <DesktopNavLink key={item.href} item={item} />
                ))}
              </nav>
              <Separator className="w-8 my-2" />
              <nav className="w-full flex flex-col items-center space-y-1.5">
                {bottomNavItems.map((item) => (
                  <DesktopNavLink key={item.href} item={item} />
                ))}
              </nav>
            </div>
          </ScrollArea>
          <div className="border-t p-3 space-y-3">
            <div className="hidden">
              <SubscriptionBanner />
            </div>
            <div className="flex justify-center">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button className="rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 focus:ring-offset-sidebar">
                    <AvatarImageWithStorage
                      src={currentUser?.avatarUrl}
                      alt={currentUser?.name || 'Usuário'}
                      fallback={currentUser?.name?.slice(0, 2).toUpperCase() || 'U'}
                      className="h-10 w-10"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <div className="space-y-1">
                    <p className="font-medium">{currentUser?.name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">{currentUser?.email || 'usuario@email.com'}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex justify-center">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-10 w-10 rounded-full hover:bg-sidebar-accent/50"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p>Sair</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}
