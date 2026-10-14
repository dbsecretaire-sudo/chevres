import type { Commande } from '@/features/commercial/types';
import { totalCommande, totalLigne } from '@/features/commercial/services/commandes';
import {
  documentHtml,
  ecrireEtPartagerPdf,
  noteHtml,
  sectionHtml,
  tableauHtml,
} from '@/features/export/services/htmlPdf';
import { getSettings } from '@/features/settings/settings';
import { NOM_FICHIER_BON_LIVRAISON } from '@/shared/constants/commercial';
import { FORMAT_EXPORT } from '@/shared/constants/export';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';

const P = TEXTES.commercial.bonLivraison;

/** Le bon de livraison d'une commande en PDF : le client, la date de livraison, les fromages (quantité, prix, total) et le total. */
export async function exporterBonLivraisonPdf(commande: Commande): Promise<void> {
  const settings = await getSettings();
  const lignes = [
    ...commande.lignes.map((l) => ({
      [P.colonnes.fromage]: l.libelle,
      [P.colonnes.quantite]: String(l.quantite),
      [P.colonnes.prix]: formatMontant(l.prixUnitaire),
      [P.colonnes.total]: formatMontant(totalLigne(l)),
    })),
    {
      [P.colonnes.fromage]: P.total,
      [P.colonnes.quantite]: String(commande.lignes.reduce((t, l) => t + l.quantite, 0)),
      [P.colonnes.prix]: '',
      [P.colonnes.total]: formatMontant(totalCommande(commande)),
    },
  ];
  const corps = sectionHtml(
    P.client(commande.client),
    [
      commande.livraisonPrevue ? noteHtml(P.livraison(formatDateFR(commande.livraisonPrevue))) : '',
      tableauHtml(lignes, '', { totaux: true }),
      commande.note ? noteHtml(`${P.note} : ${commande.note}`) : '',
    ].join(''),
  );
  await ecrireEtPartagerPdf(
    documentHtml(P.titre, settings.exploitation, corps, especesActives(), undefined, {
      sousTitre: P.sousTitre(commande.numero),
    }),
    `${NOM_FICHIER_BON_LIVRAISON}_${commande.numero}.${FORMAT_EXPORT.PDF}`,
    P.titre,
  );
}
