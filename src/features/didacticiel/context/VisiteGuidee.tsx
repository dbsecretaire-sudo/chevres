import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { etapesDeLaVisite, pageDeLEtape, type EtapeVisite } from '@/features/didacticiel/services/visiteGuidee';

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
  /** Ramène à la page de l'étape en cours (quand on s'en est éloigné). */
  reprendre: () => void;
}

const Contexte = createContext<ContexteVisite | null>(null);

/** La visite guidée : l'étape en cours (gardée sur l'appareil), qui suit les pages que l'utilisateur ouvre en touchant les boutons de l'interface. */
export function VisiteGuideeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const adresse = usePathname();
  const etapes = useMemo(() => etapesDeLaVisite(), []);
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
  // La visite suit l'utilisateur : une page qui est celle d'une étape suivante (ou, à défaut, d'une étape précédente) reprend la visite à cette étape.
  const index = useMemo(() => {
    if (!etat.actif) return etat.index;
    const courante = etapes[etat.index];
    if (courante && pageDeLEtape(courante.route, adresse)) return etat.index;
    const avant = etapes.findIndex((e, i) => i > etat.index && pageDeLEtape(e.route, adresse));
    if (avant >= 0) return avant;
    for (let i = etat.index - 1; i >= 0; i--) if (pageDeLEtape(etapes[i].route, adresse)) return i;
    return etat.index;
  }, [etapes, etat, adresse]);

  // L'étape retrouvée devient l'étape en cours (pour que la suite reparte d'elle).
  if (etat.actif && index !== etat.index) setEtat({ actif: true, index });

  // L'étape en cours est gardée sur l'appareil.
  useEffect(() => {
    if (charge.current) AsyncStorage.setItem(CLE_STOCKAGE, JSON.stringify({ actif: etat.actif, index })).catch(() => undefined);
  }, [etat.actif, index]);

  const demarrer = useCallback(() => {
    setEtat({ actif: true, index: 0 });
    router.push('/' as never);
  }, [router]);
  const quitter = useCallback(() => setEtat({ actif: false, index: 0 }), []);
  const suivant = useCallback(
    () => setEtat(index + 1 >= etapes.length ? { actif: false, index: 0 } : { actif: true, index: index + 1 }),
    [index, etapes.length],
  );
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
      surLaPage: !!etape && pageDeLEtape(etape.route, adresse),
      demarrer,
      suivant,
      quitter,
      reprendre,
    }),
    [etat.actif, index, etapes.length, etape, adresse, demarrer, suivant, quitter, reprendre],
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
      reprendre: () => undefined,
    };
  }
  return contexte;
}
