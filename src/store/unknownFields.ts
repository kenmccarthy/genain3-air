/**
 * Lists the fields in an imported file that this edition's schema does not define, for example
 * fields added by a newer SETU edition. Review objects keep such fields (see model/v2/schema.ts);
 * this only reports them so the user knows they are there.
 */
import type { z } from 'zod'

interface Def {
  type: string
  innerType?: z.ZodType
  in?: z.ZodType
  shape?: Record<string, z.ZodType>
  element?: z.ZodType
  options?: z.ZodType[]
  valueType?: z.ZodType
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/** Paths such as `statement.reviewer` or `assessments[].extra`, each listed once. */
export function unknownFields(schema: z.ZodType, value: unknown): string[] {
  const found = new Set<string>()
  walk(schema, value, '', found)
  return [...found]
}

function walk(schema: z.ZodType, value: unknown, path: string, found: Set<string>): void {
  const def = (schema as unknown as { _zod: { def: Def } })._zod.def
  switch (def.type) {
    case 'default':
    case 'prefault':
    case 'optional':
    case 'nullable':
    case 'readonly':
      return walk(def.innerType!, value, path, found)
    case 'pipe':
      return walk(def.in!, value, path, found)
    case 'object':
      if (!isObject(value)) return
      for (const [key, v] of Object.entries(value)) {
        const child = path ? `${path}.${key}` : key
        if (def.shape && key in def.shape) walk(def.shape[key], v, child, found)
        else found.add(child)
      }
      return
    case 'array':
      if (Array.isArray(value)) for (const v of value) walk(def.element!, v, `${path}[]`, found)
      return
    case 'record':
      if (isObject(value))
        for (const [key, v] of Object.entries(value))
          walk(def.valueType!, v, `${path}.${key}`, found)
      return
    case 'union': {
      const option = def.options?.find((o) => o.safeParse(value).success)
      if (option) walk(option, value, path, found)
      return
    }
  }
}
