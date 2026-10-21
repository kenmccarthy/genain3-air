/** The JSON files in tests/fixtures, as text, by file name. */
const files = import.meta.glob('./fixtures/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function fixture(name: string): string {
  const text = files[`./fixtures/${name}`]
  if (text === undefined) throw new Error(`No fixture ${name}`)
  return text
}

export const fixtureNames = () => Object.keys(files).map((f) => f.replace('./fixtures/', ''))
