import {
  exporterExploitationPdf,
  exporterCheptelPdf,
  exporterRegistreCompletPdf,
  exporterPlanComptablePdf,
} from '@/features/export/pdfExport';
import {
  exporterExploitationExcel,
  exporterCheptelExcel,
  exporterPlanComptableExcel,
} from '@/features/export/xlsxExport';
import { exporterCarnetMiseBasPdf } from '@/features/export/carnetMiseBasPdf';
import { exporterInventairePdf } from '@/features/export/inventairePdf';
import { exporterInventaireGitePdf } from '@/features/export/inventaireGitePdf';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import {
  NOM_FICHIER_EXPORT_CHEPTEL,
  NOM_FICHIER_EXPORT_EXPLOITATION,
  NOM_FICHIER_EXPORT_INVENTAIRE,
  NOM_FICHIER_EXPORT_PLAN_COMPTABLE,
  NOM_FICHIER_EXPORT_REGISTRE_COMPLET,
} from '@/shared/constants/export';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { TEXTES } from '@/shared/textes';

/** Un PDF que l'utilisateur peut générer à la demande. */
export interface PdfDisponible {
  id: string;
  titre: string;
  aide: string;
  generer: (annee: number) => Promise<void>;
  /** La racine du nom de son fichier (« plan_comptable ») : elle retrouve, dans la bibliothèque, les documents déjà générés. */
  fichier?: string;
  /** Quand le même document existe en Excel : on choisit alors le format (PDF ou Excel) avant de le générer. */
  genererExcel?: (annee: number) => Promise<void>;
}

/**
 * Les PDF de l'établissement actif, rangés par activité : pour un élevage, le rapport d'exploitation, le registre du cheptel
 * (de l'espèce choisie) et l'inventaire ; pour un gîte, son inventaire. Le plan comptable de l'année est dans la liste de tous.
 */
export function pdfsDisponibles(): PdfDisponible[] {
  const T = TEXTES.export.catalogue;
  // Le plan comptable de l'année : pour tous, en PDF ou en Excel.
  const planComptable: PdfDisponible = {
    id: 'plan-comptable',
    fichier: NOM_FICHIER_EXPORT_PLAN_COMPTABLE,
    titre: T.planComptable.titre,
    aide: T.planComptable.aide,
    generer: exporterPlanComptablePdf,
    genererExcel: exporterPlanComptableExcel,
  };
  if (!modeEntreprise()) {
    return [
      {
        id: 'exploitation',
        fichier: NOM_FICHIER_EXPORT_EXPLOITATION,
        titre: T.exploitation.titre,
        aide: T.exploitation.aide,
        generer: exporterExploitationPdf,
        genererExcel: exporterExploitationExcel,
      },
      {
        id: 'cheptel',
        fichier: NOM_FICHIER_EXPORT_CHEPTEL,
        titre: T.cheptel.titre,
        aide: T.cheptel.aide,
        generer: () => exporterCheptelPdf(),
        genererExcel: () => exporterCheptelExcel(),
      },
      {
        id: 'registre-complet',
        fichier: NOM_FICHIER_EXPORT_REGISTRE_COMPLET,
        titre: T.registreComplet.titre,
        aide: T.registreComplet.aide,
        generer: () => exporterRegistreCompletPdf(),
      },
      {
        id: 'carnet-mise-bas',
        fichier: 'carnet_mise_bas',
        titre: T.carnetMiseBas.titre,
        aide: T.carnetMiseBas.aide,
        generer: () => exporterCarnetMiseBasPdf('a4'),
      },
      {
        id: 'inventaire',
        fichier: NOM_FICHIER_EXPORT_INVENTAIRE,
        titre: T.inventaire.titre,
        aide: T.inventaire.aide,
        generer: exporterInventairePdf,
      },
      planComptable,
    ];
  }
  const gite = activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);
  return [
    ...(gite
      ? [
          {
            id: 'inventaire-gite',
            titre: T.inventaireGite.titre,
            aide: T.inventaireGite.aide,
            generer: () => exporterInventaireGitePdf(),
          },
        ]
      : []),
    planComptable,
  ];
}
