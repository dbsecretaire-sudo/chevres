import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { exporterEtiquettesLotPdf } from '@/features/export/documents/etiquettesLotPdf';
import { enregistrerLaVente } from '@/features/comptabilite/hooks/nouvelleEcriture/enregistrement';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { fromageDeLArticle } from '@/features/production/simple/fromageDeLArticle';
import type { ProduitVendu } from '@/features/production/simple/VenteProduitSimple';
import { lireArchiveStock } from '@/features/stock/repository';
import { etiquetteDuLot } from '@/features/stock/services/etiquetteLot';
import { articlesDuProduit, enregistrerPeseeDuLot, lotsAChoisir } from '@/features/stock/services/lots';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { SelectField } from '@/shared/components/SelectField';
import { Button } from '@/shared/components/Button';
import { CIRCUIT_VENTE } from '@/shared/constants/commercial';
import { TYPE_CHOIX_FACTURE, UNITE_VENTE } from '@/shared/constants/comptabilite';
import { tauxTvaDeLaVente } from '@/shared/dictionnaire/tauxParProduit';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';
import { colors } from '@/shared/theme/colors';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';

/** Une pièce en stock : son lot, et le nom de son article. */
interface PieceEnStock {
  lot: LotFromage;
  libelle: string;
}

/**
 * La vente de fromages pièce par pièce, sur une seule page pour la tablette (l'interface Windows mobile) : à gauche les pièces en stock, qu'on sélectionne
 * une ou plusieurs ; à droite l'acheteur (facultatif), puis pour chaque pièce choisie son poids net (pour l'étiquette) et son prix, repris de l'article du
 * stock. Chaque pièce fait sa propre vente, comme avant : ses lots, ses étiquettes et son prix restent distincts.
 */
export function VenteFromageTablette({ produit, onRetour }: { produit: ProduitVendu; onRetour: () => void }) {
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [lotIds, setLotIds] = useState<string[]>([]);
  const [clientId, setClientId] = useState('');
  const [poids, setPoids] = useState<Record<string, string>>({});
  const [apercu, setApercu] = useState(false);
  const [message, setMessage] = useState('');
  const [fait, setFait] = useState<{ lots: LotFromage[]; total: number } | null>(null);

  const charger = async () => {
    const [stock, tous] = await Promise.all([lireArchiveStock(), listClients()]);
    setArchive(stock);
    setClients(tous);
  };

  useEffect(() => {
    Promise.all([lireArchiveStock(), listClients()])
      .then(([stock, tous]) => {
        setArchive(stock);
        setClients(tous);
      })
      .catch(() => undefined);
  }, []);

  const articles = archive && produit.articles ? articlesDuProduit(produit.articles, archive, espece) : [];
  const pieces: PieceEnStock[] = archive
    ? articles.flatMap((a) => lotsAChoisir(archive, a.cle).map((lot) => ({ lot, libelle: a.libelle })))
    : [];
  const choisies = pieces.filter((p) => lotIds.includes(p.lot.id));
  const client = clients.find((c) => c.id === clientId);
  const prixDe = (p: PieceEnStock): number | undefined => (archive ? archive.prix[p.lot.article] : undefined);
  const poidsDe = (id: string): number => parseDecimal(poids[id] ?? '');
  const total = choisies.reduce((somme, p) => somme + Math.round((prixDe(p) ?? 0) * 100) / 100, 0);
  const pretAVendre = choisies.length > 0 && !!client && choisies.every((p) => poidsDe(p.lot.id) > 0 && (prixDe(p) ?? 0) > 0);

  /** Une pièce se choisit en la touchant, et se retire en la touchant à nouveau. */
  const basculer = (id: string) => {
    setLotIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    setApercu(false);
  };

  const enregistrer = async () => {
    if (!archive || choisies.length === 0) return;
    if (!client) return setMessage('Choisissez l’acheteur : il doit pouvoir être retrouvé en cas de rappel.');
    const sansPoids = choisies.find((p) => !(poidsDe(p.lot.id) > 0));
    if (sansPoids) return setMessage(`Pesez la pièce du lot ${sansPoids.lot.numero} : le poids net se saisit en kilos.`);
    const sansPrix = choisies.find((p) => !((prixDe(p) ?? 0) > 0));
    if (sansPrix) return setMessage(`Le prix du lot ${sansPrix.lot.numero} n’est pas fixé dans le stock.`);
    try {
      for (const p of choisies) {
        const prix = Math.round((prixDe(p) ?? 0) * 100) / 100;
        await enregistrerLaVente({
          activite: espece,
          date: todayISO(),
          categorie: produit.categorie,
          quantite: 1,
          unite: UNITE_VENTE.PIECE,
          prix,
          tauxTva: tauxTvaDeLaVente(produit.categorie),
          client: client ? nomComplet(client) : undefined,
          ...fromageDeLArticle(p.lot.article, p.libelle),
          fromages: p.lot.id,
          choixFacture: TYPE_CHOIX_FACTURE.SANS_FACTURE,
          circuit: client?.circuit || CIRCUIT_VENTE.FERME,
        });
        await enregistrerPeseeDuLot(p.lot.id, Math.round(poidsDe(p.lot.id) * 1000) / 1000, prix);
      }
      await noterAEnvoyer();
      setFait({ lots: choisies.map((p) => p.lot), total });
    } catch {
      setMessage('La vente n’a pas pu être enregistrée. Réessayez.');
    }
  };

  const nouvelleVente = async () => {
    setFait(null);
    setMessage('');
    setLotIds([]);
    setClientId('');
    setPoids({});
    setApercu(false);
    await charger();
  };

  if (fait)
    return (
      <View style={styles.page}>
        <Text style={styles.titre}>
          {fait.lots.length === 1 ? `Pièce vendue · lot ${fait.lots[0].numero}` : `${fait.lots.length} pièces vendues`}
        </Text>
        <Text style={styles.detail}>{formatMontant(fait.total)}</Text>
        {fait.lots.map((lot) => (
          <Button
            key={lot.id}
            label={`Imprimer l’étiquette du lot ${lot.numero}`}
            variant="secondary"
            onPress={() => exporterEtiquettesLotPdf(lot.id, undefined, 1)}
          />
        ))}
        <Button label="Autre vente" onPress={nouvelleVente} />
        <Button label="Retour" variant="secondary" onPress={onRetour} />
      </View>
    );

  // L'aperçu de l'étiquette ne concerne qu'une pièce à la fois.
  const unique = choisies.length === 1 ? choisies[0] : undefined;
  const etiquette =
    unique && archive && prixDe(unique) !== undefined
      ? etiquetteDuLot({ ...unique.lot, poidsNetKg: poidsDe(unique.lot.id) > 0 ? poidsDe(unique.lot.id) : undefined, prixPiece: prixDe(unique) }, archive)
      : undefined;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.titre}>{produit.libelle}</Text>
      <View style={styles.grille}>
        <View style={styles.colonne}>
          <Text style={styles.libelle}>Pièces en stock</Text>
          <Text style={styles.detail}>Touchez une ou plusieurs pièces.</Text>
          {pieces.length === 0 ? <Text style={styles.detail}>Aucune pièce en stock.</Text> : null}
          {pieces.map((p) => {
            const choisie = lotIds.includes(p.lot.id);
            return (
              <Pressable
                key={p.lot.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: choisie }}
                onPress={() => basculer(p.lot.id)}
                style={[styles.carte, choisie && styles.carteChoisie]}
              >
                <Text style={[styles.carteTitre, choisie && styles.texteChoisi]}>{`Lot ${p.lot.numero}`}</Text>
                <Text style={[styles.detail, choisie && styles.texteChoisi]}>{`${p.libelle} · en stock${choisie ? ' · choisie' : ''}`}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.colonne, styles.formulaire]}>
          {choisies.length > 0 ? (
            <>
              <Text style={styles.detail}>{`${choisies.length} pièce${choisies.length > 1 ? 's' : ''} : ${choisies.map((p) => `Lot ${p.lot.numero}`).join(' · ')}`}</Text>
              <SelectField<string>
                label="Acheteur"
                value={clientId}
                placeholder="Choisir un contact"
                searchable
                options={clients.map((c) => ({ value: c.id, label: nomComplet(c) }))}
                onChange={setClientId}
              />

              {choisies.map((p) => (
                <View key={p.lot.id} style={styles.ligne}>
                  <Text style={styles.ligneTexte}>{`Lot ${p.lot.numero} · ${p.libelle}`}</Text>
                  <TextInput
                    style={[styles.saisie, styles.poidsSaisie]}
                    value={poids[p.lot.id] ?? ''}
                    placeholder="kg"
                    onChangeText={(v) => setPoids({ ...poids, [p.lot.id]: v })}
                    keyboardType="decimal-pad"
                    accessibilityLabel={`Poids net du lot ${p.lot.numero} (kg)`}
                  />
                  <Text style={styles.gros}>{prixDe(p) !== undefined ? formatMontant(prixDe(p) ?? 0) : 'à fixer'}</Text>
                </View>
              ))}

              <View style={styles.total}>
                <Text style={styles.libelle}>Total</Text>
                <Text style={styles.grosTotal}>{formatMontant(total)}</Text>
              </View>

              {apercu && etiquette ? (
                <View style={styles.etiquette}>
                  <Text style={styles.libelle}>Aperçu de l’étiquette</Text>
                  <Text style={styles.etiquetteProduit}>{etiquette.produit}</Text>
                  <Text style={styles.etiquetteLot}>{`LOT ${etiquette.numero}`}</Text>
                  {etiquette.dlc ? <Text style={styles.etiquetteLigne}>{`DLC : ${etiquette.dlc}`}</Text> : null}
                  {etiquette.poidsNetKg ? <Text style={styles.etiquetteLigne}>{`Poids net : ${String(etiquette.poidsNetKg).replace('.', ',')} kg`}</Text> : null}
                  {etiquette.prixPiece !== undefined ? <Text style={styles.etiquetteLigne}>{`Prix : ${formatMontant(etiquette.prixPiece)}`}</Text> : null}
                </View>
              ) : null}

              {message ? <Text style={styles.erreur}>{message}</Text> : null}

              <View style={styles.actions}>
                {unique ? (
                  <Button label={apercu ? 'Masquer l’aperçu' : 'Aperçu de l’étiquette'} variant="secondary" onPress={() => setApercu(!apercu)} />
                ) : null}
                <Button
                  label={choisies.length > 1 ? `Enregistrer les ${choisies.length} ventes` : 'Enregistrer la vente'}
                  disabled={!pretAVendre}
                  onPress={enregistrer}
                />
              </View>
            </>
          ) : (
            <Text style={styles.detail}>Choisissez une ou plusieurs pièces dans la colonne de gauche.</Text>
          )}
        </View>
      </View>
      <Button label="Retour" variant="secondary" onPress={onRetour} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14 },
  titre: { fontSize: 22, fontWeight: '500', color: colors.text },
  grille: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colonne: { flex: 1, minWidth: 220, gap: 10 },
  formulaire: { flex: 2, backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, borderWidth: 0.5, borderColor: colors.border },
  libelle: { fontSize: 14, color: colors.textMuted },
  detail: { fontSize: 14, color: colors.textMuted },
  carte: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: colors.border, minHeight: 64 },
  carteChoisie: { backgroundColor: colors.primary, borderColor: colors.primary },
  carteTitre: { fontSize: 16, fontWeight: '500', color: colors.text },
  texteChoisi: { color: colors.blanc },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  ligneTexte: { flex: 1, fontSize: 16, color: colors.text },
  poidsSaisie: { width: 120 },
  saisie: { borderRadius: 12, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.background, fontSize: 18, color: colors.text },
  gros: { fontSize: 20, fontWeight: '500', color: colors.text },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 10 },
  grosTotal: { fontSize: 24, fontWeight: '500', color: colors.text },
  etiquette: { borderWidth: 1, borderColor: colors.text, borderRadius: 6, padding: 12, gap: 4 },
  etiquetteProduit: { fontSize: 16, color: colors.text },
  etiquetteLot: { fontSize: 20, fontWeight: '500', color: colors.text },
  etiquetteLigne: { fontSize: 15, color: colors.text },
  erreur: { fontSize: 14, color: '#a33' },
  actions: { flexDirection: 'row', gap: 8 },
});
