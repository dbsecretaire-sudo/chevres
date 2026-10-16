import { Pressable, Text, View } from 'react-native';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/components/ColonnesVerticales.styles';

export interface ColonneGraphique {
  cle: string;
  libelle: string;
  valeur: number;
  /** Le montant écrit sous le nom, et une ligne en plus (un pourcentage). */
  texteValeur: string;
  texteDetail?: string;
  /** Un montant de plus empilé au-dessus de la colonne (les activités touristiques), d'une autre couleur ; il compte dans la hauteur. */
  complement?: number;
  /** Vrai : la colonne est pleine (la référence) ; sinon elle est seulement cernée. */
  pleine?: boolean;
}

interface Props {
  colonnes: ColonneGraphique[];
  /** La colonne choisie (son détail est déroulé ailleurs) ; un appui la choisit ou la libère. */
  choisie: string | null;
  onChoisir: (cle: string | null) => void;
  /** Le nom de l'axe vertical (l'unité : « € »), et la façon d'écrire une graduation. */
  titreAxe: string;
  formaterGraduation: (valeur: number) => string;
  /** La hauteur du dessin (px). */
  hauteur?: number;
}

/** Un pas de graduation lisible (1, 2 ou 5 fois une puissance de dix) pour environ quatre graduations. */
function pasLisible(max: number): number {
  const brut = max / 4;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const facteur = brut / puissance;
  return (facteur <= 1 ? 1 : facteur <= 2 ? 2 : facteur <= 5 ? 5 : 10) * puissance;
}

/**
 * Un graphique en colonnes, de simples vues : un axe vertical gradué, une colonne par valeur (pleine pour la référence, cernée pour les
 * autres) et son nom, son montant et sa ligne de détail dessous. Un appui sur une colonne ou sur son nom la choisit.
 */
export function ColonnesVerticales({
  colonnes,
  choisie,
  onChoisir,
  titreAxe,
  formaterGraduation,
  hauteur = 220,
}: Props) {
  const plusGrand = Math.max(...colonnes.map((c) => c.valeur + (c.complement ?? 0)), 1);
  const pas = pasLisible(plusGrand);
  const sommet = Math.ceil(plusGrand / pas) * pas;
  const graduations = Array.from({ length: Math.round(sommet / pas) }, (_, i) => (i + 1) * pas);
  const y = (valeur: number) => (valeur / sommet) * hauteur;

  return (
    <View>
      <Text style={styles.titreAxe}>{titreAxe}</Text>
      <View style={styles.zone}>
        <View style={[styles.axe, { height: hauteur }]}>
          {graduations.map((g) => (
            <Text key={g} style={[styles.graduation, { bottom: y(g) - 8 }]}>
              {formaterGraduation(g)}
            </Text>
          ))}
        </View>
        <View style={styles.colonnes}>
          {colonnes.map((c) => {
            const active = choisie === c.cle;
            return (
              <Pressable
                key={c.cle}
                style={styles.colonne}
                onPress={() => onChoisir(active ? null : c.cle)}
                accessibilityRole="button"
                accessibilityState={{ expanded: active }}
              >
                <View style={[styles.pied, { height: hauteur }]}>
                  {graduations.map((g) => (
                    <View key={g} style={[styles.repere, { bottom: y(g) }]} />
                  ))}
                  {c.complement ? (
                    <View
                      style={[styles.barre, styles.barreComplement, { height: Math.max(y(c.complement), 2) }]}
                    />
                  ) : null}
                  <View
                    style={[
                      styles.barre,
                      { height: Math.max(y(c.valeur), 2) },
                      c.pleine ? styles.barrePleine : styles.barreCernee,
                      active && !c.pleine && styles.barreChoisie,
                    ]}
                  />
                </View>
                <Text style={[commonStyles.lineBold, styles.libelle]}>{c.libelle}</Text>
                <Text style={[commonStyles.note, styles.valeur]}>{c.texteValeur}</Text>
                {c.texteDetail ? (
                  <Text style={[commonStyles.note, styles.valeur]}>{c.texteDetail}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
