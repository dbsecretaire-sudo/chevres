import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import type { DefinitionEspece } from '@/features/especes/types';
import { UNITE_DUREE } from '@/shared/constants/temps';
import type { Duree } from '@/shared/utils/age';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.especes;

interface Props {
  /** Absent pour une nouvelle espèce. */
  initial?: DefinitionEspece;
  libelleValider: string;
  onValider: (definition: Omit<DefinitionEspece, 'id'>) => void | Promise<void>;
  /** Pour une espèce ajoutée : le bouton qui la supprime. */
  onSupprimer?: () => void;
}

/** Une durée à saisir : un nombre et son unité (jours ou mois). */
function ChampDuree({
  label,
  valeur,
  unite,
  onValeur,
  onUnite,
  aide,
}: {
  label: string;
  valeur: string;
  unite: string;
  onValeur: (v: string) => void;
  onUnite: (u: string) => void;
  aide?: string;
}) {
  return (
    <View style={commonStyles.gap6}>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={label}
            required
            value={valeur}
            onChangeText={onValeur}
            keyboardType="number-pad"
          />
        </View>
        <View style={commonStyles.flex1}>
          <SelectField<string>
            label={T.champs.unite}
            required
            value={unite}
            onChange={onUnite}
            options={[
              { value: UNITE_DUREE.JOURS, label: T.unites.jours },
              { value: UNITE_DUREE.MOIS, label: T.unites.mois },
            ]}
          />
        </View>
      </View>
      {aide ? <Text style={commonStyles.note}>{aide}</Text> : null}
    </View>
  );
}

const enTexte = (duree?: Duree): { valeur: string; unite: string } => ({
  valeur: duree ? String(duree.valeur) : '',
  unite: duree?.unite ?? UNITE_DUREE.MOIS,
});

/**
 * Les noms et les âges d'une espèce : son nom, l'âge de sevrage, celui de la maturité sexuelle (en dessous, c'est un petit), le
 * nombre maximal de petits par portée, et les mots de la femelle adulte, du mâle adulte et du petit. Tout est obligatoire.
 */
export function FormulaireEspece({ initial, libelleValider, onValider, onSupprimer }: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [sevrage, setSevrage] = useState(enTexte(initial?.ageSevrage));
  const [maturite, setMaturite] = useState(enTexte(initial?.agePetitMax));
  const [portee, setPortee] = useState(initial ? String(initial.nbPetitsMax) : '');
  const [femelle, setFemelle] = useState(initial?.femelle ?? '');
  const [male, setMale] = useState(initial?.male ?? '');
  const [petit, setPetit] = useState(initial?.petit ?? '');
  const [erreur, setErreur] = useState(false);

  const nombre = (texte: string) => Math.round(parseDecimal(texte));
  const valide =
    !!nom.trim() &&
    !!femelle.trim() &&
    !!male.trim() &&
    !!petit.trim() &&
    nombre(sevrage.valeur) > 0 &&
    nombre(maturite.valeur) > 0 &&
    nombre(portee) > 0;

  const valider = async () => {
    if (!valide) return setErreur(true);
    setErreur(false);
    await onValider({
      nom: nom.trim(),
      ageSevrage: { valeur: nombre(sevrage.valeur), unite: sevrage.unite as Duree['unite'] },
      agePetitMax: { valeur: nombre(maturite.valeur), unite: maturite.unite as Duree['unite'] },
      nbPetitsMax: nombre(portee),
      femelle: femelle.trim(),
      male: male.trim(),
      petit: petit.trim(),
    });
  };

  return (
    <View style={commonStyles.gap10}>
      <FormField
        label={T.champs.nom}
        required
        value={nom}
        onChangeText={setNom}
        placeholder={T.champs.nomPlaceholder}
      />
      <ChampDuree
        label={T.champs.sevrage}
        valeur={sevrage.valeur}
        unite={sevrage.unite}
        onValeur={(valeur) => setSevrage({ ...sevrage, valeur })}
        onUnite={(unite) => setSevrage({ ...sevrage, unite })}
      />
      <ChampDuree
        label={T.champs.maturite}
        valeur={maturite.valeur}
        unite={maturite.unite}
        onValeur={(valeur) => setMaturite({ ...maturite, valeur })}
        onUnite={(unite) => setMaturite({ ...maturite, unite })}
        aide={T.champs.maturiteAide}
      />
      <FormField
        label={T.champs.portee}
        required
        value={portee}
        onChangeText={setPortee}
        keyboardType="number-pad"
      />
      <FormField
        label={T.champs.femelle}
        required
        value={femelle}
        onChangeText={setFemelle}
        placeholder={T.champs.femellePlaceholder}
      />
      <FormField
        label={T.champs.male}
        required
        value={male}
        onChangeText={setMale}
        placeholder={T.champs.malePlaceholder}
      />
      <FormField
        label={T.champs.petit}
        required
        value={petit}
        onChangeText={setPetit}
        placeholder={T.champs.petitPlaceholder}
      />
      {erreur ? <Text style={commonStyles.required}>{T.tousObligatoires}</Text> : null}
      <Button label={libelleValider} onPress={valider} />
      {onSupprimer ? <Button variant="danger" label={T.supprimer} onPress={onSupprimer} /> : null}
    </View>
  );
}
