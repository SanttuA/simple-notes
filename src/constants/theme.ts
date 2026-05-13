import type { ColorSchemeName } from 'react-native';

import type { NoteColor } from '@/types/notes';

export const Colors = {
  light: {
    background: '#F7F5EF',
    surface: '#FFFDF7',
    elevated: '#FFFFFF',
    text: '#202124',
    textMuted: '#6C6258',
    border: '#DED8CC',
    primary: '#2E7D68',
    primarySoft: '#DDEFE8',
    primaryText: '#FFFFFF',
    danger: '#B3261E',
    dangerSoft: '#F9DEDC',
    input: '#FFFFFF',
    shadow: '#000000',
  },
  dark: {
    background: '#151613',
    surface: '#1E201C',
    elevated: '#272922',
    text: '#F3F0E8',
    textMuted: '#BDB6A8',
    border: '#3B3E35',
    primary: '#75C7AC',
    primarySoft: '#173F35',
    primaryText: '#09241D',
    danger: '#F2B8B5',
    dangerSoft: '#601410',
    input: '#22251F',
    shadow: '#000000',
  },
} as const;

export const NotePalette: Record<
  NoteColor,
  { light: string; dark: string; border: string; label: string }
> = {
  default: { light: '#FFFDF7', dark: '#1E201C', border: '#DED8CC', label: 'Plain' },
  sage: { light: '#E5F1E3', dark: '#1C3327', border: '#A7C5A4', label: 'Sage' },
  sky: { light: '#E0EEF8', dark: '#17324A', border: '#A0C3DD', label: 'Sky' },
  amber: { light: '#FFF0C2', dark: '#3D2F12', border: '#E4C469', label: 'Amber' },
  coral: { light: '#FFE0D8', dark: '#4A211C', border: '#E3A093', label: 'Coral' },
  grape: { light: '#ECE2F4', dark: '#332342', border: '#BCA4D0', label: 'Grape' },
  slate: { light: '#E7E9EA', dark: '#293034', border: '#BAC1C4', label: 'Slate' },
};

export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
} as const;

export const Radius = {
  small: 6,
  medium: 8,
  large: 12,
  pill: 999,
} as const;

export const MaxContentWidth = 840;

export function getTheme(scheme: ColorSchemeName) {
  return scheme === 'dark' ? Colors.dark : Colors.light;
}
