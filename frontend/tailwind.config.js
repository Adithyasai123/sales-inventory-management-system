/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic Token Mapping using rgb(var(--token-rgb) / <alpha-value>)
        bg: "rgb(var(--color-bg-rgb) / <alpha-value>)",
        surface: "rgb(var(--color-surface-rgb) / <alpha-value>)",
        surfaceAlt: "rgb(var(--color-surfaceAlt-rgb) / <alpha-value>)",
        sidebar: "rgb(var(--color-sidebar-rgb) / <alpha-value>)",
        sidebarText: "rgb(var(--color-sidebarText-rgb) / <alpha-value>)",
        sidebarIcon: "rgb(var(--color-sidebarIcon-rgb) / <alpha-value>)",
        sidebarHover: "rgb(var(--color-sidebarHover-rgb) / <alpha-value>)",
        navActive: "rgb(var(--color-navActiveBg-rgb) / <alpha-value>)",
        navActiveText: "rgb(var(--color-navActiveText-rgb) / <alpha-value>)",
        border: "rgb(var(--color-border-rgb) / <alpha-value>)",
        text: "rgb(var(--color-text-rgb) / <alpha-value>)",
        muted: "rgb(var(--color-textMuted-rgb) / <alpha-value>)",
        textMuted: "rgb(var(--color-textMuted-rgb) / <alpha-value>)",

        primaryText: "rgb(var(--color-primaryText-rgb) / <alpha-value>)",
        accentText: "rgb(var(--color-accentText-rgb) / <alpha-value>)",

        primary: {
          DEFAULT: "rgb(var(--color-primary-rgb) / <alpha-value>)",
          text: "rgb(var(--color-primaryText-rgb) / <alpha-value>)",
          soft: "rgb(var(--color-primarySoft-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent-rgb) / <alpha-value>)",
          text: "rgb(var(--color-accentText-rgb) / <alpha-value>)",
        },
        ink: "rgb(var(--color-accent-rgb) / <alpha-value>)",

        chart1: "var(--color-chart1)",
        chart2: "var(--color-chart2)",
        chart3: "var(--color-chart3)",
        chart4: "var(--color-chart4)",
        chart5: "var(--color-chart5)",

        success: "rgb(var(--color-success-rgb) / <alpha-value>)",
        successSoft: "rgb(var(--color-successSoft-rgb) / <alpha-value>)",
        warning: "rgb(var(--color-warning-rgb) / <alpha-value>)",
        warningSoft: "rgb(var(--color-warningSoft-rgb) / <alpha-value>)",
        danger: "rgb(var(--color-danger-rgb) / <alpha-value>)",
        dangerSoft: "rgb(var(--color-dangerSoft-rgb) / <alpha-value>)",

        // Direct token aliases
        slate: {
          DEFAULT: "rgb(var(--color-accent-rgb) / <alpha-value>)",
          ink: "rgb(var(--color-accent-rgb) / <alpha-value>)",
          muted: "rgb(var(--color-textMuted-rgb) / <alpha-value>)",
        },
        mint: {
          DEFAULT: "rgb(var(--color-primary-rgb) / <alpha-value>)",
          primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
          200: "rgb(var(--color-primarySoft-rgb) / <alpha-value>)",
          400: "var(--color-chart2)",
          light: "rgb(var(--color-surfaceAlt-rgb) / <alpha-value>)",
          border: "rgb(var(--color-border-rgb) / <alpha-value>)",
        },
        forest: {
          DEFAULT: "rgb(var(--color-accent-rgb) / <alpha-value>)",
          ink: "rgb(var(--color-accent-rgb) / <alpha-value>)",
          dark: "rgb(var(--color-accent-rgb) / <alpha-value>)",
          muted: "rgb(var(--color-textMuted-rgb) / <alpha-value>)",
          border: "rgb(var(--color-border-rgb) / <alpha-value>)",
          surface: "rgb(var(--color-surfaceAlt-rgb) / <alpha-value>)",
          bg: "rgb(var(--color-bg-rgb) / <alpha-value>)",
        },
      },
      borderRadius: {
        'card': '24px',
        'panel': '12px',
        'input': '8px',
        'btn': '8px',
        'btn-sm': '6px',
        'alert': '12px',
        'pill': '9999px',
        'full': '9999px',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Figtree"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'none': 'none',
        'card': 'var(--shadow-card, 0 4px 12px -4px rgba(15, 61, 122, 0.18))',
        'flat': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
