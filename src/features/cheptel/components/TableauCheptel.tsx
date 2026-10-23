import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Chevre } from '@/features/cheptel/types';
import { statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { LABEL_SEXE } from '@/shared/textes/libelles';
import { formatDateFR } from '@/shared/utils/dates';

const COLONNES: readonly ColonneDuTableau<Chevre>[] = [
  { cle: 'boucle', titre: 'Boucle', poids: 1.6, valeur: (a) => a.numeroBoucle ?? '' },
  { cle: 'nom', titre: 'Nom', poids: 1.4, valeur: (a) => a.nom ?? '' },
  { cle: 'sexe', titre: 'Sexe', poids: 0.9, valeur: (a) => LABEL_SEXE[a.sexe] },
  { cle: 'naissance', titre: 'Naissance', poids: 1.3, valeur: (a) => a.dateNaissance, texte: (a) => formatDateFR(a.dateNaissance) },
  { cle: 'mere', titre: 'Mère', poids: 1.6, valeur: (a) => a.mereNumeroBoucle ?? '' },
  {
    cle: 'statut',
    titre: 'Statut',
    poids: 2,
    valeur: (a) => statutLabel(a.statut, a.sexe),
    // Un animal sorti dit aussi la date de sa sortie.
    texte: (a) =>
      a.statut !== STATUT_CHEVRE.VIVANTE && a.dateStatut
        ? `${statutLabel(a.statut, a.sexe)} · ${formatDateFR(a.dateStatut)}`
        : statutLabel(a.statut, a.sexe),
  },
  { cle: 'poids', titre: 'Poids', poids: 0.9, aligne: 'droite', valeur: (a) => a.poidsKg, texte: (a) => (a.poidsKg ? String(a.poidsKg) : '') },
  { cle: 'notes', titre: 'Notes', poids: 1.2, valeur: (a) => a.notes ?? '' },
];

/**
 * Les animaux du cheptel en tableau (affichage sobre sur un grand écran) : une ligne par animal, avec sa boucle, son nom, sa naissance, ses parents, son statut et son
 * poids ; on trie d'un clic sur un titre, et un clic ouvre la fiche. Le nombre d'animaux affichés est sous le tableau.
 */
export function TableauCheptel({ animaux }: { animaux: readonly Chevre[] }) {
  const router = useRouter();
  return (
    <View style={styles.cadre}>
      <TableauDeDonnees
        colonnes={COLONNES}
        lignes={animaux}
        cleDeLaLigne={(a) => a.id}
        tri={{ cle: 'boucle' }}
        vide={TEXTES.cheptel.listeCheptel.aucunAnimalNeCorrespondAux}
        onLigne={(a) => {
          noterOrigine(ROUTES.lieu('animaux'), ROUTES.ficheChevre(a.id));
          router.push(ROUTES.ficheChevre(a.id) as never);
        }}
        pied={<Text style={styles.total}>{animaux.length} animal{animaux.length > 1 ? 'aux' : ''}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: { flex: 1, padding: 8 },
  total: { fontSize: 14, fontWeight: '800', color: colors.text },
});
