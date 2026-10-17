import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMeresPossibles } from '@/features/cheptel/hooks/useMeresPossibles';
import { creerChevre, numeroBoucleExiste } from '@/features/cheptel/repository/chevres';
import { enregistrerNaissance } from '@/features/cheptel/repository/naissances';
import type { Sexe } from '@/features/cheptel/types';
import { todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { SEXE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

export interface CabritForm {
  key: string;
  numeroBoucle: string;
  sexe: Sexe;
  mortNe: boolean;
}

export const nouveauCabrit = (): CabritForm => ({
  key: generateId(),
  numeroBoucle: '',
  sexe: SEXE.FEMELLE,
  mortNe: false,
});

/** Formulaire de création d'une chèvre, avec éventuellement la déclaration de sa mise bas (cabris). */
export function useNouvelleChevre() {
  const router = useRouter();
  const params = useLocalSearchParams<{ numeroBoucle?: string; sexe?: Sexe }>();

  const [numeroBoucle, setNumeroBoucle] = useState(params.numeroBoucle ?? '');
  const [dateBouclage, setDateBouclage] = useState('');
  const [nom, setNom] = useState('');
  const [sexe, setSexe] = useState<Sexe>(params.sexe === SEXE.MALE ? SEXE.MALE : SEXE.FEMELLE);
  const [dateNaissance, setDateNaissance] = useState(todayISO());
  const [mereNumeroBoucle, setMereNumeroBoucle] = useState('');
  const [notes, setNotes] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  /** Le message sous le n° de boucle quand il est déjà attribué à un autre animal (vérifié dès la saisie). */
  const [erreurBoucle, setErreurBoucle] = useState('');
  useEffect(() => {
    const boucle = numeroBoucle.trim();
    let actif = true;
    (boucle ? numeroBoucleExiste(boucle) : Promise.resolve(false)).then((existe) => {
      if (actif) setErreurBoucle(existe ? TEXTES.commun.general.leNBoucleEstDeja(boucle) : '');
    });
    return () => {
      actif = false;
    };
  }, [numeroBoucle]);

  /** La mère se choisit parmi les femelles qui avaient atteint la maturité sexuelle à la naissance du petit (facultatif). */
  const optionsMeres = useMeresPossibles(dateNaissance, mereNumeroBoucle || undefined);

  const [avecCabrits, setAvecCabrits] = useState(false);
  const [dateMiseBas, setDateMiseBas] = useState(todayISO());
  const [cabrits, setCabrits] = useState<CabritForm[]>([nouveauCabrit()]);

  const majCabrit = (key: string, patch: Partial<CabritForm>) => {
    setCabrits((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const ajouterCabrit = () => setCabrits((prev) => [...prev, nouveauCabrit()]);

  const supprimerCabrit = (key: string) => {
    setCabrits((prev) => (prev.length > 1 ? prev.filter((c) => c.key !== key) : prev));
  };

  const annuler = () => router.replace(ROUTES.CHEPTEL_LISTE);

  const enregistrer = async () => {
    // Le n° de boucle est déjà celui d'un autre animal : le message est sous le champ, rien n'est enregistré.
    if (erreurBoucle) return;
    if (avecCabrits && !numeroBoucle.trim()) {
      Alert.alert(
        TEXTES.cheptel.nouvelleChevre.nDeBoucleRequis,
        TEXTES.cheptel.nouvelleChevre.pourEnregistrerSesCabrisIl,
      );
      return;
    }

    const boucleMere = numeroBoucle.trim();
    const bouclesCabrits = avecCabrits
      ? cabrits.map((c) => c.numeroBoucle.trim()).filter((b) => b.length > 0)
      : [];
    const doublonsLocaux = bouclesCabrits.filter(
      (b, i) => bouclesCabrits.indexOf(b) !== i || b === boucleMere,
    );
    if (doublonsLocaux.length > 0) {
      Alert.alert(
        TEXTES.commun.general.nDeBoucleEnDouble,
        TEXTES.cheptel.nouvelleChevre.leNValeurEstUtilise(doublonsLocaux[0]),
      );
      return;
    }

    setEnregistrement(true);
    try {
      const bouclesAVerifier = boucleMere ? [boucleMere, ...bouclesCabrits] : bouclesCabrits;
      for (const boucle of bouclesAVerifier) {
        if (await numeroBoucleExiste(boucle)) {
          Alert.alert(
            TEXTES.commun.general.nDeBoucleDejaUtilise,
            TEXTES.commun.general.leNBoucleEstDeja(boucle),
          );
          return;
        }
      }

      const chevre = await creerChevre({
        numeroBoucle: boucleMere || undefined,
        dateBouclage: boucleMere ? dateBouclage || undefined : undefined,
        nom: nom.trim() || undefined,
        sexe,
        dateNaissance,
        mereNumeroBoucle: mereNumeroBoucle.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (avecCabrits && chevre.numeroBoucle) {
        await enregistrerNaissance({
          date: dateMiseBas,
          mereId: chevre.id,
          mereNumeroBoucle: chevre.numeroBoucle,
          cabrits: cabrits.map((c) => ({
            numeroBoucle: c.numeroBoucle.trim() || undefined,
            sexe: c.sexe,
            mortNe: c.mortNe,
          })),
        });
      }
      router.replace(ROUTES.CHEPTEL_LISTE);
    } finally {
      setEnregistrement(false);
    }
  };

  return {
    numeroBoucle,
    setNumeroBoucle,
    erreurBoucle,
    dateBouclage,
    setDateBouclage,
    nom,
    setNom,
    sexe,
    setSexe,
    dateNaissance,
    setDateNaissance,
    mereNumeroBoucle,
    setMereNumeroBoucle,
    optionsMeres,
    notes,
    setNotes,
    enregistrement,
    avecCabrits,
    setAvecCabrits,
    dateMiseBas,
    setDateMiseBas,
    cabrits,
    majCabrit,
    ajouterCabrit,
    supprimerCabrit,
    annuler,
    enregistrer,
  };
}

export type EtatNouvelleChevre = ReturnType<typeof useNouvelleChevre>;
