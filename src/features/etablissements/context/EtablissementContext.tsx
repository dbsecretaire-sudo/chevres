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
  choisirEtablissementActif,
  creerEtablissement,
  initialiserEtablissements,
  modifierEtablissement,
  supprimerEtablissement,
  type DonneesEtablissement,
  type Etablissement,
} from '@/features/etablissements/repository';
import { SelecteurEtablissement } from '@/features/etablissements/components/SelecteurEtablissement';
import { TEXTES } from '@/shared/textes';

interface EtablissementContextValue {
  etablissements: Etablissement[];
  actif: Etablissement;
  ouvrirSelecteur: () => void;
}

const EtablissementContext = createContext<EtablissementContextValue | undefined>(undefined);

export function EtablissementProvider({ children }: PropsWithChildren) {
  const [pret, setPret] = useState(false);
  const [liste, setListe] = useState<Etablissement[]>([]);
  const [actifId, setActifId] = useState('');
  // L'application s'ouvre toujours sur le choix de l'établissement.
  const [selecteurOuvert, setSelecteurOuvert] = useState(true);

  useEffect(() => {
    initialiserEtablissements().then(({ liste: l, actifId: a }) => {
      setListe(l);
      setActifId(a);
      setPret(true);
    });
  }, []);

  const entrer = useCallback(async (id: string) => {
    await choisirEtablissementActif(id);
    setActifId(id);
    setSelecteurOuvert(false);
    setTimeout(() => router.replace('/'), 0);
  }, []);

  const creer = useCallback(
    async (donnees: DonneesEtablissement) => {
      const nouveau = await creerEtablissement(donnees);
      setListe((prev) => [...prev, nouveau]);
      await entrer(nouveau.id);
    },
    [entrer],
  );

  const modifier = useCallback(async (id: string, donnees: DonneesEtablissement) => {
    await modifierEtablissement(id, donnees);
    setListe((prev) => prev.map((e) => (e.id === id ? { ...e, ...donnees, nom: donnees.nom.trim() } : e)));
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await supprimerEtablissement(id);
    setListe((prev) => prev.filter((e) => e.id !== id));
  }, []);

  if (!pret) return null;

  const actif = liste.find((e) => e.id === actifId) ?? liste[0];

  if (selecteurOuvert) {
    return (
      <SelecteurEtablissement
        etablissements={liste}
        actifId={actif.id}
        onChoisir={entrer}
        onCreer={creer}
        onModifier={modifier}
        onSupprimer={supprimer}
        onFermer={() => setSelecteurOuvert(false)}
      />
    );
  }

  return (
    <EtablissementContext.Provider
      value={{ etablissements: liste, actif, ouvrirSelecteur: () => setSelecteurOuvert(true) }}
    >
      {/* Remonter tout l'arbre au changement d'établissement : chaque écran recharge ses données depuis le bon espace de stockage. */}
      <Fragment key={actif.id}>{children}</Fragment>
    </EtablissementContext.Provider>
  );
}

export function useEtablissement(): EtablissementContextValue {
  const ctx = useContext(EtablissementContext);
  if (!ctx) throw new Error(TEXTES.etablissements.etablissementContext.useetablissementDoitEtreUtiliseDans);
  return ctx;
}
