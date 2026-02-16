function getSecureRandomBytes(length: number): Uint8Array {
  if (length <= 0) {
    return new Uint8Array()
  }

  return crypto.getRandomValues(new Uint8Array(length))
}

export function generateSecureToken(length: number = 32): string {
  const bytes = getSecureRandomBytes(length)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function generateSecureCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = getSecureRandomBytes(length)

  let code = ''
  for (let i = 0; i < bytes.length; i++) {
    code += chars[bytes[i] % chars.length]
  }

  return code
}
