import { getInitials } from './storage'

export function studentEmailFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
  return `${slug || 'student'}@school.edu`
}

export { getInitials }
