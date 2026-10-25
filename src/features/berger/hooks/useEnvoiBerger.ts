import { useRouter } from 'expo-router';
import { useSynchronisation } from '@/features/sync/useSynchronisation';
import { useAEnvoyer } from '@/shared/hooks/useAEnvoyer';
import { ROUTES } from '@/shared/constants/routes';

/**
 * La pastille « Envoyer » du mode normal : le nombre de saisies qui attendent, et l'envoi. Sans connexion, l'appui ouvre l'écran de synchronisation.
 */
export function useEnvoiBerger() {
  const router = useRouter();
  const sync = useSynchronisation();
  const aEnvoyer = useAEnvoyer();
  const envoyer = async () => {
    if (sync.occupe) return;
    if (!sync.connexion) return router.push(ROUTES.GOOGLE_DRIVE as never);
    await sync.envoyer();
  };
  return { aEnvoyer, envoyer };
}
