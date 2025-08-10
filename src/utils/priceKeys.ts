const ALIASES: Record<string, string> = {
  PLASTIC: 'plastics',
  PLASTICS: 'plastics',
  SCREW: 'screws',
  SCREWS: 'screws'
}

export function toResourceId(key: string): string {
  const k = (key || '').trim().toUpperCase()
  const alias = ALIASES[k] ?? k
  return alias.toLowerCase()
}