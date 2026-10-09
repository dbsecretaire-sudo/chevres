import { Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { ListRow } from '@/shared/components/ListRow';
import type { Element, StatutElement } from '@/features/dossiers/types';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { estEnRetard } from '@/features/dossiers/services/recherche';
import { LABEL_STATUT_ELEMENT } from '@/shared/textes/libelles';
import { ROUTES } from '@/shared/constants/routes';
import { formatDateFR, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { TEXTES } from '@/shared/textes';

const PUCES_STATUT = Object.entries(LABEL_STATUT_ELEMENT).map(([valeur, label]) => ({ valeur, label }));

interface Props {
  element: Element;
  /** Chemin affiché sous le titre (« Client › Dossier ») dans les résultats de recherche. */
  chemin?: string;
  /** Quand il est donné, des puces permettent de changer l'avancement d'un geste (à faire, en cours, terminé). */
  onStatut?: (statut: StatutElement) => void;
}

/** Un contenu dans une liste : titre, date, avancement et échéance (en rouge si elle est dépassée). */
export function LigneElement({ element, chemin, onStatut }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const enRetard = estEnRetard(element, todayISO());

  // Ce qu'il faut savoir d'un coup d'œil : où il est rangé, l'échéance (et le retard), le statut quand aucune puce ne l'affiche.
  const infos = [
    chemin,
    !element.echeance ? formatDateFR(element.date) : undefined,
    !onStatut && statutEffectif(element) ? LABEL_STATUT_ELEMENT[statutEffectif(element)!] : undefined,
    enRetard ? TEXTES.dossiers.element.enRetard : undefined,
    element.echeance ? TEXTES.dossiers.element.echeanceLe(formatDateFR(element.echeance)) : undefined,
    element.fichiers && element.fichiers.length > 0
      ? TEXTES.fichiers.nombre(element.fichiers.length)
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ListRow
      title={element.titre}
      subtitle={
        <View>
          <Text style={enRetard ? styles.carteAlerte : undefined}>{infos}</Text>
          {element.etiquettes && element.etiquettes.length > 0 ? (
            <View style={styles.ligneEtiquettes}>
              {element.etiquettes.map((e) => (
                <Text key={e} style={styles.etiquette}>
                  {e}
                </Text>
              ))}
            </View>
          ) : null}
          {onStatut ? (
            <View style={styles.ligneEtiquettes}>
              <PucesDefilantes<string>
                puces={PUCES_STATUT}
                valeur={statutEffectif(element) ?? ''}
                onChoisir={(v) => onStatut(v as StatutElement)}
              />
            </View>
          ) : null}
        </View>
      }
      onPress={() => {
        // Ouvert depuis l'accueil (hors de l'onglet Activité) : on reconstruit l'arborescence — dossier du client, puis
        // sous-dossier — pour que « retour » ramène dans le sous-dossier du contenu et non à l'accueil.
        if (!pathname.startsWith(ROUTES.CLIENTS_EXPLORATEUR)) {
          router.push(ROUTES.dossierClient(element.clientId));
          router.push(ROUTES.sousDossier(element.dossierId));
        }
        router.push(ROUTES.element(element.id));
      }}
    />
  );
}
