import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { lireArchiveCommercial, enregistrerEtapeAccueil } from '@/features/commercial/repository';
import { etapesAccueilManquantes } from '@/features/commercial/services/accueilPublic';
import type { ArchiveCommercial } from '@/features/commercial/types';
import { ListeFichiers } from '@/features/fichiers/components/ListeFichiers';
import { choisirFichiers, piecesDisponibles, rangerFichier, supprimerPiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import type { EtapeReglementaire } from '@/features/stock/types';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { ETAPE_ACCUEIL, ETAPES_ACCUEIL_OBLIGATOIRES } from '@/shared/constants/agritourisme';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.commercial.agritourisme.accueilPublic;

/** Les démarches dans l'ordre où on les fait : les obligatoires d'abord, puis celles à vérifier. */
const ETAPES: string[] = Object.values(ETAPE_ACCUEIL).sort(
  (a, b) => Number(ETAPES_ACCUEIL_OBLIGATOIRES.includes(b)) - Number(ETAPES_ACCUEIL_OBLIGATOIRES.includes(a)),
);

/**
 * Les démarches pour accueillir du public à la ferme (déclaration en mairie comme établissement recevant du public, sécurité incendie, accessibilité, assurance,
 * DDPP…) : chacune avec sa case « Fait », sa date, sa référence et ses pièces jointes, comme le dossier réglementaire des savons. Tant qu'une démarche obligatoire
 * manque, un rappel s'affiche sur l'accueil.
 */
export default function AccueilPublic() {
  const [archive, setArchive] = useState<ArchiveCommercial | null>(null);
  const charger = useCallback(
    () =>
      lireArchiveCommercial()
        .then(setArchive)
        .catch(() => undefined),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  if (!archive) return <Screen>{null}</Screen>;

  const manque = etapesAccueilManquantes(archive);
  const etape = (e: string): EtapeReglementaire => archive.accueilPublic?.[e] ?? {};
  const maj = async (e: string, modification: Partial<EtapeReglementaire>) => {
    await enregistrerEtapeAccueil(e, modification);
    await charger();
  };
  const ajouterFichiers = async (e: string) => {
    if (!piecesDisponibles()) return Alert.alert(TEXTES.fichiers.indisponibleWeb);
    try {
      const nouveaux: PieceJointe[] = [];
      for (const choisi of await choisirFichiers(TYPES_FICHIERS_ACCEPTES, true)) nouveaux.push(await rangerFichier(choisi));
      await maj(e, { fichiers: [...(etape(e).fichiers ?? []), ...nouveaux] });
    } catch (erreur: unknown) {
      Alert.alert(erreur instanceof Error ? erreur.message : TEXTES.fichiers.erreurAjout);
    }
  };
  const retirerFichier = async (e: string, piece: PieceJointe) => {
    await supprimerPiece(piece);
    await maj(e, { fichiers: (etape(e).fichiers ?? []).filter((f) => f.id !== piece.id) });
  };

  return (
    <Screen>
      <Text style={commonStyles.note}>{T.intro}</Text>
      <Text style={commonStyles.lineBold}>
        {manque.length === 0 ? T.enRegle : T.incomplet(manque.map((e) => T.etapes[e as keyof typeof T.etapes].titre).join(', '))}
      </Text>
      {ETAPES.map((e) => {
        const textes = T.etapes[e as keyof typeof T.etapes];
        const donnees = etape(e);
        return (
          <SectionForm
            key={e}
            titre={`${textes.titre} · ${ETAPES_ACCUEIL_OBLIGATOIRES.includes(e) ? T.obligatoire : T.facultatif}`}
            aide={textes.aide}
          >
            <Checkbox
              label={T.fait}
              value={!!donnees.fait}
              onChange={(fait) => maj(e, { fait: fait || undefined, date: fait && !donnees.date ? todayISO() : donnees.date })}
            />
            <DateField label={T.date} value={donnees.date ?? ''} onChange={(date) => maj(e, { date })} />
            <FormField
              label={textes.reference}
              defaultValue={donnees.reference ?? ''}
              onEndEditing={(ev) => {
                maj(e, { reference: ev.nativeEvent.text.trim() || undefined });
              }}
            />
            <View>
              <ListeFichiers
                titre={T.fichiers}
                libelleAjout={T.ajouterFichier}
                pieces={donnees.fichiers ?? []}
                onAjouter={() => ajouterFichiers(e)}
                onRetirer={(piece) => retirerFichier(e, piece)}
              />
            </View>
          </SectionForm>
        );
      })}
    </Screen>
  );
}
