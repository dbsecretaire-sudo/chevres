import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.commun.filtreColonne;

interface Props {
  visible: boolean;
  /** Le nom de la colonne. */
  colonne: string;
  /** Toutes les valeurs de la colonne, dans l'ordre où elles se présentent. */
  valeurs: string[];
  /** Les valeurs gardées en ce moment (rien : toutes). */
  gardees?: string[];
  /** Appelé avec les valeurs cochées (rien : toutes, le filtre est effacé). */
  onAppliquer: (gardees: string[] | undefined) => void;
  /** Quand la colonne se trie : appelé par « Tri croissant » (vrai) et « Tri décroissant » (faux), qui ferment le menu. */
  onTrier?: (croissant: boolean) => void;
  onFermer: () => void;
}

/**
 * Le menu d'une colonne de tableau, comme le filtre d'Excel : tri croissant ou décroissant, une recherche dans les valeurs, la liste
 * des valeurs avec leur case (et « Tout »), puis OK ou Annuler. Décocher tout n'a pas de sens : sans valeur gardée, on efface le filtre.
 */
export function FiltreColonne({ visible, colonne, valeurs, gardees, onAppliquer, onTrier, onFermer }: Props) {
  const [recherche, setRecherche] = useState('');
  /** Les valeurs cochées dans le menu (avant d'appuyer sur OK) ; au départ celles qui sont gardées, ou toutes. */
  const [cochees, setCochees] = useState<string[]>(gardees ?? valeurs);
  const affichees = valeurs.filter((v) =>
    (v || T.vide).toLowerCase().includes(recherche.trim().toLowerCase()),
  );
  const toutCoche = affichees.length > 0 && affichees.every((v) => cochees.includes(v));
  const basculer = (valeur: string) =>
    setCochees((actuelles) =>
      actuelles.includes(valeur) ? actuelles.filter((v) => v !== valeur) : [...actuelles, valeur],
    );
  const basculerTout = () =>
    setCochees((actuelles) =>
      toutCoche
        ? actuelles.filter((v) => !affichees.includes(v))
        : [...new Set([...actuelles, ...affichees])],
    );
  const valider = () => {
    // Tout coché (ou plus rien) : pas de filtre.
    onAppliquer(cochees.length === 0 || valeurs.every((v) => cochees.includes(v)) ? undefined : cochees);
    onFermer();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.titre(colonne)}</Text>
          {onTrier ? (
            <View style={commonStyles.gap6}>
              <Button
                variant="secondary"
                label={T.triCroissant}
                onPress={() => {
                  onTrier(true);
                  onFermer();
                }}
              />
              <Button
                variant="secondary"
                label={T.triDecroissant}
                onPress={() => {
                  onTrier(false);
                  onFermer();
                }}
              />
            </View>
          ) : null}
          <ChampRecherche value={recherche} onChangeText={setRecherche} placeholder={T.rechercher} />
          <Checkbox label={T.tout} value={toutCoche} onChange={basculerTout} />
          {affichees.length === 0 ? (
            <Text style={commonStyles.mutedItalic}>{T.aucun}</Text>
          ) : (
            <FlatList
              style={commonStyles.listeDeFenetre}
              data={affichees}
              keyExtractor={(v) => v || '__vide__'}
              renderItem={({ item }) => (
                <Checkbox
                  label={item || T.vide}
                  value={cochees.includes(item)}
                  onChange={() => basculer(item)}
                />
              )}
            />
          )}
          <View style={commonStyles.row}>
            <Button style={commonStyles.flex1} variant="secondary" label={T.annuler} onPress={onFermer} />
            <Button style={commonStyles.flex1} label={T.ok} onPress={valider} />
          </View>
          {gardees ? (
            <Button
              variant="secondary"
              label={T.effacer}
              onPress={() => {
                onAppliquer(undefined);
                onFermer();
              }}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
