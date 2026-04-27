import { TextStyle } from 'react-native';

// Duolingo uses a custom rounded family ("din round" / Feather). For a prototype
// we lean on the system font and rely on weight + tracking to read close.
export const typography = {
  display: { fontSize: 28, fontWeight: '800', letterSpacing: 0.2 } as TextStyle,
  h1: { fontSize: 24, fontWeight: '800' } as TextStyle,
  h2: { fontSize: 20, fontWeight: '800' } as TextStyle,
  h3: { fontSize: 17, fontWeight: '700' } as TextStyle,
  body: { fontSize: 15, fontWeight: '500' } as TextStyle,
  caption: { fontSize: 13, fontWeight: '600', letterSpacing: 0.4 } as TextStyle,
  button: { fontSize: 15, fontWeight: '800', letterSpacing: 0.8 } as TextStyle,
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

export const spacing = (n: number) => n * 4;
