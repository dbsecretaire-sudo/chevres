import { describe, expect, it } from 'vitest';
import { controlerAvantEnregistrement, type SaisieAControler } from '@/features/comptabilite/hooks/nouvelleEcriture/enregistrement';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre, cleArticle } from '@/features/stock/services/stock';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { GENRE_ARTICLE, ROLE_VIANDE } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture;

const saisie = (extra: Partial<SaisieAControler> = {}): SaisieAControler =>
  ({
    type: TYPE_FACTURE.EMISE,
    categorieRecette: CATEGORIE_RECETTE.VIANDE,
    categorieDepense: CATEGORIE_DEPENSE.ALIMENTATION,
    activite: 'chevres',
    precision: '',
    animaux: [],
    poidsKg: '',
    venduAuPoids: false,
    estProductionVente: true,
    typeFromage: 'frais',
    typeFromageLibre: '',
    fromages: [],
    animauxAchetes: [],
    animauxEnvoyes: [],
    ...extra,
  }) as SaisieAControler;

describe('contrôles avant l’enregistrement', () => {
  const libelle = async (role: string) => {
    const archive = await lireArchiveStock();
    return articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, 'chevres' as never).find((a) => a.cle === cleArticle(GENRE_ARTICLE.VIANDE, `chevres_${role}`))!.libelle;
  };

  it('une vente d’animaux demande les animaux', async () => {
    const e = await controlerAvantEnregistrement(saisie({ precision: await libelle(ROLE_VIANDE.SUR_PIED) }));
    expect(e?.titre).toBe(T.animauxRequis);
  });

  it('au kilo (sur pied), le poids est requis', async () => {
    const e = await controlerAvantEnregistrement(saisie({ precision: await libelle(ROLE_VIANDE.SUR_PIED), animaux: ['a'] }));
    expect(e?.titre).toBe(T.poidsRequis);
  });

  it('un animal vivant vendu à la tête n’a pas besoin de poids', async () => {
    const e = await controlerAvantEnregistrement(saisie({ precision: await libelle(ROLE_VIANDE.VIVANT), animaux: ['a'] }));
    expect(e).toBeUndefined();
  });

  it('un animal vivant vendu au poids vif (réforme) demande le poids', async () => {
    const e = await controlerAvantEnregistrement(
      saisie({ precision: await libelle(ROLE_VIANDE.VIVANT), animaux: ['a'], venduAuPoids: true }),
    );
    expect(e?.titre).toBe(T.poidsRequis);
  });

  it('une facture d’abattoir : un lot est requis (sans lot, pas de facture)', async () => {
    const e = await controlerAvantEnregistrement(
      saisie({ type: TYPE_FACTURE.RECUE, categorieRecette: CATEGORIE_RECETTE.AUTRE, categorieDepense: CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE, estProductionVente: false }),
    );
    expect(e?.titre).toBe(T.lotAbattoir.aucun);
  });
});
