export const designTokens = {
  colors: {
    // Brand - Deep indigo with warmth
    brand: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    // Accent - Warm amber/gold
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Neutral - Slate with subtle warmth
    neutral: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    // Semantic
    success: {
      light: '#dcfce7',
      DEFAULT: '#22c55e',
      dark: '#166534',
    },
    warning: {
      light: '#fef9c3',
      DEFAULT: '#eab308',
      dark: '#854d0e',
    },
    error: {
      light: '#fef2f2',
      DEFAULT: '#ef4444',
      dark: '#991b1b',
    },
    info: {
      light: '#dbeafe',
      DEFAULT: '#3b82f6',
      dark: '#1e40af',
    },
  },

  typography: {
    fontFamilies: {
      sans: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
      mono: 'var(--font-geist-mono), ui-monospace, monospace',
      display: 'var(--font-display), var(--font-geist-sans), system-ui, sans-serif',
    },
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.1',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
    },
    letterSpacings: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
      wider: '0.04em',
    },
  },

  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },

  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
    DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.12)',
    '2xl': '0 35px 60px -15px rgb(0 0 0 / 0.15)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    focus: '0 0 0 3px rgb(99 102 241 / 0.4)',
    focusAccent: '0 0 0 3px rgb(245 158 11 / 0.4)',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modalBackdrop: 400,
    modal: 500,
    popover: 600,
    tooltip: 700,
    toast: 800,
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Component-specific tokens
  components: {
    button: {
      heights: {
        sm: '2rem',      // 32px
        DEFAULT: '2.5rem', // 40px
        lg: '3rem',      // 48px
        xl: '3.5rem',    // 56px
      },
      padding: {
        sm: '0.5rem 1rem',
        DEFAULT: '0.75rem 1.5rem',
        lg: '1rem 2rem',
        xl: '1.25rem 2.5rem',
      },
      iconSize: {
        sm: '1rem',
        DEFAULT: '1.25rem',
        lg: '1.5rem',
      },
    },
    input: {
      heights: {
        sm: '2rem',
        DEFAULT: '2.5rem',
        lg: '3rem',
      },
      padding: {
        sm: '0 0.75rem',
        DEFAULT: '0 1rem',
        lg: '0 1.25rem',
      },
    },
    card: {
      padding: {
        sm: '1rem',
        DEFAULT: '1.5rem',
        lg: '2rem',
      },
    },
  },
} as const

export type DesignTokens = typeof designTokens

// CSS Custom Properties Generator
export function generateCSSVariables(tokens: typeof designTokens): string {
  const lines: string[] = ['/* Design Tokens */', ':root {']

  // Colors
  Object.entries(tokens.colors.brand).forEach(([key, value]) => {
    lines.push(`  --color-brand-${key}: ${value};`)
  })
  Object.entries(tokens.colors.accent).forEach(([key, value]) => {
    lines.push(`  --color-accent-${key}: ${value};`)
  })
  Object.entries(tokens.colors.neutral).forEach(([key, value]) => {
    lines.push(`  --color-neutral-${key}: ${value};`)
  })
  Object.entries(tokens.colors.success).forEach(([key, value]) => {
    lines.push(`  --color-success-${key}: ${value};`)
  })
  Object.entries(tokens.colors.warning).forEach(([key, value]) => {
    lines.push(`  --color-warning-${key}: ${value};`)
  })
  Object.entries(tokens.colors.error).forEach(([key, value]) => {
    lines.push(`  --color-error-${key}: ${value};`)
  })
  Object.entries(tokens.colors.info).forEach(([key, value]) => {
    lines.push(`  --color-info-${key}: ${value};`)
  })

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    lines.push(`  --spacing-${key}: ${value};`)
  })

  // Border Radius
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    lines.push(`  --radius-${key}: ${value};`)
  })

  // Shadows
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    lines.push(`  --shadow-${key}: ${value};`)
  })

  // Transitions
  Object.entries(tokens.transitions).forEach(([key, value]) => {
    lines.push(`  --transition-${key}: ${value};`)
  })

  // Z-Index
  Object.entries(tokens.zIndex).forEach(([key, value]) => {
    lines.push(`  --z-${key}: ${value};`)
  })

  // Typography
  Object.entries(tokens.typography.fontSizes).forEach(([key, value]) => {
    lines.push(`  --text-${key}: ${value};`)
  })

  lines.push('}')
  return lines.join('\n')
}

// Light theme overrides
export const lightTheme = {
  '--bg-primary': '#ffffff',
  '--bg-secondary': '#f8fafc',
  '--bg-tertiary': '#f1f5f9',
  '--bg-hover': '#e2e8f0',
  '--bg-active': '#cbd5e1',
  '--text-primary': '#0f172a',
  '--text-secondary': '#334155',
  '--text-tertiary': '#64748b',
  '--text-quaternary': '#94a3b8',
  '--text-inverse': '#ffffff',
  '--border-primary': '#e2e8f0',
  '--border-secondary': '#cbd5e1',
  '--border-focus': '#6366f1',
  '--border-error': '#ef4444',
  '--brand-primary': '#4f46e5',
  '--brand-hover': '#4338ca',
  '--brand-light': '#eef2ff',
  '--accent-primary': '#f59e0b',
  '--accent-hover': '#d97706',
  '--accent-light': '#fffbeb',
  '--success-bg': '#dcfce7',
  '--success-text': '#166534',
  '--warning-bg': '#fef9c3',
  '--warning-text': '#854d0e',
  '--error-bg': '#fef2f2',
  '--error-text': '#991b1b',
  '--info-bg': '#dbeafe',
  '--info-text': '#1e40af',
  '--shadow-card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
  '--shadow-card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
  '--shadow-elevated': '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
}

// Dark theme overrides
export const darkTheme = {
  '--bg-primary': '#0f172a',
  '--bg-secondary': '#1e293b',
  '--bg-tertiary': '#334155',
  '--bg-hover': '#475569',
  '--bg-active': '#64748b',
  '--text-primary': '#f8fafc',
  '--text-secondary': '#e2e8f0',
  '--text-tertiary': '#94a3b8',
  '--text-quaternary': '#64748b',
  '--text-inverse': '#0f172a',
  '--border-primary': '#334155',
  '--border-secondary': '#475569',
  '--border-focus': '#818cf8',
  '--border-error': '#f87171',
  '--brand-primary': '#6366f1',
  '--brand-hover': '#818cf8',
  '--brand-light': '#1e1b4b',
  '--accent-primary': '#fbbf24',
  '--accent-hover': '#fcd34d',
  '--accent-light': '#422006',
  '--success-bg': '#064e3b',
  '--success-text': '#86efac',
  '--warning-bg': '#422006',
  '--warning-text': '#fde68a',
  '--error-bg': '#450a0a',
  '--error-text': '#fca5a5',
  '--info-bg': '#1e3a5f',
  '--info-text': '#93c5fd',
  '--shadow-card': '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
  '--shadow-card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
  '--shadow-elevated': '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
}