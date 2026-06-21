import type { FieldSchema, FormSchema } from '../types'
import { describe, expect, it } from 'vitest'
import { useFormValidation } from './useFormValidation'

function makeSchema(fieldOverrides?: Record<string, Partial<FieldSchema>>): FormSchema {
  const baseFields: FieldSchema[] = [
    { key: 'name', label: 'Name', component: 'input' },
    { key: 'email', label: 'Email', component: 'input' },
    { key: 'age', label: 'Age', component: 'number' },
  ]
  const fields = fieldOverrides
    ? baseFields.map(f => ({ ...f, ...fieldOverrides[f.key] }))
    : baseFields
  return { sections: [{ title: 'Basic', fields }] }
}

function makeSchemaWithValidation() {
  return {
    sections: [
      {
        title: 'Basic',
        fields: [
          {
            key: 'name',
            label: 'Name',
            component: 'input',
            rules: [
              { required: true },
            ],
          },
          {
            key: 'email',
            label: 'Email',
            component: 'input',
            rules: [
              { required: true, message: 'Email is required' },
              {
                validator: (value: unknown) => {
                  if (typeof value === 'string' && !value.includes('@'))
                    return 'Invalid email format'
                  return true
                },
              },
            ],
          },
          {
            key: 'age',
            label: 'Age',
            component: 'number',
            rules: [
              {
                validator: (value: unknown) => {
                  if (typeof value === 'number' && value < 0)
                    return 'Age cannot be negative'
                  return true
                },
                message: 'Age validation failed',
              },
            ],
          },
        ],
      },
    ],
  }
}

describe('useFormValidation', () => {
  describe('validateField', () => {
    it('returns undefined for field without rules', () => {
      const schema = makeSchema()
      const values = { name: 'test' }
      const { validateField } = useFormValidation(schema, () => values)

      const result = validateField('name')
      expect(result).toBeUndefined()
    })

    it('returns undefined for non-existent field', () => {
      const schema = makeSchema()
      const values = {}
      const { validateField } = useFormValidation(schema, () => values)

      const result = validateField('nonexistent')
      expect(result).toBeUndefined()
    })

    it('validates required field with empty value', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: '', email: 'test@example.com', age: 25 }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('name')).toBe('This field is required')
    })

    it('validates required field with null value', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: null, email: 'test@example.com', age: 25 }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('name')).toBe('This field is required')
    })

    it('validates required field with undefined value', () => {
      const schema = makeSchemaWithValidation()
      const values = { email: 'test@example.com', age: 25 }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('name')).toBe('This field is required')
    })

    it('passes required validation with non-empty value', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: 'John', email: 'test@example.com', age: 25 }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('name')).toBeUndefined()
    })

    it('uses custom message for required validation', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: 'John', email: '', age: 25 }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('email')).toBe('Email is required')
    })

    it('runs custom validator returning string', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: 'John', email: 'invalid', age: 25 }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('email')).toBe('Invalid email format')
    })

    it('runs custom validator returning string (used as error message directly)', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: 'John', email: 'test@example.com', age: -5 }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('age')).toBe('Age cannot be negative')
    })

    it('uses rule.message when validator returns false', () => {
      const schema: FormSchema = {
        sections: [{
          title: 'Test',
          fields: [{
            key: 'code',
            label: 'Code',
            component: 'input',
            rules: [{
              validator: () => false,
              message: 'Code is invalid',
            }],
          }],
        }],
      }
      const values = { code: 'abc' }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('code')).toBe('Code is invalid')
    })

    it('uses default message when validator returns false and no rule.message', () => {
      const schema: FormSchema = {
        sections: [{
          title: 'Test',
          fields: [{
            key: 'code',
            label: 'Code',
            component: 'input',
            rules: [{
              validator: () => false,
            }],
          }],
        }],
      }
      const values = { code: 'abc' }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('code')).toBe('Validation failed')
    })

    it('passes custom validator returning true', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: 'John', email: 'test@example.com', age: 25 }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('age')).toBeUndefined()
    })

    it('updates fieldErrors ref on validation', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: '', email: 'test@example.com', age: 25 }
      const { validateField, fieldErrors } = useFormValidation(schema, () => values)

      validateField('name')
      expect(fieldErrors.value.name).toBe('This field is required')

      validateField('email')
      expect(fieldErrors.value.email).toBeUndefined()
    })
  })

  describe('validateAll', () => {
    it('returns empty array when all fields pass', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: 'John', email: 'test@example.com', age: 25 }
      const { validateAll } = useFormValidation(schema, () => values)

      expect(validateAll()).toEqual([])
    })

    it('returns all validation errors', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: '', email: 'invalid', age: -5 }
      const { validateAll } = useFormValidation(schema, () => values)

      const errors = validateAll()
      expect(errors).toHaveLength(3)
      expect(errors.map(e => e.key)).toEqual(['name', 'email', 'age'])
    })

    it('updates fieldErrors ref for all fields', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: '', email: 'test@example.com', age: 25 }
      const { validateAll, fieldErrors } = useFormValidation(schema, () => values)

      validateAll()
      expect(fieldErrors.value.name).toBe('This field is required')
      expect(fieldErrors.value.email).toBeUndefined()
      expect(fieldErrors.value.age).toBeUndefined()
    })

    it('clears previous errors when fields become valid', () => {
      const schema = makeSchemaWithValidation()
      const values: Record<string, unknown> = { name: '', email: 'test@example.com', age: 25 }
      const { validateAll, fieldErrors } = useFormValidation(schema, () => values)

      validateAll()
      expect(fieldErrors.value.name).toBe('This field is required')

      values.name = 'John'
      validateAll()
      expect(fieldErrors.value.name).toBeUndefined()
    })
  })

  describe('clearErrors', () => {
    it('clears all field errors', () => {
      const schema = makeSchemaWithValidation()
      const values = { name: '', email: '', age: 25 }
      const { validateAll, clearErrors, fieldErrors } = useFormValidation(schema, () => values)

      validateAll()
      expect(Object.keys(fieldErrors.value).length).toBeGreaterThan(0)

      clearErrors()
      expect(fieldErrors.value).toEqual({})
    })
  })

  describe('edge cases', () => {
    it('handles empty schema', () => {
      const schema = { sections: [] }
      const values = {}
      const { validateAll, validateField } = useFormValidation(schema, () => values)

      expect(validateAll()).toEqual([])
      expect(validateField('any')).toBeUndefined()
    })

    it('handles empty sections', () => {
      const schema = { sections: [{ title: 'Empty', fields: [] }] }
      const values = {}
      const { validateAll } = useFormValidation(schema, () => values)

      expect(validateAll()).toEqual([])
    })

    it('handles required field with value 0 (not empty)', () => {
      const schema: FormSchema = {
        sections: [{
          title: 'Test',
          fields: [{
            key: 'count',
            label: 'Count',
            component: 'number',
            rules: [{ required: true }],
          }],
        }],
      }
      const values = { count: 0 }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('count')).toBeUndefined()
    })

    it('handles required field with value false (not empty)', () => {
      const schema: FormSchema = {
        sections: [{
          title: 'Test',
          fields: [{
            key: 'flag',
            label: 'Flag',
            component: 'checkbox',
            rules: [{ required: true }],
          }],
        }],
      }
      const values = { flag: false }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('flag')).toBeUndefined()
    })

    it('validator receives form context with all values', () => {
      let receivedValues: Record<string, unknown> | undefined
      const schema: FormSchema = {
        sections: [{
          title: 'Test',
          fields: [{
            key: 'a',
            label: 'A',
            component: 'input',
            rules: [{
              validator: (_value: unknown, ctx) => {
                receivedValues = ctx.values
                return true
              },
            }],
          }],
        }],
      }
      const values = { a: 'hello', b: 'world' }
      const { validateField } = useFormValidation(schema, () => values)

      validateField('a')
      expect(receivedValues).toEqual({ a: 'hello', b: 'world' })
    })

    it('validates multiple rules in order and stops at first error', () => {
      const schema: FormSchema = {
        sections: [{
          title: 'Test',
          fields: [{
            key: 'field',
            label: 'Field',
            component: 'input',
            rules: [
              { required: true, message: 'Required' },
              {
                validator: () => 'Custom error',
                message: 'Should not reach here',
              },
            ],
          }],
        }],
      }
      const values = { field: '' }
      const { validateField } = useFormValidation(schema, () => values)

      expect(validateField('field')).toBe('Required')
    })
  })
})
