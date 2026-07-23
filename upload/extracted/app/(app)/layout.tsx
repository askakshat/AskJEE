import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { getCurrentUser, getProfile } from '@/lib/data'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile()

  return (
    <AppShell name={profile?.full_name ?? ''} email={user.email ?? ''}>
      {children}
    </AppShell>
  )
}
