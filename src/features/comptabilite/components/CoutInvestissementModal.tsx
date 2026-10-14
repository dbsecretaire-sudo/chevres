import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { INVESTISSEMENT } from '@/shared/constants/economies';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { ReglageInvestissement } from '@/features/settings/settings';
import { formatMontant } from '@/shared/utils/dates';
import { parseMontant } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.rentabilite.plan.investissements;

interface Props {
  visible: boolean;
  investissement: ValeurDe<typeof INVESTISSEMENT> | null;
  /** Ce qui est déjà indiqué (coût et prix). */
  reglage: ReglageInvestissement;
  /** Reçoit ce qui est saisi ; sans rien (« undefined »), l'investissement revient aux hypothèses de départ. */
  onValider: (reglage: ReglageInvestissement | undefined) => void;
  onFermer: () => void;
}

/** Un montant saisi, ou rien quand le champ est vide ; invalide (« NaN ») quand il n'est pas un montant positif. */
function montantSaisi(texte: string): number | undefined {
  if (!texte.trim()) return undefined;
  const montant = parseMontant(texte);
  return montant > 0 ? montant : Number.NaN;
}

/**
 * Le coût d'un investissement du plan d'économies (pour son remboursement) et les deux prix d'après devis — la tonne de grain en sacs et
 * en vrac, le litre de gazole à la pompe et en cuve : l'écart remplace l'hypothèse de départ.
 */
export function CoutInvestissementModal({ visible, investissement, reglage, onValider, onFermer }: Props) {
  const silo = investissement === INVESTISSEMENT.SILO;
  const textes = silo ? T.silo : T.cuve;
  const [cout, setCout] = useState('');
  const [prixActuel, setPrixActuel] = useState('');
  const [prixAvec, setPrixAvec] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      const texte = (valeur?: number) => (valeur ? formatMontant(valeur) : '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCout(texte(reglage.cout));
      setPrixActuel(texte(reglage.prixActuel));
      setPrixAvec(texte(reglage.prixAvecInvestissement));
      setErreur(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const valider = () => {
    const valeurs = [montantSaisi(cout), montantSaisi(prixActuel), montantSaisi(prixAvec)];
    if (valeurs.some((v) => v !== undefined && Number.isNaN(v))) return setErreur(T.montantInvalide);
    const [coutSaisi, actuel, avec] = valeurs;
    if ((actuel === undefined) !== (avec === undefined)) return setErreur(T.deuxPrix);
    if (actuel !== undefined && avec !== undefined && avec >= actuel) return setErreur(T.prixIncoherents);
    const saisie: ReglageInvestissement = {
      cout: coutSaisi,
      prixActuel: actuel,
      prixAvecInvestissement: avec,
    };
    onValider(coutSaisi === undefined && actuel === undefined ? undefined : saisie);
  };

  const champ = (label: string, valeur: string, changer: (v: string) => void) => (
    <FormField
      label={label}
      value={valeur}
      onChangeText={changer}
      onBlur={() => parseMontant(valeur) > 0 && changer(formatMontant(parseMontant(valeur)))}
      keyboardType="decimal-pad"
      placeholder="0,00"
    />
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{textes.titre}</Text>
          {champ(T.coutLabel, cout, setCout)}
          {champ(textes.prixActuel, prixActuel, setPrixActuel)}
          {champ(textes.prixAvecInvestissement, prixAvec, setPrixAvec)}
          <Text style={commonStyles.note}>{T.coutAide}</Text>
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
          {reglage.cout || reglage.prixActuel ? (
            <Button variant="secondary" label={T.hypotheses} onPress={() => onValider(undefined)} />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
