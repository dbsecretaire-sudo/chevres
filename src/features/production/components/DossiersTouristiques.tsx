import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { Contact } from '@/features/contacts/services/contacts';
import { listTousControles } from '@/features/exploitation/repository/controles';
import { dossiersTouristiques, nombreDeContenus } from '@/features/exploitation/services/dossiersDeContenus';
import type { Controle } from '@/features/exploitation/types';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lieux.tourisme.dossiers;

/**
 * Les dossiers touristiques, sur la page de l'office de tourisme : ceux qu'on a marqués touristiques dans les dossiers d'un contact (la Route des Sens
 * Authentiques de l'ODARC…), chacun avec le contact qui le range. On ne les crée pas ici : un dossier devient touristique depuis le dossier du contact.
 */
export function DossiersTouristiques({
  contacts,
  ouvrir,
}: {
  /** Tous les contacts : le contact qui range un dossier peut être un autre (l'ODARC). */
  contacts: Contact[];
  ouvrir: (route: string) => void;
}) {
  const [controles, setControles] = useState<Controle[]>([]);

  useFocusEffect(
    useCallback(() => {
      listTousControles()
        .then(setControles)
        .catch(() => undefined);
    }, []),
  );

  const dossiers = dossiersTouristiques(controles).map(({ entree, dossier }) => ({
    entree,
    dossier,
    contact: contacts.find(
      (c) =>
        (!!c.fournisseur && entree.fournisseurId === c.fournisseur.id) ||
        (!!c.client && entree.clientId === c.client.id),
    ),
  }));

  return (
    <GroupeAccueil titre={T.groupe}>
      <BlocLignes>
        {dossiers.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucun}</Text> : null}
        {dossiers.map(({ entree, dossier, contact }) => (
          <ListRow
            key={`${entree.id}-${dossier.id}`}
            title={dossier.nom}
            subtitle={[
              contact?.nom,
              TEXTES.production.lieux.groupement.dossiers.contenus(
                nombreDeContenus(entree as Controle, dossier.id),
              ),
            ]
              .filter(Boolean)
              .join(' · ')}
            icone="folder"
            onPress={() => contact && ouvrir(ROUTES.contactDossier(contact.cle, dossier.id))}
          />
        ))}
      </BlocLignes>
    </GroupeAccueil>
  );
}
