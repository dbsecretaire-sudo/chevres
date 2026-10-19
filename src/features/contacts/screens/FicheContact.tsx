import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { BoutonsContact } from '@/features/clients/components/BoutonsContact';
import { estVente } from '@/features/clients/components/ClientResume';
import type { EcritureClient } from '@/features/clients/services/resumeClient';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { FormulaireContactChamps } from '@/features/contacts/components/FormulaireContactChamps';
import { useCategoriesContact } from '@/features/contacts/hooks/useCategoriesContact';
import {
  assurerEntreeDuContact,
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
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';

const T = TEXTES.contacts.fiche;

/** Les trois onglets de la fiche : les écritures, les documents (éléments avec fichiers) et les autres éléments liés. */
type Onglet = 'ecritures' | 'documents' | 'autres';
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories, idsConnus, assurerCategorie } = useCategoriesContact();

  const [contact, setContact] = useState<Contact | undefined>();
  const [introuvable, setIntrouvable] = useState(false);
  const [ecritures, setEcritures] = useState<EcritureClient[]>([]);
  const [elements, setElements] = useState<ElementLie[]>([]);
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
    const [ventes, factures, controles, archive] = await Promise.all([
      listToutesVentes(),
      listToutesFactures(),
      listTousControles(),
      lireArchiveDossiers(),
    ]);
    setEcritures(ecrituresDuContact(c, ventes, factures));
    setElements(elementsDuContact(c, controles, archive));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger().catch(() => undefined);
    }, [charger]),
  );

  const categorie = useMemo(() => (contact ? categorieDuContact(contact, idsConnus) : {}), [contact, idsConnus]);
  const nomDeLaCategorie = (cle: string | undefined) => categories.find((c) => c.id === cle)?.nom;

  /** Enregistré tout seul (`auto`), il ne dit rien d'une saisie incomplète et laisse la fiche en modification. */
  const enregistrer = async (aEnregistrer: FormulaireContact, confirme = false, auto = false): Promise<boolean> => {
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

  const ajouterDocument = async () => {
    if (!contact) return;
    const entreeId = await assurerEntreeDuContact(contact);
    router.push(ROUTES.contactContenu(entreeId) as never);
  };

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
  // Les documents : ce qui est rangé dans la fiche du contact (courriers, contrats, aides, notes…) ; les autres : le reste de son dossier.
  const documents = elements.filter((x) => x.origine === 'partenaire');
  const autres = elements.filter((x) => x.origine === 'dossier');

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
                onPress={() => enregistrer({ ...formulaireDuContact(contact, idsConnus), categorie: cle }, true)}
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
                { valeur: 'documents', label: T.ongletDocuments(documents.length) },
                { valeur: 'autres', label: T.ongletAutres(autres.length) },
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
                        router.push((estVente(e) ? ROUTES.ficheVente(e.id) : ROUTES.ficheFacture(e.id)) as never)
                      }
                    />
                  ))
                )}
              </View>
            ) : (
              <View style={commonStyles.gap10}>
                {onglet === 'documents' ? (
                  <Button variant="secondary" label={T.ajouterDocument} onPress={ajouterDocument} />
                ) : null}
                {(onglet === 'documents' ? documents : autres).length === 0 ? (
                  <Text style={commonStyles.mutedItalic}>
                    {onglet === 'documents' ? T.aucunDocument : T.aucunAutre}
                  </Text>
                ) : (
                  (onglet === 'documents' ? documents : autres).map((x) => (
                    <ListRow
                      key={x.cle}
                      title={x.titre}
                      subtitle={[
                        formatDateFR(x.date),
                        x.nature
                          ? (TEXTES.exploitation.controles.natureGroupement[
                              x.nature as keyof typeof TEXTES.exploitation.controles.natureGroupement
                            ] ?? T.origine[x.origine])
                          : T.origine[x.origine],
                        x.fichiers > 0 ? TEXTES.fichiers.nombre(x.fichiers) : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      onPress={() =>
                        router.push(
                          (x.origine === 'partenaire'
                            ? ROUTES.contactContenu(x.groupementId!, x.contenuId)
                            : ROUTES.element(x.elementId!)) as never,
                        )
                      }
                    />
                  ))
                )}
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
