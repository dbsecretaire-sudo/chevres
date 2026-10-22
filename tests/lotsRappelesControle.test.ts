import { describe, expect, it } from 'vitest';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  basculerControleLot,
  controlerLots,
  fabriquerFromages,
  rappelerLots,
} from '@/features/stock/services/lots';

describe('le contrôle d’un lot rappelé', () => {
  it('ne se coche plus, ni seul ni avec « tout cocher »', async () => {
    await fabriquerFromages({
      article: 'fromage:frais',
      date: '2026-10-20',
      quantite: 3,
      debut: 'FF26293-1',
    });
    const [premier, deuxieme, troisieme] = ((await lireArchiveStock()).lots ?? []).filter((l) =>
      l.numero.startsWith('FF26293-'),
    );
    await rappelerLots([premier.id], '2026-10-21');
    await basculerControleLot(premier.id);
    await controlerLots([premier.id, deuxieme.id, troisieme.id], true);
    const lots = (await lireArchiveStock()).lots ?? [];
    const de = (id: string) => lots.find((l) => l.id === id)!;
    expect(de(premier.id).controleOk).toBeUndefined();
    expect(de(deuxieme.id).controleOk).toBe(true);
    expect(de(troisieme.id).controleOk).toBe(true);
    // Un lot qui n'est pas rappelé se coche et se décoche toujours seul.
    await basculerControleLot(deuxieme.id);
    expect((await lireArchiveStock()).lots?.find((l) => l.id === deuxieme.id)?.controleOk).toBe(false);
  });
});
