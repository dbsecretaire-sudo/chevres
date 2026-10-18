import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useDeuxColonnes } from '@/bureau/colonnes';
import { estBureau } from '@/shared/utils/plateforme';
import { etapeApresUnMenu, etapeDeLaPage, etapeSuivante, etapeSurLaPage, etapesDeLaVisite, etapesPourLEcran, type EtapeVisite } from '@/features/didacticiel/services/visiteGuidee';

const CLE_STOCKAGE = 'troupeau:v1:visite-guidee';

interface EtatVisite {
  actif: boolean;
  index: number;
}

interface ContexteVisite {
  actif: boolean;
  index: number;
  total: number;
  /** L'étape en cours, quelle que soit la page où l'on est. */
  etape: EtapeVisite | undefined;
  /** Vrai quand la page courante est celle de l'étape en cours : sinon, la visite attend qu'on y revienne. */
  surLaPage: boolean;
  demarrer: () => void;
  suivant: () => void;
  quitter: () => void;
  /** Un choix dans un menu de la barre du haut (Windows) : si l'étape demandait d'ouvrir un menu, elle est validée. */
  menuChoisi: (route: string) => void;
  /** L'élément à toucher de l'étape vient d'être touché : l'étape est validée, même quand le toucher ne change pas de page. */
  valider: () => void;
  /** Ramène à la page de l'étape en cours (quand on s'en est éloigné). */
  reprendre: () => void;
}

const Contexte = createContext<ContexteVisite | null>(null);

/** La visite guidée : l'étape en cours (gardée sur l'appareil), qui suit les pages que l'utilisateur ouvre en touchant les boutons de l'interface. */
export function VisiteGuideeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const adresse = usePathname();
  // Sur Windows (deux colonnes), le menu de la rubrique est toujours à gauche : les étapes « revenir au menu » n'ont pas lieu d'être.
  const colonnes = useDeuxColonnes();
  const etapes = useMemo(() => etapesPourLEcran(etapesDeLaVisite(), estBureau(), colonnes), [colonnes]);
  const [etat, setEtat] = useState<EtatVisite>({ actif: false, index: 0 });
  const charge = useRef(false);

  // L'étape reprise au démarrage de l'application.
  useEffect(() => {
    AsyncStorage.getItem(CLE_STOCKAGE)
      .then((brut) => {
        if (brut) setEtat(JSON.parse(brut) as EtatVisite);
      })
      .catch(() => undefined)
      .finally(() => {
        charge.current = true;
      });
  }, []);
  // La visite suit l'utilisateur quand il change de page : une page qui est celle d'une étape suivante (ou, à défaut, d'une étape précédente)
  // reprend la visite à cette étape. Seul un changement de page y touche : « Suivant » choisit son étape, et la page suit.
  const [pageVue, setPageVue] = useState(adresse);
  if (adresse !== pageVue) {
    setPageVue(adresse);
    if (etat.actif) {
      const trouvee = etapeDeLaPage(etapes, etat.index, adresse, colonnes);
      if (trouvee !== etat.index) setEtat({ actif: true, index: trouvee });
    }
  }
  const index = etat.index;

  // L'étape en cours est gardée sur l'appareil.
  useEffect(() => {
    if (charge.current) AsyncStorage.setItem(CLE_STOCKAGE, JSON.stringify({ actif: etat.actif, index })).catch(() => undefined);
  }, [etat.actif, index]);

  const demarrer = useCallback(() => {
    setEtat({ actif: true, index: 0 });
    router.push('/' as never);
  }, [router]);
  const quitter = useCallback(() => setEtat({ actif: false, index: 0 }), []);
  const menuChoisi = useCallback(
    (route: string) =>
      setEtat((avant) => {
        if (!avant.actif) return avant;
        const suite = etapeApresUnMenu(etapes, avant.index, route, colonnes);
        return suite === null || suite === avant.index ? avant : { actif: true, index: suite };
      }),
    [etapes, colonnes],
  );
  const valider = useCallback(
    () =>
      setEtat((avant) => (avant.actif && avant.index + 1 < etapes.length ? { actif: true, index: avant.index + 1 } : avant)),
    [etapes.length],
  );
  const suivant = useCallback(() => {
    const prochaine = etapeSuivante(etapes, index, adresse, colonnes);
    if (!prochaine) {
      setEtat({ actif: false, index: 0 });
      return;
    }
    setEtat({ actif: true, index: prochaine.index });
    if (prochaine.ouvrir) router.push(prochaine.ouvrir as never);
  }, [etapes, index, adresse, colonnes, router]);
  const etape = etat.actif ? etapes[index] : undefined;
  const reprendre = useCallback(() => {
    const route = etape?.route;
    router.push((typeof route === 'string' ? route : '/') as never);
  }, [etape, router]);

  const valeur = useMemo<ContexteVisite>(
    () => ({
      actif: etat.actif,
      index,
      total: etapes.length,
      etape,
      surLaPage: etapeSurLaPage(etape, adresse, colonnes),
      demarrer,
      suivant,
      quitter,
      menuChoisi,
      valider,
      reprendre,
    }),
    [etat.actif, index, etapes.length, etape, adresse, colonnes, demarrer, suivant, quitter, menuChoisi, valider, reprendre],
  );
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

/** La visite guidée en cours (rien d'actif hors du fournisseur). */
export function useVisiteGuidee(): ContexteVisite {
  const contexte = useContext(Contexte);
  if (!contexte) {
    return {
      actif: false,
      index: 0,
      total: 0,
      etape: undefined,
      surLaPage: false,
      demarrer: () => undefined,
      suivant: () => undefined,
      quitter: () => undefined,
      menuChoisi: () => undefined,
      valider: () => undefined,
      reprendre: () => undefined,
    };
  }
  return contexte;
}
