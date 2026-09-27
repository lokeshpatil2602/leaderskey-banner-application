import { Platform, TextStyle } from 'react-native';

export type FontOption = {
  id: string;
  label: string;
  description: string;
  getStyle: () => TextStyle;
};

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'Sans-Serif',
    label: 'Modern',
    description: 'Clean Sans',
    getStyle: () => ({
      fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
      fontWeight: '700'
    })
  },
  {
    id: 'Serif',
    label: 'Classic',
    description: 'Elegant Serif',
    getStyle: () => ({
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      fontWeight: '600'
    })
  },
  {
    id: 'Monospace',
    label: 'Typewriter',
    description: 'Monospace',
    getStyle: () => ({
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      fontWeight: '600'
    })
  },
  {
    id: 'Condensed',
    label: 'Impact',
    description: 'Bold Condensed',
    getStyle: () => ({
      fontFamily: Platform.select({
        ios: 'Impact',
        android: 'sans-serif-condensed',
        default: 'sans-serif-condensed'
      }),
      fontWeight: '800'
    })
  },
  {
    id: 'Casual',
    label: 'Casual',
    description: 'Friendly Script',
    getStyle: () => ({
      fontFamily: Platform.select({
        ios: 'Snell Roundhand',
        android: 'casual',
        default: 'cursive'
      }),
      fontWeight: '500'
    })
  },
  {
    id: 'Light',
    label: 'Minimal',
    description: 'Thin Light',
    getStyle: () => ({
      fontFamily: Platform.select({
        ios: 'Helvetica-Light',
        android: 'sans-serif-light',
        default: 'sans-serif-light'
      }),
      fontWeight: '300'
    })
  }
];

export const getResolvedFontStyle = (fontId?: string): TextStyle => {
  if (!fontId) {
    return FONT_OPTIONS[0].getStyle();
  }

  const exact = FONT_OPTIONS.find(
    (f) =>
      f.id.toLowerCase() === fontId.toLowerCase() ||
      f.label.toLowerCase() === fontId.toLowerCase()
  );
  if (exact) {
    return exact.getStyle();
  }

  const lower = fontId.toLowerCase();
  if (lower.includes('serif') || lower.includes('georgia') || lower.includes('times')) {
    return FONT_OPTIONS[1].getStyle();
  }
  if (lower.includes('mono') || lower.includes('courier') || lower.includes('code')) {
    return FONT_OPTIONS[2].getStyle();
  }
  if (lower.includes('condensed') || lower.includes('impact') || lower.includes('montserrat')) {
    return FONT_OPTIONS[3].getStyle();
  }
  if (lower.includes('casual') || lower.includes('cursive') || lower.includes('script') || lower.includes('poppins')) {
    return FONT_OPTIONS[4].getStyle();
  }
  if (lower.includes('light') || lower.includes('thin') || lower.includes('inter')) {
    return FONT_OPTIONS[5].getStyle();
  }

  return FONT_OPTIONS[0].getStyle();
};
