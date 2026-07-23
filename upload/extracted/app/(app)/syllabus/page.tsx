import { getChaptersWithProgress } from '@/lib/data'
import { SyllabusBoard } from '@/components/syllabus/syllabus-board'

export const metadata = {
  title: 'Syllabus Tracker — PrepTrack',
}

export default async function SyllabusPage() {
  const chapters = await getChaptersWithProgress()

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          Syllabus Tracker
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Mark each chapter&apos;s status across Class 11 and 12. Completed and
          revision chapters are automatically queued for spaced revision.
        </p>
      </header>
      <SyllabusBoard initialChapters={chapters} />
    </div>
  )
}
