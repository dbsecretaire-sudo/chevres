import { Text, View } from 'react-native';
import { LignesChambreEditor } from '@/features/comptabilite/components/LignesChambreEditor';
import { LignesVeterinaireEditor } from '@/features/comptabilite/components/LignesVeterinaireEditor';
import { LignesProductionEditor } from '@/features/comptabilite/components/LignesProductionEditor';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { Checkbox } from '@/shared/components/Checkbox';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { SectionForm } from '@/shared/components/SectionForm';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { LignesMarchandisesEditor } from '@/features/comptabilite/components/LignesMarchandisesEditor';
import { LignesAlimentationEditor } from '@/features/comptabilite/components/LignesAlimentationEditor';
import { LignesCarburantEditor } from '@/features/comptabilite/components/LignesCarburantEditor';
import { ChampTauxImposition } from '@/features/comptabilite/components/ChampTauxImposition';
import { ChampMontantTtc, NoteComptePcg } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import type { EtatFicheFacture } from '@/features/comptabilite/hooks/useFicheFacture';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { clientsPourLaRecette } from '@/features/comptabilite/utils/recettes';
import {
  depenseImposee,
  estChambreAgriculture,
  fournisseursPourLaDepense,
  fournituresSeulementBoucles,
} from '@/features/fournisseurs/services/categorie';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { ChampNatureUrssaf } from '@/features/comptabilite/components/ChampNatureUrssaf';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  TYPE_AIDE,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { CATEGORIES_RECETTE_AVEC_NATURE_URSSAF } from '@/shared/constants/entreprise';
import { ROUTES } from '@/shared/constants/routes';
import { DossiersDeLAide } from '@/features/exploitation/components/DossiersDeLAide';
import { idVisiteDeLaFacture } from '@/features/exploitation/services/visitesFacture';
import { especesActives, plusieursEspeces } from '@/shared/dictionnaire/animaux';
import { formatTotalEuros } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import {
  categorieFournisseurDe,
  pasPayeeAffichee,
  sansFactureAffichee,
} from '@/shared/dictionnaire/categoriesFournisseur';
import { categorieClientDe, pasEncaisseeAffichee } from '@/shared/dictionnaire/categoriesClient';
import { estBoucleNumerotee } from '@/features/stock/services/boucles';
import { ChampVisite } from '@/features/comptabilite/components/ecriture/ChampVisite';
import { ChampAtelier } from '@/features/comptabilite/components/ChampAtelier';
import { ChampElementAgritourisme } from '@/features/comptabilite/components/ChampElementAgritourisme';
import { ATELIER } from '@/shared/constants/ateliers';
import { ChampPaiement } from '@/features/comptabilite/components/ChampPaiement';
import { tauxImpositionAide } from '@/features/comptabilite/utils/planComptable';
import { avecPaiement } from '@/features/comptabilite/utils/paiement';
import { ChampStockProduction } from '@/features/comptabilite/components/ecriture/ChampStockProduction';
import { styles } from '@/shared/styles/comptabilite/FicheFacture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import {
  LABEL_ACTIVITE_COMPTABLE,
  LABEL_CATEGORIE_DEPENSE,
  LABEL_CATEGORIE_RECETTE,
  LABEL_TYPE_AIDE,
} from '@/shared/textes/libelles';
import type { TypeAide } from '@/features/comptabilite/types';

const T = TEXTES.comptabilite.nouvelleEcriture;

/**
 * Formulaire de modification d'une facture : les mêmes deux blocs, les mêmes champs et le même ordre qu'à la création — d'abord
 * l'identification (date, tiers, n° de facture, paiement), puis les informations (catégorie, ce qui lui est propre, montant, TVA,
 * atelier). Le type et la catégorie ne se modifient pas.
 */
export function FactureFormulaire({ f }: { f: EtatFicheFacture }) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const { settings } = useAppSettings();
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
  const fournisseur = fournisseurs.find((x) => x.nomEntreprise === form.tiers);
  // Une entreprise non assujettie à la TVA n'a pas de taux à saisir.
  const sansTva = modeEntreprise() && !settings.exploitation?.entreprise?.tvaApplicable;
  const champTauxTva = sansTva ? null : (
    <SelectField
      label={TEXTES.commun.general.tauxDeTva}
      value={form.tauxTva?.toString() ?? ''}
      onChange={f.changerTauxTva}
      options={OPTIONS_TAUX_TVA}
    />
  );
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
      ? LABEL_CATEGORIE_DEPENSE[form.categorieDepense]
      : '';

  /** Le montant : un seul champ, ou le total des lignes (alimentation, carburant, marchandises) qui le font. */
  const montant = f.estAlimentation ? (
    <>
      <LignesAlimentationEditor lignes={f.lignes} onChange={f.setLignes} activite={f.activiteForm} />
      <Text style={styles.total}>
        {TEXTES.commun.general.totalFactureTtcDeuxPoints}
        {formatTotalEuros(f.totalAlimentation)}
      </Text>
    </>
  ) : f.estMarchandises ? (
    <>
      <LignesMarchandisesEditor lignes={f.lignesMarchandises} onChange={f.setLignesMarchandises} />
      <Text style={styles.total}>
        {TEXTES.commun.general.totalFactureTtcDeuxPoints}
        {formatTotalEuros(f.totalMarchandises)}
      </Text>
    </>
  ) : f.estChambre ? (
    <>
      <LignesChambreEditor lignes={f.lignesChambre} onChange={f.setLignesChambre} />
      <LignesProductionEditor
        lignes={f.lignesProduction}
        onChange={f.setLignesProduction}
        seulementBoucles
        titre={TEXTES.fournisseurs.chambre.boucles}
      />
      <Text style={styles.total}>
        {TEXTES.commun.general.totalFactureTtcDeuxPoints}
        {formatTotalEuros(f.totalChambre)}
      </Text>
    </>
  ) : f.estProduction ? (
    <>
      <LignesProductionEditor
        lignes={f.lignesProduction}
        onChange={f.setLignesProduction}
        seulementBoucles={fournituresSeulementBoucles(fournisseur)}
      />
      <Text style={styles.total}>
        {TEXTES.commun.general.totalFactureTtcDeuxPoints}
        {formatTotalEuros(f.totalProduction)}
      </Text>
    </>
  ) : f.estCarburant ? (
    <>
      <LignesCarburantEditor lignes={f.lignesCarburant} onChange={f.setLignesCarburant} />
      <Text style={styles.total}>
        {TEXTES.commun.general.totalFactureTtcDeuxPoints}
        {formatTotalEuros(f.totalCarburant)}
      </Text>
    </>
  ) : (
    <>
      <ChampMontantTtc value={f.montantTexte} onChange={f.changerMontant} />
      {/* Une dépense « Autre » d'un fournisseur de la Chambre d'agriculture : on peut la détailler par article. */}
      {form.categorieDepense === CATEGORIE_DEPENSE.AUTRE && estChambreAgriculture(fournisseur) ? (
        <Button
          variant="secondary"
          label={TEXTES.fournisseurs.chambre.detailler}
          onPress={f.detaillerChambreAgriculture}
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

      {/* L'identification : la date, le tiers, le numéro de la facture et le paiement. */}
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
            options={clientsPourLaRecette(clients, form.categorieRecette, f.activiteForm, form.tiers).map(
              (c) => ({ value: c.id, label: nomComplet(c) }),
            )}
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
            options={fournisseursPourLaDepense(fournisseurs, form.categorieDepense, form.tiers).map((x) => ({
              value: x.id,
              label: x.nomEntreprise,
            }))}
            onEdit={() => router.push(ROUTES.fournisseursDepuis(retour))}
          />
        )}
        {/* Une aide n'a pas de numéro de facture : le tiers et le type d'aide la décrivent. */}
        {estAide ? null : (
          <FormField
            label={T.nDeFactureOuObjet}
            value={form.description ?? ''}
            onChangeText={(description) => f.setForm({ ...form, description })}
            placeholder={T.precisions}
          />
        )}
        {/* Le paiement : réglée ou encaissée (la date du jour s'enregistre en la cochant payée), ou pas encore, avec la date prévue. */}
        {paiementAffiche ? (
          <ChampPaiement
            libelle={
              estEmise
                ? TEXTES.comptabilite.tresorerie.paiement.pasEncaissee
                : TEXTES.comptabilite.tresorerie.paiement.pasPayee
            }
            enAttente={form.payee === false}
            onEnAttente={(attente) => f.setForm(avecPaiement(form, attente))}
            echeance={form.echeance ?? ''}
            onEcheance={(echeance) => f.setForm({ ...form, echeance })}
          />
        ) : null}
        {estEmise || !sansFactureAffichee(categorieFournisseurDuTiers) ? null : (
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
      </SectionForm>

      {/* Les informations : la catégorie (fixe), ce qui lui est propre, le montant, la TVA, l'atelier. */}
      <SectionForm>
        <FormField
          label={estEmise ? T.categorieDeRecette : T.categorieDeDepense}
          value={categorie}
          editable={false}
          style={commonStyles.verrouille}
          aide={TEXTES.comptabilite.ficheFacture.nonModifiableLaCategorieLe}
        />
        {f.compteAffiche ? <NoteComptePcg compte={f.compteAffiche} /> : null}

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

        {/* Le montant, puis le taux de TVA ; une aide a, à côté du montant, son taux d'imposition (comme à la création). */}
        {estAide ? (
          <>
            <View style={commonStyles.row}>
              <View style={commonStyles.flex1}>{montant}</View>
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
            {montant}
            {champTauxTva}
          </>
        )}

        {/* La nature de la recette pour la déclaration URSSAF (une entreprise). */}
        {modeEntreprise() &&
        ((estEmise &&
          form.categorieRecette &&
          (CATEGORIES_RECETTE_AVEC_NATURE_URSSAF as readonly string[]).includes(form.categorieRecette)) ||
          (!estEmise && form.categorieDepense === CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT)) ? (
          <ChampNatureUrssaf
            value={form.natureUrssaf ?? ''}
            onChange={(valeur) =>
              f.setForm({ ...form, natureUrssaf: (valeur || undefined) as typeof form.natureUrssaf })
            }
          />
        ) : null}

        {/* L'atelier de la charge (facultatif) : un fournisseur dont la catégorie impose la dépense (vétérinaire…) n'en demande pas. */}
        {!estEmise && !modeEntreprise() && !depenseImposee(fournisseur) ? (
          <ChampAtelier
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

    </>
  );
}
