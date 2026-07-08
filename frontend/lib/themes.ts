export type Theme = {
  id: string;
  name: string;
  bg: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  textMuted: string;
  fontHeading: string;
  fontBody: string;
};

export const THEME_PRESETS: Theme[] = [
  { id: "amber-noir", name: "Amber Noir", bg: "#0b0a08", surface: "rgba(255,255,255,0.04)", primary: "#f59e0b", accent: "#d97706", text: "#fafafa", textMuted: "#a1a1aa", fontHeading: "'Playfair Display', Georgia, serif", fontBody: "'Inter', system-ui, sans-serif" },
  { id: "blush-editorial", name: "Blush Editorial", bg: "#fdf6f3", surface: "#ffffff", primary: "#c2617a", accent: "#9c4a5f", text: "#2b1f22", textMuted: "#7a6569", fontHeading: "'Playfair Display', Georgia, serif", fontBody: "'Inter', system-ui, sans-serif" },
  { id: "midnight-cinema", name: "Midnight Cinema", bg: "#05070d", surface: "rgba(255,255,255,0.05)", primary: "#38bdf8", accent: "#0ea5e9", text: "#f1f5f9", textMuted: "#94a3b8", fontHeading: "'Space Grotesk', 'Inter', sans-serif", fontBody: "'Inter', system-ui, sans-serif" },
  { id: "sage-minimal", name: "Sage Minimal", bg: "#f7f8f5", surface: "#ffffff", primary: "#5c7a5e", accent: "#3f5940", text: "#232823", textMuted: "#697169", fontHeading: "'Cormorant Garamond', Georgia, serif", fontBody: "'Inter', system-ui, sans-serif" },
  { id: "sunset-warm", name: "Sunset Warm", bg: "#1a0f0a", surface: "rgba(255,255,255,0.05)", primary: "#fb7185", accent: "#f97316", text: "#fff7ed", textMuted: "#d6b8a8", fontHeading: "'Playfair Display', Georgia, serif", fontBody: "'Inter', system-ui, sans-serif" },
  { id: "mono-classic", name: "Mono Classic", bg: "#0a0a0a", surface: "rgba(255,255,255,0.04)", primary: "#ffffff", accent: "#a3a3a3", text: "#fafafa", textMuted: "#a3a3a3", fontHeading: "'Playfair Display', Georgia, serif", fontBody: "'Inter', system-ui, sans-serif" },
];

export const getTheme = (id: string): Theme => THEME_PRESETS.find((t) => t.id === id) || THEME_PRESETS[0];
