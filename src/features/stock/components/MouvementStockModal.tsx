import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { formatMontant } from '@/shared/utils/dates';
import { parseDecimal, parseMontant } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** L'article dont on change le stock ; la fenêtre est fermée quand il est absent. */
  article: { cle: string; libelle: string } | null;
  /** Demande aussi les litres de lait utilisés quand on ajoute des fromages fabriqués. */
  avecLitres?: boolean;
  /** Le nom du champ des litres quand il diffère (brocciu : le lait versé dans le lactosérum). */
  libelleLitres?: string;
  /** Le prix de vente actuel de l'article, quand il en a un (une boisson du bar) : un champ permet de le modifier ici. */
  prixVente?: number;
  /** Reçoit la variation (positive pour un ajout, négative pour un retrait, nulle si seul le prix change), les litres de lait éventuels et le prix de vente saisi. */
  onValider: (cle: string, delta: number, litres?: number, prix?: number) => void;
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
  prixVente,
  onValider,
  onSupprimer,
  onFermer,
}: Props) {
  const [quantite, setQuantite] = useState('');
  const [litres, setLitres] = useState('');
  const [prix, setPrix] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart sans quantité.
    if (article) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantite('');
      setLitres('');
      setPrix(prixVente === undefined ? '' : formatMontant(prixVente));
      setErreur(null);
    }
    // Seule l'ouverture remet le formulaire à zéro, pas un changement du prix en arrière-plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article]);

  /** La quantité saisie avec son signe : positive pour un ajout, négative pour un retrait (le « − » typographique est accepté). */
  const nombre = Math.round(parseDecimal(quantite.replace('−', '-')));

  const valider = () => {
    if (!article) return;
    const prixSaisi = prixVente === undefined ? undefined : parseMontant(prix);
    if (prixSaisi !== undefined && !(prixSaisi > 0)) return setErreur(T.prixInvalide);
    const prixChange = prixSaisi !== undefined && prixSaisi !== prixVente;
    // Sans quantité, il faut au moins un nouveau prix à enregistrer.
    if (nombre === 0 && !prixChange)
      return setErreur(prixSaisi === undefined ? T.quantiteInvalide : T.quantiteOuPrix);
    const litresUtilises = litres.trim() ? parseDecimal(litres) : undefined;
    onValider(
      article.cle,
      nombre,
      nombre > 0 && litresUtilises && litresUtilises > 0 ? litresUtilises : undefined,
      prixChange ? prixSaisi : undefined,
    );
  };

  return (
    <Modal visible={!!article} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.titre(article?.libelle ?? '')}</Text>
          <FormField
            label={T.quantite}
            required={prixVente === undefined}
            value={quantite}
            onChangeText={(texte) => {
              setQuantite(texte);
              setErreur(null);
            }}
            keyboardType={CLAVIER_QUANTITE}
            placeholder="0"
          />
          <Text style={commonStyles.note}>{T.aide}</Text>
          {avecLitres && nombre > 0 ? (
            <FormField
              label={libelleLitres ?? T.litres}
              value={litres}
              onChangeText={setLitres}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          ) : null}
          {prixVente === undefined ? null : (
            <FormField
              label={T.prixVente}
              value={prix}
              onChangeText={(texte) => {
                setPrix(texte);
                setErreur(null);
              }}
              // Une fois saisi, le prix s'affiche en monnaie (2,00 €).
              onBlur={() => parseMontant(prix) > 0 && setPrix(formatMontant(parseMontant(prix)))}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          )}
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
