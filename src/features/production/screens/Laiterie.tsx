import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LigneTransaction } from '@/features/comptabilite/components/LigneTransaction';
import { listTransactions, type Transaction } from '@/features/comptabilite/services/transactions';
import { useCategoriesContact } from '@/features/contacts/hooks/useCategoriesContact';
import { listContacts } from '@/features/contacts/repository';
import type { Contact } from '@/features/contacts/services/contacts';
import { categorieDuContact } from '@/features/contacts/services/fiche';
import { portraitDeTiers } from '@/features/contacts/services/portraitTiers';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { CATEGORIE_VENTE, CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';
import { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ESPECES_PETITS_RUMINANTS } from '@/shared/constants/primes';
import { ROUTES } from '@/shared/constants/routes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { commonStyles } from '@/shared/styles/commonStyles';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import { Text } from 'react-native';

const T = TEXTES.production.laiterie;
const A = TEXTES.production.accueil;
/** Combien de factures la page en montre : les plus récentes ; les autres sont dans les écritures. */
const FACTURES_MONTREES = 5;

/**
 * La laiterie : tout ce qui touche au lait au même endroit — le lait par animal, sa qualité, puis le récolteur : ses contacts et les
 * factures de lait de l'année.
 */
export default function Laiterie() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const { settings } = useAppSettings();
  const { idsConnus } = useCategoriesContact();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const petitsRuminants = ESPECES_PETITS_RUMINANTS.includes(espece);

  useFocusEffect(
    useCallback(() => {
      listContacts()
        .then(setContacts)
        .catch(() => undefined);
      listTransactions(settings.anneeActive)
        .then(setTransactions)
        .catch(() => undefined);
    }, [settings.anneeActive]),
  );

  const recolteurs = useMemo(
    () => contacts.filter((c) => categorieDuContact(c, idsConnus).id === CATEGORIE_CLIENT.RECOLTEUR),
    [contacts, idsConnus],
  );
  const factures = useMemo(
    () =>
      transactions
        .filter((t) => t.libelleCategorie === LABEL_CATEGORIE_VENTE[CATEGORIE_VENTE.LAIT] || t.categorie === CATEGORIE_RECETTE.LAIT)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions],
  );

  const lait: { cle: string; titre: string; aide: string; icone: keyof typeof Ionicons.glyphMap; route: string }[] = [
    ...(petitsRuminants ? [{ cle: 'productionLait', ...A.productionLait, icone: 'water' as const, route: ROUTES.PRODUCTION_LAIT }] : []),
    { cle: 'laitier', ...A.laitier, icone: 'flask' as const, route: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER) },
  ];

  return (
    <Screen>
      <GroupeAccueil titre={T.groupeLait}>
        <BlocLignes>
          {lait.map((l) => (
            <ListRow key={l.cle} title={l.titre} subtitle={l.aide} icone={l.icone} onPress={() => router.push(l.route as never)} />
          ))}
        </BlocLignes>
      </GroupeAccueil>

      <GroupeAccueil titre={T.groupeRecolteur}>
        <BlocLignes>
          {recolteurs.map((c) => (
            <ListRow
              key={c.cle}
              title={c.nom}
              subtitle={[(c.client ?? c.fournisseur)?.telephone, (c.client ?? c.fournisseur)?.email].filter(Boolean).join(' · ') || undefined}
              emoji={portraitDeTiers(CATEGORIE_CLIENT.RECOLTEUR).emoji}
              onPress={() => router.push(ROUTES.ficheContact(c.cle) as never)}
            />
          ))}
          {recolteurs.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunRecolteur}</Text> : null}
          <ListRow title={T.ajouterRecolteur} icone="add-circle" onPress={() => router.push(ROUTES.CONTACT_NOUVEAU as never)} />
        </BlocLignes>
      </GroupeAccueil>

      <GroupeAccueil titre={T.groupeFactures}>
        <BlocLignes>
          {factures.slice(0, FACTURES_MONTREES).map((t) => (
            <LigneTransaction key={`${t.id}:${t.activite}`} item={t} />
          ))}
          {factures.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucuneFacture}</Text> : null}
          {factures.length > FACTURES_MONTREES ? (
            <ListRow title={T.plusDeFactures(factures.length - FACTURES_MONTREES)} icone="list" onPress={() => router.push(ROUTES.comptabiliteDuLieu(factures.map((t) => t.id), T.titre) as never)} />
          ) : null}
          <ListRow
            title={T.nouvelleFacture}
            icone="add-circle"
            onPress={() => router.push(`${ROUTES.COMPTABILITE_NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.LAIT}` as never)}
          />
        </BlocLignes>
      </GroupeAccueil>
    </Screen>
  );
}
