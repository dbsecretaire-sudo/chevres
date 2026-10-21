import { describe, expect, it } from 'vitest';
import {
  SANS_LABORATOIRE,
  TOUS_LES_LABORATOIRES,
  analysesDuLaboratoire,
  laboratoiresDesAnalyses,
} from '@/features/exploitation/services/laboratoires';
import type { Controle } from '@/features/exploitation/types';
import type { Fournisseur } from '@/features/fournisseurs/types';

const analyse = (id: string, laboratoireId?: string) =>
  ({ id, date: '2026-05-10', type: 'mai 2026', laboratoireId }) as Controle;
const labo = (id: string) => ({ id, nomEntreprise: id }) as Fournisseur;

describe('les laboratoires des analyses du lait', () => {
  const analyses = [analyse('a', 'l1'), analyse('b', 'l2'), analyse('c'), analyse('d', 'l1')];

  it('tous les laboratoires réunis gardent toutes les analyses, avec ou sans laboratoire', () => {
    expect(analysesDuLaboratoire(analyses, TOUS_LES_LABORATOIRES).map((a) => a.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('un laboratoire ne garde que ses analyses ; « sans laboratoire » celles qui n’en ont pas', () => {
    expect(analysesDuLaboratoire(analyses, 'l1').map((a) => a.id)).toEqual(['a', 'd']);
    expect(analysesDuLaboratoire(analyses, SANS_LABORATOIRE).map((a) => a.id)).toEqual(['c']);
  });

  it('seuls les laboratoires qui ont fait des analyses sont proposés', () => {
    expect(laboratoiresDesAnalyses(analyses, [labo('l1'), labo('l2'), labo('l3')]).map((f) => f.id)).toEqual(['l1', 'l2']);
  });
});
