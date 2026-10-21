import { useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LigneTransaction } from '@/features/comptabilite/components/LigneTransaction';
import { listTransactions, type Transaction } from '@/features/comptabilite/services/transactions';
import { useCategoriesContact } from '@/features/contacts/hooks/useCategoriesContact';
import { listContacts } from '@/features/contacts/repository';
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
import { AntenneGds } from '@/features/production/components/AntenneGds';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
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
}
/** Combien d'écritures la page en montre : les plus récentes ; les autres sont dans la comptabilité. */
const ECRITURES_MONTREES = 5;

/**
 * La page d'un lieu de la carte de la ferme (pompe à essence, vétérinaire, foin et maïs, organismes, équarrissage, abattoir, boucherie) :
 * les contacts du lieu, les écritures de l'année qui le concernent avec « Nouvelle facture », et les rubriques de l'application qui s'y
 * rattachent. Le lieu se donne en paramètre (`?lieu=carburant`).
 */
export default function LieuTiers() {
  const router = useRouter();
  const { lieu } = useLocalSearchParams<{ lieu?: string }>();
  const cle: CleLieuTiers = estLieuTiers(lieu) ? lieu : 'aliments';
  const config = LIEUX_TIERS[cle];
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
  // La nouvelle écriture du lieu : avec le premier contact du lieu déjà choisi quand le lieu le demande (le groupement sanitaire : le GDS).
  const premier = tiers[0];
  const parDefaut = (param: 'fournisseur' | 'client', id?: string) =>
    config.contactParDefaut && id ? `&${param}=${id}` : '';
  const routeNouvelle = `${config.nouvelle}${parDefaut('fournisseur', premier?.fournisseur?.id)}`;
  const routeVersement = config.recetteDuLieu
    ? `${ROUTES.COMPTABILITE_NOUVELLE}?type=emise&categorie=${config.recetteDuLieu}${parDefaut('client', premier?.client?.id)}`
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
                onPress={() => router.push(l.route as never)}
              />
            ))}
          </BlocLignes>
        </GroupeAccueil>
      ) : null}

      {cle === 'groupementSanitaire' ? (
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
                  onPress={() => router.push(ROUTES.ficheContact(c.cle) as never)}
                />
              ))}
              {tiers.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunTiers}</Text> : null}
              <ListRow
                title={textes.ajouterTiers ?? ''}
                icone="add-circle"
                onPress={() =>
                  router.push(
                    (config.categoriesContact[0]
                      ? `${ROUTES.CONTACT_NOUVEAU}?categorie=${config.categoriesContact[0]}`
                      : ROUTES.CONTACT_NOUVEAU) as never,
                  )
                }
              />
            </BlocLignes>
          </GroupeAccueil>

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
                    router.push(
                      ROUTES.comptabiliteDuLieu(
                        ecritures.map((t) => t.id),
                        textes.titre,
                      ) as never,
                    )
                  }
                />
              ) : null}
              <ListRow
                title={textes.nouvelle ?? ''}
                icone="add-circle"
                onPress={() => router.push(routeNouvelle as never)}
              />
              {routeVersement && textes.versement ? (
                <ListRow title={textes.versement} icone="add-circle" onPress={() => router.push(routeVersement as never)} />
              ) : null}
            </BlocLignes>
          </GroupeAccueil>
        </>
      ) : null}
    </Screen>
  );
}
