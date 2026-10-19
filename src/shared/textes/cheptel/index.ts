import { scannerBoucleCoreTextes } from '@/shared/textes/cheptel/scannerBoucleCore';
import { googleVisionTextes } from '@/shared/textes/cheptel/googleVision';
import { ajoutRapideChevreTextes } from '@/shared/textes/cheptel/ajoutRapideChevre';
import { bilanAnnuelTextes } from '@/shared/textes/cheptel/bilanAnnuel';
import { accueilTextes } from '@/shared/textes/cheptel/accueil';
import { lotsTextes } from '@/shared/textes/cheptel/lots';
import { tableauDeBordTextes } from '@/shared/textes/cheptel/tableauDeBord';
import { traitementsTextes } from '@/shared/textes/cheptel/traitements';
import { reglagesTextes } from '@/shared/textes/cheptel/reglages';
import { ugbPrimesTextes } from '@/shared/textes/cheptel/ugbPrimes';
import { ficheChevreTextes } from '@/shared/textes/cheptel/ficheChevre';
import { suiviMouvementsTextes } from '@/shared/textes/cheptel/suiviMouvements';
import { historiqueTextes } from '@/shared/textes/cheptel/historique';
import { listeCheptelTextes } from '@/shared/textes/cheptel/listeCheptel';
import { naissancesTextes } from '@/shared/textes/cheptel/naissances';
import { circulationTextes } from '@/shared/textes/cheptel/circulation';
import { nouvelleChevreTextes } from '@/shared/textes/cheptel/nouvelleChevre';
import { reservationTextes } from '@/shared/textes/cheptel/reservation';
import { nouvelleNaissanceTextes } from '@/shared/textes/cheptel/nouvelleNaissance';
import { miseAJourTextes } from '@/shared/textes/cheptel/miseAJour';
import { chevreLabelTextes } from '@/shared/textes/cheptel/chevreLabel';

/** Textes de l'interface — « cheptel ». À modifier ici uniquement. */
export const TEXTES_CHEPTEL = {
  scannerBoucleCore: scannerBoucleCoreTextes,
  googleVision: googleVisionTextes,
  ajoutRapideChevre: ajoutRapideChevreTextes,
  bilanAnnuel: bilanAnnuelTextes,
  accueil: accueilTextes,
  lots: lotsTextes,
  tableauDeBord: tableauDeBordTextes,
  traitements: traitementsTextes,
  reglages: reglagesTextes,
  ugbPrimes: ugbPrimesTextes,
  ficheChevre: ficheChevreTextes,
  suiviMouvements: suiviMouvementsTextes,
  historique: historiqueTextes,
  listeCheptel: listeCheptelTextes,
  naissances: naissancesTextes,
  circulation: circulationTextes,
  nouvelleChevre: nouvelleChevreTextes,
  reservation: reservationTextes,
  nouvelleNaissance: nouvelleNaissanceTextes,
  miseAJour: miseAJourTextes,
  chevreLabel: chevreLabelTextes,
} as const;
