import { DateTime } from 'luxon'

// Ensure you add luxon to dependencies if not present.
export const DEFAULT_TZ = 'Europe/Madrid'

export function toUserZoned(date: string | Date, tz = DEFAULT_TZ) {
  const d = typeof date === 'string' ? DateTime.fromISO(date, { zone: 'utc' }) : DateTime.fromJSDate(date, { zone: 'utc' })
  return d.setZone(tz)
}

export function formatUserDate(date: string | Date, tz = DEFAULT_TZ, fmt = 'yyyy-LL-dd') {
  return toUserZoned(date, tz).toFormat(fmt)
}

export function nowUser(tz = DEFAULT_TZ) {
  return DateTime.now().setZone(tz)
}
