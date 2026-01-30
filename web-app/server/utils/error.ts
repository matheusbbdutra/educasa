import { createError } from 'h3'

export function createCustomError(statusCode: number, message: string, data?: any) {
  return createError({
    statusCode,
    message,
    data,
    fatal: false // Ensure errors are not fatal
  })
}
