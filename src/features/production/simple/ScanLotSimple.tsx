import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScannerBoucleModal } from '@/features/cheptel/components/ScannerBoucleModal';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import { idsDesFromages } from '@/features/comptabilite/utils/ventes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { lotsDuNumero } from '@/features/production/simple/lotsDuNumero';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit } from '@/features/stock/services/lots';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
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
  const [scanOuvert, setScanOuvert] = useState(false);
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

  const articles = archive ? Object.values(PRODUIT_A_LOTS).flatMap((p) => articlesDuProduit(p, archive, espece)) : [];
  const nomDeLArticle = (cle: string) => articles.find((a) => a.cle === cle)?.libelle ?? '';

  const scanner = (
    <ScannerBoucleModal
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

  // Le lot regardé : ses informations.
  if (choisi) {
    const vente = choisi.venteId ? ventes.find((v) => v.id === choisi.venteId) : undefined;
    const nbLots = vente ? idsDesFromages(vente).length : 0;
    const ok = !!choisi.controleOk && !choisi.dateRappel;
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Text style={stylesRoles.detail}>{nomDeLArticle(choisi.article)}</Text>
        <Text style={stylesRoles.titre}>{T.numero(choisi.numero)}</Text>
        <View style={styles.carte}>
          <Text style={styles.etiquette}>{T.fabrication}</Text>
          <Text style={styles.valeur}>{formatDateFR(choisi.dateFabrication)}</Text>
        </View>
        <View style={styles.carte}>
          <Text style={styles.etiquette}>{T.controle}</Text>
          <View style={styles.ligne}>
            <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={40} color={ok ? colors.primary : colors.danger} />
            <Text style={[styles.valeur, { color: ok ? colors.primary : colors.danger }]}>
              {choisi.dateRappel ? T.rappele(formatDateFR(choisi.dateRappel)) : ok ? T.controleOk : T.controleNonOk}
            </Text>
          </View>
        </View>
        <View style={styles.carte}>
          <Text style={styles.etiquette}>{T.vente}</Text>
          {vente ? (
            <>
              <Text style={styles.valeur}>{vente.prix === undefined ? T.prixInconnu : formatMontant(vente.prix)}</Text>
              {nbLots > 1 ? <Text style={stylesRoles.detail}>{T.pourLots(nbLots)}</Text> : null}
              <Text style={styles.valeur}>{vente.client || T.clientInconnu}</Text>
              <Text style={stylesRoles.detail}>{formatDateFR(vente.date)}</Text>
            </>
          ) : (
            <Text style={styles.valeur}>{choisi.dateVente ? T.venduSansFiche(formatDateFR(choisi.dateVente)) : T.pasVendu}</Text>
          )}
        </View>
        <Button label={T.autreLot} variant="secondary" onPress={() => { setChoisi(null); setTrouves(null); setSaisie(''); }} />
        {lienRetour}
      </ScrollView>
    );
  }

  // Plusieurs lots pour ce numéro : on choisit.
  if (trouves && trouves.length > 1)
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Text style={stylesRoles.titre}>{T.plusieurs}</Text>
        <ListeDeChoix
          presentation="tuiles"
          choix={trouves.map((l) => ({ cle: l.id, libelle: `${nomDeLArticle(l.article)}\n${T.numero(l.numero)}`, icone: 'tag' as const }))}
          onChoisir={(c) => setChoisi(trouves.find((l) => l.id === c.cle) ?? null)}
        />
        <Button label={T.autreLot} variant="secondary" onPress={() => setTrouves(null)} />
        {scanner}
      </ScrollView>
    );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Text style={stylesRoles.titre}>{T.titre}</Text>
      <Text style={stylesRoles.detail}>{T.aide}</Text>
      <Button label={T.scanner} onPress={() => setScanOuvert(true)} />
      <FormField label={T.numeroDuLot} value={saisie} onChangeText={setSaisie} autoCapitalize="characters" />
      <Button label={T.chercher} variant="secondary" disabled={!saisie.trim()} onPress={() => chercher(saisie)} />
      {trouves && trouves.length === 0 ? <Text style={[stylesRoles.detail, { color: colors.danger }]}>{T.introuvable}</Text> : null}
      {lienRetour}
      {scanner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carte: { backgroundColor: colors.blanc, borderRadius: 12, borderWidth: 1, borderColor: '#E3DFD3', padding: 16, gap: 4 },
  etiquette: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  valeur: { fontSize: 22, fontWeight: '800', color: colors.text },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
