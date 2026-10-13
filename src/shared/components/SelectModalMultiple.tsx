import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import type { SelectOption } from '@/shared/components/SelectModal';
import { colors } from '@/shared/theme/colors';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { dansLaPlage, lirePlage } from '@/shared/utils/plage';
import { styles } from '@/shared/styles/components/SelectField.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.commun.selectField;

interface Props<T extends string> {
  visible: boolean;
  titre: string;
  options: SelectOption<T>[];
  /** Le texte du bouton qui valide : il reçoit le nombre de lignes cochées. */
  libelleValider: (nombre: number) => string;
  /** Les lignes cochées, quand on valide. */
  onValider: (valeurs: T[]) => void;
  onClose: () => void;
  /**
   * Le nombre qui fait le numéro d'une ligne (« 12 » pour le lot 12) : quand il est donné, une plage tapée dans la recherche
   * (« 12-30 ») propose de cocher d'un coup toutes les lignes de ce nombre à celui-là.
   */
  numeroDe?: (valeur: T) => number | undefined;
}

/**
 * Une liste dont on coche plusieurs lignes d'un coup : une recherche, « Tout cocher » (les lignes que la recherche montre), une plage
 * de numéros tapée dans la recherche, puis un bouton qui valide les lignes cochées. Comme SelectModal, mais pour plusieurs choix.
 */
export function SelectModalMultiple<T extends string>({
  visible,
  titre,
  options,
  libelleValider,
  onValider,
  onClose,
  numeroDe,
}: Props<T>) {
  const accent = useAccentColor();
  const [recherche, setRecherche] = useState('');
  const [cochees, setCochees] = useState<Set<T>>(new Set());

  const q = recherche.trim().toLowerCase();
  const plage = numeroDe ? lirePlage(recherche) : null;
  const optionsFiltrees = useMemo(
    () => (!q || plage ? options : options.filter((o) => o.label.toLowerCase().includes(q))),
    [options, q, plage],
  );
  /** Les lignes d'une plage tapée : celles dont le numéro est entre les deux nombres (dans un sens ou dans l'autre). */
  const dansLaPlageTapee = useMemo(
    () => (plage && numeroDe ? dansLaPlage(options, plage, (o) => numeroDe(o.value)) : []),
    [options, plage, numeroDe],
  );

  const toutesCochees = optionsFiltrees.length > 0 && optionsFiltrees.every((o) => cochees.has(o.value));

  const bascule = (valeur: T) =>
    setCochees((actuelles) => {
      const suivantes = new Set(actuelles);
      if (suivantes.has(valeur)) suivantes.delete(valeur);
      else suivantes.add(valeur);
      return suivantes;
    });

  /** Coche ou décoche en bloc les lignes données. */
  const basculeEnBloc = (lignes: SelectOption<T>[], cocher: boolean) =>
    setCochees((actuelles) => {
      const suivantes = new Set(actuelles);
      for (const ligne of lignes) {
        if (cocher) suivantes.add(ligne.value);
        else suivantes.delete(ligne.value);
      }
      return suivantes;
    });

  const fermer = () => {
    setRecherche('');
    setCochees(new Set());
    onClose();
  };

  const valider = () => {
    // Dans l'ordre de la liste, pas dans celui des coches.
    onValider(options.filter((o) => cochees.has(o.value)).map((o) => o.value));
    fermer();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <Pressable style={commonStyles.backdrop} onPress={fermer}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>{titre}</Text>
          <TextInput
            style={styles.recherche}
            placeholder={numeroDe ? T.rechercherOuPlage : T.rechercherParNOuLibellePoints}
            placeholderTextColor={colors.textMuted}
            value={recherche}
            onChangeText={setRecherche}
          />
          {plage && dansLaPlageTapee.length > 0 ? (
            <Pressable
              style={styles.option}
              onPress={() => {
                basculeEnBloc(dansLaPlageTapee, true);
                setRecherche('');
              }}
            >
              <Text style={[commonStyles.valueText, { color: accent, fontWeight: '700' }]}>
                {T.cocherLaPlage(plage.debut, plage.fin, dansLaPlageTapee.length)}
              </Text>
            </Pressable>
          ) : null}
          {optionsFiltrees.length > 0 ? (
            <Pressable style={styles.option} onPress={() => basculeEnBloc(optionsFiltrees, !toutesCochees)}>
              <Text style={[commonStyles.valueText, { color: accent, fontWeight: '700' }]}>
                {toutesCochees ? T.toutDecocher : T.toutCocher(optionsFiltrees.length)}
              </Text>
            </Pressable>
          ) : null}
          <FlatList
            style={styles.liste}
            data={optionsFiltrees}
            keyExtractor={(item, index) => `${item.value}|${index}`}
            renderItem={({ item }) => {
              const cochee = cochees.has(item.value);
              return (
                <Pressable
                  style={[commonStyles.row, styles.option, cochee && styles.optionSelected]}
                  onPress={() => bascule(item.value)}
                >
                  <Ionicons
                    name={cochee ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={cochee ? accent : colors.textMuted}
                  />
                  <Text style={[commonStyles.valueText, cochee && { color: accent, fontWeight: '700' }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={styles.aucunResultat}>{T.aucunResultat}</Text>}
          />
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={fermer}
            />
            <Button
              style={commonStyles.flex1}
              label={libelleValider(cochees.size)}
              onPress={valider}
              disabled={cochees.size === 0}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
