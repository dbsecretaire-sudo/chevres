import { describe, expect, it } from 'vitest';
import { ligneAlimentVide, lignesAlimentationFinales, versLignesAlimentationForm } from '@/features/comptabilite/forms/lignesAlimentation';
import { ligneProductionVide, lignesProductionFinales } from '@/features/comptabilite/forms/lignesProduction';
import { ligneMarchandiseVide, lignesMarchandisesFinales } from '@/features/comptabilite/forms/lignesMarchandises';
import { totalMontants } from '@/shared/utils/nombres';
import { offertAffiche } from '@/shared/dictionnaire/categoriesFournisseur';
import type { Facture } from '@/features/comptabilite/types';

const aliment = (extra: Record<string, unknown>) => ({ ...ligneAlimentVide(), ...extra }) as ReturnType<typeof ligneAlimentVide>;

describe('dépense offerte par le fournisseur (cadeau)', () => {
  it('le total ne compte pas les lignes offertes, et seulement quand la dépense est offerte', () => {
    const lignes = [
      { montant: '10' },
      { montant: '20', offert: false },
      { montant: '5', offert: undefined },
    ];
    expect(totalMontants(lignes)).toBe(35);
    expect(totalMontants(lignes, true)).toBe(20);
  });

  it('une ligne d’aliment offerte compte 0 € et reste avec sa quantité ; une ligne vide disparaît', () => {
    const lignes = [aliment({ quantiteKg: '100', montant: '' }), aliment({ montant: '' }), aliment({ montant: '30', offert: false })];
    const finales = lignesAlimentationFinales(lignes, 'caprin' as never, true);
    expect(finales).toHaveLength(2);
    expect(finales[0]).toMatchObject({ montant: 0, offert: true, quantiteKg: 100 });
    expect(finales[1]).toMatchObject({ montant: 30 });
    expect(finales[1].offert).toBeUndefined();
    // Sans dépense offerte, une ligne sans montant n'est pas gardée (comme avant).
    expect(lignesAlimentationFinales(lignes, 'caprin' as never)).toHaveLength(1);
  });

  it('une fourniture offerte entre au stock (article et quantité) pour 0 €', () => {
    const lignes = [
      { ...ligneProductionVide(), article: 'perso:sel', quantite: '12', montant: '' },
      { ...ligneProductionVide(), article: '', quantite: '', montant: '' },
    ];
    const finales = lignesProductionFinales(lignes, true);
    expect(finales).toEqual([{ article: 'perso:sel', quantite: 12, montant: 0, bouclesDebut: undefined, offert: true }]);
    expect(lignesProductionFinales(lignes)).toEqual([]);
  });

  it('une marchandise offerte garde sa quantité pour 0 €', () => {
    const lignes = [{ ...ligneMarchandiseVide(), marchandise: 'Bière', quantite: '24', montant: '' }];
    expect(lignesMarchandisesFinales(lignes, true)).toMatchObject([{ marchandise: 'Bière', quantite: 24, montant: 0, offert: true }]);
    expect(lignesMarchandisesFinales(lignes)).toEqual([]);
  });

  it('à la modification, une ligne facturée d’une dépense offerte garde son bouton désactivé', () => {
    const facture = {
      offert: true,
      lignesAlimentation: [
        { type: 'foin', montant: 0, offert: true },
        { type: 'luzerne', montant: 40 },
      ],
    } as unknown as Facture;
    const [offerte, facturee] = versLignesAlimentationForm(facture);
    expect(offerte.offert).toBeUndefined();
    expect(facturee.offert).toBe(false);
  });

  it('la catégorie du fournisseur propose la case d’office, sauf si elle la retire', () => {
    expect(offertAffiche(undefined)).toBe(true);
    expect(offertAffiche({ id: 'x', nom: 'X' })).toBe(true);
    expect(offertAffiche({ id: 'x', nom: 'X', offert: false })).toBe(false);
  });
});
