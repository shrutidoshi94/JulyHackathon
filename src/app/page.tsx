import { AppVocalBridgeProvider } from '@/components/AppVocalBridgeProvider';
import { VoiceAgent } from '@/components/VoiceAgent';

export default function Home() {
  return (
    <AppVocalBridgeProvider>
      <VoiceAgent />
    </AppVocalBridgeProvider>
  );
}
