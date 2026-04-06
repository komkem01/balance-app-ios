export const tokens = {
  colors: {
    bgBase: "#f8fafc",
    bgSoft: "#f1f5f9",
    textPrimary: "#0f172a",
    textMuted: "#64748b",
    textSubtle: "#94a3b8",
    borderSoft: "#e2e8f0",
    white: "#ffffff",
    primary: "#0a1633",
    primaryHover: "#0d1d45",
    indigo: "#6366f1",
    emerald: "#10b981",
    rose: "#f43f5e",
    sky: "#38bdf8",
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  type: {
    label: 10,
    caption: 11,
    body: 14,
    subheading: 20,
    heading: 34,
  },
} as const;

export type AppTokens = typeof tokens;
