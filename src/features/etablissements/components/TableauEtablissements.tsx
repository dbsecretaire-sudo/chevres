import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ATraiter } from '@/features/a-traiter/types';
import type { Etablissement } from '@/features/etablissements/repository';
import { libelleTypesEtablissement } from '@/features/etablissements/utils/typesEtablissement';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

interface Props {
  etablissements: readonly Etablissement[];
  actifId: string;
  aTraiterDe: (id: string) => ATraiter[];
  onChoisir: (id: string) => void;
  onModifier: (id: string) => void;
}

/**
 * Le choix de l'établissement du poste de comptabilité (affichage sobre, grande fenêtre) : un tableau — nom, types, choses à traiter —, dont une ligne ouvre
 * l'établissement. Le dernier utilisé est marqué d'une étoile ; « Modifier » ouvre sa fiche.
 */
export function TableauEtablissements({ etablissements, actifId, aTraiterDe, onChoisir, onModifier }: Props) {
  const colonnes: readonly ColonneDuTableau<Etablissement>[] = [
    { cle: 'nom', titre: 'Établissement', poids: 3, valeur: (e) => e.nom, texte: (e) => `${e.id === actifId ? '★ ' : ''}${e.nom}` },
    { cle: 'types', titre: 'Espèces', poids: 3, valeur: (e) => libelleTypesEtablissement(e) || 'Espèces non renseignées' },
    { cle: 'traiter', titre: 'À traiter', poids: 1, aligne: 'droite', valeur: (e) => aTraiterDe(e.id).length, texte: (e) => (aTraiterDe(e.id).length ? String(aTraiterDe(e.id).length) : '') },
    {
      cle: 'modifier',
      titre: '',
      poids: 1,
      aligne: 'droite',
      triable: false,
      valeur: () => '',
      rendu: (e) => (
        <Pressable onPress={() => onModifier(e.id)} hitSlop={6} accessibilityRole="button">
          <Text style={styles.lien}>{TEXTES.commun.general.modifier}</Text>
        </Pressable>
      ),
    },
  ];
  return (
    <View style={styles.cadre}>
      <TableauDeDonnees
        integre
        colonnes={colonnes}
        lignes={etablissements}
        cleDeLaLigne={(e) => e.id}
        vide=""
        tri={{ cle: 'nom' }}
        onLigne={(e) => onChoisir(e.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Sur toute la largeur de la fenêtre, comme les autres tableaux du poste de comptabilité.
  cadre: { width: '100%' },
  lien: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, textDecorationLine: 'underline' },
});
