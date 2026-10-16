import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { elementsDeFormule } from '@/features/commercial/services/agritourisme';
import { coutsParFormule, type CoutsAgritourisme } from '@/features/commercial/services/coutsAgritourisme';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';

const T = TEXTES.commercial.agritourisme.couts;

/**
 * Rentabilité › Coûts de production : le coût d'une visite pour chaque formule d'agritourisme, d'après les charges rattachées à
 * l'atelier Agritourisme (assurances, gazole, usure du 4x4, ingrédients…) et ce que chaque formule comprend. Rien sans formule.
 */
export function CoutsAgritourismeFormules({ annee, horsTaxes }: { annee: number; horsTaxes: boolean }) {
  const [couts, setCouts] = useState<CoutsAgritourisme | null>(null);
  useEffect(() => {
    Promise.all([lireArchiveCommercial(), listFactures(annee)]).then(([archive, factures]) =>
      setCouts(
        coutsParFormule({
          visites: archive.visites.filter((v) => v.date.startsWith(String(annee))),
          formules: archive.formules,
          elements: elementsDeFormule(archive),
          factures,
          horsTaxes,
        }),
      ),
    );
  }, [annee, horsTaxes]);

  if (!couts || couts.formules.length === 0) return null;
  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineBold}>{T.titre}</Text>
      {couts.total === 0 ? <Text style={commonStyles.note}>{T.aucuneCharge}</Text> : null}
      {couts.formules.map((c) => (
        <View key={c.formule.id} style={commonStyles.gap2}>
          <View style={styles.ligne}>
            <Text style={commonStyles.lineSemiBold}>{c.formule.nom}</Text>
            <Text style={commonStyles.lineBold}>
              {c.composants.length > 0 ? T.parVisite(formatMontant(c.coutParVisite)) : '—'}
            </Text>
          </View>
          {c.composants.map((composant) => (
            <Text key={composant.cle || 'commun'} style={commonStyles.note}>
              {T.composant(
                composant.libelle ?? T.commun,
                composant.postes.map((p) => `${p.libelle} ${formatMontant(p.montant)}`).join(' + '),
                composant.visites,
                formatMontant(composant.parVisite),
              )}
            </Text>
          ))}
        </View>
      ))}
      {couts.nonReparti > 0 ? (
        <Text style={commonStyles.note}>{T.nonReparti(formatMontant(couts.nonReparti))}</Text>
      ) : null}
      <Text style={commonStyles.note}>{T.aide}</Text>
    </View>
  );
}
