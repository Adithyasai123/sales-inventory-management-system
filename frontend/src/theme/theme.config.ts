/**
 * ============================================================================
 * SIMS PALETTE & THEME CONFIGURATION ("Blue & Navy" - MongoDB Atlas Inspired)
 * ============================================================================
 * This is the SINGLE SOURCE OF TRUTH for all colors, radii, and typography in SIMS.
 * ============================================================================
 */

export interface ThemeColors {
  // Core Page & Surface Backgrounds
  bg: string;
  surface: string;
  surfaceAlt: string;
  sidebar: string;
  sidebarBorder: string;
  sidebarText: string;
  sidebarIcon: string;
  sidebarHover: string;
  border: string;

  // Crisp, High-Contrast Typography
  text: string;           // Light: #0B1B33 | Dark: #F2F7FF
  textMuted: string;      // Light: #4A5D78 | Dark: #B4C2DC

  // Primary & Accent (Blue & Navy)
  primary: string;
  primaryText: string;
  primarySoft: string;
  accent: string;
  accentText: string;
  navActiveBg: string;
  navActiveText: string;

  // Visual & Chart Series (Blue & Navy 5-series tokens)
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;

  // Semantic Status Tints
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
}

export interface ThemeDefinition {
  name: 'light' | 'dark';
  colors: ThemeColors;
  metaThemeColor: string;
  radius: {
    card: string;        // 24px
    panel: string;       // 12px
    input: string;       // 8px
    button: string;      // 8px
    buttonSm: string;    // 6px
    pill: string;        // 9999px
    alert: string;       // 12px
  };
  shadows: {
    card: string;
  };
  fonts: {
    serif: string;
    sans: string;
  };
}

export const lightTheme: ThemeDefinition = {
  name: 'light',
  metaThemeColor: '#FFFFFF',
  colors: {
    // Pure white page background, soft sky blue sidebar & blue-tinted surfaces
    bg: '#FFFFFF',
    sidebar: '#DCEBFB',
    sidebarBorder: '#C4D9F3',
    sidebarText: '#0B1B33',
    sidebarIcon: '#1F4E8C',
    sidebarHover: '#CFE2F8',
    surface: '#EEF5FD',
    surfaceAlt: '#E1ECFA',
    border: '#D3E3F8',

    // Near-black navy primary text (#0B1B33) & crisp secondary muted text (#4A5D78)
    text: '#0B1B33',
    textMuted: '#4A5D78',

    // Primary #BBD6F8 with primaryText #0F2F5C; accent/ink #0F3D7A with white text
    primary: '#BBD6F8',
    primaryText: '#0F2F5C',
    primarySoft: '#D8E8FC',
    accent: '#0F3D7A',
    accentText: '#FFFFFF',
    navActiveBg: '#0F3D7A',
    navActiveText: '#FFFFFF',

    // Charts: chart1 #2F6FD0, chart2 #7FB0EA, chart3 #0F3D7A, chart4 #5E7A99, chart5 #BBD6F8
    chart1: '#2F6FD0',
    chart2: '#7FB0EA',
    chart3: '#0F3D7A',
    chart4: '#5E7A99',
    chart5: '#BBD6F8',

    // Status Tints
    success: '#2F6FD0',
    successSoft: '#D8E8FC',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    danger: '#D9383A',
    dangerSoft: '#FEE2E2',
  },
  radius: {
    card: '24px',
    panel: '12px',
    input: '8px',
    button: '8px',
    buttonSm: '6px',
    pill: '9999px',
    alert: '12px',
  },
  shadows: {
    card: '0 4px 12px -4px rgba(15, 61, 122, 0.18)',
  },
  fonts: {
    serif: '"Source Serif 4", Georgia, serif',
    sans: '"Figtree", system-ui, sans-serif',
  },
};

export const darkTheme: ThemeDefinition = {
  name: 'dark',
  metaThemeColor: '#0A1220',
  colors: {
    // Deep blue dark page & surfaces with AA contrast
    bg: '#0A1220',
    sidebar: '#0D1830',
    sidebarBorder: '#243A5F',
    sidebarText: '#F2F7FF',
    sidebarIcon: '#7FB0EA',
    sidebarHover: '#182A4A',
    surface: '#12203A',
    surfaceAlt: '#182A4A',
    border: '#243A5F',

    // Crisp high-contrast dark text (#F2F7FF) & clear muted text (#B4C2DC)
    text: '#F2F7FF',
    textMuted: '#B4C2DC',

    // Primary #6FA8F0 with primaryText #0A1220; accent/ink #D6E6FF with dark text #0A1220
    primary: '#6FA8F0',
    primaryText: '#0A1220',
    primarySoft: '#182A4A',
    accent: '#D6E6FF',
    accentText: '#0A1220',
    navActiveBg: '#6FA8F0',
    navActiveText: '#0A1220',

    // Charts: #6FA8F0, #3D75C9, #D6E6FF, #7C93B8, #2A4F8F
    chart1: '#6FA8F0',
    chart2: '#3D75C9',
    chart3: '#D6E6FF',
    chart4: '#7C93B8',
    chart5: '#2A4F8F',

    // Status Tints
    success: '#6FA8F0',
    successSoft: '#182A4A',
    warning: '#FBBF24',
    warningSoft: '#452A0A',
    danger: '#F87171',
    dangerSoft: '#451A1A',
  },
  radius: {
    card: '24px',
    panel: '12px',
    input: '8px',
    button: '8px',
    buttonSm: '6px',
    pill: '9999px',
    alert: '12px',
  },
  shadows: {
    card: '0 4px 16px -4px rgba(0, 0, 0, 0.5)',
  },
  fonts: {
    serif: '"Source Serif 4", Georgia, serif',
    sans: '"Figtree", system-ui, sans-serif',
  },
};
