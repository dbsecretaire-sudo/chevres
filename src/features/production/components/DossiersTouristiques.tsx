import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { assurerEntreeDuContact } from '@/features/contacts/repository';
import type { Contact } from '@/features/contacts/services/contacts';
import { listTousControles, modifierEntree } from '@/features/exploitation/repository/controles';
import {
  avecDossier,
  dossiersTouristiques,
  nombreDeContenus,
} from '@/features/exploitation/services/dossiersDeContenus';
import type { Controle } from '@/features/exploitation/types';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { SelectModal } from '@/shared/components/SelectModal';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lieux.tourisme.dossiers;
const D = TEXTES.production.lieux.groupement.dossiers;

/**
 * Les dossiers touristiques, sur la page de l'office de tourisme : ceux qu'on a marqués touristiques dans les dossiers d'un contact (la Route des Sens
 * Authentiques de l'ODARC…), chacun avec le contact qui le range. « Nouveau dossier » demande d'abord le tiers (office de tourisme ou partenaire) : un dossier
 * touristique est d'office lié à un tiers.
 */
export function DossiersTouristiques({
  tiers,
  contacts,
  ouvrir,
}: {
  /** Les tiers du lieu (offices de tourisme et partenaires) : ceux entre lesquels on choisit pour un nouveau dossier. */
  tiers: Contact[];
  /** Tous les contacts : le contact qui range un dossier peut être un autre (l'ODARC). */
  contacts: Contact[];
  ouvrir: (route: string) => void;
}) {
  const [controles, setControles] = useState<Controle[]>([]);
  const [choixTiers, setChoixTiers] = useState(false);
  /** Le tiers choisi pour le nouveau dossier, dont on demande ensuite le nom. */
  const [tiersChoisi, setTiersChoisi] = useState<Contact | null>(null);

  const charger = useCallback(
    () =>
      listTousControles()
        .then(setControles)
        .catch(() => undefined),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
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

  const creer = async (nom: string) => {
    const contact = tiersChoisi;
    setTiersChoisi(null);
    if (!contact || !nom.trim()) return;
    const id = await assurerEntreeDuContact(contact);
    await modifierEntree(id, (e) => avecDossier(e, nom, undefined, true));
    await charger();
  };

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
        <ListRow
          title={T.nouveau}
          icone="add-circle"
          onPress={() => (tiers.length === 0 ? Alert.alert(T.aucunTiers) : setChoixTiers(true))}
        />
      </BlocLignes>
      <SelectModal<string>
        visible={choixTiers}
        titre={T.choisirTiers}
        value=""
        searchable
        options={tiers.map((c) => ({ value: c.cle, label: c.nom }))}
        onSelect={(cle) => {
          setChoixTiers(false);
          setTiersChoisi(tiers.find((c) => c.cle === cle) ?? null);
        }}
        onClose={() => setChoixTiers(false)}
      />
      <NomModal
        visible={!!tiersChoisi}
        titre={T.nouveauTitre(tiersChoisi?.nom ?? '')}
        placeholder={D.nomDuDossier}
        onValider={creer}
        onAnnuler={() => setTiersChoisi(null)}
      />
    </GroupeAccueil>
  );
}
