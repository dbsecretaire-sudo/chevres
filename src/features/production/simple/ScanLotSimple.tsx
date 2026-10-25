import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScannerBoucleModal } from '@/features/cheptel/components/ScannerBoucleModal';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { formaterNumeroDeLot, lettresDesNumeros, lotsDuNumero } from '@/features/production/simple/lotsDuNumero';
import { ClavierNumerique } from '@/features/berger/components/ClavierNumerique';
import { lireArchiveStock } from '@/features/stock/repository';
import { etiquetteDuLot } from '@/features/stock/services/etiquetteLot';
import { articlesDuProduit, estArticleFromage, etatDuLot } from '@/features/stock/services/lots';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { ETAT_LOT, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { styles as stylesRoles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';

const T = TEXTES.production.scanLotSimple;

/**
 * « Scanner un lot » au plus simple : on photographie (ou on tape) le numéro du lot, et la page montre ce qu'on sait de lui — sa date de fabrication, son contrôle (✓ vert, ou
 * ✗ rouge avec la date du rappel), et, s'il est vendu, le prix de la vente et le client. En lecture seule : le contrôle et les rappels se font dans le mode avancé.
 */
export function ScanLotSimple({ onRetour }: { onRetour?: () => void }) {
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [saisie, setSaisie] = useState('');
  // L'appareil photo s'ouvre d'office (« Annuler » mène à la saisie du numéro) ; il se rouvre pour scanner un autre lot.
  const [scanOuvert, setScanOuvert] = useState(true);
  /** Les lots trouvés pour le numéro cherché (rien tant qu'on n'a pas cherché), et celui qu'on regarde. */
  const [trouves, setTrouves] = useState<LotFromage[] | null>(null);
  const [choisi, setChoisi] = useState<LotFromage | null>(null);

  useEffect(() => {
    Promise.all([lireArchiveStock(), listToutesVentes()])
      .then(([stock, toutes]) => {
        setArchive(stock);
        setVentes(toutes);
      })
      .catch(() => undefined);
  }, []);

  const chercher = (texte: string) => {
    const lots = lotsDuNumero(archive?.lots ?? [], texte);
    setTrouves(lots);
    setChoisi(lots.length === 1 ? lots[0] : null);
  };

  /** Les numéros de lot connus : de quoi placer le « - » et choisir les lettres du clavier. */
  const numeros = (archive?.lots ?? []).map((l) => l.numero);
  const articles = archive ? Object.values(PRODUIT_A_LOTS).flatMap((p) => articlesDuProduit(p, archive, espece)) : [];
  const nomDeLArticle = (cle: string) => articles.find((a) => a.cle === cle)?.libelle ?? '';

  const scanner = (
    <ScannerBoucleModal
      lot
      visible={scanOuvert}
      onClose={() => setScanOuvert(false)}
      onDetected={(lu) => {
        setSaisie(lu);
        chercher(lu);
      }}
    />
  );

  /** Le retour à la page d'avant, quand elle est donnée (le menu de la fromagerie du mode normal) ; sinon c'est celui de la barre du bas. */
  const lienRetour = onRetour ? (
    <Pressable style={stylesRoles.discret} onPress={onRetour} accessibilityRole="button">
      <Text style={stylesRoles.discretTexte}>{TEXTES.production.fabricationSimple.retour}</Text>
    </Pressable>
  ) : null;

  // Le lot regardé, au centre de la page : le produit, sa fabrication, sa DLC, le stock restant, puis une grande coche verte (contrôle ok) ou une croix rouge (avec la date du
  // rappel), et enfin la vente (prix et client).
  if (choisi) {
    const vente = choisi.venteId ? ventes.find((v) => v.id === choisi.venteId) : undefined;
    const ok = !!choisi.controleOk && !choisi.dateRappel;
    const restant = (archive?.lots ?? []).filter((l) => l.article === choisi.article && etatDuLot(l) === ETAT_LOT.EN_STOCK).length;
    // La DLC d'un plat ou d'un savon vient de sa fabrication ; celle d'un fromage reste à configurer.
    const etiquette = archive ? etiquetteDuLot(choisi, archive) : undefined;
    const dlc = etiquette?.dlc ?? etiquette?.ddm;
    return (
      <ScrollView contentContainerStyle={styles.centre}>
        <Text style={styles.produit}>{estArticleFromage(choisi.article) ? `Fromage ${nomDeLArticle(choisi.article).toLowerCase()}` : nomDeLArticle(choisi.article)}</Text>
        <Text style={styles.petit}>{T.numero(choisi.numero)}</Text>
        <Text style={styles.ligne}>{T.fabricationLe(formatDateFR(choisi.dateFabrication))}</Text>
        {dlc ? <Text style={styles.ligne}>{T.dlc(formatDateFR(dlc))}</Text> : estArticleFromage(choisi.article) ? <Text style={styles.ligne}>{T.dlcAConfigurer}</Text> : null}
        {choisi.lait ? <Text style={styles.ligne}>{T.variante(choisi.sale, choisi.lait)}</Text> : null}
        <Text style={styles.ligne}>{T.stockRestant(restant)}</Text>
        <Ionicons
          name={ok ? 'checkmark-circle-outline' : 'close-circle-outline'}
          size={190}
          color={ok ? colors.success : colors.danger}
          accessibilityLabel={ok ? T.controleOk : T.controleNonOk}
          style={styles.symbole}
        />
        {choisi.dateRappel ? <Text style={styles.ligne}>{T.rappeleLe(formatDateFR(choisi.dateRappel))}</Text> : null}
        {vente ? (
          <>
            <Text style={styles.ligne}>{T.venteDe(vente.prix === undefined ? T.prixInconnu : formatMontant(vente.prix))}</Text>
            <Text style={styles.ligne}>{T.clientDe(vente.client || T.clientInconnu)}</Text>
          </>
        ) : (
          <Text style={styles.ligne}>{choisi.dateVente ? T.venduSansFiche(formatDateFR(choisi.dateVente)) : T.pasVendu}</Text>
        )}
        <Button label={T.autreLot} variant="secondary" style={styles.pleine} onPress={() => { setChoisi(null); setTrouves(null); setSaisie(''); setScanOuvert(true); }} />
        {lienRetour}
      </ScrollView>
    );
  }

  // Plusieurs lots pour ce numéro : on choisit.
  if (trouves && trouves.length > 1)
    return (
      <ScrollView contentContainerStyle={styles.centre}>
        <Text style={stylesRoles.titre}>{T.plusieurs}</Text>
        <ListeDeChoix
          presentation="tuiles"
          choix={trouves.map((l) => ({ cle: l.id, libelle: `${nomDeLArticle(l.article)}\n${T.numero(l.numero)}`, icone: 'tag' as const }))}
          onChoisir={(c) => setChoisi(trouves.find((l) => l.id === c.cle) ?? null)}
        />
        <Button label={T.autreLot} variant="secondary" style={styles.pleine} onPress={() => setTrouves(null)} />
        {scanner}
      </ScrollView>
    );

  return (
    <ScrollView contentContainerStyle={[styles.centre, { gap: 12 }]} keyboardShouldPersistTaps="handled">
      <Text style={stylesRoles.titre}>{T.titre}</Text>
      <Text style={stylesRoles.detail}>{T.aide}</Text>
      <Button label={T.scanner} style={styles.pleine} onPress={() => setScanOuvert(true)} />
      <ClavierNumerique valeur={saisie} onChange={setSaisie} lettres={lettresDesNumeros(numeros)} />
      {/* Le numéro tapé : centré, non modifiable à la main, avec son « - » placé tout seul. */}
      <View style={[stylesRoles.affichageNumero, styles.pleine]} accessibilityLabel={`${T.numeroDuLot} ${saisie}`}>
        <Text style={stylesRoles.affichageNumeroTexte}>{formaterNumeroDeLot(saisie, numeros)}</Text>
      </View>
      <Button label={T.chercher} variant="secondary" style={styles.pleine} disabled={!saisie.trim()} onPress={() => chercher(saisie)} />
      {trouves && trouves.length === 0 ? <Text style={[stylesRoles.detail, { color: colors.danger }]}>{T.introuvable}</Text> : null}
      {lienRetour}
      {scanner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Le contenu est centré dans la page, en largeur comme en hauteur.
  centre: { flexGrow: 1, padding: 16, gap: 6, alignItems: 'center', justifyContent: 'center' },
  produit: { fontSize: 38, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 12 },
  petit: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 6 },
  ligne: { fontSize: 20, color: colors.text, textAlign: 'center' },
  symbole: { marginVertical: 10 },
  // Un bouton ou un champ : toute la largeur de la page, sans dépasser 420 px, centré.
  pleine: { width: '100%', maxWidth: 420 },
});
