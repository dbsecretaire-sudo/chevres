import { useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import LieuAssociations from '@/features/production/screens/LieuAssociations';
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
import { DossiersTouristiques } from '@/features/production/components/DossiersTouristiques';
import { balanceDesEcritures } from '@/features/comptabilite/services/balanceDesEcritures';
import { ChoixCategoriesTiers } from '@/shared/components/ChoixCategoriesTiers';
import { categoriesDeLOrganisation } from '@/features/exploitation/services/partenaires';
import { categoriesClient } from '@/shared/dictionnaire/categoriesClient';
import { categoriesFournisseur } from '@/shared/dictionnaire/categoriesFournisseur';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { TableauAssurance } from '@/features/production/components/TableauAssurance';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { contratsDe } from '@/features/fournisseurs/services/contratsAssureur';
import { ContenuDossierPac } from '@/features/cheptel/screens/DossierPac';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
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
  /** Pour le groupement sanitaire : le groupe des vétérinaires, rangés avec lui. */
  groupeVeterinaires?: string;
  ajouterVeterinaire?: string;
  /** Banque et comptabilité : l'ajout d'un comptable, à côté de celui d'une banque. */
  ajouterComptable?: string;
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
  const { lieu } = useLocalSearchParams<{ lieu?: string }>();
  // Une association ou une coopérative agricole a sa propre page : ses cartes, puis la fiche de chacune avec ses volets.
  return lieu === 'groupement' ? <LieuAssociations /> : <LieuTiersStandard />;
}

function LieuTiersStandard() {
  const { lieu } = useLocalSearchParams<{ lieu?: string }>();
  const cle: CleLieuTiers = estLieuTiers(lieu) ? lieu : 'aliments';
  const config = LIEUX_TIERS[cle];
  /** Ouvre une page depuis cette page : sa flèche de retour (et « Annuler », et l'enregistrement d'une écriture) ramène ici, pas à l'onglet d'avant. */
  const ouvrir = useOuvrir();
  // Le poste de comptabilité (Windows, affichage sobre) montre les assureurs et leurs contrats en tableau.
  const comptable = useDispositionComptable();
  const textes: TextesLieu = T[cle];
  const { settings, patchSettings } = useAppSettings();
  /** Partenariats : la fenêtre qui coche les catégories de tiers. */
  const [choixOuvert, setChoixOuvert] = useState(false);
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

  /** Les catégories cochées pour les partenariats (en plus de celles d'office du lieu). */
  const cochees = useMemo(
    () => (cle === 'tourisme' ? (settings.exploitation?.categoriesPartenariats ?? []) : []),
    [cle, settings.exploitation?.categoriesPartenariats],
  );
  const tiers = useMemo(
    () =>
      contacts.filter((c) =>
        [...config.categoriesContact, ...cochees].includes(categorieDuContact(c, idsConnus).id ?? ''),
      ),
    [contacts, idsConnus, config, cochees],
  );
  const nombreParCategorie = useMemo(() => {
    const nombre: Record<string, number> = {};
    for (const c of contacts) {
      const id = categorieDuContact(c, idsConnus).id;
      if (id) nombre[id] = (nombre[id] ?? 0) + 1;
    }
    return nombre;
  }, [contacts, idsConnus]);
  /** Les vétérinaires (la page du groupement sanitaire les range avec lui). */
  const veterinaires = useMemo(
    () => contacts.filter((c) => categorieDuContact(c, idsConnus).id === CATEGORIE_FOURNISSEUR.VETERINAIRE),
    [contacts, idsConnus],
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
    ? routeAvecContact(
        `${ROUTES.COMPTABILITE_NOUVELLE}?type=emise&categorie=${config.recetteDuLieu}`,
        intervenant,
      )
    : undefined;
  const liens = config.liens.map((l) => ({
    ...l,
    ...(textes.liens as Record<string, { titre: string; aide: string }>)[l.cle],
  }));

  const ligneDeLien = (l: (typeof liens)[number]) => (
    <ListRow key={l.cle} title={l.titre} subtitle={l.aide} icone={l.icone} onPress={() => ouvrir(l.route)} />
  );

  return (
    <Screen>
      {/* Les organismes : le dossier PAC (suivi des mouvements, recensement, estive, documents générés) et les terrains, directement dans la page. */}
      {config.dossierPac ? (
        <GroupeAccueil titre={T.groupeLiens}>
          <ContenuDossierPac
            partie="declarations"
            apres={
              <ListRow
                title={
                  (textes.liens as Record<string, { titre: string; aide: string }>).terrains?.titre ?? ''
                }
                subtitle={(textes.liens as Record<string, { titre: string; aide: string }>).terrains?.aide}
                icone="map"
                onPress={() => ouvrir(ROUTES.santeControles(FAMILLE_CONTROLE.SURFACE))}
              />
            }
          />
        </GroupeAccueil>
      ) : null}
      {/* Les documents : le registre de l'élevage. Le carnet de naissance d'abord, le suivi des mouvements (à générer), puis les documents des animaux et ceux déjà générés. */}
      {config.registre ? (
        <GroupeAccueil titre={T.groupeLiens}>
          <ContenuDossierPac
            partie="registre"
            avant={liens.filter((l) => l.cle === 'carnet').map(ligneDeLien)}
            apres={liens.filter((l) => l.cle !== 'carnet').map(ligneDeLien)}
          />
        </GroupeAccueil>
      ) : null}
      {liens.length > 0 && !config.registre ? (
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
        <AntenneGds
          onAjoutee={() =>
            listContacts()
              .then(setContacts)
              .catch(() => undefined)
          }
        />
      ) : null}

      {config.avecTiers ? (
        <>
          {cle === 'assurance' && comptable ? (
            <>
              <TableauAssurance assureurs={tiers} ouvrir={ouvrir} />
              <BlocLignes>
                <ListRow
                  title={textes.ajouterTiers ?? ''}
                  icone="add-circle"
                  onPress={() => ouvrir(`${ROUTES.CONTACT_NOUVEAU}?categorie=${config.categoriesContact[0]}`)}
                />
                <ListRow
                  title={TEXTES.contacts.contrat.nouveauContrat}
                  icone="add-circle"
                  onPress={() => ouvrir(ROUTES.contratAssureur({ fournisseur: tiers.length === 1 ? tiers[0].fournisseur?.id : undefined }))}
                />
              </BlocLignes>
            </>
          ) : (
          <GroupeAccueil titre={textes.groupeTiers ?? ''}>
            <BlocLignes>
              {/* Une liste à plat (le bloc sépare chaque ligne d'un trait) : le tiers, puis — pour l'assurance — ses contrats en retrait juste en dessous de lui, et « Nouveau contrat » pour lui. */}
              {tiers.flatMap((c) => [
                <ListRow
                  key={c.cle}
                  title={c.nom}
                  subtitle={
                    [(c.client ?? c.fournisseur)?.telephone, (c.client ?? c.fournisseur)?.email]
                      .filter(Boolean)
                      .join(' · ') || undefined
                  }
                  // Un assureur est une ligne qui s'ouvre (icône et flèche), pas un titre : ses contrats sont rangés dessous.
                  {...(cle === 'assurance' ? { icone: 'business' as const } : { emoji: portraitDeTiers(categorieDuContact(c, idsConnus).id).emoji })}
                  onPress={() => ouvrir(ROUTES.ficheContact(c.cle))}
                />,
                ...(cle === 'assurance'
                  ? [
                      ...contratsDe(c.fournisseur).map((contrat) => (
                        <ListRow
                          key={`${c.cle}:${contrat.id}`}
                          retrait
                          title={contrat.denomination}
                          subtitle={TEXTES.contacts.contrat.ligneSousAssureur(contrat.numero)}
                          icone="shield-checkmark"
                          onPress={() => ouvrir(ROUTES.contratAssureur({ id: contrat.id }))}
                        />
                      )),
                      <ListRow
                        key={`${c.cle}:nouveau`}
                        retrait
                        title={TEXTES.contacts.contrat.nouveauContrat}
                        icone="add-circle"
                        onPress={() => ouvrir(ROUTES.contratAssureur({ fournisseur: c.fournisseur?.id }))}
                      />,
                    ]
                  : []),
              ])}
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
              {/* Banque et comptabilité : le comptable s'ajoute aussi d'ici (sa catégorie est liée à la page). */}
              {cle === 'tourisme' ? (
                <ListRow title={T.tourisme.choisirTiers} icone="checkbox-outline" onPress={() => setChoixOuvert(true)} />
              ) : null}
              {textes.ajouterComptable ? (
                <ListRow
                  title={textes.ajouterComptable}
                  icone="add-circle"
                  onPress={() => ouvrir(`${ROUTES.CONTACT_NOUVEAU}?categorie=${CATEGORIE_FOURNISSEUR.COMPTABLE}`)}
                />
              ) : null}
            </BlocLignes>
          </GroupeAccueil>
          )}

          {/* L'office de tourisme : les dossiers marqués touristiques (la Route des Sens Authentiques…), avec « Nouveau dossier » lié à un tiers. */}
          {cle === 'tourisme' ? <DossiersTouristiques contacts={contacts} ouvrir={ouvrir} /> : null}

          {/* Le groupement sanitaire accueille les vétérinaires : leurs fiches (traitements, visites, factures) s'ouvrent d'ici. */}
          {cle === 'groupementSanitaire' ? (
            <GroupeAccueil titre={textes.groupeVeterinaires ?? ''}>
              <BlocLignes>
                {veterinaires.map((c) => (
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
                <ListRow
                  title={textes.ajouterVeterinaire ?? ''}
                  icone="add-circle"
                  onPress={() =>
                    ouvrir(`${ROUTES.CONTACT_NOUVEAU}?categorie=${CATEGORIE_FOURNISSEUR.VETERINAIRE}`)
                  }
                />
              </BlocLignes>
            </GroupeAccueil>
          ) : null}

          <GroupeAccueil titre={textes.groupeEcritures ?? ''} balance={ecritures.length > 0 ? balanceDesEcritures(ecritures) : undefined}>
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
        </>
      ) : null}
      {cle === 'tourisme' ? (
        <ChoixCategoriesTiers
          visible={choixOuvert}
          titre={T.tourisme.choixTitre}
          aide={T.tourisme.choixAide}
          fermer={T.tourisme.choixFermer}
          aucune={T.tourisme.choixAucune}
          categories={categoriesDeLOrganisation(categoriesFournisseur(), categoriesClient())}
          cochees={cochees}
          imposees={config.categoriesContact}
          nombreParCategorie={nombreParCategorie}
          nombreDeTiers={T.tourisme.choixNombre}
          onChange={(ids) => patchSettings({ exploitation: { ...settings.exploitation, categoriesPartenariats: ids } })}
          onClose={() => setChoixOuvert(false)}
        />
      ) : null}
    </Screen>
  );
}
