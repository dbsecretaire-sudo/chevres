import type { ReactNode } from 'react';
import { View } from 'react-native';
import { EnteteBerger } from '@/features/berger/components/EnteteBerger';
import { useEnvoiBerger } from '@/features/berger/hooks/useEnvoiBerger';

interface Props {
  /** Le titre de la page (ex : « Lait du jour »). */
  titre: string;
  /** Le retour de la page : la flèche ronde de l'en-tête. */
  onRetour: () => void;
  children: ReactNode;
}

/** Une page du mode normal (fromagerie, tourisme) : son en-tête commun, puis son contenu. */
export function PageBerger({ titre, onRetour, children }: Props) {
  const { aEnvoyer, envoyer } = useEnvoiBerger();
  return (
    <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12 }}>
      <EnteteBerger titre={titre} onRetour={onRetour} aEnvoyer={aEnvoyer} onEnvoyer={envoyer} />
      {children}
    </View>
  );
}
