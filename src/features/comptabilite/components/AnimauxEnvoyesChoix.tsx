import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { SelectModalMultiple } from '@/shared/components/SelectModalMultiple';
import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import { libelleChevreAvecDate } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.animauxEnvoyes;

interface Props {
  /** Les identifiants des animaux choisis. */
  valeur: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Les animaux qui partent avec une dépense « Animaux vivants (vente) » : choisis parmi les animaux vivants du cheptel. À l'enregistrement,
 * leur fiche passe à « abattoir » (leur sortie, comme dans l'inventaire) ; le document de circulation se génère depuis la dépense.
 */
export function AnimauxEnvoyesChoix({ valeur, onChange }: Props) {
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => {
    listTousLesAnimauxDeLEspece()
      .then((tous) => setAnimaux(tous.filter((a) => a.statut === STATUT_CHEVRE.VIVANTE)))
      .catch(() => undefined);
  }, []);
  const options = useMemo(
    () =>
      animaux
        .map((a) => ({ value: a.id, label: libelleChevreAvecDate(a) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr', { numeric: true })),
    [animaux],
  );
  const choisis = options.filter((o) => valeur.includes(o.value));

  return (
    <View style={commonStyles.gap8}>
      <Text style={commonStyles.lineSemiBold}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      {choisis.length > 0 ? <Text style={commonStyles.line}>{T.nAnimaux(choisis.length)}</Text> : null}
      {choisis.map((o) => (
        <Text key={o.value} style={commonStyles.note}>
          {o.label}
        </Text>
      ))}
      <Button variant="secondary" label={valeur.length > 0 ? T.modifier : T.choisir} onPress={() => setOuvert(true)} />
      <SelectModalMultiple
        key={valeur.join(',')}
        visible={ouvert}
        titre={T.titre}
        options={options}
        initiales={valeur}
        libelleValider={T.valider}
        onValider={(ids) => {
          onChange(ids);
          setOuvert(false);
        }}
        onClose={() => setOuvert(false)}
      />
    </View>
  );
}
