import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export type ColorToken = keyof typeof Colors;
export type SpacingToken = keyof typeof Spacing;
export type RadiusToken = keyof typeof Radius;
export type TypographyToken = keyof typeof Typography;

export type VerificationStatus =
  | 'VERIFIED'
  | 'PARTIAL'
  | 'AI_UNVERIFIED'
  | 'ALGORITHMIC'
  | 'FAILED'
  | 'SKIPPED';
