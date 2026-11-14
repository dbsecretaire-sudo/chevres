import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  choisirEspeceCourante,
  choisirEtablissementActif,
  creerEtablissement,
  initialiserEtablissements,
  listEtablissements,
  modifierEtablissement,
  rafraichirEtablissements,
  supprimerEtablissement,
  type DonneesEtablissement,
  type Etablissement,
} from '@/features/etablissements/repository';
import { ROUTES } from '@/shared/constants/routes';
import { SelecteurEtablissement } from '@/features/etablissements/components/SelecteurEtablissement';
import { lireConnexion } from '@/features/sync/synchronisation';
import { especeCourante, especesActives, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';

interface EtablissementContextValue {
  etablissements: Etablissement[];
  actif: Etablissement;
  /** Ouvre le choix de l'établissement ; sans effet quand l'établissement ne se change pas (modérateur, compte utilisateur). */
  ouvrirSelecteur: () => void;
  /** Vrai sauf pour un modérateur ou un compte utilisateur : eux ne changent pas d'établissement une fois celui-ci pris. */
  peutChangerEtablissement: boolean;
  /** Vrai pour l'administrateur seul : lui crée, modifie et supprime les établissements (ils sont ceux du serveur). */
  peutGerer: boolean;
  /** L'écran où l'on voulait arriver en ouvrant l'établissement (la cloche « À traiter », un nouvel établissement) : donné une seule fois, une fois le mode choisi. */
  prendreLaDestination: () => string | undefined;
  /** Espèces de l'établissement actif (une seule la plupart du temps). */
  especes: EspeceAnimale[];
  /** Espèce dont le cheptel est affiché en ce moment. */
  espece: EspeceAnimale;
  /** Change d'espèce et revient sur l'écran indiqué (l'écran courant par défaut) une fois les données rechargées. */
  changerEspece: (espece: EspeceAnimale) => Promise<void>;
  /** Relit la liste des établissements (depuis le serveur, puis la copie locale) après une synchronisation ou une connexion. */
  recharger: () => Promise<void>;
}

const EtablissementContext = createContext<EtablissementContextValue | undefined>(undefined);

export function EtablissementProvider({ children }: PropsWithChildren) {
  const [pret, setPret] = useState(false);
  const [liste, setListe] = useState<Etablissement[]>([]);
  const [actifId, setActifId] = useState('');
  const [espece, setEspece] = useState<EspeceAnimale>(especeCourante());
  // Le rôle du compte connecté (absent hors connexion) : il décide de ce qu'on peut changer ici.
  const [roleCompte, setRoleCompte] = useState<string | undefined>(undefined);
  // L'application s'ouvre toujours sur le choix de l'établissement ; le mode (normal ou avancé) se demande ensuite, pour l'établissement choisi.
  const [selecteurOuvert, setSelecteurOuvert] = useState(true);
  const destinationEnAttente = useRef<(() => string) | undefined>(undefined);
  const peutChangerEtablissement = roleCompte !== 'moderateur' && roleCompte !== 'utilisateur';
  const peutGerer = roleCompte === 'administrateur';

  useEffect(() => {
    Promise.all([initialiserEtablissements(), lireConnexion().catch(() => null)]).then(([{ liste: l, actifId: a }, connexion]) => {
      setListe(l);
      setActifId(a);
      setEspece(especeCourante());
      setRoleCompte(connexion?.role);
      // Un modérateur ou un compte utilisateur n'a pas le choix de son établissement : on passe directement au choix du mode.
      if (connexion?.role === 'utilisateur' || connexion?.role === 'moderateur') setSelecteurOuvert(false);
      setPret(true);
    });
  }, []);

  /** Ouvre un établissement : le mode se choisit ensuite, puis l'accueil s'ouvre (ou directement un écran : `destination`, calculée une fois l'établissement ouvert). */
  const entrer = useCallback(async (id: string, destination?: () => string) => {
    await choisirEtablissementActif(id);
    setActifId(id);
    setEspece(especeCourante());
    destinationEnAttente.current = destination;
    setSelecteurOuvert(false);
  }, []);

  const prendreLaDestination = useCallback(() => {
    const destination = destinationEnAttente.current;
    destinationEnAttente.current = undefined;
    return destination?.();
  }, []);

  // Pas de navigation ni de remontage de l'arbre : les écrans se recréent seuls (voir ecranParEspece).
  const changerEspece = useCallback(async (nouvelle: EspeceAnimale) => {
    await choisirEspeceCourante(nouvelle);
    setEspece(especeCourante());
  }, []);

  /**
   * Relit la liste (serveur, puis copie locale) et le rôle du compte. Appelée après une connexion et à chaque synchronisation : un modérateur
   * ou un utilisateur n'a qu'une exploitation, ouverte tout de suite, sans passer par le choix de l'établissement.
   */
  const recharger = useCallback(async () => {
    await rafraichirEtablissements();
    const connexion = await lireConnexion().catch(() => null);
    setRoleCompte(connexion?.role);
    const l = await listEtablissements();
    setListe(l);
    if ((connexion?.role === 'moderateur' || connexion?.role === 'utilisateur') && l.length > 0) {
      await choisirEtablissementActif(l[0].id);
      setActifId(l[0].id);
      setSelecteurOuvert(false);
    }
    setEspece(especeCourante());
  }, []);

  /** Crée l'établissement (administrateur) et l'ouvre sur ses informations : on les remplit d'abord (statut, régime, TVA, tarifs). */
  const creer = useCallback(
    async (donnees: DonneesEtablissement) => {
      const nouveau = await creerEtablissement(donnees);
      setListe(await listEtablissements());
      await entrer(nouveau.id, () => ROUTES.INFORMATIONS_EXPLOITATION);
    },
    [entrer],
  );

  const modifier = useCallback(async (id: string, donnees: DonneesEtablissement) => {
    await modifierEtablissement(id, donnees);
    setListe(await listEtablissements());
    setEspece(especeCourante());
  }, []);

  const supprimer = useCallback(async (id: string) => {
    const resultat = await supprimerEtablissement(id);
    if (!resultat.supprime) return;
    setListe(await listEtablissements());
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
        peutGerer={peutGerer}
        onChoisir={(id) => entrer(id)}
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
        ouvrirSelecteur: () => {
          if (peutChangerEtablissement) setSelecteurOuvert(true);
        },
        peutChangerEtablissement,
        peutGerer,
        prendreLaDestination,
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
