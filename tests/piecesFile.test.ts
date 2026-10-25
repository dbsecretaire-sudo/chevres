import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from 'vitest';
import { ajouterPieceAEnvoyer, lirePiecesAEnvoyer, piecesDe, retirerPieceAEnvoyer } from '@/features/fichiers/services/piecesFile';
import type { PieceJointe } from '@/features/fichiers/types';

const piece = (id: string): PieceJointe => ({ id, nom: `${id}.pdf`, extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-25' });

describe('reconnaître les fichiers joints dans les fiches', () => {
  it('trouve une pièce dans une fiche, même imbriquée, et ignore le reste', () => {
    const fiche = { id: 'f1', nom: 'Déclaration', pieces: [piece('a'), { id: 'b', nom: 'x' }], sous: { encore: piece('c') } };
    expect(piecesDe(fiche).map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('une valeur vide ou sans pièce ne donne rien', () => {
    expect(piecesDe(null)).toEqual([]);
    expect(piecesDe({ id: 'f1', n: 2 })).toEqual([]);
  });
});

describe('la file des fichiers à envoyer', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('une pièce ajoutée deux fois n’entre qu’une fois dans la file', async () => {
    await ajouterPieceAEnvoyer(piece('a'));
    await ajouterPieceAEnvoyer(piece('a'));
    expect((await lirePiecesAEnvoyer()).map((p) => p.id)).toEqual(['a']);
  });

  it('retirer une pièce la sort de la file, sans toucher aux autres', async () => {
    await ajouterPieceAEnvoyer(piece('a'));
    await ajouterPieceAEnvoyer(piece('b'));
    await retirerPieceAEnvoyer('a');
    expect((await lirePiecesAEnvoyer()).map((p) => p.id)).toEqual(['b']);
  });

  it('une file vide se lit comme une liste vide', async () => {
    expect(await lirePiecesAEnvoyer()).toEqual([]);
  });
});
