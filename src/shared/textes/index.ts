import { TEXTES_ACCUEIL } from '@/shared/textes/accueil';
import { TEXTES_CHEPTEL } from '@/shared/textes/cheptel';
import { TEXTES_CLIENTS } from '@/shared/textes/clients';
import { TEXTES_COMMUN } from '@/shared/textes/commun';
import { TEXTES_COMPTABILITE } from '@/shared/textes/comptabilite';
import { TEXTES_COMPTES_PCG } from '@/shared/textes/comptesPcg';
import { TEXTES_DOSSIERS } from '@/shared/textes/dossiers';
import { TEXTES_DRIVE } from '@/shared/textes/drive';
import { TEXTES_ENTREPRISE } from '@/shared/textes/entreprise';
import { TEXTES_ETABLISSEMENTS } from '@/shared/textes/etablissements';
import { TEXTES_EXPLOITATION } from '@/shared/textes/exploitation';
import { TEXTES_EXPORT } from '@/shared/textes/export';
import { TEXTES_FOURNISSEURS } from '@/shared/textes/fournisseurs';
import { TEXTES_GITE } from '@/shared/textes/gite';
import { TEXTES_NAVIGATION } from '@/shared/textes/navigation';
import { TEXTES_RH } from '@/shared/textes/rh';
import { TEXTES_SAUVEGARDE } from '@/shared/textes/sauvegarde';
import { TEXTES_SETTINGS } from '@/shared/textes/settings';

/** Tous les textes de l'application, groupés par domaine puis par écran. */
export const TEXTES = {
  accueil: TEXTES_ACCUEIL,
  cheptel: TEXTES_CHEPTEL,
  clients: TEXTES_CLIENTS,
  commun: TEXTES_COMMUN,
  comptabilite: TEXTES_COMPTABILITE,
  comptesPcg: TEXTES_COMPTES_PCG,
  dossiers: TEXTES_DOSSIERS,
  drive: TEXTES_DRIVE,
  entreprise: TEXTES_ENTREPRISE,
  etablissements: TEXTES_ETABLISSEMENTS,
  exploitation: TEXTES_EXPLOITATION,
  export: TEXTES_EXPORT,
  fournisseurs: TEXTES_FOURNISSEURS,
  gite: TEXTES_GITE,
  navigation: TEXTES_NAVIGATION,
  rh: TEXTES_RH,
  sauvegarde: TEXTES_SAUVEGARDE,
  settings: TEXTES_SETTINGS,
} as const;
