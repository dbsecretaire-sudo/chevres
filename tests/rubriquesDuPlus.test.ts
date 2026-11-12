import { describe, expect, it } from 'vitest';
import { RUBRIQUES, RUBRIQUES_DU_PLUS, titreDeLaRubrique } from '@/features/accueil/rubriques/rubriquesDuPlus';
import { ROUTES } from '@/shared/constants/routes';

describe('les rubriques du mode avancé', () => {
  it('le menu « Plus » a ses rubriques de la maquette, dans son ordre, et chacune a sa page', () => {
    expect(RUBRIQUES_DU_PLUS.map((r) => r.cle)).toEqual(['reglementation', 'partenaires', 'bilans', 'historique', 'reglages']);
    for (const r of RUBRIQUES_DU_PLUS) expect(RUBRIQUES[r.cle]).toBeDefined();
  });

  it('une page de rubrique ne répète pas un écran, et chaque ligne a une adresse', () => {
    for (const [nom, rubrique] of Object.entries(RUBRIQUES)) {
      const routes = rubrique.sections.flatMap((s) => s.lignes.map((l) => l.route));
      expect(routes.every((r) => r.startsWith('/')), nom).toBe(true);
      expect(new Set(routes).size, nom).toBe(routes.length);
    }
  });

  it('Clients et Contacts sont dans Partenaires, comme sur la maquette', () => {
    const routesDe = (nom: string) => RUBRIQUES[nom].sections.flatMap((s) => s.lignes.map((l) => l.route));
    expect(routesDe('partenaires')).toContain(ROUTES.CLIENTS);
    expect(routesDe('partenaires')).toContain(ROUTES.CONTACTS);
  });

  it('le mouvement des chèvres propose l’entrée, la vente vivante, l’abattoir et les sorties', () => {
    const routes = RUBRIQUES.mouvement.sections.flatMap((s) => s.lignes.map((l) => l.route));
    // La sortie « Sortie ou mort » ouvre la page Décès, comme la tuile Décès des chèvres : un seul chemin pour déclarer un décès.
    expect(routes).toEqual([ROUTES.CHEPTEL_NOUVELLE, ROUTES.VENTES_VIVANTS, ROUTES.lotAbattoirNouveau(), ROUTES.CHEPTEL_DECES, ROUTES.lieu('equarrissage')]);
  });

  it('le titre d’une rubrique vient de sa page ; une rubrique inconnue n’a pas de titre', () => {
    expect(titreDeLaRubrique('argent')).toBe('Argent');
    expect(titreDeLaRubrique('inconnue')).toBe('');
    expect(titreDeLaRubrique(undefined)).toBe('');
  });
});
