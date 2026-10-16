import type { Commande, VisiteAgritourisme } from '@/features/commercial/types';
import { montantVisite } from '@/features/commercial/services/agritourisme';
import { totalCommande } from '@/features/commercial/services/commandes';
import { LABEL_STATUT_COMMANDE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import { formatDateShortFR } from '@/shared/utils/dates';

const C = TEXTES.export.xlsxExport.commercial.colonnes;

/** Une visite d'agritourisme : date, groupe, formule, personnes, prix, recette, coût estimé, état et paiement. */
export function visiteAgritourismeRow(v: VisiteAgritourisme) {
  return {
    [C.date]: formatDateShortFR(v.date),
    [C.client]: v.client,
    [C.formule]: v.formule,
    [C.personnes]: v.participants,
    [C.prixParPersonne]: v.prixParPersonne,
    [C.recette]: montantVisite(v),
    [C.etat]: TEXTES.commercial.agritourisme.statuts[v.statut],
    [C.aEncaisser]: v.enAttente ? (v.echeance ? formatDateShortFR(v.echeance) : C.oui) : '',
    [C.note]: v.note ?? '',
  };
}

/** Une commande de client : numéro, date, client, livraison, état, fromages commandés et total. */
export function commandeRow(c: Commande) {
  return {
    [C.numero]: c.numero,
    [C.date]: formatDateShortFR(c.date),
    [C.client]: c.client,
    [C.livraison]: c.livraisonPrevue ? formatDateShortFR(c.livraisonPrevue) : '',
    [C.etat]: LABEL_STATUT_COMMANDE[c.statut],
    [C.articles]: c.lignes.map((l) => `${l.quantite} × ${l.libelle}`).join(' ; '),
    [C.total]: totalCommande(c),
    [C.note]: c.note ?? '',
  };
}
