/**
 * Validate a value against a JSON Schema in contracts/ (ask request and response).
 * Covers the keywords that schema uses (type, enum, const, required,
 * additionalProperties: false, properties, items), so no JSON Schema
 * library is needed for this one contract.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Schema = {
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<string, Schema>;
  items?: Schema;
};

export function loadContract(name: string): Schema {
  return JSON.parse(
    readFileSync(resolve(__dirname, '../../../../contracts', name), 'utf8'),
  );
}

export const askResponseSchema: Schema = loadContract(
  'ask_response.schema.json',
);

function typeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

export function schemaErrors(
  value: unknown,
  schema: Schema = askResponseSchema,
  path = '$',
): string[] {
  const errors: string[] = [];
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const t = typeOf(value);
    if (
      !allowed.includes(t) &&
      !(t === 'integer' && allowed.includes('number'))
    ) {
      return [`${path}: type ${t} not in ${allowed.join('|')}`];
    }
  }
  if (schema.enum && !schema.enum.includes(value))
    errors.push(`${path}: ${String(value)} not in enum`);
  if ('const' in schema && value !== schema.const)
    errors.push(`${path}: expected ${String(schema.const)}`);
  if (typeOf(value) === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) errors.push(`${path}: missing ${key}`);
    }
    for (const [key, v] of Object.entries(obj)) {
      const sub = schema.properties?.[key];
      if (sub) errors.push(...schemaErrors(v, sub, `${path}.${key}`));
      else if (schema.additionalProperties === false && v !== undefined) {
        errors.push(`${path}: unexpected property ${key}`);
      }
    }
  }
  if (typeOf(value) === 'array' && schema.items) {
    (value as unknown[]).forEach((v, i) =>
      errors.push(...schemaErrors(v, schema.items, `${path}[${i}]`)),
    );
  }
  return errors;
}
