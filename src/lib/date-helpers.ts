import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  subWeeks,
  isSaturday,
  isSunday,
  nextSaturday,
  nextSunday
} from 'date-fns'
import { es } from 'date-fns/locale'
import { PrivilegeKey } from '@/types/privileges'

/**
 * Calculates the upcoming service date (Saturday or Sunday) from baseDate.
 * If baseDate is Saturday and we ask for Saturday, it returns baseDate.
 * Otherwise, it returns the upcoming Saturday/Sunday in the future.
 */
export function getUpcomingServiceDate(key: PrivilegeKey, baseDate: Date = new Date()): Date {
  const isSatPrivilege = key === 'saturday_musician'
  if (isSatPrivilege) {
    return isSaturday(baseDate) ? baseDate : nextSaturday(baseDate)
  } else {
    return isSunday(baseDate) ? baseDate : nextSunday(baseDate)
  }
}

/**
 * Calculates the exact target date for a given privilege key.
 * Saturday privileges are resolved to Saturday of the week of baseDate.
 * Sunday privileges are resolved to Sunday of the week of baseDate.
 */
export function getAutoDateForPrivilege(key: PrivilegeKey, baseDate: Date = new Date()): Date {
  const isSatPrivilege = key === 'saturday_musician'
  
  // Get start of the week (Monday)
  const monday = startOfWeek(baseDate, { weekStartsOn: 1 })
  
  // Saturday is Monday + 5 days
  const satDate = new Date(monday)
  satDate.setDate(monday.getDate() + 5)
  
  // Sunday is Monday + 6 days
  const sunDate = new Date(monday)
  sunDate.setDate(monday.getDate() + 6)
  
  return isSatPrivilege ? satDate : sunDate
}

/**
 * Formats a Date object or ISO short string into a warm Spanish string.
 * Example: "Sábado, 22 de agosto de 2026"
 * Parses YYYY-MM-DD strings timezone-safely in local time.
 */
export function formatFullSpanishDate(date: Date | string): string {
  let d: Date
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number)
      d = new Date(year, month - 1, day)
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  const formatted = format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/**
 * Formats a Date into ISO short string YYYY-MM-DD for database storing and matching.
 * Handles strings timezone-safely without shifting them.
 */
export function formatISOShortDate(date: Date | string): string {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    const d = new Date(date)
    return format(d, 'yyyy-MM-dd')
  }
  return format(date, 'yyyy-MM-dd')
}

/**
 * Gets the start (Monday) and end (Sunday) of the week for a given date.
 */
export function getWeekBounds(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }) // Sunday
  return { start, end }
}

export function getNextWeekDate(date: Date = new Date()): Date {
  return addWeeks(date, 1)
}

export function getPrevWeekDate(date: Date = new Date()): Date {
  return subWeeks(date, 1)
}
