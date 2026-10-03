import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import type { Chevre } from '@/features/cheptel/types';
import type { Controle, VisiteVeterinaire } from '@/features/exploitation/types';
import type { Facture, Vente } from '@/features/comptabilite/types';

export type Categorie = ValeurDe<typeof CATEGORIE_STOCKAGE>;

export interface RecordMap {
  cheptel: Chevre;
  ventes: Vente;
  factures: Facture;
  visites_veterinaire: VisiteVeterinaire;
  controles: Controle;
}
