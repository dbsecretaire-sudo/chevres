import { describe, expect, it } from 'vitest';
import { fromCSV, toCSV } from '@/shared/storage/csv';

describe('fichiers de Drive : les champs ajoutés ne se perdent pas', () => {
  it('une vente garde l’état des animaux et son caractère offert', () => {
    const vente = {
      id: 'v1',
      activite: 'chevres',
      date: '2026-03-02',
      categorie: 'viande',
      quantite: 2,
      unite: 'piece',
      prix: 0,
      tauxTva: 10,
      etatAnimaux: 'vivants',
      offert: true,
    } as never;
    const [relue] = fromCSV('ventes', toCSV('ventes', [vente])) as unknown as Record<string, unknown>[];
    expect(relue.etatAnimaux).toBe('vivants');
    expect(relue.offert).toBe(true);
  });

  it('un animal garde sa réservation (client, bon de commande, état)', () => {
    const animal = {
      id: 'a1',
      sexe: 'M',
      dateNaissance: '2026-01-02',
      statut: 'vivante',
      reservation: { client: 'Momo', clientId: 'c1', commandeId: 'b1', etat: 'morts', date: '2026-10-17' },
    } as never;
    const [relu] = fromCSV('cheptel', toCSV('cheptel', [animal])) as unknown as Record<string, unknown>[];
    expect(relu.reservation).toEqual({ client: 'Momo', clientId: 'c1', commandeId: 'b1', etat: 'morts', date: '2026-10-17' });
  });
});
