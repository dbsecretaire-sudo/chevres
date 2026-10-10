import { TEXTES_A_TRAITER } from '@/shared/textes/aTraiter';
import { TEXTES_ACCUEIL } from '@/shared/textes/accueil';
import { TEXTES_ANNEXES } from '@/shared/textes/annexes';
import { TEXTES_BAR } from '@/shared/textes/bar';
import { TEXTES_CHEPTEL } from '@/shared/textes/cheptel';
import { TEXTES_CLIENTS } from '@/shared/textes/clients';
import { TEXTES_COMMUN } from '@/shared/textes/commun';
import { TEXTES_COMPTABILITE } from '@/shared/textes/comptabilite';
import { TEXTES_COMPTES_PCG } from '@/shared/textes/comptesPcg';
import { TEXTES_DOSSIERS } from '@/shared/textes/dossiers';
import { TEXTES_DRIVE } from '@/shared/textes/drive';
import { TEXTES_ENTREPRISE } from '@/shared/textes/entreprise';
import { TEXTES_ESPECES } from '@/shared/textes/especes';
import { TEXTES_ETABLISSEMENTS } from '@/shared/textes/etablissements';
import { TEXTES_EXPLOITATION } from '@/shared/textes/exploitation';
import { TEXTES_EXPORT } from '@/shared/textes/export';
import { TEXTES_FICHIERS } from '@/shared/textes/fichiers';
import { TEXTES_FOURNISSEURS } from '@/shared/textes/fournisseurs';
import { TEXTES_GITE } from '@/shared/textes/gite';
import { TEXTES_NAVIGATION } from '@/shared/textes/navigation';
import { TEXTES_PRODUCTION } from '@/shared/textes/production';
import { TEXTES_RAPPELS } from '@/shared/textes/rappels';
import { TEXTES_SAUVEGARDE } from '@/shared/textes/sauvegarde';
import { TEXTES_SETTINGS } from '@/shared/textes/settings';
import { TEXTES_STOCK } from '@/shared/textes/stock';
import { TEXTES_TRADING } from '@/shared/textes/trading';

/** Tous les textes de l'application, groupés par domaine puis par écran. */
export const TEXTES = {
  accueil: TEXTES_ACCUEIL,
  aTraiter: TEXTES_A_TRAITER,
  annexes: TEXTES_ANNEXES,
  bar: TEXTES_BAR,
  cheptel: TEXTES_CHEPTEL,
  clients: TEXTES_CLIENTS,
  commun: TEXTES_COMMUN,
  comptabilite: TEXTES_COMPTABILITE,
  comptesPcg: TEXTES_COMPTES_PCG,
  dossiers: TEXTES_DOSSIERS,
  drive: TEXTES_DRIVE,
  entreprise: TEXTES_ENTREPRISE,
  especes: TEXTES_ESPECES,
  etablissements: TEXTES_ETABLISSEMENTS,
  exploitation: TEXTES_EXPLOITATION,
  export: TEXTES_EXPORT,
  fichiers: TEXTES_FICHIERS,
  fournisseurs: TEXTES_FOURNISSEURS,
  gite: TEXTES_GITE,
  navigation: TEXTES_NAVIGATION,
  production: TEXTES_PRODUCTION,
  rappels: TEXTES_RAPPELS,
  sauvegarde: TEXTES_SAUVEGARDE,
  settings: TEXTES_SETTINGS,
  stock: TEXTES_STOCK,
  trading: TEXTES_TRADING,
} as const;
