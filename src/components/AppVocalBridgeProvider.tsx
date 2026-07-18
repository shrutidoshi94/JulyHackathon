'use client';

import { VocalBridgeProvider } from '@vocalbridgeai/react';
import type { ReactNode } from 'react';

type Props = { children: ReactNode };

/** Wraps the app so hooks can mint tokens via /api/voice-token (key stays server-side). */
export function AppVocalBridgeProvider({ children }: Props) {
  return (
    <VocalBridgeProvider
      options={{
        auth: { tokenUrl: '/api/voice-token' },
        participantName: 'Wanderer',
        autoPlayAudio: true,
        autoAckHeartbeat: true,
        debug: process.env.NODE_ENV === 'development',
      }}
    >
      {children}
    </VocalBridgeProvider>
  );
}
