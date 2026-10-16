import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { ROUTES } from '@/shared/constants/routes';
import { Screen } from '@/shared/components/Screen';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SectionForm } from '@/shared/components/SectionForm';
import { SelectField } from '@/shared/components/SelectField';
import { useRappels } from '@/features/rappels/hooks/useRappels';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { reglagesTva } from '@/features/comptabilite/utils/reglagesTva';
import { getSettings, synchroBouclesActive } from '@/features/settings/settings';
import { MarquerBoucles } from '@/features/stock/components/MarquerBoucles';
import { synchroniserPoseBoucles } from '@/features/stock/services/boucles';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { PERIODICITE_TVA, REGIME_TVA_PILOTAGE } from '@/shared/constants/tva';
import { LABEL_PERIODICITE_TVA, LABEL_REGIME_TVA_PILOTAGE } from '@/shared/textes/libelles';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.pilotageTva.reglages;

/**
 * Comptabilité › Réglages : le régime de TVA (franchise, RFA, réel simplifié ou normal), la périodicité de son suivi et, au RFA, son
 * taux ; la synchronisation des boucles avec le cheptel ; la trésorerie ; puis les rappels de déclaration.
 */
export default function ReglagesComptabilite() {
  const router = useRouter();
  const { settings, patchSettings } = useAppSettings();
  const { genres, desactives, activer } = useRappels();
  const infos = settings.exploitation;
  const [synchroBoucles, setSynchroBoucles] = useState(() => synchroBouclesActive(infos));
  useEffect(() => {
    // Les réglages se chargent après l'ouverture de l'écran : la case reprend alors leur valeur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSynchroBoucles(synchroBouclesActive(settings.exploitation));
  }, [settings.exploitation]);
  const tva = reglagesTva(infos);
  /** Une entreprise qui n'est pas assujettie à la TVA est en franchise : son régime se règle dans ses informations. */
  const entrepriseNonAssujettie = modeEntreprise() && !infos?.entreprise?.tvaApplicable;
  const enregistrerTva = (patch: { regime?: string; periodicite?: string; tauxRfa?: number | undefined }) =>
    patchSettings({
      exploitation: {
        ...infos,
        tva: { regime: tva.regime, periodicite: tva.periodicite, tauxRfa: tva.tauxRfa, ...patch },
      },
    });
  const sansDeclaration =
    tva.regime === REGIME_TVA_PILOTAGE.FRANCHISE || tva.regime === REGIME_TVA_PILOTAGE.RFA;

  return (
    <Screen>
      <SectionForm titre={T.titre} aide={T.aide}>
        {entrepriseNonAssujettie ? (
          <Text style={commonStyles.note}>{TEXTES.entreprise.tva.nonAssujetti}</Text>
        ) : (
          <>
            <SelectField
              label={T.regime}
              value={tva.regime}
              onChange={(regime) => enregistrerTva({ regime })}
              options={Object.values(REGIME_TVA_PILOTAGE).map((valeur) => ({
                value: valeur,
                label: LABEL_REGIME_TVA_PILOTAGE[valeur],
              }))}
            />
            {sansDeclaration ? null : (
              <SelectField
                label={T.periodicite}
                value={tva.periodicite}
                onChange={(periodicite) => enregistrerTva({ periodicite })}
                options={Object.values(PERIODICITE_TVA).map((valeur) => ({
                  value: valeur,
                  label: LABEL_PERIODICITE_TVA[valeur],
                }))}
              />
            )}
            {tva.regime === REGIME_TVA_PILOTAGE.RFA ? (
              <FormField
                label={T.tauxRfa}
                value={tva.tauxRfa === undefined ? '' : String(tva.tauxRfa).replace('.', ',')}
                onChangeText={(v) =>
                  /^\d*[.,]?\d*$/.test(v) &&
                  enregistrerTva({ tauxRfa: v.trim() ? parseDecimal(v) : undefined })
                }
                keyboardType="decimal-pad"
                placeholder="0"
                aide={T.aideTauxRfa}
              />
            ) : null}
          </>
        )}
      </SectionForm>

      {/* Les boucles de l'inventaire : synchronisées avec le cheptel, ou non (un élevage seulement). */}
      {modeEntreprise() ? null : (
        <SectionForm titre={TEXTES.stock.boucles.synchro.titre}>
          <Checkbox
            label={TEXTES.stock.boucles.synchro.option}
            value={synchroBoucles}
            onChange={async (actif) => {
              // La case suit le doigt sans attendre l'écriture ; celle-ci part des réglages enregistrés les plus récents.
              setSynchroBoucles(actif);
              const { exploitation } = await getSettings();
              await patchSettings({ exploitation: { ...exploitation, synchroBoucles: actif } });
              // Réactivée : les poses se remettent d'accord avec le cheptel tout de suite.
              if (actif) await synchroniserPoseBoucles();
            }}
          />
          <Text style={commonStyles.note}>{TEXTES.stock.boucles.synchro.optionAide}</Text>
          <MarquerBoucles />
        </SectionForm>
      )}

      {/* Les taux proposés par produit : la TVA des ventes et l'imposition des aides. */}
      <BlocLignes>
        <ListRow
          title={TEXTES.comptabilite.tauxParProduit.titre}
          subtitle={TEXTES.comptabilite.tauxParProduit.aide}
          icone="pricetag"
          onPress={() => router.push(ROUTES.COMPTABILITE_TAUX)}
        />
      </BlocLignes>

      {/* La trésorerie : solde de départ, seuil d'alerte et emprunts. */}
      <BlocLignes>
        <ListRow
          title={TEXTES.comptabilite.accueil.tresorerie.titre}
          subtitle={TEXTES.comptabilite.tresorerie.reglagesEcran.soldeAide}
          icone="wallet"
          onPress={() => router.push(ROUTES.COMPTABILITE_TRESORERIE_REGLAGES)}
        />
      </BlocLignes>

      {/* Les rappels de déclaration (RSA trimestriel, URSSAF mensuel) : chacun peut être désactivé. */}
      {genres.length > 0 ? (
        <SectionForm titre={TEXTES.rappels.reglages.titre} aide={TEXTES.rappels.reglages.aide}>
          {genres.map((genre) => (
            <Checkbox
              key={genre}
              label={TEXTES.rappels.reglages[genre]}
              value={!desactives.includes(genre)}
              onChange={(actif) => activer(genre, actif)}
            />
          ))}
        </SectionForm>
      ) : null}
    </Screen>
  );
}
