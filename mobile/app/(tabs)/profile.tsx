import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Profile tab redirect
 * Profile has been elevated to a top-level Stack screen accessed from the top-right avatar.
 */
export default function TabProfileRedirect() {
  return <Redirect href="/profile" />;
}
