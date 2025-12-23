import { Sidebar } from '@/components/sidebar'
import { GlobalNotificationListener } from '@/components/global-notification-listener'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
      <GlobalNotificationListener />
    </div>
  )
}

