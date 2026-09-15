/** httpOnly cookie serialization for the consultant gates (quota, OTP, verification). */
export function serializeConsultCookie(
  name: string,
  value: string,
  maxAgeSec: number,
): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${name}=${value}; Path=/; Max-Age=${Math.max(0, Math.floor(maxAgeSec))}; HttpOnly; SameSite=Lax${secure}`
}

export function clearConsultCookie(name: string): string {
  return serializeConsultCookie(name, '', 0)
}
