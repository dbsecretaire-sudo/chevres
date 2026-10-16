import { describe, expect, it } from 'vitest';
import {
  composerCourrier,
  destinataireFournisseur,
  destinataireGroupement,
  expediteurDe,
  lienMailto,
  manques,
  paragraphesDe,
  politesseCourrier,
  texteDuCourriel,
  villeDeLAdresse,
} from '@/features/exploitation/services/courrier';
import type { Fournisseur } from '@/features/fournisseurs/types';

const expediteur = expediteurDe({ nomExploitant: 'Anne Martin', adresseExploitant: 'Lieu-dit Pianella\n20250 Corte', siret: '123' });
const msa: Fournisseur = {
  id: 'f1',
  nom: 'Dupont',
  prenom: 'Léa',
  nomEntreprise: 'MSA de Corse',
  siret: '',
  adressePostale: 'Pernicaggio, CS 70407, 20 705 Ajaccio cedex 9',
};

describe('courrier', () => {
  it('lit la ville d’une adresse', () => {
    expect(villeDeLAdresse('12 rue X, 75564 Paris Cedex 12')).toBe('Paris');
    expect(villeDeLAdresse('20250 Corte')).toBe('Corte');
    expect(villeDeLAdresse('sans code postal')).toBeUndefined();
  });

  it('sépare le message en paragraphes', () => {
    expect(paragraphesDe('a\nb\n\n\nc')).toEqual(['a\nb', 'c']);
    expect(paragraphesDe('   ')).toEqual([]);
  });

  it('signale ce qui manque sur les fiches', () => {
    const sansEmail = destinataireFournisseur(msa);
    expect(manques(expediteur, sansEmail, true)).toEqual(['destinataireEmail']);
    expect(manques(expediteur, sansEmail, false)).toEqual([]);
    expect(manques({}, { nom: 'X' }, false)).toEqual(['expediteurNom', 'expediteurAdresse', 'destinataireFiche']);
  });

  it('retrouve la fiche client d’un groupement par son nom', () => {
    const d = destinataireGroupement('GDS 2B', [{ id: 'c1', nom: 'gds 2b', email: 'a@b.fr' }]);
    expect(d.fiche).toEqual({ genre: 'client', id: 'c1' });
    expect(d.email).toBe('a@b.fr');
    expect(destinataireGroupement('Inconnu', []).fiche).toBeUndefined();
  });

  it('compose la lettre selon les usages', () => {
    const c = composerCourrier(expediteur, destinataireFournisseur(msa), 'Demande', 'Bonjour.\n\nSuite.', '2026-03-14', false);
    expect(c.appel).toBe('Madame, Monsieur,');
    expect(c.politesse).toContain('Madame, Monsieur');
    expect(c.paragraphes).toHaveLength(2);
    expect(c.lieuDate).toMatch(/^Fait à Corte, le /);
    expect(c.destinataire).toContain('À l’attention de Léa Dupont');
    expect(c.mention).toBeUndefined();
  });

  it('adapte la politesse à la formule d’appel choisie', () => {
    expect(politesseCourrier('Madame la Directrice,')).toBe(
      'Je vous prie d’agréer, Madame la Directrice, l’expression de mes salutations distinguées.',
    );
    expect(politesseCourrier('Bonjour Anne,')).toBe('Je vous prie d’agréer l’expression de mes salutations distinguées.');
    const c = composerCourrier(expediteur, { nom: 'X' }, 'o', 'm', '2026-01-01', false, 'Monsieur le Maire');
    expect(c.appel).toBe('Monsieur le Maire,');
    const perso = composerCourrier(expediteur, { nom: 'X' }, 'o', 'm', '2026-01-01', false, undefined, 'Cordialement,');
    expect(perso.politesse).toBe('Cordialement,');
  });

  it('ajoute la mention du recommandé pour un courrier seulement', () => {
    const d = { nom: 'X' };
    expect(composerCourrier(expediteur, d, 'o', 'm', '2026-01-01', false, undefined, undefined, 'simple').mention).toBe(
      'Lettre recommandée',
    );
    expect(composerCourrier(expediteur, d, 'o', 'm', '2026-01-01', false, undefined, undefined, 'ar').mention).toBe(
      'Lettre recommandée avec accusé de réception',
    );
    expect(composerCourrier(expediteur, d, 'o', 'm', '2026-01-01', true, undefined, undefined, 'ar').mention).toBeUndefined();
  });

  it('compose le courriel et son lien mailto', () => {
    const c = composerCourrier(expediteur, { nom: 'X', email: 'a@b.fr' }, 'Objet', 'Message', '2026-01-01', true);
    const { objet, corps } = texteDuCourriel(c, expediteur);
    expect(objet).toBe('Objet');
    expect(corps.startsWith('Bonjour,')).toBe(true);
    expect(corps).toContain('Cordialement,');
    const lien = lienMailto('a@b.fr', objet, corps);
    expect(lien.startsWith('mailto:a@b.fr?subject=Objet&body=')).toBe(true);
    expect(lien).toContain('%0D%0A');
  });
});
