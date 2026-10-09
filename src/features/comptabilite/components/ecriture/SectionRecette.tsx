import { useRouter } from 'expo-router';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { FormField } from '@/shared/components/FormField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import {
  ChampCategorieCompte,
  ChampMontantTtc,
  NoteComptePcg,
} from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import {
  ChampTypeAide,
  ChampsAide,
  ChampsVenteAnimal,
  ChampsVenteOeufs,
  ChampsVenteCabris,
  ChampsVenteFromage,
  ChampsVenteLait,
  ChampsVenteViande,
} from '@/features/comptabilite/components/ecriture/ChampsVente';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import type { Vente } from '@/features/comptabilite/types';
import { libelleCategorieVente } from '@/features/comptabilite/utils/ventes';
import { ChampNatureUrssaf } from '@/features/comptabilite/components/ChampNatureUrssaf';
import { CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';
import { CATEGORIES_RECETTE_AVEC_NATURE_URSSAF } from '@/shared/constants/entreprise';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { ROUTES } from '@/shared/constants/routes';
import { SECTION_STOCK, SECTION_STOCK_PAR_CATEGORIE_RECETTE } from '@/shared/constants/stock';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';
import { SelectField } from '@/shared/components/SelectField';
import { Checkbox } from '@/shared/components/Checkbox';

/** Champs d'un crédit : facture émise (aide, autre) ou vente de production (lait, fromage, cabris). */
export function SectionRecette({ e }: { e: EtatNouvelleEcriture }) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const optionsClients = e.clients.map((c) => ({ value: c.id, label: nomComplet(c) }));

  return (
    <>
      {/* Une aide se décrit par son type (DPB, ICHN…) ; une autre facture par son numéro. */}
      {e.categorieRecette === CATEGORIE_RECETTE.AIDE && <ChampTypeAide e={e} />}
      {!e.estProductionVente && e.categorieRecette !== CATEGORIE_RECETTE.AIDE && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.nDeFacture}
          value={e.description}
          onChangeText={e.setDescription}
          placeholder={TEXTES.comptabilite.nouvelleEcriture.precisions}
          aide={TEXTES.comptabilite.nouvelleEcriture.aideNumeroFacture}
        />
      )}
      <ChampCategorieCompte
        label={TEXTES.comptabilite.nouvelleEcriture.categorieDeRecette}
        // Le libellé est un lien : l'inventaire, à la section de la catégorie choisie (c'est lui qui tient ses prix et ses lignes).
        onPressLabel={
          !e.entreprise && e.activite !== ACTIVITE_COMMUNE
            ? () =>
                router.push(
                  ROUTES.stockDepuis(
                    retour,
                    SECTION_STOCK_PAR_CATEGORIE_RECETTE[e.categorieRecette],
                    e.activite,
                  ),
                )
            : undefined
        }
        // Une vente d'œufs est liée à la liste des œufs de l'inventaire : le crayon y mène (le prix s'y change).
        onEdit={
          e.categorieRecette === CATEGORIE_RECETTE.OEUFS
            ? () =>
                router.push(
                  ROUTES.stockDepuis(
                    retour,
                    SECTION_STOCK.OEUFS,
                    e.activite === ACTIVITE_COMMUNE ? undefined : e.activite,
                  ),
                )
            : undefined
        }
        value={e.groupeRecetteAffiche}
        onChange={e.choisirGroupeRecette}
        options={e.optionsGroupesRecette}
        demanderCompte={e.categorieRecette === CATEGORIE_RECETTE.AUTRE && !e.categorieAjoutee}
        compte={e.compteRecetteAutre}
        onCompteChange={e.setCompteRecetteAutre}
        optionsCompte={e.optionsCompteRecette}
        onGererComptes={() => router.push(ROUTES.COMPTES_PCG)}
      />

      {/* Seconde liste : lait ou fromage ; boucherie, petits, animal sur pied ou vivant. */}
      {e.categoriesDuGroupe.length > 1 && (
        <SelectField
          label={TEXTES.comptabilite.nouvelleEcriture.detailDeLaVente}
          required
          value={e.categorieRecette}
          onChange={e.changerCategorieRecette}
          options={e.categoriesDuGroupe.map((categorie) => ({
            value: categorie,
            label: libelleCategorieVente({
              categorie: categorie as Vente['categorie'],
              activite: e.activite,
            }),
          }))}
        />
      )}

      {e.modeAvance ? <NoteComptePcg compte={e.compteAffiche} /> : null}

      {!e.estProductionVente && (
        <SelectFieldEditable
          label={TEXTES.comptabilite.nouvelleEcriture.clientOrganisme}
          required
          searchable
          placeholder={TEXTES.commun.general.choixDuClient}
          value={e.clientId}
          onChange={e.setClientId}
          options={optionsClients}
          onEdit={() => router.push(ROUTES.CLIENTS)}
        />
      )}

      {(e.categorieRecette === CATEGORIE_RECETTE.AUTRE ||
        (e.entreprise && e.categorieRecette !== CATEGORIE_RECETTE.AIDE)) && (
        <ChampMontantTtc value={e.montant} onChange={e.setMontant} />
      )}

      {/* Une entreprise assujettie à la TVA indique le taux de chaque recette (hors aide). */}
      {e.entreprise && e.afficherTva && e.categorieRecette !== CATEGORIE_RECETTE.AIDE && (
        <SelectField
          label={TEXTES.commun.general.tauxDeTva}
          value={e.tauxTvaVente}
          onChange={e.setTauxTvaVente}
          options={OPTIONS_TAUX_TVA}
        />
      )}

      {e.categorieRecette === CATEGORIE_RECETTE.AIDE && <ChampsAide e={e} />}

      {e.estProductionVente && (
        <>
          <SelectFieldEditable
            label={TEXTES.commun.general.client}
            required
            searchable
            placeholder={TEXTES.commun.general.choixDuClient}
            value={e.clientId}
            onChange={e.setClientId}
            options={optionsClients}
            onEdit={() => router.push(ROUTES.CLIENTS)}
          />
          <Checkbox
            label={TEXTES.comptabilite.nouvelleEcriture.declarerLaVente}
            value={e.avecFacture}
            onChange={e.setAvecFacture}
          />
          {/* Une vente déclarée a un numéro de facture. */}
          {e.avecFacture ? (
            <FormField
              label={TEXTES.comptabilite.nouvelleEcriture.nDeFacture}
              required
              value={e.numeroFacture}
              onChangeText={e.setNumeroFacture}
            />
          ) : null}
        </>
      )}

      {/* Une entreprise : la nature de la recette pour la déclaration URSSAF (selon la catégorie tant qu'on n'en choisit pas). */}
      {e.modeAvance &&
      modeEntreprise() &&
      !e.estProductionVente &&
      (CATEGORIES_RECETTE_AVEC_NATURE_URSSAF as readonly string[]).includes(e.categorieRecette) ? (
        <ChampNatureUrssaf value={e.natureUrssaf} onChange={e.setNatureUrssaf} />
      ) : null}

      {e.categorieRecette === CATEGORIE_RECETTE.LAIT && <ChampsVenteLait e={e} />}
      {e.categorieRecette === CATEGORIE_RECETTE.FROMAGE && <ChampsVenteFromage e={e} />}
      {e.categorieRecette === CATEGORIE_RECETTE.CABRIS && <ChampsVenteCabris e={e} />}
      {(e.categorieRecette === CATEGORIE_RECETTE.ANIMAL_SUR_PIED ||
        e.categorieRecette === CATEGORIE_RECETTE.ANIMAL_VIVANT ||
        e.categorieRecette === CATEGORIE_RECETTE.ANIMAL_MORT) && <ChampsVenteAnimal e={e} />}
      {e.categorieRecette === CATEGORIE_RECETTE.OEUFS && <ChampsVenteOeufs e={e} />}
      {(e.categorieRecette === CATEGORIE_RECETTE.VIANDE ||
        e.categorieRecette === CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE) && <ChampsVenteViande e={e} />}
    </>
  );
}
