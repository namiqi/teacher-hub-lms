import type { Assignment } from '../types'

/** Demo assignments — published samples for seed classes */
export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'assign-demo-1',
    classKey: 'math_201',
    title: 'Chapter 7 Problem Set',
    description:
      'Complete problems 1–20 from the textbook. Show all work for full credit.',
    dueAt: '2026-05-20T23:59:00.000Z',
    createdAt: '2026-05-10T12:00:00.000Z',
    status: 'published',
    kind: 'assignment',
    resourceLink: 'https://example.com/algebra-ch7',
  },
  {
    id: 'announce-demo-1',
    classKey: 'math_201',
    kind: 'announcement',
    title: 'Bring calculators Friday',
    description:
      'We will use graphing calculators for the review session. Borrow one from the library if needed.',
    dueAt: '2026-05-08T10:00:00.000Z',
    createdAt: '2026-05-08T10:00:00.000Z',
    status: 'published',
  },
  {
    id: 'assign-demo-2',
    classKey: 'math_401',
    title: 'Limits & Continuity Quiz Prep',
    description:
      'Review sections 2.1–2.3. Practice problems will be discussed in class.',
    dueAt: '2026-05-22T15:00:00.000Z',
    createdAt: '2026-05-12T09:00:00.000Z',
    status: 'published',
    kind: 'assignment',
  },
  {
    id: 'assign-demo-3',
    classKey: 'math_101',
    title: 'Triangle Proofs Worksheet',
    description: 'Finish the proof exercises handed out in class.',
    dueAt: '2026-05-18T23:59:00.000Z',
    createdAt: '2026-05-08T14:00:00.000Z',
    status: 'closed',
    kind: 'assignment',
  },
]
