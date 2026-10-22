import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LigneTransaction } from '@/features/comptabilite/components/LigneTransaction';
import { listTransactions, type Transaction } from '@/features/comptabilite/services/transactions';
import { useCategoriesContact } from '@/features/contacts/hooks/useCategoriesContact';
import { listContacts } from '@/features/contacts/repository';
import { nomDuFournisseur, type Contact } from '@/features/contacts/services/contacts';
import { categorieDuContact, elementsDuContact } from '@/features/contacts/services/fiche';
import { routeAvecContact } from '@/features/accueil/services/routeAvecContact';
import { LIEUX_TIERS } from '@/features/accueil/services/lieuxTiers';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { BlocLignes } from '@/shared/components/BlocListe';
import { DossiersDuContact, entreeDuContact } from '@/features/contacts/components/DossiersDuContact';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { lireArchiveDossiers } from '@/features/dossiers/repository';
import type { ArchiveDossiers } from '@/features/dossiers/types';
import { listTousControles } from '@/features/exploitation/repository/controles';
import type { Controle } from '@/features/exploitation/types';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { SENS_TRANSACTION } from '@/shared/constants/comptabilite';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { ROUTES } from '@/shared/constants/routes';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { LABEL_VOLET_COOPERATIVE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';
import { nomComplet } from '@/shared/utils/personne';

const T = TEXTES.production.lieux;
const G = T.groupement;
const config = LIEUX_TIERS.groupement;
/** Combien d'écritures chaque groupe montre : les plus récentes ; les autres sont dans la comptabilité. */
const ECRITURES_MONTREES = 5;

const voletsDe = (c: Contact): string[] => c.client?.volets ?? c.fournisseur?.volets ?? [];
const libelleDuVolet = (v: string): string =>
  LABEL_VOLET_COOPERATIVE[v as keyof typeof LABEL_VOLET_COOPERATIVE] ?? v;

/** Les noms sous lesquels les écritures d'un contact le portent (son nom, celui de sa fiche client, celui de sa fiche fournisseur). */
const nomsDe = (c: Contact): Set<string> =>
  new Set(
    [c.nom, c.client ? nomComplet(c.client) : '', c.fournisseur ? nomDuFournisseur(c.fournisseur) : '']
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean),
  );

/** Ce qu'une écriture ajoute au solde : une recette en plus, une dépense en moins. */
const effet = (t: Transaction): number =>
  (t.sens === SENS_TRANSACTION.ENTREE ? 1 : -1) * (t.montantActivite ?? t.montant ?? 0);

/** Le solde d'écritures : « +120,00 € » ou « -45,00 € ». */
const soldeEcrit = (ecritures: readonly Transaction[]): string => {
  const solde = Math.round(ecritures.reduce((somme, t) => somme + effet(t), 0) * 100) / 100;
  return `${solde < 0 ? '-' : '+'}${formatMontant(Math.abs(solde))}`;
};

/** Les petites pastilles des volets d'une association ou d'une coopérative. */
function PastillesDesVolets({ volets }: { volets: readonly string[] }) {
  if (volets.length === 0) return <Text style={commonStyles.muted}>{G.aucunVolet}</Text>;
  return (
    <View style={styles.pastilles}>
      {volets.map((v) => (
        <View key={v} style={styles.pastille}>
          <Text style={styles.pastilleTexte}>{libelleDuVolet(v)}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * La page « Association et coopérative agricole » : la liste des associations et coopératives (une carte chacune : son nom, ses volets et son solde de l'année),
 * puis, en ouvrant l'une d'elles (`?association=`), sa fiche : seulement ses volets, avec leurs écritures de l'année et leur nouvelle écriture.
 */
export default function LieuAssociations() {
  const { association } = useLocalSearchParams<{ association?: string }>();
  const ouvrir = useOuvrir();
  const { settings } = useAppSettings();
  const { idsConnus } = useCategoriesContact();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [controles, setControles] = useState<Controle[]>([]);
  const [dossiers, setDossiers] = useState<ArchiveDossiers>({ sousDossiers: [], elements: [] });
  const [onglet, setOnglet] = useState<'dossiers' | 'comptabilite'>('dossiers');

  /** Relit les contenus des partenaires et le secrétariat : après chaque changement des dossiers de l'association. */
  const chargerLesDossiers = useCallback(() => {
    listTousControles()
      .then(setControles)
      .catch(() => undefined);
    lireArchiveDossiers()
      .then(setDossiers)
      .catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerLesDossiers();
      listContacts()
        .then(setContacts)
        .catch(() => undefined);
      listTransactions(settings.anneeActive)
        .then(setTransactions)
        .catch(() => undefined);
    }, [settings.anneeActive, chargerLesDossiers]),
  );

  const associations = useMemo(
    () => contacts.filter((c) => categorieDuContact(c, idsConnus).id === CATEGORIE_FOURNISSEUR.GROUPEMENT),
    [contacts, idsConnus],
  );
  const ecrituresDe = useCallback(
    (c: Contact) => {
      const noms = nomsDe(c);
      return transactions.filter((t) => noms.has(t.titre.trim().toLowerCase()));
    },
    [transactions],
  );
  const choisie = association ? associations.find((c) => c.cle === association) : undefined;

  const liens = config.liens.map((l) => ({
    ...l,
    ...(G.liens as Record<string, { titre: string; aide: string }>)[l.cle],
  }));
  const rangeeDesLiens =
    liens.length === 0 ? null : (
      <GroupeAccueil titre={T.groupeLiens}>
        <BlocLignes>
          {liens.map((l) => (
            <ListRow
              key={l.cle}
              title={l.titre}
              subtitle={l.aide}
              icone={l.icone}
              onPress={() => ouvrir(l.route)}
            />
          ))}
        </BlocLignes>
      </GroupeAccueil>
    );

  /** Un groupe d'écritures avec ses plus récentes, le lien vers les autres et le bouton de la nouvelle écriture. */
  const groupeDEcritures = (
    cle: string,
    titre: string,
    lignes: Transaction[],
    vide: string,
    nouvelle: string,
    route: string,
  ) => (
    <GroupeAccueil key={cle} titre={titre}>
      <BlocLignes>
        {lignes.slice(0, ECRITURES_MONTREES).map((t) => (
          <LigneTransaction key={`${t.id}:${t.activite}`} item={t} />
        ))}
        {lignes.length === 0 ? <Text style={commonStyles.mutedItalic}>{vide}</Text> : null}
        {lignes.length > ECRITURES_MONTREES ? (
          <ListRow
            title={T.plusDEcritures(lignes.length - ECRITURES_MONTREES)}
            icone="list"
            onPress={() =>
              ouvrir(
                ROUTES.comptabiliteDuLieu(
                  lignes.map((t) => t.id),
                  titre,
                ),
              )
            }
          />
        ) : null}
        <ListRow title={nouvelle} icone="add-circle" onPress={() => ouvrir(route)} />
      </BlocLignes>
    </GroupeAccueil>
  );

  if (choisie) {
    const siennes = ecrituresDe(choisie);
    const volets = voletsDe(choisie);
    const simples = siennes.filter((t) => !t.volet);
    // Les dossiers de cette association seulement : ses courriers, démarches, aides et notes (rangés sous sa fiche) et les éléments de son dossier.
    const siens = elementsDuContact(choisie, controles, dossiers);
    return (
      <Screen>
        <View style={styles.entete}>
          <Text style={styles.nom}>{choisie.nom}</Text>
          <PastillesDesVolets volets={volets} />
          <Text style={commonStyles.muted}>{G.soldeAnnee(settings.anneeActive, soldeEcrit(siennes))}</Text>
        </View>
        <BlocLignes>
          <ListRow
            title={G.modifierFiche}
            icone="create"
            onPress={() => ouvrir(ROUTES.ficheContact(choisie.cle))}
          />
        </BlocLignes>
        <PucesDefilantes<'dossiers' | 'comptabilite'>
          puces={[
            { valeur: 'dossiers', label: G.ongletDossiers(siens.length) },
            { valeur: 'comptabilite', label: G.ongletComptabilite },
          ]}
          valeur={onglet}
          onChoisir={setOnglet}
        />
        {onglet === 'dossiers' ? (
          <DossiersDuContact
            contact={choisie}
            entree={entreeDuContact(controles, choisie)}
            ouvrir={ouvrir}
            onChange={chargerLesDossiers}
          />
        ) : null}
        {/* Un groupe par volet coché sur sa fiche ; sans volet coché, seulement ses écritures simples. */}
        {onglet === 'comptabilite' ? (
          <>
            {(config.volets ?? [])
              .filter((v) => volets.includes(v.cle))
              .map((v) =>
                groupeDEcritures(
                  v.cle,
                  G.volets[v.cle as keyof typeof G.volets].titre,
                  siennes.filter((t) => t.volet === v.cle),
                  G.aucuneEcritureVolet,
                  G.volets[v.cle as keyof typeof G.volets].nouvelle,
                  routeAvecContact(v.route, choisie),
                ),
              )}
            {groupeDEcritures(
              'simples',
              volets.length > 0 ? G.autresEcritures : G.groupeEcritures,
              simples,
              T.aucuneEcriture,
              G.nouvelleSimple,
              routeAvecContact(config.nouvelle, choisie),
            )}
          </>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      {rangeeDesLiens}
      <GroupeAccueil titre={G.groupeTiers}>
        {associations.map((c) => (
          <Pressable
            key={c.cle}
            style={styles.carte}
            onPress={() => ouvrir(`${ROUTES.lieu('groupement')}&association=${c.cle}`)}
            accessibilityRole="button"
            accessibilityLabel={c.nom}
          >
            <Text style={styles.nom}>🤝 {c.nom}</Text>
            <PastillesDesVolets volets={voletsDe(c)} />
            <Text style={commonStyles.muted}>
              {G.soldeAnnee(settings.anneeActive, soldeEcrit(ecrituresDe(c)))}
            </Text>
          </Pressable>
        ))}
        {associations.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunTiers}</Text> : null}
        <BlocLignes>
          <ListRow
            title={G.ajouterTiers}
            icone="add-circle"
            onPress={() => ouvrir(`${ROUTES.CONTACT_NOUVEAU}?categorie=${CATEGORIE_FOURNISSEUR.GROUPEMENT}`)}
          />
        </BlocLignes>
      </GroupeAccueil>
    </Screen>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: colors.blanc,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE5D2',
    padding: 12,
    gap: 6,
    marginBottom: 8,
  },
  entete: { gap: 6 },
  nom: { fontSize: 17, fontWeight: '800', color: colors.primary },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pastille: { backgroundColor: '#E9F0E1', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pastilleTexte: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
