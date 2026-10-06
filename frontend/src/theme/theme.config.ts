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
  metaThemeColor: '#000000',
  colors: {
    // True black page & sleek dark surfaces with AA contrast
    bg: '#000000',
    sidebar: '#0A0A0A',
    sidebarBorder: '#1F1F23',
    sidebarText: '#F4F4F5',
    sidebarIcon: '#A1A1AA',
    sidebarHover: '#18181B',
    surface: '#0F0F11',
    surfaceAlt: '#18181B',
    border: '#27272A',

    // Crisp high-contrast dark text (#F4F4F5) & clear muted text (#A1A1AA)
    text: '#F4F4F5',
    textMuted: '#A1A1AA',

    // Primary & Accent neutral high-contrast monochromatic design
    primary: '#E4E4E7',
    primaryText: '#000000',
    primarySoft: '#18181B',
    accent: '#FFFFFF',
    accentText: '#000000',
    navActiveBg: '#FFFFFF',
    navActiveText: '#000000',

    // Charts: sleek high-contrast neutrals on black
    chart1: '#FFFFFF',
    chart2: '#A1A1AA',
    chart3: '#71717A',
    chart4: '#52525B',
    chart5: '#3F3F46',

    // Status Tints
    success: '#22C55E',
    successSoft: '#052E16',
    warning: '#EAB308',
    warningSoft: '#422006',
    danger: '#EF4444',
    dangerSoft: '#450A0A',
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
