import { Alert } from 'react-native';
import { ajouterUnDocumentGds, documentsGds, retirerUnDocumentGds } from '@/features/sante/services/gds';
import { rapportsDeLaVisite } from '@/features/sante/services/visitesEtTraitements';
import { choisirFichiers, piecesDisponibles, rangerFichier, supprimerPiece } from '@/features/fichiers/services/pieces';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { DocumentGdsDepose } from '@/features/settings/settings';
import { DOCUMENT_GDS } from '@/shared/constants/gds';
import { TYPES_ANALYSES_ACCEPTES } from '@/shared/constants/fichiers';
import { TEXTES } from '@/shared/textes';

/**
 * Les documents du rapport d'essais d'une visite (images PNG/JPG ou PDF du laboratoire) : ceux qui lui sont rattachés, de quoi en téléverser d'autres et en retirer.
 * `cleDeLaVisite` : la facture du vétérinaire (comme sur la page des visites), à défaut la visite elle-même.
 */
export function useRapportsDeLaVisite(cleDeLaVisite: string | undefined) {
  const { settings, patchSettings } = useAppSettings();
  const documents: DocumentGdsDepose[] = cleDeLaVisite
    ? rapportsDeLaVisite(cleDeLaVisite, documentsGds(settings.exploitation?.gds, DOCUMENT_GDS.RAPPORTS_ESSAIS))
    : [];

  /** Retire un document : le fichier est effacé de l'appareil. */
  const retirer = async (document: DocumentGdsDepose) => {
    await supprimerPiece(document.piece);
    await patchSettings({
      exploitation: {
        ...settings.exploitation,
        gds: retirerUnDocumentGds(settings.exploitation?.gds, DOCUMENT_GDS.RAPPORTS_ESSAIS, document.piece.id),
      },
    });
  };

  /** Choisit des fichiers du laboratoire, les range sur l'appareil et les rattache à cette visite (ils rejoignent la liste des rapports d'essais). */
  const ajouter = async () => {
    if (!cleDeLaVisite) return;
    if (!piecesDisponibles()) return Alert.alert(TEXTES.fichiers.indisponibleWeb);
    try {
      const choisis = await choisirFichiers(TYPES_ANALYSES_ACCEPTES, true);
      if (choisis.length === 0) return;
      let gds = settings.exploitation?.gds;
      for (const choisi of choisis) {
        gds = ajouterUnDocumentGds(gds, DOCUMENT_GDS.RAPPORTS_ESSAIS, {
          piece: await rangerFichier(choisi),
          deposeLe: new Date().toISOString(),
          visiteId: cleDeLaVisite,
        });
      }
      await patchSettings({ exploitation: { ...settings.exploitation, gds } });
    } catch (e: unknown) {
      Alert.alert(e instanceof Error ? e.message : TEXTES.fichiers.erreurAjout);
    }
  };

  return { documents, ajouter, retirer };
}
