import { describe, expect, it } from 'vitest';
import {
  enregistrerEtapeAccueil,
  lireArchiveCommercial,
  normaliserArchiveCommercial,
} from '@/features/commercial/repository';
import { etapesAccueilManquantes, rappelsAccueilPublic } from '@/features/commercial/services/accueilPublic';
import type { FormuleAgritourisme } from '@/features/commercial/types';
import { ETAPE_ACCUEIL, ETAPES_ACCUEIL_OBLIGATOIRES } from '@/shared/constants/agritourisme';
import { GENRE_RAPPEL } from '@/shared/constants/rappels';

const formule = { id: 'f1', nom: 'Visite', prix: 10, elements: [] } as FormuleAgritourisme;

describe('démarches d’accueil du public', () => {
  it('sans visite ni formule, la ferme ne reçoit pas de public : aucun rappel', () => {
    expect(rappelsAccueilPublic(normaliserArchiveCommercial(undefined), '2026-10-22')).toEqual([]);
  });

  it('avec une formule, un rappel unique liste les démarches obligatoires qui manquent', () => {
    const archive = normaliserArchiveCommercial({ formules: [formule] });
    expect(etapesAccueilManquantes(archive)).toEqual(ETAPES_ACCUEIL_OBLIGATOIRES);
    const [rappel] = rappelsAccueilPublic(archive, '2026-10-22');
    expect(rappel).toMatchObject({ genre: GENRE_RAPPEL.ACCUEIL_PUBLIC, enRetard: true });
    expect(rappel.detail).toContain('Déclaration en mairie');
    // Une démarche facultative ne compte pas.
    expect(ETAPES_ACCUEIL_OBLIGATOIRES).not.toContain(ETAPE_ACCUEIL.CONSIGNES);
  });

  it('faire une démarche la retire du rappel ; toutes faites, plus de rappel', async () => {
    for (const etape of ETAPES_ACCUEIL_OBLIGATOIRES.slice(0, -1))
      await enregistrerEtapeAccueil(etape, { fait: true, date: '2026-10-01', reference: 'R1' });
    let archive = { ...(await lireArchiveCommercial()), formules: [formule] };
    expect(etapesAccueilManquantes(archive)).toEqual([ETAPE_ACCUEIL.DDPP]);
    expect(archive.accueilPublic?.[ETAPE_ACCUEIL.ERP]).toMatchObject({ fait: true, reference: 'R1' });
    await enregistrerEtapeAccueil(ETAPE_ACCUEIL.DDPP, { fait: true });
    archive = { ...(await lireArchiveCommercial()), formules: [formule] };
    expect(rappelsAccueilPublic(archive, '2026-10-22')).toEqual([]);
  });

  it('la relecture ne garde que des démarches bien formées', () => {
    const archive = normaliserArchiveCommercial({
      accueilPublic: { erp: { fait: true }, bizarre: 'x' as never, ddpp: { fait: 'oui' as never } },
    });
    expect(archive.accueilPublic?.erp?.fait).toBe(true);
    expect(archive.accueilPublic).not.toHaveProperty('bizarre');
    expect(archive.accueilPublic?.ddpp?.fait).toBeUndefined();
  });
});
