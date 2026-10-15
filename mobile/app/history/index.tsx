/**
 * VAMO Mobile — History Index Route
 *
 * Analysis History is now unified inside the Saved tab ("Saved | History" toggle).
 * This route redirects to /(tabs)/saved?tab=history to preserve URL compatibility.
 */

import React from 'react';
import { Redirect } from 'expo-router';

export default function HistoryIndexRedirect() {
  return <Redirect href={{ pathname: '/(tabs)/saved', params: { tab: 'history' } }} />;
}
