import { describe, expect, it } from 'vitest';
import { calculerTresorerie, echeancesDeContrat } from '@/features/comptabilite/services/tresorerie';
import type { Facture } from '@/features/comptabilite/types';
import type { ContratAssurance } from '@/features/settings/settings';
import { CATEGORIE_DEPENSE, TYPE_FACTURE } from '@/shared/constants/comptabilite';

const contrat = (extra: Partial<ContratAssurance> = {}): ContratAssurance => ({
  id: 'c1',
  nom: 'RC exploitation',
  prime: 600,
  periodicite: 'annuelle',
  prochaineEcheance: '2026-12-01',
  ...extra,
});

describe('échéancier des assurances', () => {
  it('compte une prime par période, de la prochaine échéance à l’horizon', () => {
    const trimestrielle = echeancesDeContrat(contrat({ periodicite: 'trimestrielle', prime: 150 }), '2026-10-22', '2027-10-22');
    expect(trimestrielle.map((e) => e.date)).toEqual(['2026-12-01', '2027-03-01', '2027-06-01', '2027-09-01']);
    expect(echeancesDeContrat(contrat(), '2026-10-22', '2027-10-22').map((e) => e.date)).toEqual(['2026-12-01']);
  });

  it('ignore les primes passées', () => {
    expect(echeancesDeContrat(contrat({ prochaineEcheance: '2026-01-15' }), '2026-10-22', '2027-10-22').map((e) => e.date)).toEqual([
      '2027-01-15',
    ]);
  });

  it('ajoute les primes à venir à l’échéancier, en « à payer »', () => {
    const t = calculerTresorerie({ annee: 2026, ventes: [], factures: [], contratsAssurance: [contrat()], aujourdhui: '2026-10-22' });
    expect(t.echeances).toHaveLength(1);
    expect(t.echeances[0]).toMatchObject({ source: 'assurance', montant: -600, libelle: 'RC exploitation' });
    expect(t.totaux.aPayer).toBe(600);
  });

  it('ne compte pas deux fois une prime déjà notée comme dépense à moins d’un mois', () => {
    const facture = {
      id: 'f1',
      date: '2026-11-25',
      montant: 600,
      type: TYPE_FACTURE.RECUE,
      categorieDepense: CATEGORIE_DEPENSE.ASSURANCES,
      tiers: 'Groupama',
      payee: true,
    } as Facture;
    const t = calculerTresorerie({ annee: 2026, ventes: [], factures: [facture], contratsAssurance: [contrat()], aujourdhui: '2026-10-22' });
    expect(t.echeances).toHaveLength(0);
  });

  it('sans contrat donné (échéancier désactivé), rien n’est ajouté', () => {
    const t = calculerTresorerie({ annee: 2026, ventes: [], factures: [], aujourdhui: '2026-10-22' });
    expect(t.echeances).toHaveLength(0);
  });
});
