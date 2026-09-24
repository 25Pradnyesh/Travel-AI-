import { useMemo } from 'react';
import { Theme } from '@/constants';

export function useTheme() {
  return useMemo(() => Theme, []);
}

export default useTheme;
