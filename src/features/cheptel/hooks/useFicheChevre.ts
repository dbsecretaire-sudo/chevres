import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  declarerStatutChevre,
  modifierDateDeSortie,
  getChevre,
  listDescendance,
  numeroBoucleExiste,
  reactiverChevre,
  saveChevre,
  supprimerChevre,
} from '@/features/cheptel/repository/chevres';
import { listControlesPourChevre } from '@/features/exploitation/repository/controles';
import { listVisitesPourChevre } from '@/features/exploitation/repository/visitesVeterinaire';
import { especeDe } from '@/features/cheptel/utils/espece';
import type { Chevre, StatutChevre } from '@/features/cheptel/types';
import type { Controle, VisiteVeterinaire } from '@/features/exploitation/types';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { todayISO } from '@/shared/utils/dates';
import { STATUT_CHEVRE, VUE_FICHE_CHEVRE } from '@/shared/constants/cheptel';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TEXTES } from '@/shared/textes';

/** État et actions de la fiche d'une chèvre : chargement, modification, changement de statut, suppression. */
export function useFicheChevre(id: string | undefined) {
  const router = useRouter();

  const [chevre, setChevre] = useState<Chevre | null>(null);
  const [form, setForm] = useState<Chevre | null>(null);
  const [descendance, setDescendance] = useState<Chevre[]>([]);
  const [visites, setVisites] = useState<VisiteVeterinaire[]>([]);
  const [controles, setControles] = useState<Controle[]>([]);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [vueSecondaire, setVueSecondaire] = useState<ValeurDe<typeof VUE_FICHE_CHEVRE> | null>(null);

  const [statutForm, setStatutForm] = useState<StatutChevre>(STATUT_CHEVRE.MORTE);
  const [dateStatutForm, setDateStatutForm] = useState(todayISO());
  /** Le poids donné à la sortie (abattoir, vente) ; absent : celui de la fiche reste. */
  const [poidsStatutForm, setPoidsStatutForm] = useState<number | undefined>(undefined);
  const [showStatutForm, setShowStatutForm] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    const c = await getChevre(id);
    setChevre(c ?? null);
    setForm(c ?? null);
    if (c) {
      setDescendance(await listDescendance(c.id));
      setVisites(await listVisitesPourChevre(c));
      setControles(await listControlesPourChevre(c));
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  /**
   * Retourne true si l'enregistrement a réussi (utile pour enchaîner une navigation, ex : ajout d'un cabri). Enregistré tout seul
   * (`auto`), il ne dit rien d'une saisie refusée et laisse la fiche en modification.
   */
  const enregistrerModifications = async (auto = false): Promise<boolean> => {
    if (!form) return false;
    const boucle = form.numeroBoucle?.trim();
    if (boucle && (await numeroBoucleExiste(boucle, form.id, especeDe(form)))) {
      if (!auto) setErreur(TEXTES.cheptel.ficheChevre.leNBoucleEstDeja(boucle));
      return false;
    }
    await saveChevre(form);
    if (auto) {
      setChevre(form);
      return true;
    }
    setEditing(false);
    charger();
    return true;
  };

  // Tout changement de la fiche s'enregistre tout seul.
  useEnregistrementAuto({
    actif: editing,
    signature: JSON.stringify(form),
    enregistrer: () => enregistrerModifications(true),
  });

  const supprimerDefinitivement = async () => {
    if (!chevre) return;
    await supprimerChevre(chevre.id);
    router.back();
  };

  const choisirStatut = async (statut: StatutChevre) => {
    if (editing) {
      const ok = await enregistrerModifications();
      if (!ok) return;
    }
    setStatutForm(statut);
    setPoidsStatutForm(undefined);
    setShowStatutForm(true);
  };

  const enregistrerStatut = async () => {
    if (!chevre) return;
    await declarerStatutChevre(chevre.id, statutForm, dateStatutForm, poidsStatutForm);
    setShowStatutForm(false);
    charger();
  };

  const enregistrerDateSortie = async (date: string) => {
    if (!chevre) return;
    await modifierDateDeSortie(chevre.id, date);
    charger();
  };

  const reactiver = async () => {
    if (!chevre) return;
    await reactiverChevre(chevre.id);
    charger();
  };

  return {
    chevre,
    form,
    setForm,
    descendance,
    visites,
    controles,
    editing,
    setEditing,
    menuOuvert,
    setMenuOuvert,
    vueSecondaire,
    setVueSecondaire,
    statutForm,
    dateStatutForm,
    setDateStatutForm,
    poidsStatutForm,
    setPoidsStatutForm,
    showStatutForm,
    setShowStatutForm,
    erreur,
    setErreur,
    enregistrerModifications,
    supprimerDefinitivement,
    choisirStatut,
    enregistrerStatut,
    reactiver,
    enregistrerDateSortie,
  };
}
