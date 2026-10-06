import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { SENS_STOCK } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Sens = ValeurDe<typeof SENS_STOCK>;

interface Props {
  /** L'article dont on change le stock ; la fenêtre est fermée quand il est absent. */
  article: { cle: string; libelle: string } | null;
  /** Demande aussi les litres de lait utilisés quand on ajoute des fromages fabriqués. */
  avecLitres?: boolean;
  /** Le nom du champ des litres quand il diffère (brocciu : le lait versé dans le lactosérum). */
  libelleLitres?: string;
  /** Reçoit la variation (positive pour un ajout, négative pour un retrait) et les litres de lait éventuels. */
  onValider: (cle: string, delta: number, litres?: number) => void;
  /** Quand il est donné, un bouton permet de supprimer l'article (un article ajouté par l'utilisateur). */
  onSupprimer?: () => void;
  onFermer: () => void;
}

const T = TEXTES.stock.modal;
const PUCES: { valeur: Sens; label: string }[] = [
  { valeur: SENS_STOCK.AJOUT, label: T.ajout },
  { valeur: SENS_STOCK.RETRAIT, label: T.retrait },
];

/** Petite fenêtre pour ajouter ou retirer des unités d'un article du stock (fabriqué, acheté, cassé…). */
export function MouvementStockModal({
  article,
  avecLitres,
  libelleLitres,
  onValider,
  onSupprimer,
  onFermer,
}: Props) {
  const [sens, setSens] = useState<Sens>(SENS_STOCK.AJOUT);
  const [quantite, setQuantite] = useState('');
  const [litres, setLitres] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart d'un ajout, sans quantité.
    if (article) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSens(SENS_STOCK.AJOUT);
      setQuantite('');
      setLitres('');
      setErreur(null);
    }
  }, [article]);

  const valider = () => {
    const nombre = Math.round(parseDecimal(quantite));
    if (!article) return;
    if (nombre < 1) return setErreur(T.quantiteInvalide);
    const litresUtilises = litres.trim() ? parseDecimal(litres) : undefined;
    onValider(
      article.cle,
      sens === SENS_STOCK.AJOUT ? nombre : -nombre,
      sens === SENS_STOCK.AJOUT && litresUtilises && litresUtilises > 0 ? litresUtilises : undefined,
    );
  };

  return (
    <Modal visible={!!article} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.titre(article?.libelle ?? '')}</Text>
          <PucesDefilantes<Sens> puces={PUCES} valeur={sens} onChoisir={setSens} />
          <FormField
            label={T.quantite}
            required
            value={quantite}
            onChangeText={(texte) => {
              setQuantite(texte);
              setErreur(null);
            }}
            keyboardType="number-pad"
            placeholder="0"
          />
          {avecLitres && sens === SENS_STOCK.AJOUT ? (
            <FormField
              label={libelleLitres ?? T.litres}
              value={litres}
              onChangeText={setLitres}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          ) : null}
          {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
          <Text style={commonStyles.note}>{T.aide}</Text>
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
