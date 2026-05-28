/** Characters that are easy to read aloud (no 0/O, 1/I/L). */
const JOIN_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function generateClassJoinCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)]
  }
  return code
}

export function normalizeJoinCodeInput(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '')
}

export function formatJoinCodeForDisplay(code: string): string {
  const c = normalizeJoinCodeInput(code)
  if (c.length <= 3) return c
  const mid = Math.ceil(c.length / 2)
  return `${c.slice(0, mid)}-${c.slice(mid)}`
}

export function generateUniqueClassJoinCode(
  existingCodes: Set<string>,
  attempts = 40,
): string {
  for (let i = 0; i < attempts; i++) {
    const code = generateClassJoinCode(6)
    if (!existingCodes.has(code)) return code
  }
  return generateClassJoinCode(8)
}
