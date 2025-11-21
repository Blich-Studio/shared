import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

/**
 * Generates a unique identifier using current timestamp
 * @returns A string representation of the current timestamp in milliseconds
 */
export const generateId = (): string => {
  return dayjs().valueOf().toString()
}

/**
 * Gets the current timestamp in epoch milliseconds
 * @returns Current timestamp in milliseconds since Unix epoch
 */
export const getCurrentTimestamp = (): number => {
  return dayjs().valueOf()
}

/**
 * Formats a timestamp (epoch milliseconds) to a readable string
 * @param timestamp - Epoch milliseconds
 * @param format - dayjs format string (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(timestamp).format(format)
}

/**
 * Parses a date string to epoch milliseconds
 * @param dateString - Date string to parse
 * @param format - dayjs format string (optional)
 * @returns Epoch milliseconds or null if invalid
 */
export const parseDate = (dateString: string, format?: string): number | null => {
  const date = format ? dayjs(dateString, format) : dayjs(dateString)
  return date.isValid() ? date.valueOf() : null
}

/**
 * Adds time to a timestamp
 * @param timestamp - Base timestamp in epoch milliseconds
 * @param amount - Amount to add
 * @param unit - Time unit ('years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds')
 * @returns New timestamp in epoch milliseconds
 */
export const addTime = (timestamp: number, amount: number, unit: dayjs.ManipulateType): number => {
  return dayjs(timestamp).add(amount, unit).valueOf()
}

/**
 * Subtracts time from a timestamp
 * @param timestamp - Base timestamp in epoch milliseconds
 * @param amount - Amount to subtract
 * @param unit - Time unit ('years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds')
 * @returns New timestamp in epoch milliseconds
 */
export const subtractTime = (
  timestamp: number,
  amount: number,
  unit: dayjs.ManipulateType
): number => {
  return dayjs(timestamp).subtract(amount, unit).valueOf()
}

/**
 * Checks if the first timestamp is before the second timestamp
 * @param timestamp1 - First timestamp
 * @param timestamp2 - Second timestamp
 * @param unit - Granularity unit (optional)
 * @returns True if timestamp1 is before timestamp2
 */
export const isBefore = (
  timestamp1: number,
  timestamp2: number,
  unit?: dayjs.OpUnitType
): boolean => {
  return dayjs(timestamp1).isBefore(dayjs(timestamp2), unit)
}

/**
 * Checks if the first timestamp is after the second timestamp
 * @param timestamp1 - First timestamp
 * @param timestamp2 - Second timestamp
 * @param unit - Granularity unit (optional)
 * @returns True if timestamp1 is after timestamp2
 */
export const isAfter = (
  timestamp1: number,
  timestamp2: number,
  unit?: dayjs.OpUnitType
): boolean => {
  return dayjs(timestamp1).isAfter(dayjs(timestamp2), unit)
}

/**
 * Checks if two timestamps are the same
 * @param timestamp1 - First timestamp
 * @param timestamp2 - Second timestamp
 * @param unit - Granularity unit (optional)
 * @returns True if timestamps are the same
 */
export const isSame = (
  timestamp1: number,
  timestamp2: number,
  unit?: dayjs.OpUnitType
): boolean => {
  return dayjs(timestamp1).isSame(dayjs(timestamp2), unit)
}

/**
 * Gets relative time string (e.g., "2 hours ago", "in 3 days")
 * @param timestamp - Target timestamp
 * @param baseTimestamp - Base timestamp (default: now)
 * @returns Relative time string
 */
export const getRelativeTime = (timestamp: number, baseTimestamp?: number): string => {
  const base = baseTimestamp ? dayjs(baseTimestamp) : dayjs()
  return base.to(dayjs(timestamp))
}

/**
 * Gets the start of a time period
 * @param timestamp - Base timestamp
 * @param unit - Time unit ('year', 'month', 'day', 'hour', 'minute', 'second')
 * @returns Start of period timestamp
 */
export const startOf = (timestamp: number, unit: dayjs.OpUnitType): number => {
  return dayjs(timestamp).startOf(unit).valueOf()
}

/**
 * Gets the end of a time period
 * @param timestamp - Base timestamp
 * @param unit - Time unit ('year', 'month', 'day', 'hour', 'minute', 'second')
 * @returns End of period timestamp
 */
export const endOf = (timestamp: number, unit: dayjs.OpUnitType): number => {
  return dayjs(timestamp).endOf(unit).valueOf()
}

/**
 * Gets the difference between two timestamps
 * @param timestamp1 - First timestamp
 * @param timestamp2 - Second timestamp
 * @param unit - Time unit (default: 'milliseconds')
 * @returns Difference in specified unit
 */
export const diff = (
  timestamp1: number,
  timestamp2: number,
  unit: dayjs.QUnitType = 'milliseconds'
): number => {
  return dayjs(timestamp1).diff(dayjs(timestamp2), unit)
}
