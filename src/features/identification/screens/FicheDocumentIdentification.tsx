import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { InfoModal } from '@/shared/components/InfoModal';
import { SelectField } from '@/shared/components/SelectField';
import { ListeFichiers } from '@/features/fichiers/components/ListeFichiers';
import {
  choisirFichiers,
  piecesDisponibles,
  rangerFichier,
  supprimerPiece,
} from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import {
  enregistrerDocumentIdentification,
  getDocumentIdentification,
  supprimerDocumentIdentification,
} from '@/features/identification/repository';
import type { DocumentIdentification } from '@/features/identification/types';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { NATURE_DOCUMENT_IDENTIFICATION } from '@/shared/constants/identification';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { estDateISO, todayISO } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.identification;

/**
 * Saisie ou modification d'un document d'identification : son titre, sa nature (identification ou installation), sa date, des notes
 * et ses pièces scannées (autant qu'il en faut ; une image s'agrandit d'un appui).
 */
export default function FicheDocumentIdentification() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existant = !!id;

  const [titre, setTitre] = useState('');
  const [nature, setNature] = useState<DocumentIdentification['nature']>(NATURE_DOCUMENT_IDENTIFICATION[0]);
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [fichiers, setFichiers] = useState<PieceJointe[]>([]);
  /** Les fichiers retirés : leur copie n'est effacée de l'appareil qu'à l'enregistrement. */
  const [retires, setRetires] = useState<PieceJointe[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  /** Le document existant est chargé : dès lors, ses modifications s'enregistrent toutes seules. */
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDocumentIdentification(id).then((document) => {
      if (!document) return;
      setTitre(document.titre);
      setNature(document.nature);
      setDate(document.date);
      setNotes(document.notes ?? '');
      setFichiers(document.fichiers ?? []);
      setCharge(true);
    });
  }, [id]);

  const ajouterFichiers = async () => {
    if (!piecesDisponibles()) return setErreur(TEXTES.fichiers.indisponibleWeb);
    try {
      const nouveaux: PieceJointe[] = [];
      for (const choisi of await choisirFichiers(TYPES_FICHIERS_ACCEPTES, true)) {
        nouveaux.push(await rangerFichier(choisi));
      }
      setFichiers((actuels) => [...actuels, ...nouveaux]);
    } catch (e: unknown) {
      setErreur(e instanceof Error ? e.message : TEXTES.fichiers.erreurAjout);
    }
  };

  const retirerFichier = (piece: PieceJointe) => {
    setFichiers((actuels) => actuels.filter((f) => f.id !== piece.id));
    setRetires((actuels) => [...actuels, piece]);
  };

  /** Enregistré tout seul (`auto`), il ne dit rien d'une saisie incomplète et reste sur l'écran. */
  const enregistrer = async (auto = false): Promise<boolean> => {
    if (!titre.trim()) {
      if (!auto) setErreur(T.fiche.titreRequis);
      return false;
    }
    if (!estDateISO(date)) {
      if (!auto) setErreur(TEXTES.commun.dateField.invalide);
      return false;
    }
    await enregistrerDocumentIdentification({
      id,
      titre: titre.trim(),
      nature,
      date,
      notes: notes.trim() || undefined,
      fichiers: fichiers.length > 0 ? fichiers : undefined,
    });
    for (const piece of retires) await supprimerPiece(piece);
    if (auto) setRetires([]);
    else router.back();
    return true;
  };

  // Un document existant : tout changement s'enregistre tout seul.
  useEnregistrementAuto({
    actif: existant && charge,
    signature: JSON.stringify([titre, nature, date, notes, fichiers]),
    enregistrer: () => enregistrer(true),
  });

  const supprimer = async () => {
    if (id) {
      await supprimerDocumentIdentification(id);
      for (const piece of [...fichiers, ...retires]) await supprimerPiece(piece);
    }
    setSuppressionOuverte(false);
    router.back();
  };

  return (
    <AccentColorProvider
      color={existant ? colors.primary : colors.ajout}
      softColor={existant ? colors.badgeBg : colors.ajoutBadgeBg}
    >
      <Screen>
        <Stack.Screen
          options={{
            title: existant ? titre || T.nouveau : T.nouveau,
            headerStyle: { backgroundColor: existant ? colors.primary : colors.ajout },
          }}
        />
        <FormField
          label={T.fiche.titre}
          required
          value={titre}
          onChangeText={setTitre}
          placeholder={T.fiche.exempleTitre}
        />
        <SelectField
          label={T.nature.label}
          value={nature}
          onChange={setNature}
          options={NATURE_DOCUMENT_IDENTIFICATION.map((valeur) => ({ value: valeur, label: T.nature[valeur] }))}
        />
        <DateField label={T.fiche.date} required value={date} onChange={setDate} />
        <FormField
          label={T.fiche.notes}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={commonStyles.textarea}
        />

        <ListeFichiers
          titre={TEXTES.fichiers.titre}
          libelleAjout={TEXTES.fichiers.ajouter}
          aide={TEXTES.fichiers.aide}
          pieces={fichiers}
          onAjouter={ajouterFichiers}
          onRetirer={retirerFichier}
          apercu
        />

        {/* Un nouveau document s'enregistre avec son bouton ; un document existant, tout seul. */}
        {existant ? null : (
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={() => router.back()}
            />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={() => enregistrer()} />
          </View>
        )}
        {existant ? (
          <Button variant="danger" label={T.fiche.supprimer} onPress={() => setSuppressionOuverte(true)} />
        ) : null}

        <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
        <ConfirmModal
          visible={suppressionOuverte}
          title={T.fiche.supprimerQuestion}
          message={T.fiche.supprimerMessage}
          confirmLabel={TEXTES.commun.general.supprimer}
          onCancel={() => setSuppressionOuverte(false)}
          onConfirm={supprimer}
        />
      </Screen>
    </AccentColorProvider>
  );
}
