import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** L'article dont on change le stock ; la fenêtre est fermée quand il est absent. */
  article: { cle: string; libelle: string } | null;
  /** Demande aussi les litres de lait utilisés quand on ajoute des fromages fabriqués. */
  avecLitres?: boolean;
  /** Le nom du champ des litres quand il diffère (brocciu : le lait versé dans le lactosérum). */
  libelleLitres?: string;
  /** Les litres de lait qu'il faut pour un fromage (indiqués dans l'inventaire) : le lait utilisé s'en déduit, le champ n'est plus demandé. */
  litresParFromage?: number;
  /** Le stock se consomme (aliment, emballage, entretien) : un bouton le remet à zéro, et un retrait est une consommation. */
  consommable?: boolean;
  /** Ce qu'il reste de l'article (pour le remettre à zéro). */
  niveau?: number;
  /** L'unité de la quantité (kg pour un aliment), rappelée dans le libellé du champ. */
  unite?: string;
  /** Reçoit la variation (positive pour un ajout, négative pour un retrait) et les litres de lait éventuels. */
  onValider: (cle: string, delta: number, litres?: number) => void;
  /** Quand il est donné, un bouton permet de supprimer l'article (un article ajouté par l'utilisateur). */
  onSupprimer?: () => void;
  onFermer: () => void;
}

const T = TEXTES.stock.modal;

/** Un clavier qui propose le signe « − » : la quantité se saisit avec son signe (+1 pour un ajout, −1 pour un retrait). */
const CLAVIER_QUANTITE = Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';

/** Petite fenêtre pour ajouter ou retirer des unités d'un article du stock (fabriqué, acheté, cassé…). */
export function MouvementStockModal({
  article,
  avecLitres,
  libelleLitres,
  litresParFromage,
  unite,
  consommable,
  niveau,
  onValider,
  onSupprimer,
  onFermer,
}: Props) {
  const [quantite, setQuantite] = useState('');
  const [litres, setLitres] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart sans quantité.
    if (article) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantite('');
      setLitres('');
      setErreur(null);
    }
  }, [article]);

  /** La quantité saisie avec son signe : positive pour un ajout, négative pour un retrait (le « − » typographique est accepté). */
  const nombre = Math.round(parseDecimal(quantite.replace('−', '-')));

  const valider = () => {
    if (!article) return;
    if (nombre === 0) return setErreur(T.quantiteInvalide);
    const litresUtilises = litresParFromage
      ? Math.round(nombre * litresParFromage * 100) / 100
      : litres.trim()
        ? parseDecimal(litres)
        : undefined;
    // Des fromages ajoutés : le lait utilisé est une entrée de l'inventaire, il est requis.
    if (avecLitres && nombre > 0 && !(litresUtilises && litresUtilises > 0)) return setErreur(T.litresRequis);
    onValider(
      article.cle,
      nombre,
      nombre > 0 && litresUtilises && litresUtilises > 0 ? litresUtilises : undefined,
    );
  };

  return (
    <Modal visible={!!article} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.titre(article?.libelle ?? '')}</Text>
          <FormField
            label={unite ? `${T.quantite} (${unite})` : T.quantite}
            required
            value={quantite}
            onChangeText={(texte) => {
              setQuantite(texte);
              setErreur(null);
            }}
            keyboardType={CLAVIER_QUANTITE}
            placeholder="0"
          />
          <Text style={commonStyles.note}>{consommable ? T.aideConsommable : T.aide}</Text>
          {consommable && article && niveau && niveau > 0 ? (
            <Button
              variant="secondary"
              label={T.toutConsomme}
              onPress={() => onValider(article.cle, -niveau)}
            />
          ) : null}
          {avecLitres && litresParFromage && nombre > 0 ? (
            <Text style={commonStyles.note}>
              {T.laitUtilise(
                nombre,
                String(litresParFromage).replace('.', ','),
                String(Math.round(nombre * litresParFromage * 100) / 100).replace('.', ','),
              )}
            </Text>
          ) : null}
          {avecLitres && !litresParFromage && nombre >= 0 ? (
            <FormField
              label={libelleLitres ?? T.litres}
              required={nombre > 0}
              value={litres}
              onChangeText={setLitres}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          ) : null}
          {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onFermer}
            />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={valider} />
          </View>
          {onSupprimer ? <Button variant="danger" label={T.supprimer} onPress={onSupprimer} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
