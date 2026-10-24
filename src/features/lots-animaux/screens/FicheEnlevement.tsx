import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { ChampBoucles } from '@/features/lots-animaux/components/ChampBoucles';
import { ChoixContactDuLot } from '@/features/lots-animaux/components/ChoixContactDuLot';
import { useEnlevements } from '@/features/lots-animaux/hooks/useEnlevements';
import { ListeFichiers } from '@/features/fichiers/components/ListeFichiers';
import { choisirFichiers, piecesDisponibles, rangerFichier, supprimerPiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { TYPES_ANALYSES_ACCEPTES } from '@/shared/constants/fichiers';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.exploitation.enlevements;

/**
 * La fiche d'un enlèvement d'équarrissage : le jour, l'équarrisseur, le n° du bon, les animaux morts enlevés (leurs boucles se choisissent dans le cheptel, à la création comme
 * ensuite) et le bon remis par l'équarrisseur (scan, photo ou PDF). Un enlèvement déjà créé s'enregistre tout seul ; un nouveau a son bouton « Enregistrer ».
 */
export default function FicheEnlevement() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { enlevements, enregistrer, supprimer } = useEnlevements();
  const existant = id ? enlevements.find((e) => e.id === id) : undefined;
  const [date, setDate] = useState(todayISO());
  const [contactCle, setContactCle] = useState('');
  const [numeroBon, setNumeroBon] = useState('');
  const [boucles, setBoucles] = useState('');
  const [fichiers, setFichiers] = useState<PieceJointe[]>([]);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  /** Les fichiers ajoutés à un enlèvement qu'on n'enregistre pas : effacés en quittant. */
  const ajoutes = useRef<PieceJointe[]>([]);
  const enregistre = useRef(false);
  const [lu, setLu] = useState(false);

  // L'enlèvement existant se lit une fois, dès que les réglages sont là.
  useEffect(() => {
    if (!existant || lu) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLu(true);
    setDate(existant.date || todayISO());
    setContactCle(existant.contactCle ?? '');
    setNumeroBon(existant.numeroBon ?? '');
    setBoucles(existant.boucles);
    setFichiers(existant.fichiers ?? []);
  }, [existant, lu]);
  useEffect(
    () => () => {
      if (!existant && !enregistre.current) ajoutes.current.forEach((p) => supprimerPiece(p));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const ajouterFichiers = async () => {
    if (!piecesDisponibles()) return Alert.alert(TEXTES.fichiers.indisponibleWeb);
    try {
      const nouveaux: PieceJointe[] = [];
      for (const choisi of await choisirFichiers(TYPES_ANALYSES_ACCEPTES, true)) nouveaux.push(await rangerFichier(choisi));
      ajoutes.current.push(...nouveaux);
      setFichiers((actuels) => [...actuels, ...nouveaux]);
    } catch (e: unknown) {
      Alert.alert(e instanceof Error ? e.message : TEXTES.fichiers.erreurAjout);
    }
  };
  const retirerFichier = async (piece: PieceJointe) => {
    setFichiers((actuels) => actuels.filter((f) => f.id !== piece.id));
    await supprimerPiece(piece);
  };

  const aEnregistrer = () => ({
    id: existant?.id,
    date,
    boucles: boucles.trim(),
    contactCle: contactCle || undefined,
    numeroBon: numeroBon.trim() || undefined,
    fichiers: fichiers.length > 0 ? fichiers : undefined,
  });
  const creer = async () => {
    enregistre.current = true;
    await enregistrer(aEnregistrer());
    retournerALaPageDAvant(router);
  };

  useEnregistrementAuto({
    actif: !!existant && lu,
    signature: JSON.stringify([date, contactCle, numeroBon, boucles, fichiers.map((f) => f.id)]),
    enregistrer: async () => {
      await enregistrer(aEnregistrer());
      return true;
    },
  });

  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Screen>
        <SectionForm titre={T.sectionEnlevement}>
          <DateField label={T.jour} required value={date} onChange={setDate} />
          <ChoixContactDuLot genre="equarrissage" valeur={contactCle} onChange={setContactCle} />
          <FormField label={T.numeroBon} value={numeroBon} onChangeText={setNumeroBon} placeholder={T.exempleBon} />
        </SectionForm>
        {/* Les animaux morts de cet enlèvement : leurs boucles se choisissent dans le cheptel. */}
        <SectionForm titre={T.sectionAnimaux}>
          <ChampBoucles value={boucles} onChange={setBoucles} sansLots enColonnes avecMorts texteVide={T.aucunAnimal} />
        </SectionForm>
        <SectionForm titre={T.sectionBon}>
          <ListeFichiers
            titre={T.bonDeLEquarrisseur}
            libelleAjout={TEXTES.fichiers.ajouter}
            aide={T.aideBon}
            pieces={fichiers}
            onAjouter={ajouterFichiers}
            onRetirer={(p) => void retirerFichier(p)}
          />
        </SectionForm>
        {existant ? null : <Button label={TEXTES.commun.general.enregistrer} onPress={() => void creer()} />}
        {existant ? <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} /> : null}
        <ConfirmModal
          visible={suppressionOuverte}
          title={T.supprimerQuestion}
          message={T.supprimerMessage}
          confirmLabel={TEXTES.commun.general.supprimer}
          onCancel={() => setSuppressionOuverte(false)}
          onConfirm={async () => {
            setSuppressionOuverte(false);
            if (existant) {
              for (const piece of fichiers) await supprimerPiece(piece);
              await supprimer(existant.id);
            }
            enregistre.current = true;
            retournerALaPageDAvant(router);
          }}
        />
      </Screen>
    </AccentColorProvider>
  );
}
