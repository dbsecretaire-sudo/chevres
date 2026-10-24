import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { libelleChevre } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { especeDe } from '@/features/cheptel/utils/espece';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import { joursAbattusAFacturer, type JourAbattu } from '@/features/comptabilite/utils/animauxVendus';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { idsDesAnimaux, venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useInconsommables } from '@/features/lots-animaux/hooks/useInconsommables';
import { joursDeVie } from '@/features/production/simple/viandeAVendre';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { styles as stylesRoles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';
import { formatDateFR, formatMontant, todayISO } from '@/shared/utils/dates';

const T = TEXTES.production.viande;
const S = TEXTES.production.viande.simple;
const L = TEXTES.production.lotsViandeSimple;

/** Ce que la liste montre : « afacturer » (la viande à facturer et facturée) ou « avendre » (la viande à vendre et vendue). */
export type QuoiLotsViande = 'afacturer' | 'avendre';

/** Une ligne de la liste : son titre, son détail, et si c'est fait (facturée, vendue) ou non. */
interface Ligne {
  cle: string;
  titre: string;
  detail: string;
  fait: boolean;
  prix?: string;
}

const ligneDeVente = (v: Vente): Ligne => ({
  cle: v.id,
  titre: v.precision || LABEL_CATEGORIE_VENTE[v.categorie],
  detail: [formatDateFR(v.date), v.client].filter(Boolean).join(' · '),
  fait: true,
  prix: v.prix === undefined ? undefined : formatMontant(v.prix),
});

/**
 * Les lots de viande du mode normal, sans onglets ni filtres : la viande à facturer (les jours d'abattage « non facturée », les ventes déclarées « facturée »), ou la viande
 * à vendre (les chèvres et cabris sans boucle « non vendu », les ventes sans facture « vendu », mortes ou vivantes). Les lignes ne s'ouvrent pas : on regarde seulement ; le « Retour » est celui du bas de la page.
 */
export function LotsViandeSimple({ quoi }: { quoi: QuoiLotsViande }) {
  const { espece } = useEtablissement();
  const inconsommables = useInconsommables();
  /** Ce qui est lu : les jours d'abattage à facturer, les animaux sans boucle à vendre et les ventes de viande. */
  const [donnees, setDonnees] = useState<{ jours: JourAbattu[]; aVendre: Chevre[]; ventes: Vente[] } | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL) as Promise<Chevre[]>, listToutesVentes()])
        .then(([cheptel, toutes]) => {
          const deLEspece = cheptel.filter((a) => especeDe(a) === espece);
          const vendus = new Set(toutes.flatMap((v) => idsDesAnimaux(v)));
          setDonnees({
            jours: joursAbattusAFacturer(deLEspece, toutes),
            aVendre: deLEspece
              .filter(
                (a) =>
                  !a.numeroBoucle?.trim() && (a.statut === STATUT_CHEVRE.VIVANTE || a.statut === STATUT_CHEVRE.ABATTOIR) && !vendus.has(a.id),
              )
              .sort((a, b) => b.dateNaissance.localeCompare(a.dateNaissance)),
            ventes: toutes.filter(
              (v) => v.categorie === CATEGORIE_VENTE.VIANDE && [espece as string, ACTIVITE_COMMUNE as string].includes(activiteVente(v)),
            ),
          });
        })
        .catch(() => setDonnees({ jours: [], aVendre: [], ventes: [] }));
    }, [espece]),
  );

  /** Les lignes : ce qui reste à faire d'abord, puis ce qui est fait. */
  const lignes: Ligne[] | null = !donnees
    ? null
    : quoi === 'afacturer'
      ? [
          ...donnees.jours
            .map((j) => ({ date: j.date, animaux: j.animaux.filter((a) => !!a.numeroBoucle?.trim() && !inconsommables.has(a.id)) }))
            .filter((j) => j.animaux.length > 0)
            .map<Ligne>((j) => ({ cle: `jour-${j.date}`, titre: T.abattoirLe(formatDateFR(j.date)), detail: T.animaux(j.animaux.length), fait: false })),
          ...donnees.ventes.filter((v) => venteADeclarer(v)).map(ligneDeVente),
        ]
      : [
          ...donnees.aVendre.map<Ligne>((a) => {
            const jours = joursDeVie(a.dateNaissance, todayISO());
            return { cle: a.id, titre: libelleChevre(a), detail: jours === undefined ? '' : S.jours(jours), fait: false };
          }),
          ...donnees.ventes.filter((v) => !venteADeclarer(v)).map(ligneDeVente),
        ];

  const mentionFait = quoi === 'afacturer' ? L.facturee : L.vendu;
  const mentionNonFait = quoi === 'afacturer' ? L.nonFacturee : L.nonVendu;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={stylesRoles.titre}>{quoi === 'afacturer' ? TEXTES.accueil.ferme.terrain.tuiles.viandeAFacturer : TEXTES.accueil.ferme.terrain.tuiles.viandeAVendre}</Text>
      {lignes !== null && lignes.length === 0 ? <Text style={stylesRoles.detail}>{L.rien}</Text> : null}
      {(lignes ?? []).map((l) => (
        <View key={l.cle} style={styles.ligne}>
          <View style={styles.texte}>
            <Text style={styles.titre}>{l.titre}</Text>
            {l.detail ? <Text style={styles.detail}>{l.detail}</Text> : null}
            <Text style={[styles.mention, l.fait ? styles.fait : styles.nonFait]}>{l.fait ? mentionFait : mentionNonFait}</Text>
          </View>
          {l.prix ? <Text style={styles.prix}>{l.prix}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.blanc,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3DFD3',
    padding: 14,
  },
  texte: { flex: 1, gap: 2 },
  titre: { fontSize: 17, fontWeight: '700', color: colors.text },
  detail: { fontSize: 14, color: colors.textMuted },
  mention: { fontSize: 14, fontWeight: '700' },
  fait: { color: colors.primary },
  nonFait: { color: colors.danger },
  prix: { fontSize: 17, fontWeight: '700', color: colors.text },
});
