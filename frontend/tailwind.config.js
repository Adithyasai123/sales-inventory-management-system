/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "var(--color-forest)",       // #0F2E2A
          ink: "var(--color-forest)",           // #0F2E2A
          dark: "var(--color-forest-dark)",     // #0F3D33
          muted: "var(--color-forest-muted)",   // #5B7A73
          border: "var(--color-forest-border)", // #CFE7DC
          surface: "var(--color-forest-surface)", // #F1FAF6
          bg: "var(--color-forest-bg)",         // #E9F6F0
        },
        mint: {
          DEFAULT: "var(--color-mint)",         // #BFEBD5
          primary: "var(--color-mint)",         // #BFEBD5
          200: "var(--color-mint-200)",         // #D6EFE2
          light: "var(--color-forest-surface)", // #F1FAF6
          border: "var(--color-forest-border)", // #CFE7DC
        },
      },
      borderRadius: {
        'card': '16px',
        'input': '12px',
        'shell': '20px',
        'full': '9999px',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Figtree"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'none': 'none',
        'flat': '0 1px 2px 0 rgba(15, 46, 42, 0.04)',
      },
    },
  },
  plugins: [],
}
