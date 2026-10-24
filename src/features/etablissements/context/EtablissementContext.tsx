import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { router } from 'expo-router';
import {
  choisirEspeceCourante,
  choisirEtablissementActif,
  creerEtablissement,
  initialiserEtablissements,
  listEtablissements,
  modifierEtablissement,
  supprimerEtablissement,
  type DonneesEtablissement,
  type Etablissement,
} from '@/features/etablissements/repository';
import { ROUTES } from '@/shared/constants/routes';
import { destinationDe } from '@/features/a-traiter/services/destination';
import { SelecteurEtablissement } from '@/features/etablissements/components/SelecteurEtablissement';
import { especeCourante, especesActives, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';

interface EtablissementContextValue {
  etablissements: Etablissement[];
  actif: Etablissement;
  ouvrirSelecteur: () => void;
  /** Espèces de l'établissement actif (une seule la plupart du temps). */
  especes: EspeceAnimale[];
  /** Espèce dont le cheptel est affiché en ce moment. */
  espece: EspeceAnimale;
  /** Change d'espèce et revient sur l'écran indiqué (l'écran courant par défaut) une fois les données rechargées. */
  changerEspece: (espece: EspeceAnimale) => Promise<void>;
  /** Relit la liste des établissements (après une restauration qui a changé les types de l'établissement actif). */
  recharger: () => Promise<void>;
}

const EtablissementContext = createContext<EtablissementContextValue | undefined>(undefined);

export function EtablissementProvider({ children, sansSelecteur = false }: PropsWithChildren<{ sansSelecteur?: boolean }>) {
  const [pret, setPret] = useState(false);
  const [liste, setListe] = useState<Etablissement[]>([]);
  const [actifId, setActifId] = useState('');
  const [espece, setEspece] = useState<EspeceAnimale>(especeCourante());
  // L'application s'ouvre toujours sur le choix de l'établissement (sauf pour le berger : il travaille dans le dernier établissement ouvert).
  const [selecteurOuvert, setSelecteurOuvert] = useState(!sansSelecteur);

  useEffect(() => {
    initialiserEtablissements().then(({ liste: l, actifId: a }) => {
      setListe(l);
      setActifId(a);
      setEspece(especeCourante());
      setPret(true);
    });
  }, []);

  /** Ouvre un établissement sur son accueil, ou directement sur un écran (`destination`, calculée une fois l'établissement ouvert). */
  const entrer = useCallback(async (id: string, destination?: () => string) => {
    await choisirEtablissementActif(id);
    setActifId(id);
    setEspece(especeCourante());
    setSelecteurOuvert(false);
    setTimeout(() => {
      router.replace('/');
      if (destination) router.push(destination() as never);
    }, 0);
  }, []);

  const creer = useCallback(
    async (donnees: DonneesEtablissement) => {
      const nouveau = await creerEtablissement(donnees);
      setListe((prev) => [...prev, nouveau]);
      // Un nouvel établissement s'ouvre sur ses informations : on les remplit d'abord (statut, régime, TVA, tarifs).
      await entrer(nouveau.id, () => ROUTES.INFORMATIONS_EXPLOITATION);
    },
    [entrer],
  );

  const modifier = useCallback(async (id: string, donnees: DonneesEtablissement) => {
    await modifierEtablissement(id, donnees);
    setEspece(especeCourante());
    setListe((prev) => prev.map((e) => (e.id === id ? { ...e, ...donnees, nom: donnees.nom.trim() } : e)));
  }, []);

  // Pas de navigation ni de remontage de l'arbre : les écrans se recréent seuls (voir ecranParEspece).
  const changerEspece = useCallback(async (nouvelle: EspeceAnimale) => {
    await choisirEspeceCourante(nouvelle);
    setEspece(especeCourante());
  }, []);

  const recharger = useCallback(async () => {
    setListe(await listEtablissements());
    setEspece(especeCourante());
  }, []);

  const supprimer = useCallback(async (id: string) => {
    const resultat = await supprimerEtablissement(id);
    if (!resultat.supprime) return;
    setListe((prev) => prev.filter((e) => e.id !== id));
    setActifId(resultat.actifId);
    setEspece(especeCourante());
  }, []);

  if (!pret) return null;

  const actif = liste.find((e) => e.id === actifId) ?? liste[0];

  if (selecteurOuvert) {
    return (
      <SelecteurEtablissement
        etablissements={liste}
        actifId={actif.id}
        onChoisir={(id) => entrer(id)}
        onOuvrirATraiter={(item) => entrer(item.etablissementId, () => destinationDe(item))}
        onCreer={creer}
        onModifier={modifier}
        onSupprimer={supprimer}
        onFermer={() => setSelecteurOuvert(false)}
      />
    );
  }

  return (
    <EtablissementContext.Provider
      value={{
        etablissements: liste,
        actif,
        ouvrirSelecteur: () => setSelecteurOuvert(true),
        especes: especesActives(),
        espece,
        changerEspece,
        recharger,
      }}
    >
      {/* Remonter tout l'arbre au changement d'établissement : chaque écran recharge ses données depuis le bon espace de stockage. Le changement d'espèce, lui, ne recrée que le contenu des écrans (ecranParEspece). */}
      <Fragment key={actif.id}>{children}</Fragment>
    </EtablissementContext.Provider>
  );
}

export function useEtablissement(): EtablissementContextValue {
  const ctx = useContext(EtablissementContext);
  if (!ctx) throw new Error(TEXTES.etablissements.etablissementContext.useetablissementDoitEtreUtiliseDans);
  return ctx;
}
