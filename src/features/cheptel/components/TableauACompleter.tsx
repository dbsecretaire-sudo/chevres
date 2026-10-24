import { Pressable, Text } from 'react-native';
import type { Chevre } from '@/features/cheptel/types';
import { libelleACompleter } from '@/features/cheptel/services/aCompleter';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.roles.aCompleter;

/**
 * Ce que le berger a saisi sur le terrain, en tableau (poste de comptabilité) : l'animal (un lien vers sa fiche), ce qui a été saisi, le jour, et « Fait » pour le retirer de la liste.
 * Un clic sur la ligne ouvre la fiche.
 */
export function TableauACompleter({
  animaux,
  ouvrirFiche,
  marquerFait,
}: {
  animaux: readonly Chevre[];
  ouvrirFiche: (id: string) => void;
  marquerFait: (animal: Chevre) => void;
}) {
  const jour = (c: Chevre) => c.dateStatut ?? c.dateNaissance;
  const colonnes: readonly ColonneDuTableau<Chevre>[] = [
    {
      cle: 'animal',
      titre: 'Animal',
      poids: 2,
      valeur: (c) => c.numeroBoucle?.trim() || c.nom || T.sansBoucle,
      rendu: (c) => (
        <Pressable onPress={() => ouvrirFiche(c.id)} accessibilityRole="link">
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primaryDark, textDecorationLine: 'underline' }} numberOfLines={2}>
            {c.numeroBoucle?.trim() || c.nom || T.sansBoucle}
          </Text>
        </Pressable>
      ),
    },
    { cle: 'saisie', titre: 'Saisie du berger', poids: 2.2, valeur: (c) => libelleACompleter(c) },
    { cle: 'jour', titre: 'Jour', poids: 1.2, valeur: jour, texte: (c) => formatDateFR(jour(c)) },
    {
      cle: 'fait',
      titre: 'Complété',
      poids: 1,
      aligne: 'centre',
      triable: false,
      valeur: () => '',
      rendu: (c) => (
        <Pressable onPress={() => marquerFait(c)} accessibilityRole="button">
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>{T.fait}</Text>
        </Pressable>
      ),
    },
  ];
  return (
    <TableauDeDonnees
      colonnes={colonnes}
      lignes={animaux}
      cleDeLaLigne={(c) => c.id}
      tri={{ cle: 'jour', decroissant: true }}
      vide={T.rien}
      onLigne={(c) => ouvrirFiche(c.id)}
    />
  );
}
