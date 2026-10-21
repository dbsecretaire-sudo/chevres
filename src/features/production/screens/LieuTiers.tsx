import { useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LigneTransaction } from '@/features/comptabilite/components/LigneTransaction';
import { listTransactions, type Transaction } from '@/features/comptabilite/services/transactions';
import { useCategoriesContact } from '@/features/contacts/hooks/useCategoriesContact';
import { listContacts } from '@/features/contacts/repository';
import { routeAvecContact } from '@/features/accueil/services/routeAvecContact';
import type { Contact } from '@/features/contacts/services/contacts';
import { categorieDuContact } from '@/features/contacts/services/fiche';
import {
  ecrituresDuLieu,
  estLieuTiers,
  LIEUX_TIERS,
  type CleLieuTiers,
} from '@/features/accueil/services/lieuxTiers';
import { portraitDeTiers } from '@/features/contacts/services/portraitTiers';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { BlocLignes } from '@/shared/components/BlocListe';
import { AntenneGds, estLAntenneGds } from '@/features/production/components/AntenneGds';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lieux;

/** Les textes d'un lieu : un lieu sans tiers (l'entrepôt) n'a que son titre et ses rubriques. */
interface TextesLieu {
  titre: string;
  groupeTiers?: string;
  ajouterTiers?: string;
  groupeEcritures?: string;
  nouvelle?: string;
  versement?: string;
  liens: object;
  /** Pour une association ou une coopérative agricole : le titre et la nouvelle écriture de chaque volet. */
  volets?: Record<string, { titre: string; nouvelle: string }>;
  aucuneEcritureVolet?: string;
}
/** Combien d'écritures la page en montre : les plus récentes ; les autres sont dans la comptabilité. */
const ECRITURES_MONTREES = 5;

/**
 * La page d'un lieu de la carte de la ferme (pompe à essence, vétérinaire, foin et maïs, organismes, équarrissage, abattoir, boucherie) :
 * les contacts du lieu, les écritures de l'année qui le concernent avec « Nouvelle facture », et les rubriques de l'application qui s'y
 * rattachent. Le lieu se donne en paramètre (`?lieu=carburant`).
 */
export default function LieuTiers() {
  const { lieu } = useLocalSearchParams<{ lieu?: string }>();
  const cle: CleLieuTiers = estLieuTiers(lieu) ? lieu : 'aliments';
  const config = LIEUX_TIERS[cle];
  /** Ouvre une page depuis cette page : sa flèche de retour (et « Annuler », et l'enregistrement d'une écriture) ramène ici, pas à l'onglet d'avant. */
  const ouvrir = useOuvrir();
  const textes: TextesLieu = T[cle];
  const { settings } = useAppSettings();
  const { idsConnus } = useCategoriesContact();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  const tiers = useMemo(
    () =>
      contacts.filter((c) => config.categoriesContact.includes(categorieDuContact(c, idsConnus).id ?? '')),
    [contacts, idsConnus, config],
  );
  const ecritures = useMemo(
    () =>
      ecrituresDuLieu(
        config,
        transactions,
        tiers.map((c) => c.nom),
        (categorie) => LABEL_CATEGORIE_VENTE[categorie as keyof typeof LABEL_CATEGORIE_VENTE],
      ),
    [config, transactions, tiers],
  );
  // La nouvelle écriture du lieu : avec son intervenant déjà choisi dans « Contact » (recette ou dépense). Un lieu qui n'a qu'un intervenant le donne
  // tel quel ; avec plusieurs, le choix reste à faire (la fiche de chacun a ses propres « Nouvelle dépense / recette »), sauf pour le groupement sanitaire.
  const intervenant = config.contactParDefaut ? tiers[0] : tiers.length === 1 ? tiers[0] : undefined;
  const routeNouvelle = routeAvecContact(config.nouvelle, intervenant);
  const routeVersement = config.recetteDuLieu
    ? routeAvecContact(`${ROUTES.COMPTABILITE_NOUVELLE}?type=emise&categorie=${config.recetteDuLieu}`, intervenant)
    : undefined;
  const liens = config.liens.map((l) => ({
    ...l,
    ...(textes.liens as Record<string, { titre: string; aide: string }>)[l.cle],
  }));

  return (
    <Screen>
      {liens.length > 0 ? (
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
      ) : null}

      {/* L'antenne du GDS : sa carte disparaît dès qu'elle est dans les contacts (elle y est alors avec les autres groupements sanitaires). */}
      {cle === 'groupementSanitaire' && !contacts.some(estLAntenneGds) ? (
        <AntenneGds onAjoutee={() => listContacts().then(setContacts).catch(() => undefined)} />
      ) : null}

      {config.avecTiers ? (
        <>
          <GroupeAccueil titre={textes.groupeTiers ?? ''}>
            <BlocLignes>
              {tiers.map((c) => (
                <ListRow
                  key={c.cle}
                  title={c.nom}
                  subtitle={
                    [(c.client ?? c.fournisseur)?.telephone, (c.client ?? c.fournisseur)?.email]
                      .filter(Boolean)
                      .join(' · ') || undefined
                  }
                  emoji={portraitDeTiers(categorieDuContact(c, idsConnus).id).emoji}
                  onPress={() => ouvrir(ROUTES.ficheContact(c.cle))}
                />
              ))}
              {tiers.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunTiers}</Text> : null}
              <ListRow
                title={textes.ajouterTiers ?? ''}
                icone="add-circle"
                onPress={() =>
                  ouvrir(
                    config.categoriesContact[0]
                      ? `${ROUTES.CONTACT_NOUVEAU}?categorie=${config.categoriesContact[0]}`
                      : ROUTES.CONTACT_NOUVEAU,
                  )
                }
              />
            </BlocLignes>
          </GroupeAccueil>

          {/* Une association ou une coopérative agricole : un groupe par volet, avec ses écritures de l'année et sa nouvelle écriture. */}
          {(config.volets ?? []).map((v) => {
            const lignes = transactions.filter((t) => t.volet === v.cle);
            return (
              <GroupeAccueil key={v.cle} titre={textes.volets?.[v.cle]?.titre ?? ''}>
                <BlocLignes>
                  {lignes.slice(0, ECRITURES_MONTREES).map((t) => (
                    <LigneTransaction key={`${t.id}:${t.activite}`} item={t} />
                  ))}
                  {lignes.length === 0 ? (
                    <Text style={commonStyles.mutedItalic}>{textes.aucuneEcritureVolet}</Text>
                  ) : null}
                  {lignes.length > ECRITURES_MONTREES ? (
                    <ListRow
                      title={T.plusDEcritures(lignes.length - ECRITURES_MONTREES)}
                      icone="list"
                      onPress={() =>
                        ouvrir(
                          ROUTES.comptabiliteDuLieu(
                            lignes.map((t) => t.id),
                            textes.volets?.[v.cle]?.titre ?? textes.titre,
                          ),
                        )
                      }
                    />
                  ) : null}
                  <ListRow
                    title={textes.volets?.[v.cle]?.nouvelle ?? ''}
                    icone="add-circle"
                    onPress={() => ouvrir(routeAvecContact(v.route, intervenant))}
                  />
                </BlocLignes>
              </GroupeAccueil>
            );
          })}

          {config.volets ? null : (
          <GroupeAccueil titre={textes.groupeEcritures ?? ''}>
            <BlocLignes>
              {ecritures.slice(0, ECRITURES_MONTREES).map((t) => (
                <LigneTransaction key={`${t.id}:${t.activite}`} item={t} />
              ))}
              {ecritures.length === 0 ? (
                <Text style={commonStyles.mutedItalic}>{T.aucuneEcriture}</Text>
              ) : null}
              {ecritures.length > ECRITURES_MONTREES ? (
                <ListRow
                  title={T.plusDEcritures(ecritures.length - ECRITURES_MONTREES)}
                  icone="list"
                  onPress={() =>
                    ouvrir(
                      ROUTES.comptabiliteDuLieu(
                        ecritures.map((t) => t.id),
                        textes.titre,
                      ),
                    )
                  }
                />
              ) : null}
              <ListRow
                title={textes.nouvelle ?? ''}
                icone="add-circle"
                onPress={() => ouvrir(routeNouvelle)}
              />
              {routeVersement && textes.versement ? (
                <ListRow title={textes.versement} icone="add-circle" onPress={() => ouvrir(routeVersement)} />
              ) : null}
            </BlocLignes>
          </GroupeAccueil>
          )}
        </>
      ) : null}
    </Screen>
  );
}
