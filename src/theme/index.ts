import { tokens } from "./tokens";

export const theme = {
  ...tokens,
  shadows: {
    card: {
      shadowColor: "#0f172a",
      shadowOpacity: 0.05,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
    button: {
      shadowColor: "#0f172a",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
} as const;

export type AppTheme = typeof theme;
