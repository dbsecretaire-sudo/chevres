import { useState } from 'react';
import { Text, View } from 'react-native';
import type { ValorisationLait } from '@/features/comptabilite/services/pistesEconomie';
import { TableauSimple } from '@/features/comptabilite/components/TableauSimple';
import { ColonnesVerticales } from '@/shared/components/ColonnesVerticales';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { LOCALE } from '@/shared/constants/format';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/comptabilite/PlanEconomies.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';

const V = TEXTES.comptabilite.rentabilite.plan.valorisation;

type Vue = 'graphique' | 'tableau';

const nombre = (valeur: number, decimales = 2): string =>
  valeur.toLocaleString(LOCALE, { maximumFractionDigits: decimales });

/**
 * Le lait vendu tel quel et chaque fromage en vignettes : le montant que rapporterait le lait de l'année tout vendu (d'après le total des
 * paiements des récolteurs, soit 100 %) ou tout transformé en ce fromage, avec son pourcentage de ce lait vendu. Un appui sur une
 * vignette déroule son détail en dessous.
 */
export function GraphiqueValorisation({
  valorisation,
  recettesTourisme,
}: {
  valorisation: ValorisationLait;
  /** Les recettes de l'agritourisme de l'année : elles s'ajoutent à chaque fromage (elles en ont besoin), pas au lait vendu tel quel. */
  recettesTourisme?: number;
}) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [vue, setVue] = useState<Vue>('graphique');
  const valo = valorisation;
  // Le lait vendu : le total des paiements des récolteurs de l'année, à défaut les litres au prix de l'inventaire.
  const base = valo.recettesLait ?? (valo.prixLait !== undefined ? valo.litres * valo.prixLait : undefined);
  const tuiles = [
    ...(base !== undefined ? [{ cle: 'lait', titre: V.tuileLait, montant: base, pourcent: 100 }] : []),
    ...valo.lignes.map((l) => ({
      cle: l.cle,
      titre: l.libelle,
      montant: l.productionPotentielle,
      pourcent: base ? (l.productionPotentielle / base) * 100 : undefined,
    })),
  ];
  const ligne = valo.lignes.find((l) => l.cle === ouverte);

  return (
    <View style={commonStyles.gap6}>
      {base === undefined ? <Text style={commonStyles.mutedItalic}>{V.sansPrixLait}</Text> : null}
      <PucesDefilantes<Vue>
        puces={[
          { valeur: 'graphique', label: TEXTES.comptabilite.rentabilite.plan.vues.graphique },
          { valeur: 'tableau', label: TEXTES.comptabilite.rentabilite.plan.vues.tableau },
        ]}
        valeur={vue}
        onChoisir={setVue}
      />
      {recettesTourisme ? <Text style={commonStyles.note}>{V.tourisme}</Text> : null}
      {vue === 'graphique' ? (
        <>
          {/* Le graphique : le lait vendu (colonne pleine, la référence) et le lait tout transformé en chaque fromage (colonnes cernées) */}
          <ColonnesVerticales
            colonnes={tuiles.map((t) => ({
              cle: t.cle,
              libelle: t.titre,
              valeur: t.montant,
              texteValeur: formatMontant(t.montant),
              texteDetail: t.pourcent !== undefined ? `${nombre(t.pourcent)} %` : undefined,
              pleine: t.cle === 'lait',
              // Les activités touristiques ont besoin de fromages : le lait vendu tel quel n'en profite pas.
              complement: t.cle === 'lait' ? undefined : recettesTourisme,
            }))}
            choisie={ouverte}
            onChoisir={setOuverte}
            titreAxe={V.axe}
            formaterGraduation={(valeur) => nombre(valeur, 0)}
          />
        </>
      ) : (
        <TableauSimple
          colonnes={[
            { cle: 'type', titre: V.colonnes.type, largeur: 120 },
            { cle: 'tout', titre: V.colonnes.tout, largeur: 110 },
            { cle: 'pourcent', titre: V.colonnes.pourcent, largeur: 110 },
            { cle: 'litre', titre: V.colonnes.litre, largeur: 90 },
            { cle: 'emballages', titre: V.colonnes.emballages, largeur: 100 },
            { cle: 'net', titre: V.colonnes.net, largeur: 110 },
            ...(recettesTourisme ? [{ cle: 'tourisme', titre: V.colonneTourisme, largeur: 110 }] : []),
          ]}
          lignes={[
            ...(base !== undefined
              ? [
                  {
                    cle: 'lait',
                    cellules: {
                      type: V.tuileLait,
                      tout: formatMontant(base),
                      pourcent: '100 %',
                      litre: valo.prixLait !== undefined ? formatMontant(valo.prixLait) : '—',
                      emballages: '—',
                      net: formatMontant(base),
                      tourisme: '—',
                    },
                  },
                ]
              : []),
            ...valo.lignes.map((l) => {
              const emballages = l.coutEmballage * (valo.litres / l.litresParFromage);
              return {
                cle: l.cle,
                cellules: {
                  type: l.libelle,
                  tout: formatMontant(l.productionPotentielle),
                  pourcent: base ? `${nombre((l.productionPotentielle / base) * 100)} %` : '—',
                  litre: formatMontant(l.prixParLitre),
                  emballages: formatMontant(-emballages),
                  net: formatMontant(l.productionPotentielle - emballages),
                  tourisme: recettesTourisme ? formatMontant(recettesTourisme) : '—',
                },
              };
            }),
          ]}
        />
      )}
      <Text style={commonStyles.note}>{base !== undefined ? V.baseRecolteurs : V.toucher}</Text>
      {ouverte === 'lait' && base !== undefined ? (
        <View style={styles.detail}>
          <Text style={commonStyles.lineBold}>{V.tuileLait}</Text>
          {valo.prixLait !== undefined ? (
            <Text style={commonStyles.note}>{V.lait(formatMontant(valo.prixLait))}</Text>
          ) : null}
          <Text style={commonStyles.note}>{V.recettesLait(nombre(valo.litres, 0), formatMontant(base))}</Text>
        </View>
      ) : null}
      {ligne ? (
        <View style={styles.detail}>
          <Text style={commonStyles.lineBold}>
            {V.fromage(ligne.libelle, formatMontant(ligne.prix), nombre(ligne.litresParFromage))}
          </Text>
          <Text style={commonStyles.note}>{V.parLitre(formatMontant(ligne.prixParLitre))}</Text>
          {valo.litres > 0 ? (
            <>
              <Text style={commonStyles.note}>
                {V.production(nombre(valo.litres, 0), formatMontant(ligne.productionPotentielle))}
              </Text>
              <Text style={commonStyles.note}>
                {V.nombreEmballages(
                  nombre(valo.litres / ligne.litresParFromage, 0),
                  formatMontant(ligne.coutEmballage * (valo.litres / ligne.litresParFromage)),
                  formatMontant(
                    ligne.productionPotentielle -
                      ligne.coutEmballage * (valo.litres / ligne.litresParFromage),
                  ),
                )}
              </Text>
            </>
          ) : null}
          {recettesTourisme && valo.litres > 0 ? (
            <Text style={commonStyles.note}>
              {V.avecTourisme(
                formatMontant(recettesTourisme),
                formatMontant(ligne.productionPotentielle + recettesTourisme),
              )}
            </Text>
          ) : null}
          {ligne.gainSurLait !== undefined && valo.litres > 0 ? (
            <Text
              style={[
                commonStyles.lineSemiBold,
                { color: ligne.gainSurLait >= 0 ? colors.primary : colors.danger },
              ]}
            >
              {ligne.gainSurLait >= 0
                ? V.plus(formatMontant(ligne.gainSurLait))
                : V.moins(formatMontant(-ligne.gainSurLait))}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
