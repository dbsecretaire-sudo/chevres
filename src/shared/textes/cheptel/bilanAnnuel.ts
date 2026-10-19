import { agePetitMax } from '@/shared/constants/cheptel';
import { libelleDuree } from '@/shared/utils/age';
import { capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;
const Cap = capitaliser;

export const bilanAnnuelTextes = {
  comparaisonEspace: 'Comparaison ',
  precedenteAnneeEntreParenthesesDeuxPoints: '(précédente année entre parenthèses : ',
  nesEntreLe0101: 'Nés entre le 01/01 et le 31/12/',
  vendusAbattoirAutoConsommationComptent: '. Vendus/Abattoir/Auto-consommation comptent les sorties de',
  get pourToutCabriEncoreAge() {
    return `pour tout ${V().petit.singulier} encore âgé de moins de ${libelleDuree(agePetitMax())} à ce moment-là, même né l’année précédente.`;
  },
  t1erSemestreTardifsValeur: (valeur: number) => `1er semestre (tardifs ${valeur})`,
  t2eSemestreCabrisAnnee: (annee: number) => `2e semestre (${V().petit.pluriel} ${annee})`,
  /** Les ventes déclarées dans la comptabilité : la fiche de l'animal passe en vendu. */
  vendusStock: 'Vendus (inventaire)',
  venduesStock: 'Vendues (inventaire)',
  /** La déclaration à la Chambre d'agriculture, jointe au bilan de l'année (fichier rangé avec la sauvegarde et sur Drive). */
  declaration: {
    titre: (annee: number) => `Déclaration à la Chambre d’agriculture ${annee}`,
    aucune: 'Aucune déclaration jointe pour cette année.',
    joindre: 'Joindre un fichier',
    remplacer: 'Remplacer le fichier',
  },
  autoConsommation: 'Auto-consommation',
  mortNes: 'Mort-nés',
  get totalCabris() {
    return `Total ${V().petit.pluriel}`;
  },
  get chevresFemelles6MoisEt() {
    return `${Cap(V().femelle.pluriel)} (${libelleDuree(agePetitMax())} et plus) vivantes au 31/12/`;
  },
  reconstitueAPartirDesStatuts: ', reconstitué à partir des statuts actuels.',
  renouvellementDesigneesCetteAnnee: 'Renouvellement (désignées cette année)',
  plusAnciennes: 'Plus anciennes',
  misesBasPortees: 'Mises bas (portées)',
  get boucsMales6MoisEt() {
    return `${Cap(V().male.pluriel)} (${libelleDuree(agePetitMax())} et plus) vivants au 31/12/`;
  },
  renouvellementDesignesCetteAnnee: 'Renouvellement (désignés cette année)',
  plusAnciens: 'Plus anciens',
  morts: 'Morts',
  /** La carte de l'effectif : l'effectif de fin d'année, l'UGB et la prime prévisionnelle. */
  effectifEtUgb: {
    titre: 'Effectif et UGB prévisionnel',
    effectifActuel: 'Effectif actuel',
    effectifDeclare: 'Effectif déclaré',
    primeDifferente: (debut: string, fin: string) =>
      `La prime ne correspond pas au montant perçu entre le ${debut} et le ${fin}`,
    percu: (montant: string, debut: string, fin: string) => `Perçu du ${debut} au ${fin} : ${montant}`,
    effectifDeclarePlaceholder: 'à saisir',
    ugbPrevisionnel: 'UGB prévisionnel',
    primePrevisionnelle: 'Prime prévisionnelle',
    formule: '(UGB × taux €)',
    detail: {
      titre: 'Calcul de l’UGB et des primes',
      sevres: (nombre: number, coefficient: string) => `Animaux sevrés : ${nombre} × ${coefficient}`,
      declare: (nombre: number, coefficient: string) => `Effectif déclaré : ${nombre} × ${coefficient}`,
      petits: (nombre: number, coefficient: string) => `Petits non sevrés : ${nombre} × ${coefficient}`,
      ugb: (valeur: string) => `UGB prévisionnel : ${valeur}`,
      hectares: (valeur: string) => `Hectares admissibles : ${valeur} ha`,
      ligne: (nom: string, quantite: string, unite: string, taux: string, montant: string) =>
        `${nom} : ${quantite} ${unite} × ${taux} = ${montant}`,
      total: (montant: string) => `Total : ${montant}`,
      aucunePrime:
        'Aucune prime renseignée : cochez-les et saisissez leur montant dans Organisation › Cheptel.',
      note: 'Une indication d’après vos coefficients, vos montants et vos plafonds (réglables dans Organisation › Cheptel) : les autres conditions d’éligibilité ne sont pas calculées.',
      plafonne: (compte: string, brut: string, unite: string) =>
        `Plafonné : ${compte} ${unite} comptés sur ${brut}`,
      sousMinimum: (minimum: string, unite: string) =>
        `Seuil non atteint (${minimum} ${unite} au moins) : aucune aide`,
      degressif: 'Zone dégressive par tranches',
      partFixe: (quantite: string, unite: string, taux: string, montant: string) =>
        `Part fixe : ${quantite} ${unite} × ${taux} = ${montant}`,
      partZone: (quantite: string, unite: string, taux: string, montant: string) =>
        `Zone : ${quantite} ${unite} pleins × ${taux} = ${montant}`,
      ligneTotale: (nom: string, montant: string) => `${nom} : ${montant}`,
      zones: (detail: string) => `Zones de l’ICHN : ${detail}`,
      /** Les deux réductions du paiement de base : la plus élevée est retenue, l'autre reste enregistrée et ne change rien. */
      reductionBudgetaireRetenue: (pourcentage: string, avant: string, reduction: string) =>
        `Réduction pour plafonnement budgétaire : ${pourcentage} % de ${avant} = − ${reduction} (le taux le plus élevé est retenu)`,
      reductionBudgetaireNonRetenue: (pourcentage: string, reduction: string) =>
        `Réduction pour plafonnement budgétaire de ${pourcentage} % (− ${reduction}) : moins élevée que celle du stabilisateur, sans effet`,
      stabilisateurRetenu: (stabilisateur: string, pourcentage: string, avant: string, reduction: string) =>
        `Stabilisateur de ${stabilisateur} % : réduction de ${pourcentage} % de ${avant} = − ${reduction} (le taux le plus élevé est retenu)`,
      stabilisateurNonRetenu: (stabilisateur: string, pourcentage: string, reduction: string) =>
        `Stabilisateur de ${stabilisateur} % (réduction de ${pourcentage} %, − ${reduction}) : moins élevé que la réduction pour plafonnement budgétaire, sans effet`,
      tauxLimite: (taux: string, unite: string) => `Montant limité à ${taux} par ${unite}`,
      parametrer: 'Paramétrer l’UGB et les primes',
      fermer: 'Fermer',
    },
  },
} as const;
