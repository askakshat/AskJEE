import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {params?.error
            ? `Error: ${params.error}`
            : 'An unspecified authentication error occurred. Please try again.'}
        </p>
      </div>
      <Button asChild className="w-full">
        <Link href="/auth/login">Back to login</Link>
      </Button>
    </div>
  )
}
