import { DateTime } from 'luxon'

export const DEFAULT_TZ = process.env.APP_DEFAULT_TZ || 'Europe/Madrid'

export function toUserZoned(date: string | Date, tz?: string) {
  const d = typeof date === 'string' ? DateTime.fromISO(date, { zone: 'utc' }) : DateTime.fromJSDate(date, { zone: 'utc' })
  return d.setZone(tz || DEFAULT_TZ)
}

export function formatUserDate(date: string | Date, tz?: string, fmt='yyyy-LL-dd HH:mm') {
  return toUserZoned(date, tz).toFormat(fmt)
}
