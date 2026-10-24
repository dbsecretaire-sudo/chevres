import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { numerosDeBoucles } from '@/features/cheptel/utils/numerosBoucles';
import { useClientsDuDepart } from '@/features/lots-animaux/components/ChoixAcheteurDuDepart';
import { bouclesDuLot } from '@/features/lots-animaux/services/lots';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { nombreDAnimauxDeLaVente } from '@/features/lots-animaux/services/ventesVivants';
import type { EnlevementEquarrissage, LotAnimaux, VenteDAnimauxVivants } from '@/features/settings/settings';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';
import { nomComplet } from '@/shared/utils/personne';

const nomDuFournisseur = (f: Fournisseur): string => (f.nomEntreprise || f.nom || '').trim();

/** Une case « oui / à faire » : un ✓ vert quand c'est fait, sinon la mention en rouge. */
const etat = (fait: boolean, manque: string) =>
  fait ? <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>✓</Text> : <Text style={{ fontSize: 13, color: colors.danger }}>{manque}</Text>;

/**
 * Les bons d'enlèvement en tableau (poste de comptabilité) : le jour, le n° du bon, l'équarrisseur, les animaux enlevés et le bon (✓ quand il est joint). Un clic ouvre le bon.
 */
export function TableauEnlevements({
  enlevements,
  onOuvrir,
  vide,
}: {
  enlevements: readonly EnlevementEquarrissage[];
  onOuvrir: (enlevement: EnlevementEquarrissage) => void;
  vide: string;
}) {
  const T = TEXTES.exploitation.enlevements;
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  useEffect(() => {
    listFournisseurs()
      .then(setFournisseurs)
      .catch(() => undefined);
  }, []);
  const equarrisseur = (e: EnlevementEquarrissage) => {
    const f = fournisseurs.find((x) => x.id === e.contactCle);
    return f ? nomDuFournisseur(f) : '';
  };
  const colonnes: readonly ColonneDuTableau<EnlevementEquarrissage>[] = [
    { cle: 'date', titre: 'Jour', poids: 1.2, valeur: (e) => e.date, texte: (e) => (e.date ? formatDateFR(e.date) : '') },
    { cle: 'bon', titre: 'N° du bon', poids: 1.4, valeur: (e) => e.numeroBon ?? '' },
    { cle: 'equarrisseur', titre: 'Équarrisseur', poids: 1.6, valeur: equarrisseur },
    { cle: 'animaux', titre: 'Animaux', poids: 1, aligne: 'centre', valeur: (e) => numerosDeBoucles(e.boucles).length },
    {
      cle: 'fichier',
      titre: 'Bon joint',
      poids: 1,
      aligne: 'centre',
      valeur: (e) => ((e.fichiers ?? []).length > 0 ? 1 : 0),
      rendu: (e) => etat((e.fichiers ?? []).length > 0, T.bonManque),
    },
  ];
  return <TableauDeDonnees integre colonnes={colonnes} lignes={enlevements} cleDeLaLigne={(e) => e.id} tri={{ cle: 'date', decroissant: true }} vide={vide} onLigne={onOuvrir} />;
}

/**
 * Les bons de livraison de l'abattoir en tableau : le jour, les animaux, le document de circulation (✓ quand il est déposé) et la facture de l'abattoir liée (✓ quand elle l'est).
 */
export function TableauBonsDeLivraison({
  bons,
  onOuvrir,
  vide,
}: {
  bons: readonly LotAnimaux[];
  onOuvrir: (bon: LotAnimaux) => void;
  vide: string;
}) {
  const T = TEXTES.exploitation.bonsDeLivraison;
  const colonnes: readonly ColonneDuTableau<LotAnimaux>[] = [
    { cle: 'date', titre: 'Livraison', poids: 1.2, valeur: (l) => l.abattoir ?? '', texte: (l) => (l.abattoir ? formatDateFR(l.abattoir) : '') },
    { cle: 'animaux', titre: 'Animaux', poids: 1, aligne: 'centre', valeur: (l) => bouclesDuLot(l).length },
    {
      cle: 'document',
      titre: 'Document de circulation',
      poids: 1.4,
      aligne: 'centre',
      valeur: (l) => (l.documentCirculation ? 1 : 0),
      rendu: (l) => etat(!!l.documentCirculation, T.documentManque),
    },
    {
      cle: 'facture',
      titre: 'Facture de l’abattoir',
      poids: 1.4,
      aligne: 'centre',
      valeur: (l) => (l.factureId ? 1 : 0),
      rendu: (l) => etat(!!l.factureId, T.aFacturer),
    },
  ];
  return <TableauDeDonnees integre colonnes={colonnes} lignes={bons} cleDeLaLigne={(l) => l.id} tri={{ cle: 'date', decroissant: true }} vide={vide} onLigne={onOuvrir} />;
}

/**
 * Les ventes d'animaux vivants en tableau : le jour, l'acheteur, les animaux et le document de circulation (✓ quand il est déposé). Un clic ouvre la vente.
 */
export function TableauVentesVivants({
  ventes,
  onOuvrir,
  vide,
}: {
  ventes: readonly VenteDAnimauxVivants[];
  onOuvrir: (vente: VenteDAnimauxVivants) => void;
  vide: string;
}) {
  const T = TEXTES.exploitation.ventesVivants;
  const clients = useClientsDuDepart();
  const acheteur = (v: VenteDAnimauxVivants) => {
    const c = clients.find((x) => x.id === v.contactCle);
    return c ? nomComplet(c) : '';
  };
  const colonnes: readonly ColonneDuTableau<VenteDAnimauxVivants>[] = [
    { cle: 'date', titre: 'Départ', poids: 1.2, valeur: (v) => v.date, texte: (v) => (v.date ? formatDateFR(v.date) : '') },
    { cle: 'acheteur', titre: 'Acheteur', poids: 2, valeur: acheteur },
    { cle: 'animaux', titre: 'Animaux', poids: 1, aligne: 'centre', valeur: nombreDAnimauxDeLaVente },
    {
      cle: 'document',
      titre: 'Document de circulation',
      poids: 1.4,
      aligne: 'centre',
      valeur: (v) => (v.documentCirculation ? 1 : 0),
      rendu: (v) => etat(!!v.documentCirculation, T.documentManque),
    },
  ];
  return <TableauDeDonnees integre colonnes={colonnes} lignes={ventes} cleDeLaLigne={(v) => v.id} tri={{ cle: 'date', decroissant: true }} vide={vide} onLigne={onOuvrir} />;
}

