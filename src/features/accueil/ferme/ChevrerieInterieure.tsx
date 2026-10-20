import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Balade } from '@/features/accueil/ferme/animations';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { dessinDeLEspece } from '@/features/accueil/ferme/EnclosFerme';
import { fondDeLAnimal } from '@/features/accueil/services/fondDeLAnimal';
import { categorieAccueil } from '@/features/accueil/services/statsAccueil';
import { FiltresCheptel } from '@/features/cheptel/components/FiltresCheptel';
import { LigneChevre } from '@/features/cheptel/components/LigneChevre';
import { useListeCheptel } from '@/features/cheptel/hooks/useListeCheptel';
import type { Chevre } from '@/features/cheptel/types';
import { EmptyState } from '@/shared/components/EmptyState';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.chevrerie;

/** La tête dessinée d'une chèvre (le trait fin) : elle remplace l'emoji devant chaque chèvre de la liste. */
const TETE_DE_CHEVRE = require('../../../../assets/images/tete-chevre.png');

interface Props {
  /** Les animaux qui représentent le troupeau (jusqu'à quatre) : ils se tiennent sur le rebord du mur. */
  vedettes: readonly Chevre[];
  onSortir: () => void;
  /** Les boutons de ce qui se passe chez soi (alimentation, lots, traitements, boucles, estive, documents) et ce que fait un appui sur l'un d'eux. */
  boutons: readonly EntreeDeColonne[];
  onAppuiBouton: (cle: string, ancre: AncreBouton) => void;
}

/**
 * L'intérieur de la chèvrerie : un autre décor, le mur de bois et la paille. Sur le mur, les boutons de ce qui se passe chez soi, et sur son
 * rebord, les chèvres qui se promènent. Sur la paille, la liste des animaux du cheptel, avec sa recherche et ses filtres : chaque ligne ouvre
 * la fiche de l'animal.
 */
export function ChevrerieInterieure({ vedettes, onSortir, boutons, onAppuiBouton }: Props) {
  const router = useRouter();
  const liste = useListeCheptel();
  const dessin = dessinDeLEspece();
  const tetes = especeCourante() === TYPE_ANIMAL_ETABLISSEMENT.CHEVRES;
  const visibles = liste.filtrees;
  return (
    <View style={styles.fond}>
      <View style={styles.mur}>
        <View style={styles.tete}>
          <Pressable
            style={styles.sortir}
            onPress={onSortir}
            accessibilityRole="button"
            accessibilityLabel={T.sortir}
          >
            <Text style={styles.sortirEmoji}>🚪</Text>
            <Text style={styles.sortirTexte}>{T.sortir}</Text>
          </Pressable>
          <Text style={styles.titre}>{T.titre}</Text>
        </View>

        {/* Ce qui se passe chez soi : l'alimentation, les lots, les traitements, les boucles, l'estive, les documents. */}
        <View style={styles.boutons}>
          <ColonneFerme entrees={boutons} onAppui={onAppuiBouton} grille compacte />
        </View>

        {/* Les chèvres sur le rebord du mur, qui se promènent. */}
        <View style={styles.rebord}>
          {vedettes.map((a, i) => (
            <Balade key={a.id} amplitude={10} duree={2200 + i * 450}>
              <Text style={styles.chevre} accessibilityElementsHidden importantForAccessibility="no">
                🐐
              </Text>
            </Balade>
          ))}
        </View>
      </View>

      <View style={styles.sol}>
        <FiltresCheptel e={liste} />
        {visibles.length === 0 ? (
          <EmptyState
            title={liste.titreListeVide}
            subtitle={TEXTES.cheptel.listeCheptel.aucunAnimalNeCorrespondAux}
          />
        ) : (
          // Un seul bloc : les lignes se touchent, séparées par un fin trait (l'écart de la paille ne s'applique qu'entre blocs).
          <View>
            {visibles.map((chevre, index) => (
              <LigneDeBloc key={chevre.id} index={index} total={visibles.length}>
                <LigneChevre
                  chevre={chevre}
                  emoji={dessin}
                  image={tetes ? TETE_DE_CHEVRE : undefined}
                  fond={fondDeLAnimal(categorieAccueil(chevre))}
                  onPress={() => router.push(ROUTES.ficheChevre(chevre.id) as never)}
                />
              </LigneDeBloc>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: '#E9D8A6' },
  mur: {
    backgroundColor: '#B98A5B',
    paddingTop: 10,
    paddingHorizontal: 8,
    gap: 10,
    borderBottomWidth: 8,
    borderBottomColor: '#8A6238',
  },
  tete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#8A6238',
  },
  sortirEmoji: { fontSize: 20 },
  sortirTexte: { fontSize: 13, fontWeight: '700', color: colors.text },
  titre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.blanc,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 3,
    textAlign: 'right',
    flexShrink: 1,
  },
  boutons: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 6 },
  rebord: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    minHeight: 56,
    marginBottom: -4,
  },
  chevre: { fontSize: 44 },
  sol: { padding: 8, gap: 8 },
});
