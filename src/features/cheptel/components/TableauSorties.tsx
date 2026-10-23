import { Pressable, Text } from 'react-native';
import type { Chevre } from '@/features/cheptel/types';
import { detailDeLAnimal, libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { colors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';

/**
 * Les sorties du cheptel en tableau (poste de comptabilité) : l'animal (son nom est un lien vers sa fiche), sa boucle, sa date de naissance, comment il est sorti (vendu, mort, abattoir…)
 * et à quelle date. On classe d'un clic sur un titre, à la place du choix « Trier par ». Un clic sur la ligne ouvre la fiche.
 */
export function TableauSorties({ animaux, ouvrirFiche, vide }: { animaux: readonly Chevre[]; ouvrirFiche: (id: string) => void; vide: string }) {
  const colonnes: readonly ColonneDuTableau<Chevre>[] = [
    {
      cle: 'animal',
      titre: 'Animal',
      poids: 2.2,
      valeur: (c) => libelleChevre(c),
      rendu: (c) => (
        <Pressable onPress={() => ouvrirFiche(c.id)} accessibilityRole="link">
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primaryDark, textDecorationLine: 'underline' }} numberOfLines={2}>
            {libelleChevre(c)}
          </Text>
        </Pressable>
      ),
    },
    { cle: 'boucle', titre: 'N° de boucle', poids: 1.3, valeur: (c) => c.numeroBoucle ?? '' },
    { cle: 'detail', titre: 'Détail', poids: 2, valeur: (c) => detailDeLAnimal(c) },
    { cle: 'naissance', titre: 'Naissance', poids: 1.2, valeur: (c) => c.dateNaissance, texte: (c) => (c.dateNaissance ? formatDateFR(c.dateNaissance) : '') },
    { cle: 'sortie', titre: 'Sortie', poids: 1.4, valeur: (c) => statutLabel(c.statut, c.sexe) },
    { cle: 'dateSortie', titre: 'Date de sortie', poids: 1.2, valeur: (c) => c.dateStatut ?? '', texte: (c) => (c.dateStatut ? formatDateFR(c.dateStatut) : '') },
  ];
  return <TableauDeDonnees colonnes={colonnes} lignes={animaux} cleDeLaLigne={(c) => c.id} tri={{ cle: 'dateSortie', decroissant: true }} vide={vide} onLigne={(c) => ouvrirFiche(c.id)} />;
}
