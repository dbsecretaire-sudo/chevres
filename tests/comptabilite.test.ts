import { describe, expect, it } from 'vitest';
import { calculerAmortissement } from '@/features/comptabilite/services/amortissement';
import { ajouterMois, calculerTresorerie, echeancesDEmprunt } from '@/features/comptabilite/services/tresorerie';
import { estLigneEquarrissage } from '@/features/comptabilite/utils/equarrissage';
import { lignesProductionDe } from '@/features/comptabilite/utils/lignesProduction';
import type { Facture, Vente } from '@/features/comptabilite/types';

const vente = (plus: Partial<Vente>): Vente =>
  ({ id: 'v', date: '2026-02-10', categorie: 'fromage', quantite: 1, unite: 'piece', prix: 100, ...plus }) as unknown as Vente;
const facture = (plus: Partial<Facture>): Facture =>
  ({ id: 'f', date: '2026-02-12', type: 'recue', tiers: 'X', description: '', montant: 40, ...plus }) as unknown as Facture;

describe('dates d’échéance', () => {
  it('décale de mois en ramenant le jour au dernier du mois', () => {
    expect(ajouterMois('2026-01-31', 1)).toBe('2026-02-28');
    expect(ajouterMois('2024-01-31', 1)).toBe('2024-02-29');
    expect(ajouterMois('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('échelonne un emprunt, une mensualité par mois', () => {
    const echeances = echeancesDEmprunt({ id: 'e', nom: 'Tracteur', mensualite: 250, premiereEcheance: '2026-03-31', nombreEcheances: 3 });
    expect(echeances.map((e) => e.date)).toEqual(['2026-03-31', '2026-04-30', '2026-05-31']);
    expect(echeances.every((e) => e.montant === 250)).toBe(true);
  });
});

describe('trésorerie', () => {
  const base = { annee: 2026, aujourdhui: '2026-06-15' };

  it('compte le solde de départ, les ventes encaissées et les dépenses payées', () => {
    const t = calculerTresorerie({
      ...base,
      reglages: { soldeDepart: 1000, dateSolde: '2026-01-01' },
      ventes: [vente({ prix: 300 })],
      factures: [facture({ montant: 120 })],
    });
    expect(t.soldeActuel).toBe(1000 + 300 - 120);
    expect(t.mois[1].encaissements).toBe(300);
    expect(t.mois[1].decaissements).toBe(120);
  });

  it('une vente pas encore payée est « à encaisser », pas dans le solde actuel', () => {
    const t = calculerTresorerie({
      ...base,
      reglages: { soldeDepart: 0, dateSolde: '2026-01-01' },
      ventes: [vente({ prix: 500, payee: false, echeance: '2026-07-01' })],
      factures: [],
    });
    expect(t.soldeActuel).toBe(0);
    expect(t.totaux.aEncaisser).toBe(500);
  });

  it('une dépense pas encore payée est « à payer »', () => {
    const t = calculerTresorerie({
      ...base,
      reglages: { soldeDepart: 0, dateSolde: '2026-01-01' },
      ventes: [],
      factures: [facture({ montant: 80, payee: false, echeance: '2026-08-01' })],
    });
    expect(t.totaux.aPayer).toBe(80);
    expect(t.soldeActuel).toBe(0);
  });

  it('un paiement en retard compte à la date d’aujourd’hui', () => {
    const t = calculerTresorerie({
      ...base,
      reglages: { soldeDepart: 0, dateSolde: '2026-01-01' },
      ventes: [vente({ prix: 200, payee: false, echeance: '2026-03-01' })],
      factures: [],
    });
    expect(t.mois[5].encaissements).toBe(200);
    expect(t.echeances[0].enRetard).toBe(true);
  });

  it('signale les mois sous le seuil d’alerte', () => {
    const t = calculerTresorerie({
      ...base,
      reglages: { soldeDepart: 100, dateSolde: '2026-01-01', seuilAlerte: 50 },
      ventes: [],
      factures: [facture({ montant: 90, date: '2026-04-05' })],
    });
    expect(t.alertes.length).toBeGreaterThan(0);
    expect(t.alertes[0].mois).toBe(4);
  });
});

describe('amortissement', () => {
  it('amortit en ligne droite : montant divisé par la durée', () => {
    const r = calculerAmortissement({ inclure: true, montant: 10000, duree: 10 });
    expect(r.annuel).toBe(1000);
    expect(r.inclure).toBe(true);
  });

  it('additionne le détail des éléments, chacun sur sa durée', () => {
    const r = calculerAmortissement({
      inclure: true,
      detaille: true,
      elements: [
        { id: 'a', libelle: 'Local', montant: 20000, duree: 20 },
        { id: 'b', libelle: 'Cuve', montant: 3000, duree: 10 },
      ],
    });
    expect(r.total).toBe(23000);
    expect(r.annuel).toBe(1300);
  });

  it('n’entre pas dans la simulation sans montant ou sans le choix de l’utilisateur', () => {
    expect(calculerAmortissement(undefined).inclure).toBe(false);
    expect(calculerAmortissement({ inclure: false, montant: 1000, duree: 5 }).inclure).toBe(false);
  });
});

describe('lignes de facture', () => {
  it('reconnaît l’équarrissage, avec ou sans accent et avec une ou deux r', () => {
    expect(estLigneEquarrissage('Équarrissage ATM')).toBe(true);
    expect(estLigneEquarrissage('equarissage')).toBe(true);
    expect(estLigneEquarrissage('Forfait conseil')).toBe(false);
  });

  it('une ancienne facture d’achat devient une ligne de production', () => {
    const lignes = lignesProductionDe({ stockArticle: 'boucle:boucles', stockQuantite: 5, bouclesDebut: '100', montant: 12 });
    expect(lignes).toEqual([{ article: 'boucle:boucles', quantite: 5, montant: 12, bouclesDebut: '100' }]);
    expect(lignesProductionDe({ montant: 12 })).toEqual([]);
  });
});
