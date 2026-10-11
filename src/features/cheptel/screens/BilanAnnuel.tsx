import { useState } from 'react';
import { DetailUgbPrimes } from '@/features/cheptel/components/bilan/DetailUgbPrimes';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { coefficientsUgb, primesPrevisionnelles, ugbDe } from '@/features/cheptel/services/ugb';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { DeclarationChambre } from '@/features/cheptel/components/bilan/DeclarationChambre';
import { Text } from 'react-native';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import {
  CarteBoucs,
  CarteCabris,
  CarteChevres,
  CarteEffectif,
} from '@/features/cheptel/components/bilan/CartesBilan';
import { useBilanAnnuel } from '@/features/cheptel/hooks/useBilanAnnuel';
import { CARTE_BILAN } from '@/shared/constants/cheptel';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function BilanAnnuel() {
  const { annee, annees, setAnneeActive, bilan, bilanPrecedent, hectares } = useBilanAnnuel();
  const { settings } = useAppSettings();
  const { espece } = useEtablissement();
  const [detailUgb, setDetailUgb] = useState(false);
  /** La carte déroulée : toutes sont enroulées au départ, et une seule est visible à la fois. */
  const [carteOuverte, setCarteOuverte] = useState<string | null>(null);
  const carte = (id: string) => ({
    ouverte: carteOuverte === id,
    onBasculer: () => setCarteOuverte((actuelle) => (actuelle === id ? null : id)),
  });

  if (!bilan) return null;

  // L'UGB prévisionnel : l'effectif de fin d'année avec les coefficients de l'exploitation ; la prime prévisionnelle en découle.
  const infos = settings.exploitation;
  const coefficients = coefficientsUgb(infos, espece);
  const ugb = ugbDe(bilan.effectifFinAnnee, coefficients);
  const primes = primesPrevisionnelles(infos, { ugb, tetes: bilan.effectifFinAnnee.sevres, hectares });

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
        <SelecteurEspece />
      </LigneFiltres>

      <DeclarationChambre annee={annee} />

      <Text style={commonStyles.muted}>
        {TEXTES.cheptel.bilanAnnuel.comparaisonEspace}
        {annee} {TEXTES.cheptel.bilanAnnuel.precedenteAnneeEntreParenthesesDeuxPoints}
        {annee - 1})
      </Text>

      <CarteCabris bilan={bilan} precedent={bilanPrecedent} annee={annee} {...carte(CARTE_BILAN.CABRIS)} />
      <CarteChevres bilan={bilan} precedent={bilanPrecedent} annee={annee} {...carte(CARTE_BILAN.CHEVRES)} />
      <CarteBoucs bilan={bilan} precedent={bilanPrecedent} annee={annee} {...carte(CARTE_BILAN.BOUCS)} />
      <CarteEffectif
        bilan={bilan}
        ugb={ugb}
        prime={primes.lignes.length > 0 ? primes.total : undefined}
        lignesPrime={primes.lignes}
        onVoirDetail={() => setDetailUgb(true)}
        {...carte(CARTE_BILAN.EFFECTIF)}
      />
      <DetailUgbPrimes
        visible={detailUgb}
        onFermer={() => setDetailUgb(false)}
        effectif={bilan.effectifFinAnnee}
        coefficients={coefficients}
        ugb={ugb}
        hectares={hectares}
        lignes={primes.lignes}
        total={primes.total}
      />
    </Screen>
  );
}
