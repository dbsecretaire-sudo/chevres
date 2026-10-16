import { describe, expect, it } from 'vitest';
import { bouclesHtml, LIGNES_PAR_PAGE_REPERES, ligneDeLaListe, pagesDesReperes, type LigneListe, type ListeImprimee } from '@/features/export/bouclesPdf';
import type { BoucleStock } from '@/features/stock/types';

const boucle = (plus: Partial<BoucleStock>): BoucleStock => ({ id: 'b', article: 'boucle:boucles', numero: '200888', ...plus });

describe('liste des repères imprimée', () => {
  it('écrit l’identification avec l’indicatif, l’année de naissance et la date de pose', () => {
    const l = ligneDeLaListe(boucle({ datePose: '2020-04-01', chevreId: 'c1' }), { dateNaissance: '2019-12-16' }, undefined, 'FR 21228');
    expect(l).toMatchObject({ identification: 'FR 21228200888', naissance: '2019', pose: '01/04/2020', secondRepere: '01/04/2020', commentaires: '' });
  });

  it('range la remarque et la sortie de l’animal dans les commentaires', () => {
    const l = ligneDeLaListe(
      boucle({ remarque: 'commandée en trop', chevreId: 'c1' }),
      { dateNaissance: '2019-12-16' },
      { statut: 'abattoir', date: '2026-03-12' },
      undefined,
    );
    expect(l.commentaires).toBe('commandée en trop — Abattoir le 12/03/2026');
    expect(l.identification).toBe('200888');
  });

  it('une boucle à ne pas poser le dit en commentaire ; une boucle libre n’a ni naissance ni date', () => {
    const l = ligneDeLaListe(boucle({ remarque: undefined }), undefined, undefined, 'FR 21228');
    expect(l.naissance).toBe('');
    expect(l.pose).toBe('');
    expect(l.commentaires).toBe('');
  });

  it('compose le document : titre, édition, identité, colonnes du formulaire et note', () => {
    const liste: ListeImprimee = {
      titre: { debut: 'LISTE DES REPERES', fin: 'EN STOCK' },
      sorte: 'Boucles',
      filtre: 'Non posée',
      lignes: [{ identification: 'FR 21228200888', naissance: '', pose: '', secondRepere: '', commentaires: '' }],
    };
    const html = bouclesHtml([liste], { nom: 'Riolacci Joseph', adresse: ['Pianellucciu, 7', '20272 Pianello'], cheptel: '20 213 003' }, '12/12/2024');
    expect(html).toContain('LISTE DES REPERES');
    expect(html).toContain('EN STOCK');
    expect(html).toContain('Edition du : 12/12/2024');
    expect(html).toContain('20 213 003');
    expect(html).toContain('<b class="pays">FR</b>');
    expect(html).toContain('Année de naissance');
    expect(html).toContain('Date de pose du second repère');
    expect(html).toContain('Commentaires*');
    expect(html).toContain('20272 Pianello');
  });

  it('toujours trente lignes par page, les manquantes restant vides', () => {
    const ligne = (n: number): LigneListe => ({ identification: 'FR ' + n, naissance: '', pose: '', secondRepere: '', commentaires: '' });
    expect(LIGNES_PAR_PAGE_REPERES).toBe(30);
    for (const nombre of [0, 1, 29, 30, 31, 61]) {
      const pages = pagesDesReperes(Array.from({ length: nombre }, (_, i) => ligne(i)));
      expect(pages).toHaveLength(Math.max(1, Math.ceil(nombre / 30)));
      for (const page of pages) expect(page).toHaveLength(30);
      expect(pages.flat().filter(Boolean)).toHaveLength(nombre);
    }
  });

  it('l’en-tête est sur chaque page du document', () => {
    const lignes = Array.from({ length: 65 }, (_, i) => ({ identification: 'FR ' + i, naissance: '', pose: '', secondRepere: '', commentaires: '' }));
    const liste: ListeImprimee = { titre: { debut: 'LISTE DES REPERES', fin: '' }, sorte: 'Boucles', filtre: 'Tout', lignes };
    const html = bouclesHtml([liste], { nom: 'Riolacci Joseph', adresse: ['20272 Pianello'], cheptel: '20213003' }, '16/10/2026');
    expect(html.match(/<section class="page-repere">/g)).toHaveLength(3);
    expect(html.split('Edition du : 16/10/2026')).toHaveLength(4);
    expect(html.match(/20213003/g)).toHaveLength(3);
    // Trois pages : chacune une ligne d'en-tête de tableau et trente lignes.
    expect(html.split('<tr>')).toHaveLength(3 * 31 + 1);
  });
});
