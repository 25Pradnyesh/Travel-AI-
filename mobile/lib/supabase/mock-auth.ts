/**
 * VAMO Mobile — DEV Mock Auth Override Service
 *
 * Allows instant visual inspection and verification of Login and Profile screens in:
 * - 'real': Normal live Supabase authentication
 * - 'guest': Unauthenticated guest mode
 * - 'signed-in': Authenticated with mock profile (name, email, avatar initial)
 * - 'loading': Active authentication / session loading state
 * - 'error': Failed authentication error state
 * - 'unavailable': Sign-in unavailable / unreachable state
 */

export type MockAuthState = 'real' | 'guest' | 'signed-in' | 'loading' | 'error' | 'unavailable';

let currentMockState: MockAuthState = 'real';
const mockListeners = new Set<(state: MockAuthState) => void>();

export function getMockAuthState(): MockAuthState {
  return currentMockState;
}

export function setMockAuthState(state: MockAuthState): void {
  currentMockState = state;
  mockListeners.forEach((l) => l(state));
}

export function subscribeMockAuthState(listener: (state: MockAuthState) => void): () => void {
  mockListeners.add(listener);
  return () => {
    mockListeners.delete(listener);
  };
}

export const MOCK_USER: any = {
  id: 'mock-user-12345',
  email: 'alex.traveler@example.com',
  user_metadata: {
    full_name: 'Alex Rivera',
    name: 'Alex Rivera',
  },
  app_metadata: {
    provider: 'google',
  },
  role: 'authenticated',
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const MOCK_SESSION: any = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER,
};
