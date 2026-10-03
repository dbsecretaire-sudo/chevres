import { useRouter } from 'expo-router';
import { FormField } from '@/shared/components/FormField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import {
  ChampCategorieCompte,
  ChampMontantTtc,
  NoteComptePcg,
} from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import {
  ChampsAide,
  ChampsVenteCabris,
  ChampsVenteFromage,
  ChampsVenteLait,
} from '@/features/comptabilite/components/ecriture/ChampsVente';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import type { CategorieRecette } from '@/features/comptabilite/types';
import { CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_RECETTE } from '@/shared/textes/libelles';

/** Lues à l'affichage : certains libellés (vente de cabris…) dépendent de l'espèce de l'établissement. */
const optionsCategorieRecette = () =>
  Object.entries(LABEL_CATEGORIE_RECETTE).map(([value, label]) => ({
    value: value as CategorieRecette,
    label,
  }));

/** Champs d'un crédit : facture émise (aide, autre) ou vente de production (lait, fromage, cabris). */
export function SectionRecette({ e }: { e: EtatNouvelleEcriture }) {
  const router = useRouter();
  const optionsClients = e.clients.map((c) => ({ value: c.id, label: nomComplet(c) }));

  return (
    <>
      {!e.estProductionVente && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.nDeFacture}
          value={e.description}
          onChangeText={e.setDescription}
          placeholder={TEXTES.comptabilite.nouvelleEcriture.precisions}
        />
      )}
      <ChampCategorieCompte
        label={TEXTES.comptabilite.nouvelleEcriture.categorieDeRecette}
        value={e.categorieRecette}
        onChange={e.changerCategorieRecette}
        options={optionsCategorieRecette()}
        demanderCompte={e.categorieRecette === CATEGORIE_RECETTE.AUTRE}
        compte={e.compteRecetteAutre}
        onCompteChange={e.setCompteRecetteAutre}
        optionsCompte={e.optionsCompteRecette}
        onGererComptes={() => router.push(ROUTES.COMPTES_PCG)}
      />

      <NoteComptePcg compte={e.compteAffiche} />

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

      {e.categorieRecette === CATEGORIE_RECETTE.AUTRE && (
        <ChampMontantTtc value={e.montant} onChange={e.setMontant} />
      )}

      {e.categorieRecette === CATEGORIE_RECETTE.AIDE && <ChampsAide e={e} />}

      {e.estProductionVente && (
        <SelectFieldEditable
          label={TEXTES.commun.general.client}
          searchable
          placeholder={TEXTES.commun.general.choixDuClient}
          value={e.clientId}
          onChange={e.setClientId}
          options={optionsClients}
          onEdit={() => router.push(ROUTES.CLIENTS)}
        />
      )}

      {e.categorieRecette === CATEGORIE_RECETTE.LAIT && <ChampsVenteLait e={e} />}
      {e.categorieRecette === CATEGORIE_RECETTE.FROMAGE && <ChampsVenteFromage e={e} />}
      {e.categorieRecette === CATEGORIE_RECETTE.CABRIS && <ChampsVenteCabris e={e} />}
    </>
  );
}
