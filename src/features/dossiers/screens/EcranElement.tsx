import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { InfoModal } from '@/shared/components/InfoModal';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { ListeFichiers } from '@/features/fichiers/components/ListeFichiers';
import {
  choisirFichiers,
  piecesDisponibles,
  rangerFichier,
  supprimerPiece,
} from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import {
  enregistrerElement,
  getElement,
  getSousDossier,
  supprimerElement,
} from '@/features/dossiers/repository';
import type { StatutElement } from '@/features/dossiers/types';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { estEnRetard } from '@/features/dossiers/services/recherche';
import { SEPARATEUR_ETIQUETTES, STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { LABEL_STATUT_ELEMENT } from '@/shared/textes/libelles';
import { estDateISO, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const PUCES_AVANCEMENT = Object.entries(LABEL_STATUT_ELEMENT).map(([valeur, label]) => ({ valeur, label }));

/** Saisie ou modification d'un contenu (note, courrier, démarche…) rangé dans un sous-dossier. */
export default function EcranElement() {
  const router = useRouter();
  const { id, dossierId: dossierParam } = useLocalSearchParams<{ id?: string; dossierId?: string }>();
  const T = TEXTES.dossiers.element;
  const existant = !!id;

  const [dossierId, setDossierId] = useState(dossierParam ?? '');
  const [titre, setTitre] = useState('');
  const [texte, setTexte] = useState('');
  const [date, setDate] = useState(todayISO());
  const [echeance, setEcheance] = useState('');
  const [statut, setStatut] = useState<StatutElement>(STATUT_ELEMENT.A_FAIRE);
  const [etiquettes, setEtiquettes] = useState('');
  const [fichiers, setFichiers] = useState<PieceJointe[]>([]);
  /** Les fichiers retirés : leur copie n'est effacée de l'appareil qu'à l'enregistrement. */
  const [retires, setRetires] = useState<PieceJointe[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  useEffect(() => {
    if (!id) return;
    getElement(id).then((e) => {
      if (!e) return;
      setDossierId(e.dossierId);
      setTitre(e.titre);
      setTexte(e.texte ?? '');
      setDate(e.date);
      setEcheance(e.echeance ?? '');
      setStatut(statutEffectif(e));
      setEtiquettes((e.etiquettes ?? []).join(`${SEPARATEUR_ETIQUETTES} `));
      setFichiers(e.fichiers ?? []);
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
    } catch (e: any) {
      setErreur(e?.message ?? TEXTES.fichiers.erreurAjout);
    }
  };

  const retirerFichier = (piece: PieceJointe) => {
    setFichiers((actuels) => actuels.filter((f) => f.id !== piece.id));
    setRetires((actuels) => [...actuels, piece]);
  };

  const enregistrer = async () => {
    if (!titre.trim()) return setErreur(T.titreRequis);
    if (!estDateISO(date) || (echeance && !estDateISO(echeance)))
      return setErreur(TEXTES.commun.dateField.invalide);
    const dossier = await getSousDossier(dossierId);
    if (!dossier) return setErreur(TEXTES.dossiers.sousDossier.introuvable);
    await enregistrerElement({
      id,
      clientId: dossier.clientId,
      dossierId,
      titre: titre.trim(),
      texte: texte.trim() || undefined,
      date,
      echeance: echeance || undefined,
      statut,
      fichiers: fichiers.length > 0 ? fichiers : undefined,
      etiquettes: etiquettes
        .split(SEPARATEUR_ETIQUETTES)
        .map((e) => e.trim())
        .filter(Boolean),
    });
    for (const piece of retires) await supprimerPiece(piece);
    router.back();
  };

  const supprimer = async () => {
    if (id) await supprimerElement(id);
    setSuppressionOuverte(false);
    router.back();
  };

  return (
    <AccentColorProvider
      color={existant ? colors.primary : colors.ajout}
      softColor={existant ? colors.badgeBg : colors.ajoutBadgeBg}
    >
      <Screen>
        <Stack.Screen options={{ title: existant ? titre || T.nouveau : T.nouveau }} />
        <FormField
          label={T.titre}
          required
          value={titre}
          onChangeText={setTitre}
          placeholder={T.exempleTitre}
        />
        <FormField
          label={T.texte}
          value={texte}
          onChangeText={setTexte}
          multiline
          style={styles.textareaBasse}
        />
        <DateField label={T.date} required value={date} onChange={setDate} />

        {echeance ? (
          <>
            <DateField label={T.echeance} value={echeance} onChange={setEcheance} />
            <Button variant="secondary" label={T.retirerEcheance} onPress={() => setEcheance('')} />
          </>
        ) : (
          <Button variant="secondary" label={T.echeance} onPress={() => setEcheance(todayISO())} />
        )}

        <View style={commonStyles.gap6}>
          <Text style={commonStyles.lineSemiBold}>{T.avancement}</Text>
          <PucesDefilantes<string>
            puces={PUCES_AVANCEMENT}
            valeur={statut}
            onChoisir={(v) => setStatut(v as StatutElement)}
          />
          {estEnRetard({ echeance: echeance || undefined, statut }, todayISO()) ? (
            <Text style={commonStyles.required}>{T.enRetardInfo}</Text>
          ) : null}
        </View>
        <FormField
          label={T.etiquettes}
          value={etiquettes}
          onChangeText={setEtiquettes}
          placeholder={T.exempleEtiquettes}
        />

        <ListeFichiers
          titre={TEXTES.fichiers.titre}
          libelleAjout={TEXTES.fichiers.ajouter}
          aide={TEXTES.fichiers.aide}
          pieces={fichiers}
          onAjouter={ajouterFichiers}
          onRetirer={retirerFichier}
        />

        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={TEXTES.commun.general.annuler}
            onPress={() => router.back()}
          />
          <Button
            style={commonStyles.flex1}
            label={TEXTES.commun.general.enregistrer}
            onPress={enregistrer}
          />
        </View>
        {existant ? (
          <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} />
        ) : null}

        <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
        <ConfirmModal
          visible={suppressionOuverte}
          title={T.supprimerQuestion}
          message={T.supprimerMessage}
          confirmLabel={TEXTES.commun.general.supprimer}
          onCancel={() => setSuppressionOuverte(false)}
          onConfirm={supprimer}
        />
      </Screen>
    </AccentColorProvider>
  );
}
