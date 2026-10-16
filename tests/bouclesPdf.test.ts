import { describe, expect, it } from 'vitest';
import { bouclesHtml, LIGNES_PAR_PAGE_REPERES, ligneDeLaListe, ligneRouge, pagesDesReperes, pagesDuDocument, separerSelonInstallation, typeDuRepere, type LigneListe, type ListeImprimee } from '@/features/export/bouclesPdf';
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

  it('une boucle rouge ou de rebouclage porte sa date d’achat en commentaire', () => {
    const l = ligneDeLaListe(boucle({ article: 'boucle:rebouclage', numero: '', dateAchat: '2024-12-10' }), undefined, undefined, 'FR 21228');
    expect(l.identification).toBe('');
    expect(l.commentaires).toBe('Achat le 10/12/2024');
    expect(ligneDeLaListe(boucle({ dateAchat: '2024-12-10' }), undefined, undefined, undefined).commentaires).toBe('');
  });

  it('un rebouclage posé porte sa date de pose en commentaire (« Pose le »), une boucle rouge sa date d’achat', () => {
    const reb = ligneDeLaListe(boucle({ article: 'boucle:rebouclage', dateAchat: '2023-04-28', datePose: '2023-06-01', chevreId: 'c' }), undefined, undefined, undefined);
    expect(reb.commentaires).toBe('Pose le 01/06/2023');
    const rouge = ligneDeLaListe(boucle({ article: 'boucle:rouges', dateAchat: '2023-04-28', datePose: '2023-06-01', chevreId: 'c' }), undefined, undefined, undefined);
    expect(rouge.commentaires).toBe('Achat le 28/04/2023');
    const stock = ligneDeLaListe(boucle({ article: 'boucle:rebouclage', numero: '', dateAchat: '2023-04-28' }), undefined, undefined, undefined);
    expect(stock.commentaires).toBe('Achat le 28/04/2023');
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

  it('sépare les boucles d’avant et d’après l’installation, d’après la date de pose (à défaut d’achat)', () => {
    const { avant, apres } = separerSelonInstallation(
      [
        boucle({ numero: '1', datePose: '2020-04-01' }),
        boucle({ numero: '2', datePose: '2023-01-15' }),
        boucle({ numero: '3', datePose: '2024-06-01' }),
        boucle({ numero: '4', dateAchat: '2022-05-05' }),
        boucle({ numero: '5' }),
      ],
      '2023-01-15',
    );
    expect(avant.map((b) => b.numero)).toEqual(['1', '4']);
    // Le jour même de l'installation est d'après ; sans aucune date, une boucle en stock est d'après.
    expect(apres.map((b) => b.numero)).toEqual(['2', '3', '5']);
  });

  it('une boucle non posée suit sa commande : d’après l’installation si une boucle de la même facture y est posée', () => {
    const lot = [
      boucle({ numero: '230001', factureId: 'f1', dateAchat: '2022-12-01' }),
      boucle({ numero: '230002', factureId: 'f1', dateAchat: '2022-12-01', datePose: '2023-05-01' }),
      boucle({ numero: '230014', factureId: 'f1', dateAchat: '2022-12-01' }),
      boucle({ numero: '100', factureId: 'f0', dateAchat: '2020-01-01' }),
    ];
    const { avant, apres } = separerSelonInstallation(lot, '2023-01-15');
    expect(apres.map((b) => b.numero)).toEqual(['230001', '230002', '230014']);
    expect(avant.map((b) => b.numero)).toEqual(['100']);
    // Seules les boucles imprimées sont données, mais la commande se lit dans toutes celles de la sorte.
    const nonPosees = lot.filter((b) => !b.datePose && b.factureId === 'f1');
    expect(separerSelonInstallation(nonPosees, '2023-01-15', lot).apres).toHaveLength(2);
    expect(separerSelonInstallation(nonPosees, '2023-01-15').apres).toHaveLength(0);
  });

  it('la ligne d’une boucle rouge : repère perdu, pose de la rouge, pose à l’identique, observations', () => {
    const l = ligneRouge(
      boucle({ article: 'boucle:rouges', numero: '00462', datePose: '2024-02-01', dateAchat: '2023-04-28', chevreId: 'c' }),
      { dateRebouclage: '2024-03-10' },
      { statut: 'morte', date: '2025-08-01' },
      'FR 21228',
      'P',
    );
    expect(l).toEqual({
      perdu: 'FR 2122800462',
      type: 'P',
      poseRouge: '01/02/2024',
      identique: '10/03/2024',
      observations: '01/08/2025, voir bordereau de perte',
    });
    // Une boucle rouge en stock : une ligne vide, sans observation.
    const stock = ligneRouge(boucle({ article: 'boucle:rouges', numero: '', dateAchat: '2023-04-28' }), undefined, undefined, 'FR 21228', 'P');
    expect(stock).toMatchObject({ perdu: '', type: '', poseRouge: '', observations: '' });
  });

  it('le type du repère perdu : E pour un tiptag, P pour une boucle, vide sinon', () => {
    const tiptags = new Set(['10']);
    const boucles = new Set(['20']);
    expect(typeDuRepere('10', tiptags, boucles)).toBe('E');
    expect(typeDuRepere(' 20 ', tiptags, boucles)).toBe('P');
    expect(typeDuRepere('30', tiptags, boucles)).toBe('');
  });

  it('la liste des repères provisoires rouges : titre, colonnes du formulaire et indices de 1 à 30 sur chaque page', () => {
    const rouges = Array.from({ length: 35 }, (_, i) => ({ perdu: 'FR ' + i, type: 'P', poseRouge: '', identique: '', observations: '' }));
    const liste: ListeImprimee = { titre: { debut: 'LISTE DES REPERES PROVISOIRES ROUGES', fin: '' }, sorte: 'Boucles rouges', filtre: 'Tout', lignes: [], rouges };
    const html = bouclesHtml([liste], { nom: 'X', adresse: [], cheptel: '1' }, '16/10/2026');
    expect(html.split('<section class="page-repere">')).toHaveLength(3);
    expect(html).toContain('LISTE DES REPERES PROVISOIRES ROUGES');
    expect(html).toContain('N° du repère perdu');
    expect(html).toContain('Date de pose du repère à l’identique');
    expect(html).toContain('E : électronique');
    expect(html.split('<td class="indice">30</td>')).toHaveLength(3);
    expect(html.split('<td class="indice">1</td>')).toHaveLength(3);
  });

  it('chaque section commence sur un recto : une page blanche suit une section d’un nombre impair de pages', () => {
    const ligne = { identification: 'FR 1', naissance: '', pose: '', secondRepere: '', commentaires: '' };
    const section = (nombre: number, sorte: string): ListeImprimee => ({
      titre: { debut: 'LISTE DES REPERES', fin: '' },
      sorte,
      filtre: 'Tout',
      lignes: Array.from({ length: nombre }, () => ligne),
    });
    const identite = { nom: 'X', adresse: [], cheptel: '1' };
    // 1 page (impaire) : une page blanche ensuite ; 2 pages : rien ; la dernière section n'a pas de page blanche après elle.
    const pages = pagesDuDocument([section(10, 'A'), section(40, 'B'), section(5, 'C')], identite, '16/10/2026');
    expect(pages).toHaveLength(1 + 1 + 2 + 1);
    expect(pages[1]).toContain('<div class="feuille"></div>');
    expect(pages.filter((p) => p.includes('<div class="feuille"></div>'))).toHaveLength(1);
  });
});
