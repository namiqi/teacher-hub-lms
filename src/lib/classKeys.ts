/** Derive stable class key from display name, e.g. Algebra II → algebra_ii */
export function nameToClassKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/** @deprecated Legacy migration only — course codes removed from UI */
export function codeToClassKey(code: string): string {
  return nameToClassKey(code)
}

export function generateUniqueClassKey(
  name: string,
  existingKeys: Set<string>,
  id: number,
): string {
  const base = nameToClassKey(name) || `class_${id}`
  if (!existingKeys.has(base)) return base
  const withId = `${base}_${id}`
  return existingKeys.has(withId) ? `class_${id}` : withId
}

export const DEFAULT_TOKEN_CAPACITY = 12
export const NEW_STUDENT_TOKEN_CAPACITY = 8
