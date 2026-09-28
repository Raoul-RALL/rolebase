function parseVersion(version: string): number[] {
  const match = version.match(/\d+(?:\.\d+)*/)
  return match ? match[0].split('.').map(Number) : []
}

// True for a final release only (digits and dots), not for 8.0.0-rc.1
export function isStableVersion(version: string): boolean {
  return /^v?\d+(\.\d+)*$/.test(version.trim())
}

// Returns -1 if v1 < v2, 1 if v1 > v2, 0 if equal or not comparable
export function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersion(v1)
  const parts2 = parseVersion(v2)
  if (!parts1.length || !parts2.length) return 0

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }
  return 0
}
