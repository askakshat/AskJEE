import type { ReactNode } from 'react'
import { GraduationCap, Target, CalendarClock, LineChart } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">PrepTrack</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <div className="relative hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="text-sm font-medium opacity-80">
          Your JEE journey, organized.
        </div>
        <div className="space-y-8">
          <h2 className="text-pretty text-3xl font-bold leading-tight">
            Master every chapter of Class 11 &amp; 12 with a system built for
            rank-hungry aspirants.
          </h2>
          <ul className="space-y-5">
            <Feature
              icon={<Target className="size-5" />}
              title="Track every chapter"
              body="Mark chapters completed, in progress, revision, or backlog across Physics, Chemistry & Maths."
            />
            <Feature
              icon={<CalendarClock className="size-5" />}
              title="Smart revision reminders"
              body="Get emails at the perfect spaced-repetition intervals so nothing slips through the cracks."
            />
            <Feature
              icon={<LineChart className="size-5" />}
              title="Analyze every test"
              body="Log mock scores, ranks and subject-wise breakdowns to see exactly where to improve."
            />
          </ul>
        </div>
        <div className="text-sm opacity-70">
          Consistency beats intensity. Show up every day.
        </div>
      </div>
    </div>
  )
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: ReactNode
  title: string
  body: string
}) {
  return (
    <li className="flex gap-4">
      <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm leading-relaxed opacity-80">{body}</p>
      </div>
    </li>
  )
}
