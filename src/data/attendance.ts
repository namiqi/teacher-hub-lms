import { INITIAL_CLASSES } from './classes'
import { INITIAL_STUDENTS } from './students'
import type { AttendanceLedger, AttendanceStatus } from '../types'

function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function todayLabel(): string {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  return `Today (${formatShortDate(iso)})`
}

const COLS = [
  { id: 'col-may-12', dateKey: '2026-05-12', label: 'May 12' },
  { id: 'col-may-14', dateKey: '2026-05-14', label: 'May 14' },
  { id: 'col-may-16', dateKey: '2026-05-16', label: 'May 16' },
  {
    id: 'col-today',
    dateKey: new Date().toISOString().slice(0, 10),
    label: todayLabel(),
  },
]

export function buildInitialLedger(): AttendanceLedger {
  const columns = COLS.map((c) => ({
    id: c.id,
    label: c.label,
    dateKey: c.dateKey,
  }))

  const recordsByClass: AttendanceLedger['recordsByClass'] = {}

  for (const cls of INITIAL_CLASSES) {
    const classRecords: Record<number, Record<string, AttendanceStatus>> = {}
    const enrolled = INITIAL_STUDENTS.filter(
      (s) => s.status === 'active' && s.enrolledClasses.includes(cls.classKey),
    )

    enrolled.forEach((student) => {
      classRecords[student.id] = Object.fromEntries(
        columns.map((col, colIndex) => [
          col.dateKey,
          colIndex % 3 === 0
            ? 'present'
            : colIndex % 3 === 1
              ? 'excused'
              : 'absent',
        ]),
      ) as Record<string, AttendanceStatus>
    })

    recordsByClass[cls.classKey] = classRecords
  }

  return { columns, recordsByClass }
}

/** Fresh workspace: one column (today), no attendance records yet. */
export function buildEmptyLedger(): AttendanceLedger {
  const today = new Date().toISOString().slice(0, 10)
  return {
    columns: [
      {
        id: 'col-today',
        dateKey: today,
        label: todayLabel(),
      },
    ],
    recordsByClass: {},
  }
}
