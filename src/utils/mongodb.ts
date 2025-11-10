import { ObjectId } from 'mongodb'

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id - The string to validate
 * @returns True if the string is a valid ObjectId, false otherwise
 */
export const isValidObjectId = (id: string): boolean => {
  return ObjectId.isValid(id)
}

/**
 * Creates a new ObjectId from a string
 * @param id - The string representation of the ObjectId
 * @returns A new ObjectId instance
 * @throws Error if the id is not a valid ObjectId
 */
export const createObjectId = (id: string): ObjectId => {
  if (!isValidObjectId(id)) {
    throw new Error('Invalid ObjectId format')
  }
  return new ObjectId(id)
}
