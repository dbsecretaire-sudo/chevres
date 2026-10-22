import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { ChampBesoinsFormule, saisiesDesBesoins, type SaisieBesoin } from '@/features/commercial/components/ChampBesoinsFormule';
import { besoinsValides } from '@/features/commercial/services/stockVisite';
import {
  elementsDeFormule,
  enregistrerElementFormule,
  enregistrerFormule,
  supprimerElementFormule,
  supprimerFormule,
} from '@/features/commercial/services/agritourisme';
import type { ElementFormule } from '@/features/commercial/types';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { ELEMENT_AGRITOURISME, TAUX_TVA_AGRITOURISME } from '@/shared/constants/agritourisme';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/commercial/Commercial.styles';
import { TEXTES } from '@/shared/textes';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.commercial.agritourisme.formule;

const texte = (valeur: number | undefined): string =>
  valeur === undefined ? '' : String(valeur).replace('.', ',');

/** Une formule d'agritourisme : son nom, ce qu'elle comprend (visite, 4x4, repas, dégustation), son prix et ses coûts. */
export default function FicheFormuleAgritourisme() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [identifiant, setIdentifiant] = useState(id ?? '');
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [elements, setElements] = useState<string[]>([ELEMENT_AGRITOURISME.VISITE]);
  const [tauxTva, setTauxTva] = useState(texte(TAUX_TVA_AGRITOURISME));
  const [note, setNote] = useState('');
  /** Le stock que la formule consomme, en saisie. */
  const [besoins, setBesoins] = useState<SaisieBesoin[]>([]);
  const [erreur, setErreur] = useState('');
  const [suppression, setSuppression] = useState(false);
  /** Les éléments qu'une formule peut comprendre, et celui qu'on ajoute (vide : nouveau), renomme ou retire. */
  const [catalogue, setCatalogue] = useState<ElementFormule[]>(elementsDeFormule({}));
  const [elementEnEdition, setElementEnEdition] = useState<ElementFormule | 'nouveau' | null>(null);
  const [elementARetirer, setElementARetirer] = useState<ElementFormule | null>(null);

  useFocusEffect(
    useCallback(() => {
      lireArchiveCommercial().then((archive) => setCatalogue(elementsDeFormule(archive)));
      if (!id) return;
      lireArchiveCommercial().then((archive) => {
        const formule = archive.formules.find((f) => f.id === id);
        if (!formule) return;
        setIdentifiant(formule.id);
        setNom(formule.nom);
        setPrix(texte(formule.prix));
        setElements(formule.elements);
        setTauxTva(texte(formule.tauxTva ?? TAUX_TVA_AGRITOURISME));
        setNote(formule.note ?? '');
        setBesoins(saisiesDesBesoins(formule.besoins));
      });
    }, [id]),
  );

  const basculer = (element: string) =>
    setElements((courants) =>
      courants.includes(element) ? courants.filter((e) => e !== element) : [...courants, element],
    );

  const enregistrer = async () => {
    if (!nom.trim()) return setErreur(T.nomRequis);
    if (!(parseDecimal(prix) > 0)) return setErreur(T.prixInvalide);
    setErreur('');
    await enregistrerFormule({
      id: identifiant || generateId(),
      nom: nom.trim(),
      prix: parseDecimal(prix),
      elements,
      tauxTva: tauxTva.trim() ? parseDecimal(tauxTva) : undefined,
      note: note.trim() || undefined,
      besoins: (() => {
        const valides = besoinsValides(
          besoins.map((b) => ({ article: b.article, quantite: parseDecimal(b.quantite), parPersonne: b.parPersonne })),
        );
        return valides.length > 0 ? valides : undefined;
      })(),
    });
    router.back();
  };

  const supprimer = async () => {
    setSuppression(false);
    if (await supprimerFormule(identifiant)) router.back();
    else Alert.alert(T.utilisee);
  };

  return (
    <Screen>
      <SectionForm>
        <FormField label={T.nom} required value={nom} onChangeText={setNom} placeholder={T.nomPlaceholder} />
        <FormField label={T.prix} required value={prix} onChangeText={setPrix} keyboardType="decimal-pad" />
      </SectionForm>
      <SectionForm titre={T.elements} aide={T.elementsAide}>
        {catalogue.map((e) => (
          <View key={e.id} style={styles.ligneMontant}>
            <View style={commonStyles.flex1}>
              <Checkbox label={e.nom} value={elements.includes(e.id)} onChange={() => basculer(e.id)} />
            </View>
            <Pressable
              onPress={() => setElementEnEdition(e)}
              hitSlop={8}
              accessibilityLabel={T.renommerElement}
            >
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => setElementARetirer(e)}
              hitSlop={8}
              accessibilityLabel={T.retirerElement}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        ))}
        <Button variant="secondary" label={T.ajouterElement} onPress={() => setElementEnEdition('nouveau')} />
      </SectionForm>
      {/* Le stock que la formule consomme : il sort de l'inventaire à la réalisation de la visite. */}
      <SectionForm titre={TEXTES.commercial.agritourisme.stock.titre} aide={TEXTES.commercial.agritourisme.stock.aide}>
        <ChampBesoinsFormule valeur={besoins} onChange={setBesoins} />
      </SectionForm>
      <SectionForm>
        <Text style={commonStyles.note}>{T.chargesAide}</Text>
        <FormField
          label={T.tauxTva}
          aide={T.tauxTvaAide}
          value={tauxTva}
          onChangeText={setTauxTva}
          keyboardType="decimal-pad"
        />
        <FormField label={T.note} value={note} onChangeText={setNote} multiline />
      </SectionForm>
      {erreur ? <Text style={styles.alerte}>{erreur}</Text> : null}
      <View style={styles.actions}>
        <Button label={T.enregistrer} onPress={enregistrer} />
        {identifiant && id ? (
          <Button variant="danger" label={T.supprimer} onPress={() => setSuppression(true)} />
        ) : null}
      </View>
      <NomModal
        visible={elementEnEdition !== null}
        titre={elementEnEdition === 'nouveau' ? T.ajouterElementTitre : T.renommerElementTitre}
        valeurInitiale={elementEnEdition && elementEnEdition !== 'nouveau' ? elementEnEdition.nom : ''}
        placeholder={T.elementPlaceholder}
        onAnnuler={() => setElementEnEdition(null)}
        onValider={async (nomElement) => {
          const courant = elementEnEdition;
          setElementEnEdition(null);
          const element: ElementFormule =
            courant && courant !== 'nouveau'
              ? { ...courant, nom: nomElement, court: undefined }
              : { id: generateId(), nom: nomElement };
          await enregistrerElementFormule(element);
          setCatalogue(elementsDeFormule(await lireArchiveCommercial()));
          // Un élément qu'on vient d'ajouter est coché d'office.
          if (!courant || courant === 'nouveau') setElements((courants) => [...courants, element.id]);
        }}
      />
      <ConfirmModal
        visible={elementARetirer !== null}
        title={T.retirerElementTitre}
        message={T.retirerElementMessage(elementARetirer?.nom ?? '')}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setElementARetirer(null)}
        onConfirm={async () => {
          const retire = elementARetirer;
          setElementARetirer(null);
          if (!retire) return;
          await supprimerElementFormule(retire.id);
          setCatalogue(elementsDeFormule(await lireArchiveCommercial()));
          setElements((courants) => courants.filter((x) => x !== retire.id));
        }}
      />
      <ConfirmModal
        visible={suppression}
        title={T.supprimerTitre}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setSuppression(false)}
        onConfirm={supprimer}
      />
    </Screen>
  );
}
