// 6. lib/utils/validation.ts - Form Validation Utilities
// ==========================================
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  type?: 'email' | 'number' | 'url' | 'tel'
  min?: number
  max?: number
  custom?: (value: any) => string | null
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string[]>
}

export function validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult {
  const errors: Record<string, string[]> = {}
  
  for (const [field, rule] of Object.entries(rules)) {
    const fieldErrors: string[] = []
    const value = data[field]
    
    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      fieldErrors.push(`${field} wajib diisi`)
      errors[field] = fieldErrors
      continue
    }
    
    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      continue
    }
    
    // Type validation
    if (rule.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value.toString())) {
        fieldErrors.push(`${field} harus berupa email yang valid`)
      }
    }
    
    if (rule.type === 'number') {
      if (isNaN(Number(value))) {
        fieldErrors.push(`${field} harus berupa angka`)
      }
    }
    
    if (rule.type === 'url') {
      try {
        new URL(value.toString())
      } catch {
        fieldErrors.push(`${field} harus berupa URL yang valid`)
      }
    }
    
    // Length validation
    if (rule.minLength && value.toString().length < rule.minLength) {
      fieldErrors.push(`${field} minimal ${rule.minLength} karakter`)
    }
    
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      fieldErrors.push(`${field} maksimal ${rule.maxLength} karakter`)
    }
    
    // Number range validation
    if (rule.min !== undefined && Number(value) < rule.min) {
      fieldErrors.push(`${field} minimal ${rule.min}`)
    }
    
    if (rule.max !== undefined && Number(value) > rule.max) {
      fieldErrors.push(`${field} maksimal ${rule.max}`)
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      fieldErrors.push(`${field} format tidak valid`)
    }
    
    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) {
        fieldErrors.push(customError)
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Common validation rules
export const commonRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    required: true,
    type: 'email' as const,
    maxLength: 100
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128
  },
  token: {
    required: true,
    minLength: 6,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/
  }
}
