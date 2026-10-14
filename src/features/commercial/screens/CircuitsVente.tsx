import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { BarreHorizontale } from '@/shared/components/BarreHorizontale';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ColonnesVerticales } from '@/shared/components/ColonnesVerticales';
import { EmptyState } from '@/shared/components/EmptyState';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import { TuilesChiffres } from '@/features/commercial/components/TuilesChiffres';
import { useDonneesCommerciales } from '@/features/commercial/hooks/useDonneesCommerciales';
import { statistiquesVentes } from '@/features/commercial/services/statistiques';
import { CIRCUIT_NON_RENSEIGNE } from '@/shared/constants/commercial';
import { LOCALE } from '@/shared/constants/format';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { LABEL_CIRCUIT_VENTE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import { formatMontant, todayISO } from '@/shared/utils/dates';

const T = TEXTES.commercial.circuits;

const libelleCircuit = (circuit: string): string =>
  LABEL_CIRCUIT_VENTE[circuit as keyof typeof LABEL_CIRCUIT_VENTE] ?? circuit;
const pourcent = (part: number): string =>
  `${(part * 100).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} %`;

/** Ce que rapporte chaque circuit de vente (ferme, marché, restaurateurs…) : le chiffre d'affaires, sa part et le panier moyen. */
export default function CircuitsVente() {
  const donnees = useDonneesCommerciales();
  const [choisi, setChoisi] = useState<string | null>(null);
  const stats = useMemo(() => statistiquesVentes(donnees.ventes, todayISO(), ''), [donnees.ventes]);
  const meilleur = stats.circuits.find((c) => c.circuit !== CIRCUIT_NON_RENSEIGNE);
  const sansCircuit = stats.circuits.find((c) => c.circuit === CIRCUIT_NON_RENSEIGNE);
  const detail = stats.circuits.find((c) => c.circuit === choisi);

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker
          annees={donnees.annees}
          value={donnees.annee}
          onChange={donnees.setAnneeActive}
          tout={donnees.regrouper}
          onChoisirTout={donnees.choisirToutesAnnees}
        />
      </LigneFiltres>
      <Text style={commonStyles.muted}>{T.aide}</Text>
      {stats.circuits.length === 0 ? (
        <EmptyState title={T.aucune} />
      ) : (
        <>
          <TuilesChiffres
            tuiles={[
              ...(meilleur
                ? [{ cle: 'meilleur', libelle: T.cartes.meilleur, valeur: libelleCircuit(meilleur.circuit) }]
                : []),
              { cle: 'ventes', libelle: T.cartes.ventes, valeur: String(stats.nombre) },
            ]}
          />
          <ColonnesVerticales
            colonnes={stats.circuits.map((c) => ({
              cle: c.circuit,
              libelle: libelleCircuit(c.circuit),
              valeur: c.montant,
              texteValeur: formatMontant(c.montant),
              texteDetail: pourcent(c.part),
              pleine: c.circuit === stats.circuits[0].circuit,
            }))}
            choisie={choisi}
            onChoisir={setChoisi}
            titreAxe={T.graphique.axe}
            formaterGraduation={(v) => String(Math.round(v))}
          />
          {detail ? (
            <View style={commonStyles.gap6}>
              <Text style={commonStyles.lineBold}>{libelleCircuit(detail.circuit)}</Text>
              <Text style={commonStyles.line}>
                {T.detail(detail.nombre, formatMontant(detail.panierMoyen))}
              </Text>
              <BarreHorizontale segments={[{ part: detail.part, couleur: colors.primary }]} />
              <Text style={commonStyles.muted}>{T.part(pourcent(detail.part))}</Text>
            </View>
          ) : null}
          <BlocLignes>
            {stats.circuits.map((c) => (
              <ListRow
                key={c.circuit}
                title={libelleCircuit(c.circuit)}
                subtitle={`${T.detail(c.nombre, formatMontant(c.panierMoyen))} · ${pourcent(c.part)}`}
                trailing={<Text style={commonStyles.lineBold}>{formatMontant(c.montant)}</Text>}
                onPress={() => setChoisi(c.circuit === choisi ? null : c.circuit)}
              />
            ))}
          </BlocLignes>
          {sansCircuit ? <Text style={commonStyles.note}>{T.sansCircuit}</Text> : null}
        </>
      )}
    </Screen>
  );
}
