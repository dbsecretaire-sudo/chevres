import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { LigneValorisation } from '@/features/comptabilite/services/pistesEconomie';
import { calculerRepartition, type Repartition } from '@/features/comptabilite/services/repartitionLait';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { ColonnesVerticales } from '@/shared/components/ColonnesVerticales';
import { CLE_FROMAGE_BROCCIU, FROMAGES_POUR_PETIT_LAIT, RECETTE_BROCCIU } from '@/shared/constants/lait';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { LOCALE } from '@/shared/constants/format';
import { commonStyles } from '@/shared/styles/commonStyles';
import { LARGEURS, styles } from '@/shared/styles/comptabilite/RepartitionLait.styles';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { colors } from '@/shared/theme/colors';

const T = TEXTES.comptabilite.rentabilite.plan.repartition;

type Vue = 'tableau' | 'graphique';

const nombre = (valeur: number, decimales = 0): string =>
  valeur.toLocaleString(LOCALE, { maximumFractionDigits: decimales });
const pourcent = (part: number): string => `${nombre(part * 100, 2)} %`;

interface Props {
  fromages: LigneValorisation[];
  /** Le lait de l'année (litres). */
  litres: number;
  prixLait?: number;
  /** Les parts de départ (en %, par fromage) : celles choisies, sinon ce que les fabrications ont réellement utilisé. */
  parts: Record<string, number>;
  /** Vrai quand les parts sont celles que l'utilisateur a choisies : un lien revient à la répartition réelle. */
  choisies: boolean;
  onEnregistrer: (parts: Record<string, number>) => void;
  onReinitialiser: () => void;
  /** Le brocciu fait partie de la répartition (coché) : ses quantités se calculent d'après le petit-lait des autres fromages. */
  brocciuActif: boolean;
  onBrocciu: (actif: boolean) => void;
  /** Télécharger la simulation affichée (PDF). */
  onTelecharger?: (repartition: Repartition) => void;
  /** L'amortissement annuel de la fromagerie (€), quand l'utilisateur l'inclut : il se retranche du résultat. */
  amortissementAnnuel?: number;
  /** Les charges de l'année (toutes) : elles se retranchent des recettes pour le résultat final. */
  charges?: number;
  /** Ce qui se place sous le tableau, avant le bouton de téléchargement (l'amortissement de la fromagerie). */
  sousLeTableau?: ReactNode;
  /** Ce que coûte un gramme de sel (€), d'après ses achats ; rien sans achat de sel. */
  coutSelParGramme?: number;
}

/**
 * Le tableau de répartition du lait : pour chaque fromage, la part du lait de l'année (à choisir), les litres, le nombre de fromages
 * qu'ils donnent, la recette, les emballages et le net ; le reste du lait est vendu tel quel. Les totaux et la comparaison avec le lait
 * tout vendu montrent ce que change chaque répartition.
 */
export function RepartitionLait({
  fromages,
  litres,
  prixLait,
  parts,
  choisies,
  onEnregistrer,
  onReinitialiser,
  brocciuActif,
  onBrocciu,
  onTelecharger,
  amortissementAnnuel,
  charges,
  sousLeTableau,
  coutSelParGramme,
}: Props) {
  /** La présentation : le tableau (où se choisissent les parts) ou le graphique du net de chaque part. */
  const [vue, setVue] = useState<Vue>('tableau');
  const [choisie, setChoisie] = useState<string | null>(null);
  const [saisies, setSaisies] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fromages.map((f) => [f.cle, parts[f.cle] ? String(parts[f.cle]).replace('.', ',') : '']),
    ),
  );
  const partsSaisies = Object.fromEntries(
    fromages.map((f) => [f.cle, parseDecimal(saisies[f.cle] ?? '') || 0]),
  );
  const r = calculerRepartition({
    litres,
    fromages,
    parts: partsSaisies,
    prixLait,
    brocciu: {
      cle: CLE_FROMAGE_BROCCIU,
      actif: brocciuActif,
      recette: RECETTE_BROCCIU,
      coutSelParGramme: coutSelParGramme ?? 0,
      petitLaitDe: FROMAGES_POUR_PETIT_LAIT,
    },
  });
  const avecBrocciu = fromages.some((f) => f.cle === CLE_FROMAGE_BROCCIU);
  const largeurTotale = LARGEURS.type + LARGEURS.part + LARGEURS.lait + LARGEURS.nombre + 3 * LARGEURS.argent;
  const ecart = r.total.net - r.toutVendu;
  /** Le prix du lait que donne cette répartition : le net total divisé par les litres de lait. */
  const prixDevenu = r.total.litres > 0 ? r.total.net / r.total.litres : 0;

  const cellule = (texte: string, largeur: number, style?: object) => (
    <Text style={[commonStyles.line, styles.cellule, { width: largeur }, style]}>{texte}</Text>
  );

  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineBold}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide(nombre(litres))}</Text>
      <PucesDefilantes<Vue>
        puces={[
          { valeur: 'tableau', label: TEXTES.comptabilite.rentabilite.plan.vues.tableau },
          { valeur: 'graphique', label: TEXTES.comptabilite.rentabilite.plan.vues.graphique },
        ]}
        valeur={vue}
        onChoisir={setVue}
      />
      {vue === 'tableau' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={[styles.ligne, styles.entete]}>
              {cellule(T.colonnes.type, LARGEURS.type, commonStyles.lineBold)}
              {cellule(T.colonnes.part, LARGEURS.part, commonStyles.lineBold)}
              {cellule(T.colonnes.lait, LARGEURS.lait, commonStyles.lineBold)}
              {cellule(T.colonnes.nombre, LARGEURS.nombre, commonStyles.lineBold)}
              {cellule(T.colonnes.recette, LARGEURS.argent, commonStyles.lineBold)}
              {cellule(T.colonnes.emballages, LARGEURS.argent, commonStyles.lineBold)}
              {cellule(T.colonnes.net, LARGEURS.argent, commonStyles.lineBold)}
            </View>
            {r.lignes.map((l) => {
              const estBrocciu = l.cle === CLE_FROMAGE_BROCCIU;
              return (
                <View key={l.cle}>
                  <View style={styles.ligne}>
                    {cellule(l.libelle, LARGEURS.type)}
                    {estBrocciu ? (
                      // La part du brocciu n'est pas choisie : elle se calcule, à titre d'information.
                      cellule(pourcent(l.part), LARGEURS.part, commonStyles.muted)
                    ) : (
                      <View style={[styles.cellule, { width: LARGEURS.part }]}>
                        <TextInput
                          style={styles.champPart}
                          value={saisies[l.cle] ?? ''}
                          onChangeText={(texte) =>
                            setSaisies((actuelles) => ({ ...actuelles, [l.cle]: texte }))
                          }
                          onEndEditing={() => onEnregistrer(partsSaisies)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                        />
                        <Text style={commonStyles.muted}>%</Text>
                      </View>
                    )}
                    {cellule(`${nombre(l.litres, 1)} L`, LARGEURS.lait)}
                    {cellule(nombre(l.nombre, 1), LARGEURS.nombre)}
                    {cellule(formatMontant(l.recette), LARGEURS.argent)}
                    {cellule(formatMontant(-l.emballages), LARGEURS.argent)}
                    {cellule(formatMontant(l.net), LARGEURS.argent, commonStyles.lineBold)}
                  </View>
                  {estBrocciu ? (
                    <View style={[styles.ligneBrocciu, { width: largeurTotale }]}>
                      <Checkbox label={T.brocciu.caseACocher} value={brocciuActif} onChange={onBrocciu} />
                      {r.brocciu?.actif ? (
                        <Text style={commonStyles.note}>
                          {T.brocciu.detail(
                            nombre(r.brocciu.petitLaitUtilise, 1),
                            nombre(r.brocciu.petitLaitDisponible, 1),
                            nombre(r.brocciu.selGrammes, 0),
                            formatMontant(r.brocciu.coutSel),
                          )}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
            <View style={styles.ligne}>
              {cellule(T.laitVendu, LARGEURS.type)}
              {cellule(pourcent(r.vendu.part), LARGEURS.part)}
              {cellule(`${nombre(r.vendu.litres, 1)} L`, LARGEURS.lait)}
              {cellule('—', LARGEURS.nombre)}
              {cellule(formatMontant(r.vendu.recette), LARGEURS.argent)}
              {cellule('—', LARGEURS.argent)}
              {cellule(formatMontant(r.vendu.recette), LARGEURS.argent, commonStyles.lineBold)}
            </View>
            <View style={[styles.ligne, styles.total]}>
              {cellule(T.total, LARGEURS.type, commonStyles.lineBold)}
              {cellule(pourcent(r.total.part), LARGEURS.part, commonStyles.lineBold)}
              {cellule(`${nombre(r.total.litres, 1)} L`, LARGEURS.lait, commonStyles.lineBold)}
              {cellule(nombre(r.total.nombre, 1), LARGEURS.nombre, commonStyles.lineBold)}
              {cellule(formatMontant(r.total.recette), LARGEURS.argent, commonStyles.lineBold)}
              {cellule(formatMontant(-r.total.emballages), LARGEURS.argent, commonStyles.lineBold)}
              {cellule(formatMontant(r.total.net), LARGEURS.argent, commonStyles.lineBold)}
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Le net de chaque part : le lait vendu tel quel (colonne pleine) et chaque fromage (colonnes cernées) */}
          <ColonnesVerticales
            colonnes={[
              {
                cle: 'vendu',
                libelle: T.laitVendu,
                valeur: r.vendu.recette,
                texteValeur: formatMontant(r.vendu.recette),
                texteDetail: pourcent(r.vendu.part),
                pleine: true,
              },
              ...r.lignes.map((l) => ({
                cle: l.cle,
                libelle: l.libelle,
                valeur: l.net,
                texteValeur: formatMontant(l.net),
                texteDetail: pourcent(l.part),
              })),
            ]}
            choisie={choisie}
            onChoisir={setChoisie}
            titreAxe={T.axe}
            formaterGraduation={(valeur) => nombre(valeur, 0)}
          />
          {choisie === 'vendu' ? (
            <Text style={commonStyles.note}>
              {T.detailVendu(nombre(r.vendu.litres, 1), formatMontant(r.vendu.recette))}
            </Text>
          ) : null}
          {(() => {
            const l = r.lignes.find((l) => l.cle === choisie);
            return l ? (
              <Text style={commonStyles.note}>
                {T.detailFromage(
                  nombre(l.litres, 1),
                  nombre(l.nombre, 1),
                  formatMontant(l.recette),
                  formatMontant(l.emballages),
                  formatMontant(l.net),
                )}
              </Text>
            ) : null;
          })()}
        </>
      )}
      {r.depasse ? <Text style={commonStyles.required}>{T.depasse}</Text> : null}
      {prixLait !== undefined ? (
        <Text style={[commonStyles.lineSemiBold, { color: ecart >= 0 ? colors.primary : colors.danger }]}>
          {ecart >= 0
            ? T.compare.plus(formatMontant(ecart), formatMontant(prixDevenu))
            : T.compare.moins(formatMontant(-ecart), formatMontant(prixDevenu))}
        </Text>
      ) : null}
      {avecBrocciu ? (
        <Text style={commonStyles.note}>
          {T.brocciu.recette(
            RECETTE_BROCCIU.litresPetitLaitParLot,
            RECETTE_BROCCIU.litresLaitCailleParLot,
            pourcent(RECETTE_BROCCIU.partLaitEntier),
            RECETTE_BROCCIU.selGParLitrePetitLait,
          )}
        </Text>
      ) : null}
      {avecBrocciu && brocciuActif && !coutSelParGramme ? (
        <Text style={commonStyles.mutedItalic}>{T.brocciu.sansSel}</Text>
      ) : null}
      {charges !== undefined ? (
        <View style={commonStyles.gap2}>
          <Text style={commonStyles.lineBold}>{T.final.titre}</Text>
          <View style={styles.ligneResultat}>
            <Text style={[commonStyles.line, commonStyles.flex1]}>{T.final.recettes}</Text>
            <Text style={commonStyles.lineSemiBold}>{formatMontant(r.total.net)}</Text>
          </View>
          <View style={styles.ligneResultat}>
            <Text style={[commonStyles.line, commonStyles.flex1]}>{T.final.charges}</Text>
            <Text style={commonStyles.lineSemiBold}>{formatMontant(-charges)}</Text>
          </View>
          {amortissementAnnuel ? (
            <View style={styles.ligneResultat}>
              <Text style={[commonStyles.line, commonStyles.flex1]}>{T.final.amortissement}</Text>
              <Text style={commonStyles.lineSemiBold}>{formatMontant(-amortissementAnnuel)}</Text>
            </View>
          ) : null}
          <View style={styles.ligneResultat}>
            <Text style={[commonStyles.lineBold, commonStyles.flex1]}>{T.final.resultat}</Text>
            <Text
              style={[
                commonStyles.lineBold,
                {
                  color:
                    r.total.net - charges - (amortissementAnnuel ?? 0) >= 0 ? colors.primary : colors.danger,
                },
              ]}
            >
              {formatMontant(r.total.net - charges - (amortissementAnnuel ?? 0))}
            </Text>
          </View>
        </View>
      ) : null}
      {sousLeTableau}
      {onTelecharger ? (
        <Button variant="secondary" label={T.telecharger} onPress={() => onTelecharger(r)} />
      ) : null}
      <Text style={commonStyles.note}>{T.aideEmballages}</Text>
      {choisies ? (
        <Pressable onPress={onReinitialiser} hitSlop={8}>
          <Text style={commonStyles.lien}>{T.reel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
