import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { ListRow } from '@/shared/components/ListRow';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { lireArchiveDossiers } from '@/features/dossiers/repository';
import { listTousControles } from '@/features/exploitation/repository/controles';
import type { Controle } from '@/features/exploitation/types';
import { BoutonsContact } from '@/features/clients/components/BoutonsContact';
import { estVente } from '@/features/clients/components/ClientResume';
import type { EcritureClient } from '@/features/clients/services/resumeClient';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import {
  ecrituresACirculation,
  type EcritureACirculation,
} from '@/features/comptabilite/services/documentsCirculation';
import { piecesDuContact } from '@/features/contacts/services/piecesDuContact';
import { nomsDesAbattoirs } from '@/features/fournisseurs/services/abattoirs';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { DossiersDuContact, entreeDuContact } from '@/features/contacts/components/DossiersDuContact';
import { PortraitTiers } from '@/features/contacts/components/PortraitTiers';
import { FormulaireContactChamps } from '@/features/contacts/components/FormulaireContactChamps';
import { useCategoriesContact } from '@/features/contacts/hooks/useCategoriesContact';
import {
  convertirGroupementsEnContacts,
  enregistrerContact,
  getContact,
  lierLesFichesDeMemeNom,
  supprimerContact,
  type ErreurContact,
} from '@/features/contacts/repository';
import type { Contact } from '@/features/contacts/services/contacts';
import {
  balanceDuContact,
  categorieDuContact,
  ecrituresDuContact,
  elementsDuContact,
  type ElementLie,
  formulaireDuContact,
  type FormulaireContact,
} from '@/features/contacts/services/fiche';
import { contratsDe, estUnAssureur } from '@/features/fournisseurs/services/contratsAssureur';
import { ROUTES } from '@/shared/constants/routes';
import { publierLibelleDuFil } from '@/shared/navigation/titreDeLaPage';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { routeAvecContact } from '@/features/accueil/services/routeAvecContact';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';

const T = TEXTES.contacts.fiche;

/** Les onglets de la fiche : les écritures, les contrats (d'un assureur), et les documents (rangés en dossiers). */
type Onglet = 'ecritures' | 'contrats' | 'documents';
const F = TEXTES.contacts.formulaire;

/** Un montant signé : une recette « + », une dépense « − », en vert ou en rouge. */
const couleurDuMontant = (montant: number) => (montant < 0 ? colors.danger : colors.success);

/**
 * La fiche d'un contact : une seule fiche, une seule catégorie, pour le client et le fournisseur réunis. Elle montre ses coordonnées,
 * sa balance (ce qu'il vous a payé moins ce que vous lui avez payé) et toutes ses écritures ensemble. Quand ses deux anciennes fiches
 * avaient chacune une catégorie différente, elle demande laquelle garder.
 */
export default function FicheContact() {
  const router = useRouter();
  const ouvrir = useOuvrir();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories, idsConnus, assurerCategorie } = useCategoriesContact();
  const lots = useAppSettings().settings.exploitation?.lots;

  const [contact, setContact] = useState<Contact | undefined>();
  const [introuvable, setIntrouvable] = useState(false);
  const [ecritures, setEcritures] = useState<EcritureClient[]>([]);
  const [elements, setElements] = useState<ElementLie[]>([]);
  /** Les contenus rangés des partenaires : ceux du contact, en dossiers, viennent de là. */
  const [controles, setControles] = useState<Controle[]>([]);
  /** Les écritures et lots de départ qui demandent un document de circulation : ceux d'un abattoir se rangent dans ses documents. */
  const [circulations, setCirculations] = useState<EcritureACirculation[]>([]);
  const [onglet, setOnglet] = useState<Onglet>('ecritures');
  const [form, setForm] = useState<FormulaireContact | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [retraitAConfirmer, setRetraitAConfirmer] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    await convertirGroupementsEnContacts();
    await lierLesFichesDeMemeNom();
    const c = await getContact(id);
    setContact(c);
    setIntrouvable(!c);
    if (!c) {
      setEcritures([]);
      setElements([]);
      return;
    }
    const [ventes, factures, controles, archive, abattoirs] = await Promise.all([
      listToutesVentes(),
      listToutesFactures(),
      listTousControles(),
      lireArchiveDossiers(),
      nomsDesAbattoirs(),
    ]);
    setCirculations(ecrituresACirculation(ventes, factures, abattoirs, lots));
    setEcritures(ecrituresDuContact(c, ventes, factures));
    setControles(controles);
    setElements(elementsDuContact(c, controles, archive));
  }, [id, lots]);

  useFocusEffect(
    useCallback(() => {
      charger().catch(() => undefined);
    }, [charger]),
  );

  const categorie = useMemo(
    () => (contact ? categorieDuContact(contact, idsConnus) : {}),
    [contact, idsConnus],
  );
  const nomDeLaCategorie = (cle: string | undefined) => categories.find((c) => c.id === cle)?.nom;
  // Le fil d'Ariane (« … > Assurance > GROUPAMA ») porte le nom du contact, à la place de « Contact ».
  const page = usePathname();
  const nom = contact?.nom;
  useFocusEffect(
    useCallback(() => {
      publierLibelleDuFil(nom ?? '', page);
      return () => publierLibelleDuFil('', page);
    }, [nom, page]),
  );

  /** Enregistré tout seul (`auto`), il ne dit rien d'une saisie incomplète et laisse la fiche en modification. */
  const enregistrer = async (
    aEnregistrer: FormulaireContact,
    confirme = false,
    auto = false,
  ): Promise<boolean> => {
    if (!contact) return false;
    // Retirer un côté supprime sa fiche : on demande avant (une seule fenêtre, même si la saisie continue).
    if (!confirme) {
      const retrait =
        contact.client && !aEnregistrer.recettes && aEnregistrer.depenses
          ? F.retirerClient
          : contact.fournisseur && !aEnregistrer.depenses && aEnregistrer.recettes
            ? F.retirerFournisseur
            : undefined;
      if (retrait) {
        if (!retraitAConfirmer) setRetraitAConfirmer(retrait);
        return false;
      }
    }
    // Sans catégorie, rien ne s'enregistre (le contrôle est fait avant toute création de catégorie).
    if (auto && (!aEnregistrer.categorie || (aEnregistrer.recettes && !aEnregistrer.circuit))) return false;
    if (aEnregistrer.categorie) await assurerCategorie(aEnregistrer.categorie);
    const resultat = await enregistrerContact(aEnregistrer, contact, idsConnus);
    if ('erreur' in resultat) {
      if (!auto) setErreur(TEXTES.contacts.erreurs[resultat.erreur as ErreurContact]);
      return false;
    }
    if (!auto) setForm(null);
    await charger();
    return true;
  };

  // Tout changement de la fiche s'enregistre tout seul.
  useEnregistrementAuto({
    actif: !!form,
    signature: JSON.stringify(form),
    enregistrer: () => (form ? enregistrer(form, false, true) : Promise.resolve(false)),
  });

  const supprimer = async () => {
    if (!contact) return;
    await supprimerContact(contact);
    router.back();
  };

  if (introuvable || (!contact && !id)) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{T.introuvable}</Text>
      </Screen>
    );
  }
  if (!contact) return <Screen>{null}</Screen>;

  const f = contact.fournisseur;
  const c = contact.client;
  const personne = f ? [f.nom, f.prenom].filter(Boolean).join(' ') : c?.contact;
  const adresse = c?.adressePostale || f?.adressePostale;
  const telephone = c?.telephone || f?.telephone;
  const email = c?.email || f?.email;
  const balance = balanceDuContact(ecritures);
  // Les contrats : l'onglet d'un assureur (même sans contrat encore, pour en créer un).
  const contrats = contratsDe(f);
  const avecContrats = estUnAssureur(f) || contrats.length > 0;
  // Les documents : ce qui est rangé dans la fiche du contact (courriers, contrats, aides, notes…).
  const documents = elements.filter((x) => x.origine === 'partenaire');
  /** Les bons d'équarrissage (équarrisseur) et les documents de circulation (abattoir) qui s'y rangent tout seuls. */
  const pieces = piecesDuContact(
    {
      nom: contact.nom,
      cle: contact.cle,
      ids: [contact.fournisseur?.id, contact.client?.id].filter((x): x is string => !!x),
    },
    categorie.id,
    lots ?? [],
    circulations,
  );

  return (
    <Screen scroll={false}>
      <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.header}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.title}>{contact.nom}</Text>
          </View>
          <View style={commonStyles.headerDroite}>
            <BoutonsContact telephone={telephone} email={email} />
          </View>
          <Pressable style={commonStyles.boutonMenu} onPress={() => setMenuOuvert(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>

        <OptionsModal
          visible={menuOuvert}
          onClose={() => setMenuOuvert(false)}
          title={contact.nom}
          options={[
            ...(contact.fournisseur
              ? [
                  {
                    label: T.nouvelleDepense,
                    icon: 'remove-circle' as const,
                    onPress: () => {
                      setMenuOuvert(false);
                      ouvrir(
                        routeAvecContact(`${ROUTES.COMPTABILITE_NOUVELLE}?type=recue`, {
                          fournisseur: contact.fournisseur,
                        }),
                      );
                    },
                  },
                ]
              : []),
            ...(contact.client
              ? [
                  {
                    label: T.nouvelleRecette,
                    icon: 'add-circle' as const,
                    onPress: () => {
                      setMenuOuvert(false);
                      ouvrir(
                        routeAvecContact(`${ROUTES.COMPTABILITE_NOUVELLE}?type=emise`, {
                          client: contact.client,
                        }),
                      );
                    },
                  },
                ]
              : []),
            {
              label: TEXTES.commun.general.modifierLaFiche,
              icon: 'create',
              onPress: () => {
                setMenuOuvert(false);
                setForm(formulaireDuContact(contact, idsConnus));
              },
            },
            {
              label: TEXTES.commun.general.supprimerDefinitivement,
              icon: 'trash',
              color: colors.danger,
              onPress: () => {
                setMenuOuvert(false);
                setSuppressionOuverte(true);
              },
            },
          ]}
        />

        {/* Le portrait vivant du tiers : son dessin, sa catégorie et sa balance. */}
        {!form ? (
          <PortraitTiers
            categorieId={categorie.id}
            categorie={nomDeLaCategorie(categorie.id)}
            balance={ecritures.length > 0 ? formatMontant(balance) : undefined}
          />
        ) : null}

        {/* Deux catégories différentes sur les deux anciennes fiches : on demande laquelle garder, contact par contact. */}
        {categorie.conflit && !form ? (
          <Card style={commonStyles.gap8}>
            <Text style={commonStyles.cardTitle}>{T.conflitTitre}</Text>
            <Text style={commonStyles.note}>
              {T.conflitMessage(
                nomDeLaCategorie(categorie.conflit.client) ?? categorie.conflit.client,
                nomDeLaCategorie(categorie.conflit.fournisseur) ?? categorie.conflit.fournisseur,
              )}
            </Text>
            {[categorie.conflit.client, categorie.conflit.fournisseur].map((cle) => (
              <Button
                key={cle}
                variant="secondary"
                label={T.garder(nomDeLaCategorie(cle) ?? cle)}
                onPress={() =>
                  enregistrer({ ...formulaireDuContact(contact, idsConnus), categorie: cle }, true)
                }
              />
            ))}
            <Button
              variant="secondary"
              label={TEXTES.commun.general.modifierLaFiche}
              onPress={() => setForm(formulaireDuContact(contact, idsConnus))}
            />
          </Card>
        ) : null}

        {form ? (
          <Card>
            <Text style={commonStyles.cardTitle}>{F.titreModifier}</Text>
            <FormulaireContactChamps form={form} onChange={setForm} categories={categories} />
          </Card>
        ) : (
          <>
            <Card>
              <Text style={commonStyles.line}>
                {TEXTES.contacts.fiche.typeDeuxPoints}
                {[c ? TEXTES.contacts.recettes : undefined, f ? TEXTES.contacts.depenses : undefined]
                  .filter(Boolean)
                  .join(' + ')}
              </Text>
              {categorie.id ? (
                <Text style={commonStyles.line}>
                  {T.categorieDeuxPoints}
                  {nomDeLaCategorie(categorie.id) ?? categorie.id}
                </Text>
              ) : null}
              <Text style={commonStyles.line}>
                {T.nomDEntrepriseDeuxPoints}
                {contact.nom}
              </Text>
              {personne ? (
                <Text style={commonStyles.line}>
                  {T.personneDeuxPoints}
                  {personne}
                </Text>
              ) : null}
              {f?.siret ? (
                <Text style={commonStyles.line}>
                  {T.siretDeuxPoints}
                  {f.siret}
                </Text>
              ) : null}
              {f?.tva ? (
                <Text style={commonStyles.line}>
                  {T.tvaDeuxPoints}
                  {f.tva}
                </Text>
              ) : null}
              {f?.rib ? (
                <Text style={commonStyles.line}>
                  {T.ribDeuxPoints}
                  {f.rib}
                </Text>
              ) : null}
              {adresse ? (
                <Text style={commonStyles.line}>
                  {T.adresseDeuxPoints}
                  {adresse}
                </Text>
              ) : null}
              {telephone ? (
                <Text style={commonStyles.line}>
                  {T.telephoneDeuxPoints}
                  {telephone}
                </Text>
              ) : null}
              {email ? (
                <Text style={commonStyles.line}>
                  {T.emailDeuxPoints}
                  {email}
                </Text>
              ) : null}
              <Button
                label={TEXTES.commun.general.modifierLaFiche}
                variant="secondary"
                onPress={() => setForm(formulaireDuContact(contact, idsConnus))}
              />
            </Card>

            {ecritures.length > 0 ? (
              <Card style={commonStyles.gap8}>
                <Text style={commonStyles.cardTitle}>{T.resume}</Text>
                <View style={commonStyles.rowSpaceBetween}>
                  <Text style={commonStyles.lineBold}>{T.balance}</Text>
                  <Text style={[commonStyles.lineBold, { color: couleurDuMontant(balance) }]}>
                    {balance < 0 ? '−' : balance > 0 ? '+' : ''}
                    {formatMontant(Math.abs(balance))}
                  </Text>
                </View>
                <Text style={commonStyles.note}>{T.aideBalance}</Text>
              </Card>
            ) : null}

            <PucesDefilantes<Onglet>
              puces={[
                { valeur: 'ecritures', label: T.ongletEcritures(ecritures.length) },
                ...(avecContrats ? [{ valeur: 'contrats' as const, label: T.ongletContrats(contrats.length) }] : []),
                { valeur: 'documents', label: T.ongletDocuments(documents.length + pieces.length) },
              ]}
              valeur={onglet}
              onChoisir={setOnglet}
            />

            {onglet === 'ecritures' ? (
              <View style={commonStyles.gap10}>
                {ecritures.length === 0 ? (
                  <Text style={commonStyles.mutedItalic}>{T.aucuneEcriture}</Text>
                ) : (
                  ecritures.map((e) => (
                    <ListRow
                      key={e.id}
                      title={e.titre}
                      subtitle={formatDateFR(e.date)}
                      trailing={
                        <Text style={[commonStyles.lineBold, { color: couleurDuMontant(e.montant) }]}>
                          {e.montant < 0 ? '−' : '+'}
                          {formatMontant(Math.abs(e.montant))}
                        </Text>
                      }
                      onPress={() =>
                        router.push(
                          (estVente(e) ? ROUTES.ficheVente(e.id) : ROUTES.ficheFacture(e.id)) as never,
                        )
                      }
                    />
                  ))
                )}
              </View>
            ) : onglet === 'contrats' && avecContrats ? (
              <View style={commonStyles.gap10}>
                {contrats.length === 0 ? <Text style={commonStyles.mutedItalic}>{TEXTES.contacts.contrat.aucunContrat}</Text> : null}
                {contrats.map((contrat) => (
                  <ListRow
                    key={contrat.id}
                    title={contrat.denomination}
                    subtitle={TEXTES.contacts.contrat.ligneSousAssureur(contrat.numero)}
                    icone="shield-checkmark"
                    onPress={() => ouvrir(ROUTES.contratAssureur({ id: contrat.id }))}
                  />
                ))}
                <ListRow
                  title={TEXTES.contacts.contrat.nouveauContrat}
                  icone="add-circle"
                  onPress={() => ouvrir(ROUTES.contratAssureur({ fournisseur: f?.id }))}
                />
              </View>
            ) : (
              <View style={commonStyles.gap10}>
                {/* Les documents : des dossiers dans des dossiers (comme au secrétariat), avec courriers, démarches, aides et fichiers. */}
                <DossiersDuContact
                  contact={contact}
                  entree={entreeDuContact(controles, contact)}
                  pieces={pieces}
                  ouvrir={ouvrir}
                  onChange={() => {
                    charger().catch(() => undefined);
                  }}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={suppressionOuverte}
        title={T.supprimerQuestion}
        message={T.supprimerMessage(contact.nom)}
        confirmLabel={TEXTES.commun.general.supprimerDefinitivement}
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={supprimer}
      />
      <ConfirmModal
        visible={!!retraitAConfirmer}
        title={F.confirmer}
        message={retraitAConfirmer ?? ''}
        confirmLabel={F.confirmer}
        onCancel={() => setRetraitAConfirmer(null)}
        onConfirm={() => {
          setRetraitAConfirmer(null);
          if (form) enregistrer(form, true);
        }}
      />
      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </Screen>
  );
}
