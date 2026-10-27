import { useEffect, useState } from 'react';
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
import { choisirEtEnvoyerPieceWeb, lirePieceDistante } from '@/features/fichiers/services/piecesWeb';
import type { PieceJointe } from '@/features/fichiers/types';
import {
  type DeclarationsChambre,
  ecrireDeclarationsChambre,
  lireDeclarationsChambre,
  surDeclarationsRecues,
} from '@/features/cheptel/services/declarationsChambre';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { TEXTES } from '@/shared/textes';

/**
 * Le fichier de la déclaration à la Chambre d'agriculture d'une année, pour l'espèce active : on le joint une fois, puis on peut le
 * remplacer par un autre mais jamais le retirer. Les déclarations sont synchronisées avec le serveur, pour que le web les voie aussi.
 * Sur le web, le fichier n'est pas rangé dans le navigateur : il est affiché depuis le serveur.
 */
export function useDeclarationChambre(annee: number) {
  const { settings, patchSettings } = useAppSettings();
  const { espece } = useEtablissement();
  const infos = settings.exploitation;
  const cle = `${annee}:${espece}`;
  const [declarations, setDeclarations] = useState<DeclarationsChambre>({});
  const [distante, setDistante] = useState<{ piece: PieceJointe; uri: string }>();

  useEffect(() => {
    const charger = () => {
      lireDeclarationsChambre(infos?.declarationsChambre).then(setDeclarations);
    };
    charger();
    return surDeclarationsRecues(charger);
  }, [infos?.declarationsChambre]);

  /** Les fichiers rangés pour cette déclaration (une liste dans l'ancien format) : le premier est celui qu'on montre. */
  const anciennes = piecesDeLaDeclaration(declarations[cle]);
  const piece = anciennes[0];

  useEffect(() => {
    if (piecesDisponibles() || !piece) return;
    let actif = true;
    lirePieceDistante(piece)
      .then((uri) => {
        if (actif) setDistante({ piece, uri });
      })
      .catch(() => undefined);
    return () => {
      actif = false;
    };
  }, [piece]);

  /** L'image du serveur ne vaut que pour la fiche qu'elle a été chargée pour. */
  const uriWeb = distante && distante.piece === piece ? distante.uri : undefined;

  const choisirPourAppareil = async (): Promise<PieceJointe | undefined> => {
    const [choisi] = await choisirFichiers(TYPES_FICHIERS_ACCEPTES, false);
    return choisi ? rangerFichier(choisi) : undefined;
  };

  /** Choisit un fichier : il devient la déclaration, et l'ancien (s'il y en avait un) est effacé de l'appareil. */
  const choisir = async () => {
    try {
      const nouvelle = await (piecesDisponibles() ? choisirPourAppareil() : choisirEtEnvoyerPieceWeb(TYPES_FICHIERS_ACCEPTES));
      if (!nouvelle) return;
      const suivantes = { ...(await lireDeclarationsChambre(infos?.declarationsChambre)), [cle]: nouvelle };
      await ecrireDeclarationsChambre(suivantes);
      setDeclarations(suivantes);
      // Les déclarations ont quitté les réglages : elles ne s'y trouvent plus.
      if (infos?.declarationsChambre) await patchSettings({ exploitation: { ...infos, declarationsChambre: undefined } });
      if (piecesDisponibles()) for (const ancienne of anciennes) await supprimerPiece(ancienne);
    } catch (e: unknown) {
      Alert.alert(e instanceof Error ? e.message : TEXTES.fichiers.erreurAjout);
    }
  };

  return { piece, uriWeb, choisir };
}
