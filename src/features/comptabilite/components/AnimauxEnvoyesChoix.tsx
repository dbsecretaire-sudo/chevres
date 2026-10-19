import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { AncreVisite } from '@/features/didacticiel/components/AncreVisite';
import { FiltresExclusifs } from '@/shared/components/FiltresExclusifs';
import { SelectModalMultiple } from '@/shared/components/SelectModalMultiple';
import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import { libelleChevreAvecDate } from '@/features/cheptel/utils/chevreLabel';
import { estTiptag } from '@/features/cheptel/utils/tiptag';
import type { Chevre } from '@/features/cheptel/types';
import { useTiptags } from '@/features/stock/hooks/useTiptags';
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
 * leur fiche passe à « abattoir » (leur sortie, comme dans l'inventaire) ; le document de circulation se génère depuis la dépense. La liste
 * est celle des tiptag (destinés à l'abattoir, proposés d'abord) ou celle des boucles, au choix ; les animaux déjà choisis dans l'autre restent.
 */
export function AnimauxEnvoyesChoix({ valeur, onChange }: Props) {
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [sorte, setSorte] = useState<string>(T.tiptag);
  const tiptags = useTiptags();
  useEffect(() => {
    listTousLesAnimauxDeLEspece()
      .then((tous) => setAnimaux(tous.filter((a) => a.statut === STATUT_CHEVRE.VIVANTE)))
      .catch(() => undefined);
  }, []);
  const options = useMemo(
    () =>
      animaux
        .map((a) => ({ value: a.id, label: libelleChevreAvecDate(a), tiptag: estTiptag(a, tiptags) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr', { numeric: true })),
    [animaux, tiptags],
  );
  const choisis = options.filter((o) => valeur.includes(o.value));
  /** La liste montrée : les tiptag, ou les autres boucles. */
  const visibles = options.filter((o) => o.tiptag === (sorte === T.tiptag));

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
      <Text style={commonStyles.labelMuted}>{T.parmi}</Text>
      <FiltresExclusifs choix={[T.tiptag, T.boucles]} valeur={sorte} onChoisir={(v) => v && setSorte(v)} />
      <AncreVisite id="ecriture.animauxEnvoyes">
        <Button variant="secondary" label={valeur.length > 0 ? T.modifier : T.choisir} onPress={() => setOuvert(true)} />
      </AncreVisite>
      <SelectModalMultiple
        key={`${sorte}:${valeur.join(',')}`}
        visible={ouvert}
        titre={`${T.titre} — ${sorte}`}
        options={visibles}
        initiales={valeur.filter((id) => visibles.some((o) => o.value === id))}
        libelleValider={T.valider}
        onValider={(ids) => {
          // Les animaux choisis dans l'autre liste restent choisis.
          onChange([...valeur.filter((id) => !visibles.some((o) => o.value === id)), ...ids]);
          setOuvert(false);
        }}
        onClose={() => setOuvert(false)}
      />
    </View>
  );
}
