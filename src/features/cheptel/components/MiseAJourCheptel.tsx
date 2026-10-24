import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { SelectModalMultiple } from '@/shared/components/SelectModalMultiple';
import { listTousLesAnimauxDeLEspece, reactiverChevre } from '@/features/cheptel/repository/chevres';
import { animauxSansVente } from '@/features/cheptel/services/miseAJourCheptel';
import { libelleChevreAvecDate, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.cheptel.miseAJour;

/**
 * Cheptel › Réglages › Mettre à jour le cheptel : remet vivants dans le cheptel des animaux « vendus » ou « à l'abattoir » que plus aucune
 * vente ne porte (une facture supprimée). On choisit dans la liste ceux à remettre : rien n'est coché d'office.
 */
export function MiseAJourCheptel() {
  const [candidats, setCandidats] = useState<Chevre[] | null>(null);
  const [resultat, setResultat] = useState<string | null>(null);

  const chercher = async () => {
    const [animaux, ventes] = await Promise.all([listTousLesAnimauxDeLEspece(), listToutesVentes()]);
    setResultat(null);
    const liste = animauxSansVente(animaux, ventes);
    if (liste.length === 0) return setResultat(T.aucun);
    setCandidats(liste);
  };

  return (
    <Card style={commonStyles.gap8}>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      <Button variant="secondary" label={T.bouton} onPress={() => chercher().catch(() => undefined)} />
      {resultat ? <Text style={commonStyles.mutedItalic}>{resultat}</Text> : null}
      <SelectModalMultiple<string>
        key={candidats ? 'ouverte' : 'fermee'}
        visible={!!candidats}
        titre={T.choisir}
        options={(candidats ?? []).map((a) => ({
          value: a.id,
          label: `${libelleChevreAvecDate(a)} · ${statutLabel(a.statut, a.sexe, !!a.enlevementId)}${a.dateStatut ? ` le ${formatDateFR(a.dateStatut)}` : ''}`,
        }))}
        libelleValider={T.remettre}
        onValider={async (ids) => {
          for (const id of ids) await reactiverChevre(id);
          setResultat(T.remis(ids.length));
          setCandidats(null);
        }}
        onClose={() => setCandidats(null)}
      />
    </Card>
  );
}
