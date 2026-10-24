import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { enregistrerLaVente } from '@/features/comptabilite/hooks/nouvelleEcriture/enregistrement';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ControlePrix, type UnitePrix } from '@/features/production/simple/ControlePrix';
import { ListeDeChoix, type Choix } from '@/features/production/simple/ListeDeChoix';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit, lotsAChoisir } from '@/features/stock/services/lots';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { GrosBouton } from '@/shared/components/GrosBouton';
import { SelectField } from '@/shared/components/SelectField';
import { CATEGORIE_VENTE, TYPE_CHOIX_FACTURE, TYPE_FROMAGE, UNITE_VENTE } from '@/shared/constants/comptabilite';
import { CIRCUIT_VENTE } from '@/shared/constants/commercial';
import { CLE_PRIX_LAIT, type PRODUIT_A_LOTS } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { tauxTvaDeLaVente } from '@/shared/dictionnaire/tauxParProduit';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';

const T = TEXTES.production.ventesSimple;
const S = TEXTES.production.viande.simple;

/** Le produit vendu : sa catégorie de vente (d'office), ce que son prix compte, et d'où viennent ses articles (rien pour le lait). */
export interface ProduitVendu extends Choix {
  categorie: ValeurDe<typeof CATEGORIE_VENTE>;
  unite: UnitePrix;
  articles?: ValeurDe<typeof PRODUIT_A_LOTS>;
}

/** Un lot à vendre, avec l'article de l'inventaire qu'il porte. */
interface LotAVendre {
  lot: LotFromage;
  libelle: string;
}

/** Où l'on en est : le client, puis (selon le produit) les lots ou le produit et la quantité, le prix et le paiement, puis la vente est notée. */
type Etape = 'client' | 'lots' | 'produit' | 'quantite' | 'prix' | 'fait';

/** Le code de fromage d'un article de l'inventaire (« fromage:frais » → « frais ») : un fromage ajouté par l'utilisateur est « autre », avec son nom. */
function fromageDeLArticle(cle: string, libelle: string): { typeFromage: ValeurDe<typeof TYPE_FROMAGE>; typeFromageLibre?: string } {
  const code = cle.split(':')[1];
  const connu = (Object.values(TYPE_FROMAGE) as string[]).includes(code) && code !== TYPE_FROMAGE.AUTRE;
  return connu ? { typeFromage: code as ValeurDe<typeof TYPE_FROMAGE> } : { typeFromage: TYPE_FROMAGE.AUTRE, typeFromageLibre: libelle };
}

/**
 * Vendre un produit au plus simple, comme la viande : le client, les lots (le type de fromage se déduit du lot choisi), le prix total (le prix de l'inventaire × la quantité,
 * proposé d'avance) puis « Payé ? ». La vente est notée sans facture, dans la catégorie du produit et par le circuit préféré du client (la vente à la ferme sinon) : elle se retrouve
 * dans les ventes du mode avancé. Sans lot en stock, on choisit le produit puis la quantité ; le lait demande les litres. `onRetour` revient au choix du produit.
 */
export function VenteProduitSimple({ produit, onRetour }: { produit: ProduitVendu; onRetour: () => void }) {
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [etape, setEtape] = useState<Etape>('client');
  const [clientId, setClientId] = useState('');
  const [lotsChoisis, setLotsChoisis] = useState<string[]>([]);
  const [articleChoisi, setArticleChoisi] = useState<string | null>(null);
  const [quantite, setQuantite] = useState('');
  const [prix, setPrix] = useState('');
  const [calcul, setCalcul] = useState('');
  const [resume, setResume] = useState('');
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    Promise.all([lireArchiveStock(), listClients()])
      .then(([stock, tous]) => {
        setArchive(stock);
        setClients(tous);
      })
      .catch(() => undefined);
  }, []);

  const articles = produit.articles && archive ? articlesDuProduit(produit.articles, archive, espece) : [];
  /** Les lots en stock du produit, tous articles confondus ; une fois un lot choisi, seuls ceux du même article restent (une vente porte un seul produit). */
  const lotsEnStock: LotAVendre[] = archive
    ? articles.flatMap((a) => lotsAChoisir(archive, a.cle).map((lot) => ({ lot, libelle: a.libelle })))
    : [];
  const premier = lotsEnStock.find((l) => l.lot.id === lotsChoisis[0]);
  const lotsProposes = premier ? lotsEnStock.filter((l) => l.lot.article === premier.lot.article) : lotsEnStock;
  const client = clients.find((c) => c.id === clientId);
  const article = premier?.lot.article ?? articleChoisi ?? undefined;
  const libelleArticle = premier?.libelle ?? articles.find((a) => a.cle === articleChoisi)?.libelle;
  const cleDuPrix = produit.articles ? article : CLE_PRIX_LAIT;
  const nombre = lotsChoisis.length > 0 ? lotsChoisis.length : parseDecimal(quantite);

  const retourProduits = () => onRetour();

  /** Passe au prix : le prix de l'inventaire × la quantité est proposé d'avance (rien quand l'inventaire n'a pas de prix). */
  const versLePrix = async (n: number) => {
    const stock = await lireArchiveStock();
    const unitaire = cleDuPrix ? stock.prix[cleDuPrix] : undefined;
    const total = unitaire && n > 0 ? Math.round(unitaire * n * 100) / 100 : undefined;
    const quantiteTexte = String(n).replace('.', ',');
    setPrix(total === undefined ? '' : String(total).replace('.', ','));
    setCalcul(
      total === undefined || !unitaire
        ? ''
        : produit.categorie === CATEGORIE_VENTE.LAIT
          ? T.calculLitres(quantiteTexte, formatMontant(unitaire))
          : T.calculPieces(quantiteTexte, formatMontant(unitaire)),
    );
    setEtape('prix');
  };

  const vendre = async (paye: boolean) => {
    const total = parseDecimal(prix);
    if (enCours || !(total > 0) || !(nombre > 0)) return;
    setEnCours(true);
    try {
      const prixTotal = Math.round(total * 100) / 100;
      const unitaire = cleDuPrix && archive ? archive.prix[cleDuPrix] : undefined;
      const lait = produit.categorie === CATEGORIE_VENTE.LAIT;
      const vente = await enregistrerLaVente({
        activite: espece,
        date: todayISO(),
        categorie: produit.categorie,
        quantite: nombre,
        unite: lait ? UNITE_VENTE.LITRES : UNITE_VENTE.PIECE,
        prix: prixTotal,
        tauxTva: tauxTvaDeLaVente(produit.categorie),
        client: client ? nomComplet(client) : undefined,
        // Le détail : le type de fromage d'après le lot choisi ; la ligne de l'inventaire pour la charcuterie, un plat ou un savon.
        ...(produit.categorie === CATEGORIE_VENTE.FROMAGE && article && libelleArticle ? fromageDeLArticle(article, libelleArticle) : {}),
        ...(produit.articles && produit.categorie !== CATEGORIE_VENTE.FROMAGE && libelleArticle ? { precision: libelleArticle } : {}),
        fromages: lotsChoisis.length > 0 ? lotsChoisis.join(';') : undefined,
        // Un prix différent de celui de l'inventaire est gardé, pour que la fiche de la vente retrouve son total.
        prixUnitairePersonnalise: unitaire && Math.round(unitaire * nombre * 100) / 100 === prixTotal ? undefined : prixTotal / nombre,
        choixFacture: TYPE_CHOIX_FACTURE.SANS_FACTURE,
        circuit: client?.circuit || CIRCUIT_VENTE.FERME,
        payee: paye ? undefined : false,
      });
      setResume(S.venteDetail(client ? nomComplet(client) : '', formatMontant(vente.prix ?? 0), paye));
      setEtape('fait');
    } finally {
      setEnCours(false);
    }
  };

  if (!archive) return null;

  // 1. Le client (facultatif).
  if (etape === 'client')
    return (
      <View style={styles.contenu}>
        <Text style={styles.detail}>{produit.libelle}</Text>
        <Text style={styles.titre}>{T.client}</Text>
        <SelectField<string>
          label={T.client}
          value={clientId}
          placeholder={T.choisirUnClient}
          searchable
          options={clients.map((c) => ({ value: c.id, label: nomComplet(c) }))}
          onChange={setClientId}
        />
        <Button
          label={T.suivant}
          onPress={() => {
            // Le lait demande les litres ; le reste, les lots (ou, sans lot en stock, le produit puis la quantité).
            setEtape(!produit.articles ? 'quantite' : lotsEnStock.length > 0 ? 'lots' : 'produit');
          }}
        />
        <Button label={T.retour} variant="secondary" onPress={retourProduits} />
      </View>
    );

  // 2. Les lots : un appui choisit ou retire un lot.
  if (etape === 'lots')
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={styles.titre}>{T.quelsLots}</Text>
        <ListeDeChoix
          presentation="tuiles"
          choix={lotsProposes.map(({ lot, libelle }) => ({
            cle: lot.id,
            libelle: `${lotsChoisis.includes(lot.id) ? '✓ ' : ''}${lot.numero}\n${libelle}`,
            icone: produit.icone,
          }))}
          onChoisir={(c) => setLotsChoisis((actuels) => (actuels.includes(c.cle) ? actuels.filter((id) => id !== c.cle) : [...actuels, c.cle]))}
        />
        <Button label={T.lotsChoisis(lotsChoisis.length)} disabled={lotsChoisis.length === 0} onPress={() => versLePrix(lotsChoisis.length)} />
        <Button
          label={T.retour}
          variant="secondary"
          onPress={() => {
            setLotsChoisis([]);
            setEtape('client');
          }}
        />
      </ScrollView>
    );

  // 2 bis. Sans lot en stock : le produit précis, avec son prix.
  if (etape === 'produit')
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={styles.titre}>{T.quelProduit}</Text>
        {articles.length === 0 ? <Text style={styles.detail}>{T.aucunProduit}</Text> : <Text style={styles.detail}>{T.aucunLot}</Text>}
        <ListeDeChoix
          presentation="tuiles"
          choix={articles.map((a) => ({
            cle: a.cle,
            libelle: `${a.libelle}\n${archive.prix[a.cle] ? formatMontant(archive.prix[a.cle]) : T.prixAFixer}`,
            icone: produit.icone,
          }))}
          onChoisir={(c) => {
            setArticleChoisi(c.cle);
            setEtape('quantite');
          }}
        />
        <Button label={T.retour} variant="secondary" onPress={() => setEtape('client')} />
      </ScrollView>
    );

  // 3. La quantité : les litres de lait, ou le nombre de pièces quand aucun lot n'est choisi.
  if (etape === 'quantite') {
    const lait = produit.categorie === CATEGORIE_VENTE.LAIT;
    return (
      <View style={styles.contenu}>
        <Text style={styles.detail}>{libelleArticle ?? produit.libelle}</Text>
        <Text style={styles.titre}>{lait ? T.combienDeLitres : T.combienDePieces}</Text>
        <FormField label={lait ? T.litres : T.nombre} value={quantite} onChangeText={setQuantite} keyboardType="decimal-pad" autoFocus />
        <Button label={T.suivant} disabled={!(parseDecimal(quantite) > 0)} onPress={() => versLePrix(parseDecimal(quantite))} />
        <Button label={T.retour} variant="secondary" onPress={() => setEtape(lait ? 'client' : 'produit')} />
      </View>
    );
  }

  // 4. Le prix total (le prix de l'inventaire est vérifié, et demandé s'il manque), puis « Payé ? » : « Oui » ou « Non » note la vente.
  if (etape === 'prix' && cleDuPrix) {
    const valide = parseDecimal(prix) > 0;
    return (
      <ControlePrix cle={cleDuPrix} unite={produit.unite} onChange={() => lireArchiveStock().then(setArchive).then(() => versLePrix(nombre))}>
        <View style={styles.contenu}>
          <Text style={styles.detail}>{[libelleArticle ?? produit.libelle, client ? nomComplet(client) : ''].filter(Boolean).join(' · ')}</Text>
          <Text style={styles.titre}>{S.prixTotal}</Text>
          {calcul ? <Text style={styles.detail}>{calcul}</Text> : null}
          <FormField label={S.prixEnEuros} value={prix} onChangeText={setPrix} keyboardType="decimal-pad" autoFocus />
          <Text style={styles.message}>{S.paye}</Text>
          <View style={styles.grille}>
            <GrosBouton libelle={S.oui} onPress={() => (valide ? vendre(true) : undefined)} icone={<Ionicons name="checkmark" size={44} color={colors.blanc} />} />
            <GrosBouton libelle={S.non} onPress={() => (valide ? vendre(false) : undefined)} icone={<Ionicons name="close" size={44} color={colors.blanc} />} />
          </View>
          <Button label={T.retour} variant="secondary" onPress={() => setEtape(lotsChoisis.length > 0 ? 'lots' : 'quantite')} />
        </View>
      </ControlePrix>
    );
  }

  return (
    <View style={styles.contenu}>
      <Ionicons name="checkmark-circle" size={96} color={colors.primary} style={styles.coche} />
      <Text style={styles.message}>{S.venteEnregistree}</Text>
      <Text style={styles.detail}>{resume}</Text>
      <Button label={S.terminer} onPress={onRetour} />
    </View>
  );
}
