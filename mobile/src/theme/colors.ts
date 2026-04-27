// Duolingo-inspired dark theme palette.
export const colors = {
  // Surfaces
  bg: '#131F24',
  bgElevated: '#1F2C34',
  surface: '#202F36',
  surfaceAlt: '#37464F',
  divider: '#37464F',

  // Text
  text: '#F1F7FB',
  textMuted: '#AFAFAF',
  textDim: '#7C8B95',

  // Brand
  green: '#58CC02',
  greenDark: '#58A700',
  greenShadow: '#46A302',

  blue: '#1CB0F6',
  blueDark: '#1899D6',

  red: '#FF4B4B',
  redDark: '#EA2B2B',

  yellow: '#FFC800',
  yellowDark: '#E5A700',

  orange: '#FF9600',
  orangeDark: '#E08600',

  purple: '#CE82FF',
  purpleDark: '#A560E8',

  // Currencies / Streak
  streak: '#FF9600',
  gem: '#1CB0F6',

  // Lesson nodes
  lessonLocked: '#37464F',
  lessonLockedShadow: '#2A3A42',
  lessonActive: '#FFC800',
  lessonActiveShadow: '#C99A00',
  lessonComplete: '#58CC02',
  lessonCompleteShadow: '#46A302',

  // Unit / Section banner colors (cycled per unit)
  unitPalette: [
    { bg: '#58CC02', shadow: '#46A302' },
    { bg: '#CE82FF', shadow: '#A560E8' },
    { bg: '#1CB0F6', shadow: '#1899D6' },
    { bg: '#FF9600', shadow: '#E08600' },
    { bg: '#FF4B4B', shadow: '#EA2B2B' },
  ],
};

export type UnitPalette = (typeof colors.unitPalette)[number];
