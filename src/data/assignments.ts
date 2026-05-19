import type { Assignment } from '../types'

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 1,
    title: 'Chapter 7 Problem Set',
    className: 'Algebra II',
    dueDate: 'May 20, 2026',
    submitted: 28,
    total: 32,
    status: 'grading',
  },
  {
    id: 2,
    title: 'Limits & Continuity Quiz',
    className: 'Calculus AP',
    dueDate: 'May 22, 2026',
    submitted: 18,
    total: 28,
    status: 'active',
  },
  {
    id: 3,
    title: 'Triangle Proofs Worksheet',
    className: 'Geometry',
    dueDate: 'May 18, 2026',
    submitted: 30,
    total: 30,
    status: 'closed',
  },
  {
    id: 4,
    title: 'Data Analysis Project',
    className: 'Statistics',
    dueDate: 'May 25, 2026',
    submitted: 12,
    total: 26,
    status: 'active',
  },
]
