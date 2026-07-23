'use client'

import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_META, STATUS_ORDER, type ChapterStatus } from '@/lib/constants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function StatusPicker({
  value,
  onChange,
  disabled,
}: {
  value: ChapterStatus
  onChange: (status: ChapterStatus) => void
  disabled?: boolean
}) {
  const current = STATUS_META[value]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          className={cn(
            'inline-flex min-w-[140px] items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60',
          )}
        >
          <span className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: current.token }}
            />
            {current.label}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {STATUS_ORDER.map((s) => {
          const meta = STATUS_META[s]
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => onChange(s)}
              className="flex items-start gap-2.5"
            >
              <span
                className="mt-1 size-2 shrink-0 rounded-full"
                style={{ backgroundColor: meta.token }}
              />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-medium">
                  {meta.label}
                  {s === value && <Check className="size-3.5" />}
                </span>
                <span className="text-xs text-muted-foreground">
                  {meta.description}
                </span>
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
