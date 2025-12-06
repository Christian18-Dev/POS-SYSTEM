// Input validation and sanitization utilities

export function sanitizeRegexInput(input: string): string {
  // Escape special regex characters
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true }
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input.trim().slice(0, maxLength)
}

export function validatePrice(price: any): boolean {
  const num = parseFloat(price)
  return !isNaN(num) && num >= 0 && num <= 999999.99
}

export function validateStock(stock: any): boolean {
  const num = parseInt(stock)
  return !isNaN(num) && num >= 0 && num <= 999999
}
