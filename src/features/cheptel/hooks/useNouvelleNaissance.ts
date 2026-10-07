import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { enregistrerNaissance } from '@/features/cheptel/repository/naissances';
import { numeroBoucleExiste } from '@/features/cheptel/repository/chevres';
import type { Sexe } from '@/features/cheptel/types';
import { currentYear, todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { SEXE } from '@/shared/constants/cheptel';
import { TEXTES } from '@/shared/textes';

export interface CabritNaissanceForm {
  key: string;
  numeroBoucle: string;
  sexe: Sexe;
  nom: string;
  mortNe: boolean;
  renouvellement: boolean;
  renouvellementAnnee: string;
}

export const nouveauCabrit = (): CabritNaissanceForm => ({
  key: generateId(),
  numeroBoucle: '',
  sexe: SEXE.FEMELLE,
  nom: '',
  mortNe: false,
  renouvellement: false,
  renouvellementAnnee: String(currentYear()),
});

/** Un cabri par sexe de la liste « F,M,F » reçue en paramètre ; un seul cabri femelle à défaut. */
function cabritsInitiaux(sexes?: string): CabritNaissanceForm[] {
  if (!sexes) return [nouveauCabrit()];
  const liste = sexes
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is Sexe => Object.values<string>(SEXE).includes(s));
  if (liste.length === 0) return [nouveauCabrit()];
  return liste.map((sexe) => ({ ...nouveauCabrit(), sexe }));
}

/** Formulaire de déclaration d'une naissance (mise bas) : mère, date, cabris, notes. */
export function useNouvelleNaissance() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mereNumeroBoucle?: string; sexes?: string }>();

  const [date, setDate] = useState(todayISO());
  const [mereNumeroBoucle, setMereNumeroBoucle] = useState(params.mereNumeroBoucle ?? '');
  const [notes, setNotes] = useState('');
  const [cabrits, setCabrits] = useState<CabritNaissanceForm[]>(cabritsInitiaux(params.sexes));
  const [enregistrement, setEnregistrement] = useState(false);

  const majCabrit = (key: string, patch: Partial<CabritNaissanceForm>) => {
    setCabrits((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const ajouterCabrit = () => setCabrits((prev) => [...prev, nouveauCabrit()]);

  const supprimerCabrit = (key: string) => {
    setCabrits((prev) => (prev.length > 1 ? prev.filter((c) => c.key !== key) : prev));
  };

  const annuler = () => router.back();

  const enregistrer = async () => {
    if (!mereNumeroBoucle.trim()) {
      Alert.alert(
        TEXTES.cheptel.nouvelleNaissance.mereRequise,
        TEXTES.cheptel.nouvelleNaissance.merciDeRenseignerLeN,
      );
      return;
    }

    const bouclesCabrits = cabrits.map((c) => c.numeroBoucle.trim()).filter((b) => b.length > 0);
    const doublonLocal = bouclesCabrits.find((b, i) => bouclesCabrits.indexOf(b) !== i);
    if (doublonLocal) {
      Alert.alert(
        TEXTES.commun.general.nDeBoucleEnDouble,
        TEXTES.cheptel.nouvelleNaissance.leNDoublonlocalEstUtilise(doublonLocal),
      );
      return;
    }

    setEnregistrement(true);
    try {
      for (const boucle of bouclesCabrits) {
        if (await numeroBoucleExiste(boucle)) {
          Alert.alert(
            TEXTES.commun.general.nDeBoucleDejaUtilise,
            TEXTES.commun.general.leNBoucleEstDeja(boucle),
          );
          return;
        }
      }

      await enregistrerNaissance({
        date,
        mereNumeroBoucle: mereNumeroBoucle.trim(),
        cabrits: cabrits.map((c) => ({
          numeroBoucle: c.numeroBoucle.trim() || undefined,
          sexe: c.sexe,
          nom: c.nom.trim() || undefined,
          mortNe: c.mortNe,
          renouvellement: c.renouvellement,
          renouvellementAnnee: c.renouvellement ? Number(c.renouvellementAnnee) || currentYear() : undefined,
        })),
        notes: notes.trim() || undefined,
      });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  return {
    date,
    setDate,
    mereNumeroBoucle,
    setMereNumeroBoucle,
    notes,
    setNotes,
    cabrits,
    majCabrit,
    ajouterCabrit,
    supprimerCabrit,
    enregistrement,
    annuler,
    enregistrer,
  };
}
