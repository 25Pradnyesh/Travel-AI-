export type TabRoute = 'index' | 'explore' | 'saved' | 'profile';

export type RootStackParamList = {
  '(tabs)': undefined;
  'analyze/processing': { url?: string };
  'analyze/results': { id?: string };
  'place/[id]': { id: string; name?: string };
};
