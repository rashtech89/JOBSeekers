export type ThemePreset = {
  id: string
  name: string
  description: string
  swatch: [string, string, string]
  vars: Record<string, string>
  cards: 'glass' | 'flat' | 'outline'
  radius: 'sharp' | 'normal' | 'soft'
  font?: string
}

const amb = (a: string, b: string) => ({ '--amb1': a, '--amb2': b })
const SERIF = "Georgia,'Times New Roman','Noto Sans Arabic','Noto Sans Bengali',serif"
const SYSTEM = "system-ui,-apple-system,'Segoe UI','Noto Sans Arabic','Noto Sans Bengali',sans-serif"

/** Whole-site looks: palette, card style, corner style and font. Chosen in Admin, applied by ThemeEngine. */
export const themes: ThemePreset[] = [
  { id: 'classic', name: 'Classic Green', description: 'The default Job Seekers look with glass cards.', swatch: ['#07584e', '#16a895', '#e5bd75'], cards: 'glass', radius: 'normal',
    vars: { '--green': '#07584e', '--teal': '#16a895', '--gold': '#e5bd75', ...amb('rgba(22,168,149,.16)', 'rgba(7,88,78,.11)') } },
  { id: 'ocean', name: 'Ocean Blue', description: 'Cool corporate blue with glass cards.', swatch: ['#0b4f8a', '#14a3c7', '#f2c46d'], cards: 'glass', radius: 'normal',
    vars: { '--green': '#0b4f8a', '--teal': '#14a3c7', '--gold': '#f2c46d', ...amb('rgba(20,163,199,.17)', 'rgba(11,79,138,.12)') } },
  { id: 'sunset', name: 'Sunset Warm', description: 'Warm orange, friendly rounded cards.', swatch: ['#b4430f', '#f08a24', '#f6c453'], cards: 'flat', radius: 'soft',
    vars: { '--green': '#b4430f', '--teal': '#f08a24', '--gold': '#f6c453', ...amb('rgba(240,138,36,.17)', 'rgba(180,67,15,.11)') } },
  { id: 'royal', name: 'Royal Purple', description: 'Premium purple with serif text and outlined cards.', swatch: ['#4b2a8a', '#8b5cf6', '#f2c66d'], cards: 'outline', radius: 'normal', font: SERIF,
    vars: { '--green': '#4b2a8a', '--teal': '#8b5cf6', '--gold': '#f2c66d', ...amb('rgba(139,92,246,.17)', 'rgba(75,42,138,.12)') } },
  { id: 'rose', name: 'Rose Soft', description: 'Soft pink with very round shapes.', swatch: ['#9d174d', '#ec4899', '#f5c26b'], cards: 'glass', radius: 'soft',
    vars: { '--green': '#9d174d', '--teal': '#ec4899', '--gold': '#f5c26b', ...amb('rgba(236,72,153,.15)', 'rgba(157,23,77,.10)') } },
  { id: 'mono', name: 'Mono Sharp', description: 'Minimal grey, sharp corners, system font.', swatch: ['#1f2937', '#64748b', '#d4a85a'], cards: 'outline', radius: 'sharp', font: SYSTEM,
    vars: { '--green': '#1f2937', '--teal': '#64748b', '--gold': '#d4a85a', ...amb('rgba(100,116,139,.14)', 'rgba(31,41,55,.08)') } },
]
export const findTheme = (id?: string): ThemePreset => themes.find(t => t.id === id) ?? themes[0]
