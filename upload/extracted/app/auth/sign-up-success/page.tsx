import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-primary">
        <MailCheck className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You&apos;ve successfully signed up. Please confirm your email address
          to activate your account, then log in to start tracking your
          preparation.
        </p>
      </div>
      <Button asChild variant="outline" className="w-full">
        <Link href="/auth/login">Back to login</Link>
      </Button>
    </div>
  )
}
