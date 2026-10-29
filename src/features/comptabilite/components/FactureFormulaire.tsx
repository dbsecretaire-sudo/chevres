import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AnimauxEnvoyesListe } from '@/features/comptabilite/components/AnimauxEnvoyesListe';
import { LignesChambreEditor } from '@/features/comptabilite/components/LignesChambreEditor';
import { LignesVeterinaireEditor } from '@/features/comptabilite/components/LignesVeterinaireEditor';
import { BoutonCadeau } from '@/features/comptabilite/components/BoutonCadeau';
import { LignesProductionEditor } from '@/features/comptabilite/components/LignesProductionEditor';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { Checkbox } from '@/shared/components/Checkbox';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { SectionForm } from '@/shared/components/SectionForm';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { LignesAlimentationEditor } from '@/features/comptabilite/components/LignesAlimentationEditor';
import { LignesCarburantEditor } from '@/features/comptabilite/components/LignesCarburantEditor';
import { ChampTauxImposition } from '@/features/comptabilite/components/ChampTauxImposition';
import { ChampMontantTtc, NoteComptePcg } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import { ChampTauxTva } from '@/features/comptabilite/components/ecriture/ChampTauxTva';
import type { EtatFicheFacture } from '@/features/comptabilite/hooks/useFicheFacture';
import { clientsPourLaRecette } from '@/features/comptabilite/utils/recettes';
import {
  depenseImposee,
  estChambreAgriculture,
  fournisseursPourLaDepense,
  fournituresSeulementBoucles,
} from '@/features/fournisseurs/services/categorie';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  OBJET_ASSURANCE,
  TYPE_AIDE,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { DossiersDeLAide } from '@/features/exploitation/components/DossiersDeLAide';
import { idVisiteDeLaFacture } from '@/features/sante/services/visitesFacture';
import { especesActives, plusieursEspeces } from '@/shared/dictionnaire/animaux';
import { formatTotalEuros, parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import {
  categorieFournisseurDe,
  pasPayeeAffichee,
  offertAffiche,
  sansFactureAffichee,
} from '@/shared/dictionnaire/categoriesFournisseur';
import { categorieClientDe, pasEncaisseeAffichee } from '@/shared/dictionnaire/categoriesClient';
import { estBoucleNumerotee } from '@/features/stock/services/boucles';
import { ChampVisite } from '@/features/comptabilite/components/ecriture/ChampVisite';
import { ChampAtelier } from '@/features/comptabilite/components/ChampAtelier';
import { ChampVehicule } from '@/features/comptabilite/components/ChampVehicule';
import { ChampNumeroOuContrat } from '@/features/comptabilite/components/ChampNumeroOuContrat';
import { ChampObjetAssurance } from '@/features/comptabilite/components/ChampObjetAssurance';
import { ChampVoletCooperative } from '@/features/comptabilite/components/ChampVoletCooperative';
import { categorieAvecVehicule } from '@/features/exploitation/services/flotte';
import { ChampElementAgritourisme } from '@/features/comptabilite/components/ChampElementAgritourisme';
import { ATELIER } from '@/shared/constants/ateliers';
import { ChampPaiement } from '@/features/comptabilite/components/ChampPaiement';
import { tauxImpositionAide } from '@/features/comptabilite/utils/planComptable';
import { avecPaiement } from '@/features/comptabilite/utils/paiement';
import { ChampStockProduction } from '@/features/comptabilite/components/ecriture/ChampStockProduction';
import { styles } from '@/shared/styles/comptabilite/FicheFacture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import {
  LABEL_ACTIVITE_COMPTABLE,
  LABEL_CATEGORIE_DEPENSE,
  LABEL_CATEGORIE_RECETTE,
  LABEL_TYPE_AIDE,
} from '@/shared/textes/libelles';
import type { TypeAide } from '@/features/comptabilite/types';
import { optionClient, optionFournisseur } from '@/features/contacts/services/optionsContacts';

const T = TEXTES.comptabilite.nouvelleEcriture;

/** Les trois onglets de la modification : l'identification, le détail de ce qui est acheté ou vendu, puis le coût (montant, TVA, règlement). */
type OngletFacture = 'general' | 'details' | 'cout';

const ONGLETS_FACTURE: { value: OngletFacture; label: string }[] = [
  { value: 'general', label: TEXTES.comptabilite.ficheFacture.ongletGeneral },
  { value: 'details', label: TEXTES.comptabilite.ficheFacture.ongletDetails },
  { value: 'cout', label: TEXTES.comptabilite.ficheFacture.ongletCout },
];

/** Les onglets, en pastilles de liste : l'onglet ouvert est sur fond clair. */
function OngletsFacture({ value, onChange }: { value: OngletFacture; onChange: (onglet: OngletFacture) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.badgeBg, borderRadius: 10, padding: 3, marginBottom: 10 }}>
      {ONGLETS_FACTURE.map((onglet) => {
        const actif = onglet.value === value;
        return (
          <Pressable
            key={onglet.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: actif }}
            onPress={() => onChange(onglet.value)}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderRadius: 8,
              backgroundColor: actif ? colors.surface : 'transparent',
            }}
          >
            <Text style={{ fontWeight: actif ? '700' : '500', color: colors.text }}>{onglet.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Formulaire de modification d'une facture, en trois onglets : Général (la date, le tiers, l'atelier, les cases de la facture), Détails
 * (la catégorie, ce qui est acheté ou vendu, le numéro de facture) et Coût (le montant, la TVA, le règlement). Les mêmes champs qu'à la
 * création. Le type et la catégorie ne se modifient pas.
 */
export function FactureFormulaire({ f }: { f: EtatFicheFacture }) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const [onglet, setOnglet] = useState<OngletFacture>('general');
  const { form, fournisseurs, clients } = f;
  if (!form) return null;

  const estEmise = form.type === TYPE_FACTURE.EMISE;
  // Les cases que la catégorie du tiers de la facture affiche (toutes, quand on ne retrouve pas le tiers).
  const fournisseurDuTiers = f.fournisseurs.find((x) => x.nomEntreprise === form.tiers);
  const clientDuTiers = f.clients.find((x) => nomComplet(x) === form.tiers);
  const categorieFournisseurDuTiers = fournisseurDuTiers
    ? categorieFournisseurDe(fournisseurDuTiers.categorie)
    : undefined;
  const paiementAffiche = estEmise
    ? pasEncaisseeAffichee(clientDuTiers ? categorieClientDe(clientDuTiers.categorie) : undefined)
    : pasPayeeAffichee(categorieFournisseurDuTiers);
  const estAide = estEmise && form.categorieRecette === CATEGORIE_RECETTE.AIDE;
  /** Une dépense offerte par le fournisseur : la case est cochée et sa catégorie la propose ; chaque ligne a son bouton « Cadeau ». */
  const offerte = !estEmise && !!form.offert && offertAffiche(categorieFournisseurDuTiers) && !f.estChambre && !f.estCarburant;
  const fournisseur = fournisseurs.find((x) => x.nomEntreprise === form.tiers);
  const OPTIONS_TYPE_AIDE = Object.entries(LABEL_TYPE_AIDE).map(([value, label]) => ({
    value: value as TypeAide,
    label,
  }));
  const activites = [...especesActives(), ...(f.estAlimentation ? [] : [ACTIVITE_COMMUNE])];

  const categorie = estEmise
    ? form.categorieRecette
      ? LABEL_CATEGORIE_RECETTE[form.categorieRecette]
      : ''
    : form.categorieDepense
      ? (form.categoriePerso ?? LABEL_CATEGORIE_DEPENSE[form.categorieDepense])
      : '';

  /** Ce qui est acheté ou vendu en détail (alimentation, production, carburant, chambre) : ses lignes, à l'onglet Détails. */
  const estDetaille = f.estAlimentation || f.estChambre || f.estProduction || f.estCarburant;
  /** Le total de ces lignes, à l'onglet Coût. */
  const totalDetaille = f.estAlimentation
    ? f.totalAlimentation
    : f.estChambre
      ? f.totalChambre
      : f.estProduction
        ? f.totalProduction
        : f.totalCarburant;
  /** Le montant TTC de la facture : celui du détail, sinon le montant saisi. */
  const montantTtc = estDetaille ? totalDetaille : parseDecimal(f.montantTexte);

  const lignesDuDetail = f.estAlimentation ? (
    <LignesAlimentationEditor lignes={f.lignes} onChange={f.setLignes} activite={f.activiteForm} offerte={offerte} />
  ) : f.estChambre ? (
    <>
      <LignesChambreEditor lignes={f.lignesChambre} onChange={f.setLignesChambre} />
      <LignesProductionEditor
        lignes={f.lignesProduction}
        onChange={f.setLignesProduction}
        seulementBoucles
        titre={TEXTES.fournisseurs.chambre.boucles}
      />
    </>
  ) : f.estProduction ? (
    <LignesProductionEditor
      lignes={f.lignesProduction}
      onChange={f.setLignesProduction}
      seulementBoucles={fournituresSeulementBoucles(fournisseur)}
      offerte={offerte}
    />
  ) : f.estCarburant ? (
    <LignesCarburantEditor lignes={f.lignesCarburant} onChange={f.setLignesCarburant} />
  ) : null;

  /** Le montant de la facture, à l'onglet Coût : le total de son détail, ou un champ. */
  const coutMontant = estDetaille ? (
    <Text style={styles.total}>
      {TEXTES.commun.general.totalFactureTtcDeuxPoints}
      {formatTotalEuros(totalDetaille)}
    </Text>
  ) : (
    <>
      <ChampMontantTtc value={f.montantTexte} onChange={f.changerMontant} />
      {/* Dépense offerte sans détail par ligne : le bouton « Cadeau » du montant (actif d'office : 0 €). */}
      {offerte ? (
        <BoutonCadeau
          actif={form.cadeauMontant !== false}
          onChange={(actif) => f.setForm({ ...form, cadeauMontant: actif ? undefined : false })}
          ligne={TEXTES.comptabilite.nouvelleEcriture.cadeauMontantDepense}
        />
      ) : null}
    </>
  );

  return (
    <>
      {/* Comme à la création : l'activité en tête, d'une puce (un établissement à plusieurs espèces seulement). */}
      {plusieursEspeces() ? (
        <LigneFiltres>
          <ChoixDeroulant
            titre={TEXTES.comptabilite.activite.activite}
            valeur={f.activiteForm}
            options={activites.map((a) => ({ value: a, label: LABEL_ACTIVITE_COMPTABLE[a] }))}
            onChoisir={f.changerActivite}
          />
        </LigneFiltres>
      ) : null}

      <OngletsFacture value={onglet} onChange={setOnglet} />

      {/* Général : la date, le tiers, les cases de la facture (non facturée, offerte) et l'atelier. */}
      {onglet === 'general' ? (
        <SectionForm>
          <DateField
            label={TEXTES.commun.general.date}
            required
            value={form.date}
            onChange={(date) => f.setForm({ ...form, date })}
          />
          {estEmise ? (
            <SelectFieldEditable
              label={T.clientOrganisme}
              required
              searchable
              placeholder={TEXTES.commun.general.choixDuClient}
              value={clients.find((c) => nomComplet(c) === form.tiers)?.id ?? ''}
              onChange={f.choisirClient}
              options={clientsPourLaRecette(clients, form.categorieRecette, f.activiteForm, form.tiers).map(optionClient)}
              parCategories
              onEdit={() => router.push(ROUTES.clientsDepuis(retour))}
            />
          ) : (
            <SelectFieldEditable
              label={TEXTES.commun.general.fournisseur}
              required
              searchable
              placeholder={TEXTES.commun.general.choixDuFournisseur}
              value={fournisseur?.id ?? ''}
              onChange={f.choisirFournisseur}
              options={fournisseursPourLaDepense(fournisseurs, form.categorieDepense, form.tiers).map(optionFournisseur)}
              parCategories
              onEdit={() => router.push(ROUTES.fournisseursDepuis(retour))}
            />
          )}
          {estEmise ? (
            <Checkbox
              label={TEXTES.comptabilite.nouvelleEcriture.sansFacture}
              value={!!form.sansFacture}
              onChange={(sansFacture) => f.setForm({ ...form, sansFacture: sansFacture || undefined })}
            />
          ) : !sansFactureAffichee(categorieFournisseurDuTiers) ? null : (
            <>
              <Checkbox
                label={TEXTES.comptabilite.nouvelleEcriture.depenseNonFacturee}
                value={!!form.sansFacture}
                onChange={(sansFacture) => f.setForm({ ...form, sansFacture: sansFacture || undefined })}
              />
              {form.sansFacture ? (
                <Text style={commonStyles.note}>
                  {TEXTES.comptabilite.nouvelleEcriture.depenseNonFactureeAide}
                </Text>
              ) : null}
            </>
          )}
          {/* Offerte par le fournisseur (un cadeau) : le bouton « Cadeau » de chaque ligne l'offre ou la facture. */}
          {estEmise || !offertAffiche(categorieFournisseurDuTiers) ? null : (
            <>
              <Checkbox
                label={TEXTES.comptabilite.nouvelleEcriture.offertFournisseur}
                value={!!form.offert}
                onChange={(offert) => f.setForm({ ...form, offert: offert || undefined })}
              />
              {offerte ? (
                <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.offertFournisseurAide}</Text>
              ) : null}
            </>
          )}
          {/* L'atelier de la charge (facultatif) : un fournisseur dont la catégorie impose la dépense (vétérinaire…) n'en demande pas. */}
          {!estEmise && !depenseImposee(fournisseur) ? (
            <ChampAtelier
              activite={form.activite}
              value={form.atelier ?? ''}
              onChange={(atelier) =>
                f.setForm({
                  ...form,
                  atelier: atelier || undefined,
                  elementAgri: atelier === ATELIER.AGRITOURISME ? form.elementAgri : undefined,
                })
              }
            />
          ) : null}
          {!estEmise && form.atelier === ATELIER.AGRITOURISME ? (
            <ChampElementAgritourisme
              value={form.elementAgri ?? ''}
              onChange={(element) => f.setForm({ ...form, elementAgri: element || undefined })}
            />
          ) : null}
        </SectionForm>
      ) : null}

      {/* Détails : la catégorie (fixe), le numéro de la facture, ce qui est acheté ou vendu et ce qui est propre à la catégorie. */}
      {onglet === 'details' ? (
        <SectionForm>
          <FormField
            label={estEmise ? T.categorieDeRecette : T.categorieDeDepense}
            value={categorie}
            editable={false}
            style={commonStyles.verrouille}
            aide={TEXTES.comptabilite.ficheFacture.nonModifiableLaCategorieLe}
          />
          {f.compteAffiche ? <NoteComptePcg compte={f.compteAffiche} /> : null}
          {/* Une aide n'a pas de numéro de facture : le tiers et le type d'aide la décrivent. */}
          {estAide ? null : (
            <ChampNumeroOuContrat
              fournisseur={fournisseurDuTiers}
              label={T.nDeFactureOuObjet}
              valeur={form.description ?? ''}
              onChoix={(description, contrat) =>
                f.setForm({
                  ...form,
                  description,
                  // Le contrat dit ce qu'il couvre : l'objet de l'assurance et, pour un véhicule, sa plaque.
                  ...(contrat?.vehiculeId
                    ? { objetAssurance: OBJET_ASSURANCE.VEHICULE, vehiculeId: contrat.vehiculeId }
                    : contrat?.objet
                      ? { objetAssurance: contrat.objet }
                      : {}),
                })
              }
              placeholder={T.precisions}
            />
          )}
          <AnimauxEnvoyesListe facture={form} />

          {/* Une aide se décrit par son type (DPB, ICHN…). */}
          {estAide && (
            <>
              <SelectField
                label={T.typeDAide}
                required
                value={form.typeAide ?? ''}
                onChange={(typeAide) => f.setForm({ ...form, typeAide: typeAide as typeof form.typeAide })}
                options={OPTIONS_TYPE_AIDE}
              />
              {form.typeAide === TYPE_AIDE.AUTRE && (
                <FormField
                  label={T.preciserLeTypeDAide}
                  value={form.typeAideLibre ?? ''}
                  onChangeText={(typeAideLibre) => f.setForm({ ...form, typeAideLibre })}
                  placeholder={T.exAideGnrGuerreUkrainePoints}
                />
              )}
            </>
          )}

          {/* Une recette d'aide : le dossier de l'aide (ses pièces jointes) qui la lie, rangé chez l'organisme. */}
          {estAide && form.id ? <DossiersDeLAide factureId={form.id} /> : null}

          {/* Une dépense vétérinaire : le motif de la visite ; une dépense de production ou autre : le stock qu'elle alimente. */}
          {form.categorieDepense === CATEGORIE_DEPENSE.VETERINAIRE && (
            <>
              <ChampVisite
                motif={form.motifVisite ?? ''}
                ajouter={!!form.visiteVeterinaire}
                onMotif={(motif) => f.setForm({ ...form, motifVisite: motif || undefined })}
                onAjouter={(ajouter) => f.setForm({ ...form, visiteVeterinaire: ajouter || undefined })}
              />
              <LignesVeterinaireEditor
                lignes={form.lignesVeterinaire ?? []}
                onChange={(lignesVeterinaire) => f.setForm({ ...form, lignesVeterinaire })}
                dateParDefaut={form.date}
                visiteId={form.visiteVeterinaire ? idVisiteDeLaFacture(form.id) : undefined}
                retour={ROUTES.ficheFacture(form.id)}
              />
            </>
          )}
          {form.categorieDepense === CATEGORIE_DEPENSE.AUTRE && (
            <ChampStockProduction
              compte={form.compteManuel}
              article={form.stockArticle ?? ''}
              quantite={form.stockQuantite}
              debut={form.bouclesDebut}
              onChangeDebut={(debut) => f.setForm({ ...form, bouclesDebut: debut || undefined })}
              onChange={(article, quantite) =>
                f.setForm({
                  ...form,
                  stockArticle: article || undefined,
                  stockQuantite: article ? quantite : undefined,
                  bouclesDebut: estBoucleNumerotee(article) ? form.bouclesDebut : undefined,
                })
              }
            />
          )}

          {/* Ce qui est acheté ou vendu en détail : ses lignes. Le total se lit à l'onglet Coût. */}
          {lignesDuDetail}
          {/* Une dépense « Autre » d'un fournisseur de la Chambre d'agriculture : on peut la détailler par article. */}
          {form.categorieDepense === CATEGORIE_DEPENSE.AUTRE && estChambreAgriculture(fournisseur) ? (
            <Button
              variant="secondary"
              label={TEXTES.fournisseurs.chambre.detailler}
              onPress={f.detaillerChambreAgriculture}
            />
          ) : null}

          {/* Le volet d'une écriture d'une association ou d'une coopérative agricole. */}
          {form.voletCooperative ? (
            <ChampVoletCooperative
              value={form.voletCooperative}
              onChange={(volet) => f.setForm({ ...form, voletCooperative: volet || undefined })}
            />
          ) : null}
          {/* Une réparation ou une assurance : le véhicule de la flotte. */}
          {form.categorieDepense === CATEGORIE_DEPENSE.ASSURANCES ? (
            <ChampObjetAssurance
              value={form.objetAssurance ?? ''}
              onChange={(objet) =>
                f.setForm({
                  ...form,
                  objetAssurance: objet || undefined,
                  vehiculeId: objet === OBJET_ASSURANCE.VEHICULE ? form.vehiculeId : undefined,
                })
              }
            />
          ) : null}
          {form.categorieDepense === CATEGORIE_DEPENSE.REPARATION || form.categorieRecette === CATEGORIE_RECETTE.ASSURANCE_VEHICULE ? (
            <FormField
              label={form.categorieRecette ? TEXTES.flotte.motif.indemnite : TEXTES.flotte.motif.reparation}
              required={!!form.categorieRecette || !!form.vehiculeId}
              value={form.motif ?? ''}
              onChangeText={(motif) => f.setForm({ ...form, motif: motif || undefined })}
              aide={TEXTES.flotte.motif.aide}
            />
          ) : null}
          {categorieAvecVehicule(form.categorieDepense, form.categorieRecette, form.objetAssurance) ? (
            <ChampVehicule value={form.vehiculeId ?? ''} onChange={(id) => f.setForm({ ...form, vehiculeId: id || undefined })} />
          ) : null}
        </SectionForm>
      ) : null}

      {/* Coût : le montant, puis le taux de TVA ; une aide a, à côté du montant, son taux d'imposition. Puis le règlement. */}
      {onglet === 'cout' ? (
        <SectionForm>
          {estAide ? (
            <>
              <View style={commonStyles.row}>
                <View style={commonStyles.flex1}>{coutMontant}</View>
                <View style={commonStyles.flex1}>
                  <ChampTauxImposition
                    value={String(tauxImpositionAide(form.typeAide ?? TYPE_AIDE.AUTRE, form.tauxImposition))}
                    onChange={(taux) => f.setForm({ ...form, tauxImposition: Number(taux) })}
                  />
                </View>
              </View>
              <Text style={commonStyles.note}>{T.partDuMontantIncluseDans}</Text>
            </>
          ) : (
            <>
              {coutMontant}
              <ChampTauxTva value={form.tauxTva?.toString() ?? ''} onChange={f.changerTauxTva} ttc={montantTtc} />
            </>
          )}
          {/* Le paiement : réglée ou encaissée (la date du jour s'enregistre en la cochant payée), ou pas encore, avec la date prévue. */}
          {paiementAffiche ? (
            <ChampPaiement
              libellePayee={estEmise ? 'Encaissé' : 'Payé'}
              libelleAttente={estEmise ? 'À encaisser' : 'À payer'}
              enAttente={form.payee === false}
              onEnAttente={(attente) => f.setForm(avecPaiement(form, attente))}
              echeance={form.echeance ?? ''}
              onEcheance={(echeance) => f.setForm({ ...form, echeance })}
            />
          ) : null}
        </SectionForm>
      ) : null}

      {/* Quitter la modification : les changements se sont déjà enregistrés au fil de la saisie. */}
      <View style={commonStyles.row}>
        <Button style={commonStyles.flex1} variant="secondary" label={TEXTES.commun.general.annuler} onPress={() => f.setEditing(false)} />
        <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={() => f.enregistrerModifications()} />
      </View>
    </>
  );
}
