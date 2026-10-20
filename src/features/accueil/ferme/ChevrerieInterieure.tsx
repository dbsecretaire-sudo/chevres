import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Balade } from '@/features/accueil/ferme/animations';
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
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** La tête dessinée d'une chèvre (le trait fin) : elle remplace l'emoji devant chaque chèvre de la liste. */
const TETE_DE_CHEVRE = require('../../../../assets/images/tete-chevre.png');

interface Props {
  /** Les animaux qui représentent le troupeau (jusqu'à quatre) : ils se tiennent sur le rebord du mur. */
  vedettes: readonly Chevre[];
}

/**
 * L'intérieur de la chèvrerie : un autre décor, le mur et la paille. Sur le rebord du mur, les chèvres se promènent. Les boutons de ce qui se
 * passe chez soi sont dans le panneau du bas (`PanneauInterieur`), sous le pouce. Sur la paille, la liste des animaux du cheptel, avec sa recherche et ses filtres : chaque ligne ouvre
 * la fiche de l'animal.
 */
export function ChevrerieInterieure({ vedettes }: Props) {
  const router = useRouter();
  const liste = useListeCheptel();
  const dessin = dessinDeLEspece();
  const tetes = especeCourante() === TYPE_ANIMAL_ETABLISSEMENT.CHEVRES;
  const visibles = liste.filtrees;
  return (
    <View style={styles.fond}>
      <View style={styles.mur}>
        {/* Les chèvres sur le rebord du mur, qui se promènent. */}
        <View style={styles.rebord}>
          {vedettes.map((a, i) => (
            <Balade key={a.id} amplitude={10} duree={2200 + i * 450}>
              <Text style={styles.chevre} accessibilityElementsHidden importantForAccessibility="no">
                {dessin}
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
                  onPress={() => {
                    noterOrigine(ROUTES.retourAccueil('exploitation'), ROUTES.ficheChevre(chevre.id));
                    router.push(ROUTES.ficheChevre(chevre.id) as never);
                  }}
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
  // Pas de flex: 1 : dans un conteneur à hauteur libre (le défilement), il s'écraserait à zéro sur mobile ; flexGrow suit le contenu et remplit le reste.
  fond: { flexGrow: 1, backgroundColor: '#E9D8A6' },
  mur: {
    // Un fond clair (un pré) : les chèvres brunes du rebord s'y voient bien, y compris sur un petit écran.
    backgroundColor: '#D6E8C6',
    paddingTop: 10,
    paddingHorizontal: 8,
    gap: 10,
    borderBottomWidth: 8,
    borderBottomColor: '#8A6238',
  },
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
  titre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F4A1E',
    textAlign: 'right',
    flexShrink: 1,
  },
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
