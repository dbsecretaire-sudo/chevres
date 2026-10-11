import { Alert } from 'react-native';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { piecesDeLaDeclaration } from '@/features/settings/settings';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import {
  choisirFichiers,
  piecesDisponibles,
  rangerFichier,
  supprimerPiece,
} from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { TEXTES } from '@/shared/textes';

/**
 * Le fichier de la déclaration à la Chambre d'agriculture d'une année, pour l'espèce active : on le joint une fois, puis on peut le
 * remplacer par un autre mais jamais le retirer. Il se range dans les informations de l'exploitation, donc dans la sauvegarde
 * locale et sur Google Drive avec le reste.
 */
export function useDeclarationChambre(annee: number) {
  const { settings, patchSettings } = useAppSettings();
  const { espece } = useEtablissement();
  const infos = settings.exploitation;
  const cle = `${annee}:${espece}`;
  /** Les fichiers rangés pour cette déclaration (une liste dans l'ancien format) : le premier est celui qu'on montre. */
  const anciennes = piecesDeLaDeclaration(infos?.declarationsChambre?.[cle]);
  const piece = anciennes[0];

  /** Choisit un fichier : il devient la déclaration, et l'ancien (s'il y en avait un) est effacé de l'appareil. */
  const choisir = async () => {
    if (!piecesDisponibles()) return Alert.alert(TEXTES.fichiers.indisponibleWeb);
    try {
      const [choisi] = await choisirFichiers(TYPES_FICHIERS_ACCEPTES, false);
      if (!choisi) return;
      const nouvelle: PieceJointe = await rangerFichier(choisi);
      await patchSettings({
        exploitation: { ...infos, declarationsChambre: { ...infos?.declarationsChambre, [cle]: nouvelle } },
      });
      for (const ancienne of anciennes) await supprimerPiece(ancienne);
    } catch (e: unknown) {
      Alert.alert(e instanceof Error ? e.message : TEXTES.fichiers.erreurAjout);
    }
  };

  return { piece, choisir };
}
