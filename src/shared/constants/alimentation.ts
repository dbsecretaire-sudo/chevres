/** Repères d'alimentation par espèce — à modifier ici uniquement. */

import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';

/** À quel point un repère est sûr : une référence technique, une observation d'élevage, ou une estimation (un calcul à partir d'un autre chiffre). */
export const FIABILITE_REPERE = {
  REFERENCE: 'reference',
  OBSERVATION: 'observation',
  ESTIMATION: 'estimation',
} as const;

/** L'unité d'un repère : grammes d'aliment par animal et par jour, ou kilos. */
export const UNITE_REPERE = {
  G_PAR_JOUR: 'g_jour',
  KG_PAR_JOUR: 'kg_jour',
  KG_MS_PAR_JOUR: 'kg_ms_jour',
  G_CONCENTRE_PAR_LITRE: 'g_par_litre',
  /** Le lait d'une chèvre sur sa lactation (litres). */
  L_PAR_LACTATION: 'l_lactation',
} as const;

export interface RepereAlimentation {
  /** Ce qu'il mesure (« Poule pondeuse adulte »). */
  libelle: string;
  min: number;
  max: number;
  unite: (typeof UNITE_REPERE)[keyof typeof UNITE_REPERE];
  fiabilite: (typeof FIABILITE_REPERE)[keyof typeof FIABILITE_REPERE];
  /** D'où vient le chiffre (sa source, telle qu'on peut la retrouver). */
  source: string;
}

/**
 * Les repères d'alimentation (et de production) trouvés pour chaque espèce, avec leur source. Ce sont des ordres de grandeur d'élevage, pas des rations :
 * la ration juste dépend de la race, du stade, de la production et des aliments. Les chiffres viennent de documents techniques et
 * d'observations d'élevage (recherche du 12/10/2026) ; ceux qui sont des estimations le disent. Les brebis n'ont aucun repère chiffré
 * sûr trouvé : on renvoie aux tables de l'INRAE et de l'Institut de l'élevage.
 */
export const REPERES_ALIMENTATION: Record<string, readonly RepereAlimentation[]> = {
  [TYPE_ANIMAL_ETABLISSEMENT.POULES]: [
    {
      libelle: 'Poule pondeuse adulte, aliment complet',
      min: 110,
      max: 130,
      unite: UNITE_REPERE.G_PAR_JOUR,
      fiabilite: FIABILITE_REPERE.REFERENCE,
      source:
        'Guide technique Hellopro (110 à 130 g, souvent 120-125 g) ; cours sur les petits élevages (120 à 135 g au pic de ponte)',
    },
  ],
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: [
    {
      libelle: 'Truie gestante',
      min: 2.5,
      max: 3,
      unite: UNITE_REPERE.KG_PAR_JOUR,
      fiabilite: FIABILITE_REPERE.OBSERVATION,
      source:
        'Chambres d’agriculture, fiches sur l’alimentation des porcs en agriculture biologique (2,6 kg en moyenne)',
    },
    {
      libelle: 'Truie allaitante',
      min: 4,
      max: 7,
      unite: UNITE_REPERE.KG_PAR_JOUR,
      fiabilite: FIABILITE_REPERE.OBSERVATION,
      source: 'Fiches techniques porcs ; INRAE : plus de 6 kg pour une forte productrice',
    },
    {
      libelle: 'Porc charcutier à l’engrais',
      min: 2,
      max: 2.7,
      unite: UNITE_REPERE.KG_PAR_JOUR,
      fiabilite: FIABILITE_REPERE.ESTIMATION,
      source:
        'Environ 290 à 300 kg d’aliment par porc sur 4 à 5 mois (calcul) ; Ifip : plafond de rationnement de 2,4 à 2,7 kg en finition',
    },
  ],
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: [
    {
      libelle: 'Vache laitière, ingestion de matière sèche (pour 26 à 27 litres par jour)',
      min: 20.6,
      max: 21.2,
      unite: UNITE_REPERE.KG_MS_PAR_JOUR,
      fiabilite: FIABILITE_REPERE.OBSERVATION,
      source: 'Observatoire Res’alim, élevages de Bretagne, 2022 à 2024 (CNIEL)',
    },
    {
      libelle: 'Vache laitière, concentré par litre de lait',
      min: 130,
      max: 220,
      unite: UNITE_REPERE.G_CONCENTRE_PAR_LITRE,
      fiabilite: FIABILITE_REPERE.ESTIMATION,
      source:
        'INRAE / Institut de l’élevage, réseaux d’élevage (2008) : 220 g ; 3,6 kg de concentré pour 27 litres en 2024 : environ 130 g',
    },
  ],
  // Les chèvres sont de race Corse : petite (30 à 40 kg), rustique, au lait modeste, qui valorise le maquis. Les repères des races
  // laitières spécialisées (Saanen, Alpine : 60 kg et 4 litres par jour) ne s'y appliquent pas.
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: [
    {
      libelle:
        'Chèvre corse : lait sur une lactation (181 litres en 205 jours de traite à 235 litres en 225 jours)',
      min: 181,
      max: 235,
      unite: UNITE_REPERE.L_PAR_LACTATION,
      fiabilite: FIABILITE_REPERE.OBSERVATION,
      source:
        'Capgènes, fiche de la race Corse (contrôle laitier, environ 2 800 femelles : 181 L en 205 jours) ; Réussir, fiche de la race (235 L en 225 jours)',
    },
  ],
};

/** Le lait d'une chèvre corse sur sa lactation d'après le contrôle laitier (Capgènes) : de quoi retrouver un litrage par jour de traite. */
export const LAIT_CHEVRE_CORSE_CONTROLE = { litres: 181, joursDeTraite: 205 } as const;

/**
 * Les besoins d'une chèvre laitière d'après les équations de l'INRA (2007, Sauvant et coll.), relevées dans une source secondaire à
 * vérifier dans les tables d'origine : UFL = 0,79 + 0,01 (PV − 60) + 0,40 × PL35 ; PDI = 50 + 0,62 (PV − 60) + 45 × PL35, où PV est le
 * poids vif (kg) et PL35 le lait (kg par jour) ramené à 35 g de matière grasse par litre.
 */
export const EQUATIONS_BESOINS_CHEVRE = {
  poidsReference: 60,
  uflBase: 0.79,
  uflParKgPoids: 0.01,
  uflParKgLait: 0.4,
  pdiBase: 50,
  pdiParKgPoids: 0.62,
  pdiParKgLait: 45,
} as const;

/**
 * Le poids vif d'une chèvre corse (kg) : les femelles pèsent de 30 à 40 kg (Capgènes), on prend le milieu. Une hypothèse de calcul,
 * affichée comme telle. Les équations de l'INRA ont été établies pour des races laitières plus lourdes : appliquées à une chèvre corse
 * rustique, qui trouve une partie de sa ration au parcours, elles ne donnent qu'un ordre de grandeur.
 */
export const POIDS_VIF_CHEVRE_PAR_DEFAUT = 35;
