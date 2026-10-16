import { useEffect, useState } from 'react';
import { DetailUgbPrimes } from '@/features/cheptel/components/bilan/DetailUgbPrimes';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { comparerAuxPercues, saisonDePrime } from '@/features/cheptel/services/primesPercues';
import { estBureau } from '@/shared/utils/plateforme';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { parseDecimal } from '@/shared/utils/nombres';
import {
  cleAides,
  coefficientsUgb,
  effectifDeclare,
  infosPourAnnee,
  reductionBudgetaireDpb,
  stabilisateurDpb,
  primesPrevisionnelles,
  ugbDe,
} from '@/features/cheptel/services/ugb';
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
  const { annee, annees, setAnneeActive, bilan, bilanPrecedent, hectares, hectaresParZone, percues } =
    useBilanAnnuel();
  const { settings, loaded, patchSettings } = useAppSettings();
  const { espece } = useEtablissement();
  const [detailUgb, setDetailUgb] = useState(false);
  /** L'effectif déclaré, tel qu'on le saisit (vide : non saisi). Il est enregistré tout seul pour l'année et l'espèce affichées. */
  const [declare, setDeclare] = useState('');
  const declareEnregistre = effectifDeclare(settings.exploitation, annee, espece);
  useEffect(() => {
    // Chargement depuis les réglages à chaque changement d'année ou d'espèce.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeclare(declareEnregistre === undefined ? '' : String(declareEnregistre).replace('.', ','));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, annee, espece]);
  useEnregistrementAuto({
    actif: loaded,
    signature: `${annee}:${espece}:${declare}`,
    enregistrer: async () => {
      const valeur = declare.trim() ? parseDecimal(declare) : undefined;
      if (valeur === declareEnregistre) return true;
      const { [cleAides(annee, espece)]: _ancien, ...autres } =
        settings.exploitation?.ugbPrimes?.effectifsDeclares ?? {};
      await patchSettings({
        exploitation: {
          ...settings.exploitation,
          ugbPrimes: {
            ...settings.exploitation?.ugbPrimes,
            effectifsDeclares:
              valeur === undefined ? autres : { ...autres, [cleAides(annee, espece)]: valeur },
          },
        },
      });
      return true;
    },
  });
  /** La carte déroulée : toutes sont enroulées au départ, et une seule est visible à la fois. */
  const [carteOuverte, setCarteOuverte] = useState<string | null>(null);
  const carte = (id: string) => ({
    // Sur ordinateur, toutes les cartes sont déroulées.
    ouverte: estBureau() || carteOuverte === id,
    onBasculer: () => setCarteOuverte((actuelle) => (actuelle === id ? null : id)),
  });

  if (!bilan) return null;

  // L'UGB prévisionnel : l'effectif de fin d'année avec les coefficients de l'exploitation ; la prime prévisionnelle en découle.
  const infos = settings.exploitation;
  const coefficients = coefficientsUgb(infos, espece);
  // L'effectif déclaré (saisi) sert de base : tous ses animaux comptent au coefficient adulte ; à défaut, l'effectif de fin d'année.
  const declareSaisi = declare.trim() ? parseDecimal(declare) : undefined;
  const effectifCalcul =
    declareSaisi === undefined ? bilan.effectifFinAnnee : { sevres: declareSaisi, petits: 0 };
  const ugb = ugbDe(effectifCalcul, coefficients);
  const primes = primesPrevisionnelles(
    infosPourAnnee(infos, annee, espece),
    { ugb, tetes: effectifCalcul.sevres, hectares, hectaresParZone },
    stabilisateurDpb(infos, annee),
    reductionBudgetaireDpb(infos, annee),
  );

  /** Les primes calculées, avec ce qui en a été perçu sur la saison : une alerte sur celles qui diffèrent. */
  const lignesPrime = comparerAuxPercues(primes.lignes, percues);

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
        effectifDeclare={declare}
        onChangerEffectifDeclare={setDeclare}
        ugb={ugb}
        prime={primes.lignes.length > 0 ? primes.total : undefined}
        lignesPrime={lignesPrime}
        saison={saisonDePrime(annee)}
        onVoirDetail={() => setDetailUgb(true)}
        {...carte(CARTE_BILAN.EFFECTIF)}
      />
      <DetailUgbPrimes
        visible={detailUgb}
        onFermer={() => setDetailUgb(false)}
        effectif={effectifCalcul}
        declare={declareSaisi !== undefined}
        coefficients={coefficients}
        ugb={ugb}
        hectares={hectares}
        lignes={lignesPrime}
        total={primes.total}
        annee={annee}
      />
    </Screen>
  );
}
