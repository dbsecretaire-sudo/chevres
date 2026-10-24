import { describe, expect, it } from 'vitest';
import { ecrituresACirculation, estUnDepart } from '@/features/comptabilite/services/documentsCirculation';
import type { Facture, Vente } from '@/features/comptabilite/types';
import { piecesDuContact } from '@/features/contacts/services/piecesDuContact';
import { venteDuDepart, ventesVivantesDepuisLesLots, ventesVivantesRecentesDabord } from '@/features/lots-animaux/services/ventesVivants';
import { categoriesDeLots, estCategorieVerrouillee } from '@/features/lots-animaux/services/lots';
import { toutesLesPieces } from '@/features/fichiers/services/inventaire';
import type { PieceJointe } from '@/features/fichiers/types';
import { updateSettings, type LotAnimaux, type VenteDAnimauxVivants } from '@/features/settings/settings';
import { empreintesDe, fusionner } from '@/features/drive/fusion';

const piece = (id: string): PieceJointe => ({ id, nom: `${id}.pdf`, extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-22' });
const document = { piece: piece('circulation'), deposeLe: '2026-10-20T10:00:00Z' };
const lot = (id: string, extra: Partial<LotAnimaux> = {}): LotAnimaux => ({ id, nom: id, boucles: '', ...extra });
const vente = (id: string, extra: Partial<VenteDAnimauxVivants> = {}): VenteDAnimauxVivants => ({ id, date: '2026-10-20', boucles: '5', ...extra });

describe('ancien départ d’animaux vivants (lot interne) → vente d’animaux vivants', () => {
  const ancien = lot('d1', {
    nom: 'Départ du 20/10/2026',
    boucles: '5, 9',
    categorie: 'depart',
    depart: true,
    dateDepart: '2026-10-20',
    contactCle: 'c1',
    documentCirculation: document,
  });

  it('reprend le jour, les boucles, l’acheteur et le document, avec le même identifiant, et retire le lot', () => {
    const bon = lot('b1', { abattoir: '2026-10-19', depart: true });
    const r = ventesVivantesDepuisLesLots([bon, ancien, lot('libre')], []);
    expect(r?.ventesVivants).toEqual([{ id: 'd1', date: '2026-10-20', boucles: '5, 9', contactCle: 'c1', documentCirculation: document }]);
    // Le bon de livraison (départ à l'abattoir) et les autres lots restent.
    expect(r?.lots.map((l) => l.id)).toEqual(['b1', 'libre']);
  });

  it('ne fait rien quand il n’y a aucun ancien départ (la migration est sans effet la fois suivante)', () => {
    expect(ventesVivantesDepuisLesLots([lot('b1', { abattoir: '2026-10-19', depart: true }), lot('libre')], [])).toBeNull();
    const premiere = ventesVivantesDepuisLesLots([ancien], [])!;
    expect(ventesVivantesDepuisLesLots(premiere.lots, premiere.ventesVivants)).toBeNull();
  });

  it('ne duplique pas une vente déjà reprise (une synchronisation a pu rapporter l’ancien lot)', () => {
    const r = ventesVivantesDepuisLesLots([ancien], [vente('d1', { boucles: '5, 9, 12' })])!;
    expect(r.ventesVivants).toHaveLength(1);
    expect(r.ventesVivants[0].boucles).toBe('5, 9, 12');
    expect(r.lots).toEqual([]);
  });

  it('les anciennes catégories « Départs d’animaux vivants » des réglages disparaissent', () => {
    const categories = categoriesDeLots([], [{ id: 'depart', nom: 'Départs' }, { id: 'abattoir', nom: 'Abattoir' }]);
    expect(categories.map((c) => c.id)).not.toContain('depart');
    expect(estCategorieVerrouillee('depart')).toBe(false);
  });
});

describe('vente d’un départ d’animaux vivants', () => {
  it('crée la vente du jour, avec l’acheteur et le document', () => {
    const r = venteDuDepart([], { date: '2026-10-20', boucles: ['12', '7'], document, contactCle: 'c1', nouvelId: () => 'v1' });
    expect(r.vente).toEqual({ id: 'v1', date: '2026-10-20', boucles: '12, 7', contactCle: 'c1', documentCirculation: document });
  });

  it('complète la vente du même jour au même acheteur, mais pas celle d’un autre acheteur', () => {
    const existante = vente('a', { boucles: '12, 7', contactCle: 'c1', documentCirculation: document });
    const memeAcheteur = venteDuDepart([existante], { date: '2026-10-20', boucles: ['7', '30'], contactCle: 'c1' });
    expect(memeAcheteur.ventes).toHaveLength(1);
    expect(memeAcheteur.vente.boucles).toBe('12, 30, 7');
    // Le document déjà déposé reste quand le départ n'en apporte pas.
    expect(memeAcheteur.vente.documentCirculation).toBe(document);
    const autre = venteDuDepart([existante], { date: '2026-10-20', boucles: ['1'], contactCle: 'c2', nouvelId: () => 'b' });
    expect(autre.ventes.map((v) => v.id)).toEqual(['a', 'b']);
  });

  it('range les ventes de la plus récente à la plus ancienne', () => {
    expect(ventesVivantesRecentesDabord([vente('a', { date: '2026-01-01' }), vente('b', { date: '2026-09-01' })]).map((v) => v.id)).toEqual(['b', 'a']);
  });
});

describe('documents de circulation d’une vente d’animaux vivants', () => {
  const facture = (extra: Partial<Facture>): Facture =>
    ({ id: 'F1', type: 'recue', date: '2026-10-25', tiers: 'Abattoir', description: '', montant: 10, ...extra }) as Facture;
  const venteComptable = (extra: Partial<Vente>): Vente =>
    ({ id: 'V1', date: '2026-10-21', client: 'Marie', prix: 300, numeroFacture: 'F-1', ...extra }) as Vente;

  it('la liste une ligne « vivants », avec son document, et rattache la facture au détenteur d’arrivée (lotId = id de la vente)', () => {
    const e = ecrituresACirculation([venteComptable({ lotId: 'v1' })], [], new Set(), [], [], [vente('v1', { documentCirculation: document })]);
    expect(e.map((x) => x.cle)).toEqual(['vivants:v1']);
    expect(e[0]).toMatchObject({ type: 'vivants', id: 'v1', date: '2026-10-20', nature: 'vente', depose: document });
    expect(e[0].liees).toEqual([expect.objectContaining({ type: 'vente', id: 'V1', montant: 300, role: 'vente' })]);
    expect(estUnDepart(e[0].type)).toBe(true);
  });

  it('une vente sans document est rappelée comme les autres', () => {
    const e = ecrituresACirculation([], [facture({})], new Set(), [], [], [vente('v1')]);
    expect(e.find((x) => x.type === 'vivants')?.depose).toBeUndefined();
  });

  it('le bon de livraison et la vente d’animaux vivants ne se mélangent pas', () => {
    const e = ecrituresACirculation([], [], new Set(), [lot('b1', { abattoir: '2026-10-19', depart: true, nom: 'Bon' })], [], [vente('v1')]);
    expect(e.map((x) => x.cle).sort()).toEqual(['lot:b1', 'vivants:v1']);
  });

  it('un ancien départ resté dans les lots (avant la migration) n’est plus listé comme un bon', () => {
    const e = ecrituresACirculation([], [], new Set(), [lot('d1', { depart: true, dateDepart: '2026-10-20' })], [], []);
    expect(e).toEqual([]);
  });

  it('range la vente chez l’acheteur choisi, ou dont une facture porte le nom', () => {
    const ecritures = ecrituresACirculation([venteComptable({ lotId: 'v1', client: 'Marie Particulier' })], [], new Set(), [], [], [
      vente('v1', { contactCle: 'c1' }),
      vente('v2', { date: '2026-11-01' }),
    ]);
    const chezC1 = piecesDuContact({ nom: 'Pierre', cle: 'c1' }, undefined, [], ecritures, [], [vente('v1', { contactCle: 'c1' }), vente('v2', { date: '2026-11-01' })]);
    expect(chezC1.map((p) => p.cle)).toEqual(['circulation-vivants:v1']);
    const parLeNom = piecesDuContact({ nom: 'marie particulier', cle: 'c9' }, undefined, [], ecritures, [], [vente('v1', { contactCle: 'c1' })]);
    expect(parLeNom.map((p) => p.cle)).toEqual(['circulation-vivants:v1']);
  });
});

describe('sauvegarde et Google Drive', () => {
  it('la sauvegarde garde le document de circulation d’une vente d’animaux vivants', async () => {
    await updateSettings({ exploitation: { ventesVivants: [vente('v1', { documentCirculation: { piece: piece('circulation-vivants'), deposeLe: '2026-10-20T10:00:00Z' } })] } });
    expect((await toutesLesPieces()).map((p) => p.id)).toContain('circulation-vivants');
  });

  it('la fusion Drive additionne les ventes des deux appareils et propage une suppression', () => {
    const base = empreintesDe({ ventesVivants: [vente('a'), vente('b')] });
    const local = { ventesVivants: [vente('a'), vente('c')] };
    const distant = { ventesVivants: [vente('a'), vente('b'), vente('d')] };
    const valeur = fusionner(local, distant, undefined, base);
    expect((valeur as { ventesVivants: VenteDAnimauxVivants[] }).ventesVivants.map((v) => v.id).sort()).toEqual(['a', 'c', 'd']);
  });
});
