import { describe, expect, it } from 'vitest';
import { documentsRecherches } from '@/features/bibliotheque/services/recherche';
import type { DocumentGenere } from '@/features/bibliotheque/types';

const doc = (id: string, titre: string, nomFichier: string, genereLe: string): DocumentGenere =>
  ({ id, titre, nomFichier, genereLe, piece: { id, nom: nomFichier, extension: 'pdf', mime: 'application/pdf', ajoutLe: genereLe.slice(0, 10) } }) as DocumentGenere;

const documents = [
  doc('1', 'Déclaration d’estive', 'declaration_estive_2026.pdf', '2026-10-17T14:32:00.000Z'),
  doc('2', 'Registre des analyses', 'registre_analyses.pdf', '2026-03-02T09:00:00.000Z'),
  doc('3', 'Carnet sanitaire', 'carnet_sanitaire_2025.pdf', '2025-12-30T18:00:00.000Z'),
];

describe('recherche dans les documents déjà générés', () => {
  it('sans recherche, tous les documents', () => {
    expect(documentsRecherches(documents, '  ')).toHaveLength(3);
  });

  it('cherche dans le titre sans tenir compte des accents ni des majuscules', () => {
    expect(documentsRecherches(documents, 'DECLARATION').map((d) => d.id)).toEqual(['1']);
  });

  it('cherche dans le nom du fichier, et tous les mots doivent s’y trouver', () => {
    expect(documentsRecherches(documents, 'carnet 2025').map((d) => d.id)).toEqual(['3']);
    expect(documentsRecherches(documents, 'carnet estive')).toEqual([]);
  });

  it('cherche par date, en français ou en ISO', () => {
    expect(documentsRecherches(documents, '17/10/2026').map((d) => d.id)).toEqual(['1']);
    expect(documentsRecherches(documents, '2026-03').map((d) => d.id)).toEqual(['2']);
  });
});
