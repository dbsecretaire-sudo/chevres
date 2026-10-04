import { Screen } from '@/shared/components/Screen';
import { EmptyState } from '@/shared/components/EmptyState';
import { TEXTES } from '@/shared/textes';

/** Écran RH : l'onglet est en place, son contenu viendra dans un second temps. */
export default function RessourcesHumaines() {
  return (
    <Screen>
      <EmptyState
        title={TEXTES.rh.ressourcesHumaines.bientot}
        subtitle={TEXTES.rh.ressourcesHumaines.description}
      />
    </Screen>
  );
}
