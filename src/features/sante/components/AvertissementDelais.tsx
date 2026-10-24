import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import type { Chevre } from '@/features/cheptel/types';
import { listTousTraitements } from '@/features/sante/repository/traitements';
import {
  animauxEnDelai,
  finLaPlusTardive,
  type AnimalEnDelai,
  type TypeDelai,
} from '@/features/sante/services/delaisAttente';
import type { Traitement } from '@/features/sante/types';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { estDateISO, formatDateFR, todayISO } from '@/shared/utils/dates';

const A = TEXTES.cheptel.traitements.avertissement;

/** Les animaux de moins d'un an à une date : les petits (cabris, chevrettes), que la vente de cabris concerne. */
const estPetitA = (a: Pick<Chevre, 'dateNaissance'>, date: string): boolean => {
  const anniversaire = new Date(`${a.dateNaissance}T00:00:00Z`);
  anniversaire.setUTCFullYear(anniversaire.getUTCFullYear() + 1);
  return anniversaire.toISOString().slice(0, 10) > date;
};

interface Props {
  type: TypeDelai;
  /** Le jour de la vente (ou de l'abattage) : le délai se juge ce jour-là ; à défaut, aujourd'hui. */
  date?: string;
  /** Les n° de boucle des animaux de la vente : seuls ceux-là comptent. Absent : tout le troupeau. */
  boucles?: string[];
  /** Seuls les petits (moins d'un an) comptent : la vente de cabris, sans animal désigné. */
  petitsSeulement?: boolean;
}

/**
 * L'avertissement d'une vente (ou d'un abattage) : des animaux sont en délai d'attente ce jour-là. Pour le lait, les femelles traitées
 * dont le lait ne doit pas être livré ; pour la viande, les animaux concernés qu'on ne doit ni vendre ni abattre. Rien quand aucun délai
 * ne court : le composant ne s'affiche pas.
 */
export function AvertissementDelais({ type, date, boucles, petitsSeulement }: Props) {
  const router = useRouter();
  const { espece } = useEtablissement();
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  const [traitements, setTraitements] = useState<Traitement[]>([]);

  useEffect(() => {
    Promise.all([listChevresVivantes(), listTousTraitements()])
      .then(([a, t]) => {
        setAnimaux(a);
        setTraitements(t);
      })
      .catch(() => undefined);
  }, [espece]);

  const jour = date && estDateISO(date) ? date : todayISO();
  let enDelai: AnimalEnDelai[] = animauxEnDelai(animaux, traitements, jour, type);
  if (boucles) enDelai = enDelai.filter((a) => a.animal.numeroBoucle && boucles.includes(a.animal.numeroBoucle));
  if (petitsSeulement) enDelai = enDelai.filter((a) => estPetitA(a.animal, jour));
  const fin = finLaPlusTardive(enDelai);
  if (!fin || enDelai.length === 0) return null;

  const texte =
    type === 'lait'
      ? A.lait(enDelai.length, formatDateFR(fin))
      : A.viande(
          enDelai
            .slice(0, 8)
            .map((a) => a.animal.numeroBoucle ?? a.animal.nom ?? '?')
            .join(', ') + (enDelai.length > 8 ? '…' : ''),
          formatDateFR(fin),
        );

  return (
    <Card style={StyleSheet.flatten([commonStyles.gap8, { backgroundColor: colors.dangerFond, borderColor: colors.danger }])}>
      <Text style={[commonStyles.cardTitle, { color: colors.danger }]}>{A.titre}</Text>
      <Text style={commonStyles.line}>{texte}</Text>
      <Pressable onPress={() => router.push(ROUTES.CHEPTEL_TRAITEMENTS as never)} hitSlop={8}>
        <Text style={commonStyles.lien}>{A.voir}</Text>
      </Pressable>
    </Card>
  );
}
