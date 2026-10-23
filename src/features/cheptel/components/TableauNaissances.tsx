import { Pressable, Text, View } from 'react-native';
import type { PorteeNaissance } from '@/features/cheptel/repository/naissances';
import { libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { SEXE } from '@/shared/constants/cheptel';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.cheptel.naissances;

/**
 * Les naissances en tableau (poste de comptabilité) : une ligne par portée — la date, la mère, le nombre de petits, les femelles, les mâles — et, dans la dernière colonne, chaque petit avec
 * son état d'aujourd'hui (vivant, vendu, mort…) : son nom est un lien vers sa fiche.
 */
export function TableauNaissances({
  portees,
  ouvrirFiche,
  vide,
}: {
  portees: readonly PorteeNaissance[];
  /** Ouvre la fiche d'un petit. */
  ouvrirFiche: (id: string) => void;
  vide: string;
}) {
  const colonnes: readonly ColonneDuTableau<PorteeNaissance>[] = [
    { cle: 'date', titre: 'Date', poids: 1.2, valeur: (p) => p.date, texte: (p) => formatDateFR(p.date) },
    { cle: 'mere', titre: 'Mère', poids: 1.2, valeur: (p) => p.mereNumeroBoucle, texte: (p) => `${T.mereEspace}${p.mereNumeroBoucle}` },
    { cle: 'petits', titre: 'Petits', poids: 0.9, aligne: 'centre', valeur: (p) => p.cabrits.length },
    { cle: 'femelles', titre: 'F', poids: 0.6, aligne: 'centre', valeur: (p) => p.cabrits.filter((c) => c.sexe === SEXE.FEMELLE).length },
    { cle: 'males', titre: 'M', poids: 0.6, aligne: 'centre', valeur: (p) => p.cabrits.filter((c) => c.sexe === SEXE.MALE).length },
    {
      cle: 'animaux',
      titre: 'Les petits',
      poids: 4.5,
      triable: false,
      valeur: (p) => p.cabrits.map((c) => libelleChevre(c)).join(' '),
      rendu: (p) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {p.cabrits.map((c) => (
            <Pressable key={c.id} onPress={() => ouvrirFiche(c.id)} accessibilityRole="link">
              <Text style={{ fontSize: 13, color: colors.primaryDark, textDecorationLine: 'underline' }}>
                {libelleChevre(c)} <Text style={{ color: colors.textMuted, textDecorationLine: 'none' }}>· {statutLabel(c.statut, c.sexe)}</Text>
              </Text>
            </Pressable>
          ))}
        </View>
      ),
    },
  ];
  return <TableauDeDonnees colonnes={colonnes} lignes={portees} cleDeLaLigne={(p) => `${p.mereNumeroBoucle}__${p.date}`} tri={{ cle: 'date', decroissant: true }} vide={vide} />;
}
