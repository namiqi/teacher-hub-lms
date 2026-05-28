import { buildEmptyLedger, buildInitialLedger } from '../data/attendance'
import { INITIAL_CLASSES } from '../data/classes'
import { INITIAL_STUDENTS } from '../data/students'
import type { AttendanceLedger, Class, Student } from '../types'
import { INITIAL_ASSIGNMENTS } from '../data/assignments'
import {
  saveAssignments,
  saveAttendance,
  saveClasses,
  saveJoinRequests,
  savePayments,
  saveStudents,
} from './storage'

export function initializeEmptyWorkspace(): {
  classes: Class[]
  students: Student[]
  attendance: AttendanceLedger
} {
  const classes: Class[] = []
  const students: Student[] = []
  const attendance = buildEmptyLedger()

  saveClasses(classes)
  saveStudents(students)
  saveAttendance(attendance)
  savePayments([])
  saveJoinRequests([])
  saveAssignments([])

  return { classes, students, attendance }
}

export function seedDemoWorkspace(): {
  classes: Class[]
  students: Student[]
  attendance: AttendanceLedger
} {
  const classes = structuredClone(INITIAL_CLASSES)
  const students = structuredClone(INITIAL_STUDENTS)
  const attendance = buildInitialLedger()

  saveClasses(classes)
  saveStudents(students)
  saveAttendance(attendance)
  savePayments([])
  saveAssignments(structuredClone(INITIAL_ASSIGNMENTS))

  return { classes, students, attendance }
}

export function isWorkspaceSetup(classes: Class[], students: Student[]): boolean {
  const hasClass = classes.some((c) => c.status === 'active')
  const hasEnrolledStudent = students.some(
    (s) => s.status === 'active' && s.enrolledClasses.length > 0,
  )
  return hasClass && hasEnrolledStudent
}
