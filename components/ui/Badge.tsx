import type { ProjectStatus } from '@/content/projects'

const tone: Record<ProjectStatus, string> = {
  live: 'border-accent-fg text-accent-fg',
  'in-qa': 'border-fg text-fg',
  'in-development': 'border-fg-muted text-fg-muted',
  'in-design': 'border-fg-muted text-fg-muted',
  planned: 'border-fg-muted text-fg-muted',
  completed: 'border-fg text-fg',
}

/** Status badge (DESIGN §5): mono, uppercase, pill, text not colour alone. */
export function StatusBadge({ status, label }: { status: ProjectStatus; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-3 py-1.5 font-mono text-label-sm uppercase ${tone[status]}`}
    >
      {label}
    </span>
  )
}
