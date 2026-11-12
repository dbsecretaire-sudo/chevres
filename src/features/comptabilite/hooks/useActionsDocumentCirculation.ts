import { Alert } from 'react-native';
import { deposerDocumentCirculation, type EcritureACirculation } from '@/features/comptabilite/services/documentsCirculation';
import { genererLeModeleDeCirculation } from '@/features/comptabilite/services/modeleCirculation';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useLots } from '@/features/lots-animaux/hooks/useLots';
import { useVentesVivants } from '@/features/lots-animaux/hooks/useVentesVivants';
import type { DocumentCirculationDepose } from '@/features/comptabilite/types';
import type { PieceJointe } from '@/features/fichiers/types';
import { choisirEtEnvoyerPieceWeb, ouvrirPieceDistante } from '@/features/fichiers/services/piecesWeb';
import {
  choisirFichiers,
  ouvrirPiece,
  piecesDisponibles,
  pieceExiste,
  rangerFichier,
  supprimerPiece,
} from '@/features/fichiers/services/pieces';
import type { Option } from '@/shared/components/OptionsModal';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.circulation;

/** Ce dont on dépose le document : une vente, une dépense, un bon de livraison ou une vente d'animaux vivants, avec le document déjà déposé s'il y en a un. */
export type EcritureDuDocument = Pick<EcritureACirculation, 'type' | 'id' | 'depose'>;

/** Une ligne du menu d'un document de circulation. */
export type OptionDuMenu = Option;

/**
 * Ce qu'on fait du document de circulation d'une écriture : le déposer (ou le remplacer), l'ouvrir, le retirer, ou générer le modèle
 * pré-rempli. `options` donne les lignes du menu : celles d'un document déjà déposé, ou, sans document, déposer et générer le modèle.
 * `recharger` relit les écritures après un dépôt ou un retrait.
 */
export function useActionsDocumentCirculation(recharger: () => Promise<void> | void) {
  const { lots, modifier } = useLots();
  const { ventes: ventesVivants, modifier: modifierLaVente } = useVentesVivants();
  const { settings, patchSettings } = useAppSettings();
  /** Pose (ou retire) le document : celui d'une écriture est dans ses enregistrements, celui d'un bon de livraison ou d'une vente d'animaux vivants dans les réglages. */
  const poser = async (e: EcritureDuDocument, document: DocumentCirculationDepose | undefined) => {
    if (e.type === 'lot') {
      const lot = lots.find((l) => l.id === e.id);
      if (lot) await modifier({ ...lot, documentCirculation: document });
      return;
    }
    if (e.type === 'vivants') {
      const vente = ventesVivants.find((v) => v.id === e.id);
      if (vente) await modifierLaVente({ ...vente, documentCirculation: document });
      return;
    }
    if (e.type === 'entree') {
      const entrees = settings.exploitation?.entreesAnimaux ?? [];
      await patchSettings({
        exploitation: { ...settings.exploitation, entreesAnimaux: entrees.map((x) => (x.id === e.id ? { ...x, documentCirculation: document } : x)) },
      });
      return;
    }
    await deposerDocumentCirculation(e, document);
  };
  const deposer = async (e: EcritureDuDocument) => {
    try {
      // Sur le téléphone ou le PC, le fichier est rangé dans l'appareil ; sur le web, il part directement vers le serveur.
      let piece: PieceJointe | undefined;
      if (piecesDisponibles()) {
        const [choisi] = await choisirFichiers(TYPES_FICHIERS_ACCEPTES);
        piece = choisi ? await rangerFichier(choisi) : undefined;
      } else {
        piece = await choisirEtEnvoyerPieceWeb(TYPES_FICHIERS_ACCEPTES);
      }
      if (!piece) return;
      // Le fichier remplacé n'est jamais effacé du serveur : seule sa copie sur l'appareil part.
      if (e.depose && piecesDisponibles()) await supprimerPiece(e.depose.piece);
      await poser(e, { piece, deposeLe: new Date().toISOString() });
      await recharger();
    } catch (erreur: unknown) {
      Alert.alert(erreur instanceof Error ? erreur.message : TEXTES.fichiers.erreurAjout);
    }
  };
  const ouvrir = async (e: EcritureDuDocument) => {
    if (!e.depose) return;
    if (!piecesDisponibles()) {
      try {
        await ouvrirPieceDistante(e.depose.piece);
      } catch (erreur: unknown) {
        Alert.alert(erreur instanceof Error ? erreur.message : T.fichierIntrouvable);
      }
      return;
    }
    if (!(await pieceExiste(e.depose.piece))) return Alert.alert(T.fichierIntrouvable);
    await ouvrirPiece(e.depose.piece);
  };
  const retirer = async (e: EcritureDuDocument) => {
    if (!e.depose) return;
    if (piecesDisponibles()) await supprimerPiece(e.depose.piece);
    await poser(e, undefined);
    await recharger();
  };

  /**
   * Les lignes du menu. `modele` remplace la génération d'après l'écriture (le lot d'abattoir génère d'après ses animaux) ;
   * `supplement` s'ajoute à la fin (voir l'écriture…).
   */
  const options = (
    e: EcritureDuDocument,
    { modele, supplement = [] }: { modele?: () => void; supplement?: OptionDuMenu[] } = {},
  ): OptionDuMenu[] => [
    {
      label: e.depose ? T.remplacer : T.deposer,
      icon: 'cloud-upload' as const,
      onPress: () => deposer(e),
    },
    ...(e.depose
      ? [
          { label: T.ouvrir, icon: 'document-text' as const, onPress: () => ouvrir(e) },
          { label: T.retirer, icon: 'trash' as const, color: colors.danger, onPress: () => retirer(e) },
        ]
      : []),
    {
      label: T.modele,
      icon: 'print' as const,
      onPress: () => (modele ? modele() : genererLeModeleDeCirculation(e).catch(() => undefined)),
    },
    ...supplement,
  ];

  return { options, ouvrir };
}
