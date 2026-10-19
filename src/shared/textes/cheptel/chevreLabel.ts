import { ce, capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;
const Cap = capitaliser;

export const chevreLabelTextes = {
  nomSansBoucle: (nom: string) => `${nom} (sans boucle)`,
  /** Un animal sans boucle ni nom : son type, et rien d'autre (sa naissance et sa sortie sont sur la ligne du dessous). */
  typeSansBoucle: (type: string) => `${type} sans boucle`,
  get chevrette() {
    return V().petitFemelle;
  },
  get chevreau() {
    return V().petitMale;
  },
  /** L'adulte sans boucle, une fois l'âge de petit dépassé (chèvre, bouc, truie, verrat, poule, coq…). */
  get femelleAdulte() {
    return Cap(V().femelle.singulier);
  },
  get maleAdulte() {
    return Cap(V().male.singulier);
  },
  typeSansBoucleNeE: (type: string, valeur: string) => `${type} sans boucle — né(e) le ${valeur}`,
  nee: 'née',
  ne: 'né',
  get ceBouc() {
    return ce(V().male.singulier);
  },
  get ceCabri() {
    return ce(V().petit.singulier);
  },
  get cetteChevre() {
    return `cette ${V().femelle.singulier}`;
  },
} as const;
