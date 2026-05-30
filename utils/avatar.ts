// Shared avatar color utility — used by Home and Profile screens
// Ensures the same name always produces the same color across all screens

export const AVATAR_COLORS = [
  '#2e7d32', // green
  '#1565c0', // blue
  '#6a1b9a', // purple
  '#c62828', // red
  '#00838f', // teal
  '#f57f17', // amber
  '#e65100', // deep orange
  '#00695c', // dark teal
];

/**
 * Returns a consistent avatar background color for a given display name.
 * Uses the first character's char code modulo the palette length.
 */
export function getAvatarColor(name: string): string {
  if (!name || name.length === 0) return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
