import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/shared/components/EmptyState';
import { FormField } from '@/shared/components/FormField';
import { ListRow } from '@/shared/components/ListRow';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { LigneElement } from '@/features/dossiers/components/LigneElement';
import type { EtatExplorateur } from '@/features/dossiers/hooks/useExplorateur';
import { cheminDuDossier } from '@/features/dossiers/services/arborescence';
import { FILTRE_DOSSIERS } from '@/shared/constants/dossiers';
import { ROUTES } from '@/shared/constants/routes';
import { LABEL_FILTRE_DOSSIERS } from '@/shared/textes/libelles';
import { nomComplet } from '@/shared/utils/personne';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { TEXTES } from '@/shared/textes';

const PUCES = Object.values(FILTRE_DOSSIERS).map((valeur) => ({
  valeur,
  label: LABEL_FILTRE_DOSSIERS[valeur],
}));

interface Props {
  /** L'état de la recherche de l'écran (voir useExplorateur, avec la portée de la recherche). */
  etat: EtatExplorateur;
  /** Vrai dans un dossier : la recherche s'y limite, et le champ le dit. */
  dansUnDossier?: boolean;
  /** Ce que l'écran affiche quand on ne cherche rien. */
  children: ReactNode;
}

/**
 * La recherche et les filtres d'avancement, présents à chaque niveau de l'explorateur : sans terme ni filtre, l'écran
 * montre son contenu habituel ; sinon, les résultats (clients, dossiers, contenus) prennent sa place.
 */
export function RechercheDossiers({ etat: e, dansUnDossier, children }: Props) {
  const router = useRouter();
  const T = TEXTES.dossiers.explorateur;
  const chemin = (dossierId: string) => cheminDuDossier(dossierId, e.archive.sousDossiers, e.clients);

  const aucunResultat =
    e.resultats &&
    e.resultats.clients.length + e.resultats.sousDossiers.length + e.resultats.elements.length === 0;

  return (
    <>
      <FormField
        label={TEXTES.commun.general.rechercher}
        value={e.requete}
        onChangeText={e.setRequete}
        placeholder={dansUnDossier ? T.dansCeDossier : T.rechercher}
      />
      <PucesDefilantes puces={PUCES} valeur={e.filtre} onChoisir={e.setFiltre} />

      {!e.resultats ? (
        children
      ) : aucunResultat ? (
        <EmptyState title={T.aucunResultat} subtitle={T.modifiezLaRecherche} />
      ) : (
        <>
          {e.resultats.clients.length > 0 && (
            <>
              <Text style={styles.titreSection}>{T.resultatsClients}</Text>
              {e.resultats.clients.map((client) => (
                <ListRow
                  key={client.id}
                  title={nomComplet(client)}
                  subtitle={[client.telephone, client.email].filter(Boolean).join(' · ') || undefined}
                  onPress={() => router.push(ROUTES.dossierClient(client.id))}
                />
              ))}
            </>
          )}
          {e.resultats.sousDossiers.length > 0 && (
            <>
              <Text style={styles.titreSection}>{T.resultatsDossiers}</Text>
              {e.resultats.sousDossiers.map((dossier) => (
                <ListRow
                  key={dossier.id}
                  title={dossier.nom}
                  subtitle={chemin(dossier.id)}
                  onPress={() => router.push(ROUTES.sousDossier(dossier.id))}
                />
              ))}
            </>
          )}
          {e.resultats.elements.length > 0 && (
            <>
              <Text style={styles.titreSection}>{T.resultatsContenus}</Text>
              {e.resultats.elements.map((element) => (
                <LigneElement key={element.id} element={element} chemin={chemin(element.dossierId)} />
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}
