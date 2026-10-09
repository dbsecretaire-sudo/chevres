import { Screen } from '@/shared/components/Screen';
import { CarteGoogleDrive } from '@/features/settings/components/CarteGoogleDrive';
import { useGoogleDrive } from '@/features/settings/hooks/useGoogleDrive';

/** La synchronisation avec Google Drive, sur son propre écran. */
export default function EcranDrive() {
  const drive = useGoogleDrive();
  return (
    <Screen>
      <CarteGoogleDrive drive={drive} />
    </Screen>
  );
}
