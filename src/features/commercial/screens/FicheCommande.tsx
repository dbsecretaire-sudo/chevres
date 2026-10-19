import { useCallback, useState } from 'react';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { SelectField } from '@/shared/components/SelectField';
import { ChampCircuit } from '@/features/commercial/components/ChampCircuit';
import {
  annulerLivraison,
  livrerCommande,
  prixDuTarif,
  totalCommande,
  totalLigne,
} from '@/features/commercial/services/commandes';
import { libererLotsReserves } from '@/features/commercial/services/reservations';
import { exporterBonLivraisonPdf } from '@/features/commercial/services/bonLivraison';
import {
  enregistrerCommande,
  getCommande,
  lireArchiveCommercial,
  supprimerCommande,
} from '@/features/commercial/repository';
import type { ArchiveCommercial, Commande, LigneCommande } from '@/features/commercial/types';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { categorieDuClient, venteDeclareeParDefaut } from '@/features/clients/services/categorie';
import { lireArchiveStock } from '@/features/stock/repository';
import { listTousLesAnimauxDeLEspece, saveChevre } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import type { LotFromage } from '@/features/stock/types';
import { LigneChevre } from '@/features/cheptel/components/LigneChevre';
import { libelleChevreAvecDate } from '@/features/cheptel/utils/chevreLabel';
import {
  disponiblesPourLaCommande,
  liberer,
  reserver,
  reservesDeLaCommande,
} from '@/features/cheptel/services/reservations';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import { SelectModalMultiple } from '@/shared/components/SelectModalMultiple';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { articlesDuGenre, estLigneDuCheptel, type ArticleAffiche } from '@/features/stock/services/stock';
import { useNiveauxStock } from '@/features/stock/hooks/useNiveauxStock';
import { ajouterMois } from '@/features/comptabilite/services/tresorerie';
import { ajouterJours } from '@/shared/utils/calendrier';
import { JOURS_AVANT_LIVRAISON, STATUT_COMMANDE, type StatutCommande } from '@/shared/constants/commercial';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { generateId } from '@/shared/utils/id';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/commercial/Commercial.styles';
import { LABEL_STATUT_COMMANDE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant, todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import { optionClient } from '@/features/contacts/services/optionsContacts';

const T = TEXTES.commercial.commande;

/** Une ligne en cours de saisie : les nombres restent du texte jusqu'à l'enregistrement. */
interface LigneSaisie {
  id: string;
  article: string;
  quantite: string;
  prix: string;
}

const texte = (valeur: number): string => String(valeur).replace('.', ',');

/** Une commande : le client, les fromages (au tarif de sa catégorie), les dates, puis sa préparation, sa livraison et son bon. */
export default function FicheCommande() {
  const router = useRouter();
  /** L'adresse de cet écran : la fiche d'un animal ouverte d'ici y revient. */
  const retour = useAdresseCourante();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [existante, setExistante] = useState<Commande | undefined>();
  const [clients, setClients] = useState<Client[]>([]);
  const [fromages, setFromages] = useState<ArticleAffiche[]>([]);
  const [prixInventaire, setPrixInventaire] = useState<Record<string, number>>({});
  const [commercial, setCommercial] = useState<ArchiveCommercial | null>(null);
  const niveaux = useNiveauxStock();
  /** Les lots du stock : une ligne qui a des lots réservés les nomme (leurs numéros se communiquent à la facturation). */
  const [lotsDuStock, setLotsDuStock] = useState<LotFromage[]>([]);
  /** Les animaux de l'espèce et ceux déjà vendus : un bon de commande réserve des animaux sans boucle à vendre. */
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  const [idsVendus, setIdsVendus] = useState<Set<string>>(new Set());
  /** Les ventes : celles du bon gardent les animaux qu'il a vendus (leur réservation est levée à la vente). */
  const [ventesLues, setVentesLues] = useState<Vente[]>([]);
  const [choixAnimaux, setChoixAnimaux] = useState(false);

  const [clientId, setClientId] = useState('');
  const [clientLibre, setClientLibre] = useState('');
  const [date, setDate] = useState(todayISO());
  const [livraison, setLivraison] = useState(ajouterJours(todayISO(), JOURS_AVANT_LIVRAISON));
  const [circuit, setCircuit] = useState('');
  const [lignes, setLignes] = useState<LigneSaisie[]>([]);
  const [note, setNote] = useState('');
  const [numeroFacture, setNumeroFacture] = useState('');
  const [enAttente, setEnAttente] = useState(false);
  const [echeance, setEcheance] = useState('');
  const [statut, setStatut] = useState<StatutCommande>(STATUT_COMMANDE.A_PREPARER);
  const [erreur, setErreur] = useState('');
  const [confirmation, setConfirmation] = useState<'livrer' | 'defaire' | 'supprimer' | null>(null);

  const client = clients.find((c) => c.id === clientId);
  const categorieClient = client ? categorieDuClient(client) : undefined;
  const ouverte = statut === STATUT_COMMANDE.A_PREPARER || statut === STATUT_COMMANDE.PREPAREE;

  const prixPour = useCallback(
    (article: string, categorie: string | undefined, tarifs = commercial?.tarifs ?? {}) =>
      prixDuTarif(article, categorie, tarifs, prixInventaire),
    [commercial, prixInventaire],
  );

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        listClients(),
        lireArchiveStock(),
        lireArchiveCommercial(),
        id ? getCommande(id) : Promise.resolve(undefined),
        listTousLesAnimauxDeLEspece(),
        listToutesVentes(),
      ]).then(([listeClients, stock, archive, commande, lesAnimaux, lesVentes]) => {
        setClients(listeClients);
        setAnimaux(lesAnimaux);
        setIdsVendus(new Set(lesVentes.flatMap((v) => idsDesAnimaux(v))));
        setVentesLues(lesVentes);
        // Les produits qu'on commande : les fromages, puis la viande et la charcuterie de l'inventaire (hors animaux du cheptel).
        setFromages([
          ...articlesDuGenre(GENRE_ARTICLE.FROMAGE, stock),
          ...articlesDuGenre(GENRE_ARTICLE.VIANDE, stock).filter((a) => !estLigneDuCheptel(a.cle)),
        ]);
        setPrixInventaire(stock.prix);
        setLotsDuStock(stock.lots ?? []);
        setCommercial(archive);
        if (commande) {
          setExistante(commande);
          setClientId(commande.clientId ?? '');
          setClientLibre(commande.clientId ? '' : commande.client);
          setDate(commande.date);
          setLivraison(commande.livraisonPrevue ?? '');
          setCircuit(commande.circuit ?? '');
          setLignes(
            commande.lignes.map((l) => ({
              id: l.id,
              article: l.article,
              quantite: texte(l.quantite),
              prix: texte(l.prixUnitaire),
            })),
          );
          setNote(commande.note ?? '');
          setEnAttente(!!commande.enAttente);
          setEcheance(commande.echeance ?? '');
          setStatut(commande.statut);
        }
      });
    }, [id]),
  );

  const changerClient = (nouveau: string) => {
    const ancienneCategorie = categorieClient;
    const fiche = clients.find((c) => c.id === nouveau);
    const nouvelleCategorie = fiche ? categorieDuClient(fiche) : undefined;
    setClientId(nouveau);
    // Le circuit de vente privilégié du contact se prérempli.
    if (fiche?.circuit) setCircuit(fiche.circuit);
    // Les prix que l'utilisateur n'a pas modifiés suivent le tarif de la catégorie du nouveau client.
    setLignes((courantes) =>
      courantes.map((l) => {
        const ancien = prixPour(l.article, ancienneCategorie);
        if (ancien === undefined || parseDecimal(l.prix) !== ancien) return l;
        const nouveauPrix = prixPour(l.article, nouvelleCategorie);
        return nouveauPrix === undefined ? l : { ...l, prix: texte(nouveauPrix) };
      }),
    );
  };

  const ajouterLigne = () => {
    const premier = fromages[0];
    if (!premier) return;
    const prix = prixPour(premier.cle, categorieClient);
    setLignes((courantes) => [
      ...courantes,
      { id: generateId(), article: premier.cle, quantite: '1', prix: prix !== undefined ? texte(prix) : '' },
    ]);
  };

  const changerLigne = (idLigne: string, changement: Partial<LigneSaisie>) =>
    setLignes((courantes) => courantes.map((l) => (l.id === idLigne ? { ...l, ...changement } : l)));

  const changerFromage = (idLigne: string, article: string) => {
    const prix = prixPour(article, categorieClient);
    changerLigne(idLigne, { article, prix: prix !== undefined ? texte(prix) : '' });
  };

  const lignesFinales = (): LigneCommande[] =>
    lignes
      .map((l) => ({
        id: l.id,
        article: l.article,
        libelle:
          fromages.find((f) => f.cle === l.article)?.libelle ??
          existante?.lignes.find((e) => e.id === l.id)?.libelle ??
          l.article,
        quantite: Math.round(parseDecimal(l.quantite)),
        prixUnitaire: parseDecimal(l.prix) || 0,
        // Les lots réservés restent attachés à la ligne.
        lotIds: existante?.lignes.find((e) => e.id === l.id)?.lotIds,
      }))
      .filter((l) => l.quantite > 0);

  const total = totalCommande({ lignes: lignesFinales() });
  const nomClient = client ? nomComplet(client) : clientLibre.trim();
  /** Un client qui souhaite que la vente soit déclarée : le numéro de la facture se renseigne. */
  const declaree = client ? venteDeclareeParDefaut(client) : false;

  const construire = (): Commande | undefined => {
    if (!nomClient) {
      setErreur(T.clientRequis);
      return undefined;
    }
    const finales = lignesFinales();
    if (finales.length === 0) {
      setErreur(T.lignesRequises);
      return undefined;
    }
    setErreur('');
    return {
      id: existante?.id ?? '',
      numero: existante?.numero ?? '',
      clientId: client?.id,
      client: nomClient,
      date,
      livraisonPrevue: livraison || undefined,
      circuit: circuit || undefined,
      statut,
      lignes: finales,
      note: note.trim() || undefined,
      dateLivraison: existante?.dateLivraison,
      venteIds: existante?.venteIds,
      lignesFacturees: existante?.lignesFacturees,
      enAttente: enAttente || undefined,
      echeance: enAttente && echeance ? echeance : undefined,
    };
  };

  /** Enregistre la commande (nouvelle ou modifiée) et la renvoie, avec son identifiant et son numéro. */
  const enregistrer = async (aPartir?: Commande): Promise<Commande | undefined> => {
    const commande = aPartir ?? construire();
    if (!commande) return undefined;
    const { id: idCommande, numero, ...reste } = commande;
    return enregistrerCommande({ ...reste, id: idCommande || undefined, numero: numero || undefined });
  };

  const enregistrerEtQuitter = async () => {
    if (await enregistrer()) router.back();
  };

  const changerStatut = async (nouveau: StatutCommande) => {
    const commande = construire();
    if (!commande) return;
    // Une commande annulée ne réserve plus rien.
    if (nouveau === STATUT_COMMANDE.ANNULEE) await libererLesAnimaux();
    const enregistree = await enregistrer(
      nouveau === STATUT_COMMANDE.ANNULEE
        ? { ...commande, statut: nouveau, lignes: commande.lignes.map((l) => ({ ...l, lotIds: undefined })) }
        : { ...commande, statut: nouveau },
    );
    if (enregistree) router.back();
  };

  const livrer = async () => {
    setConfirmation(null);
    const commande = construire();
    if (!commande) return;
    const enregistree = await enregistrer(commande);
    if (!enregistree) return;
    await livrerCommande(enregistree, todayISO(), especeCourante(), declaree, numeroFacture);
    router.back();
  };

  const defaire = async () => {
    setConfirmation(null);
    if (existante) await annulerLivraison(existante);
    router.back();
  };

  /** Les animaux réservés par ce bon de commande. */
  const reserves = existante ? reservesDeLaCommande(animaux, existante.id) : [];
  /** Les animaux sans boucle encore à vendre (vivants ou déjà à l'abattoir, pas vendus), libres ou réservés par cette commande. */
  const aReserver = disponiblesPourLaCommande(
    animaux.filter(
      (a) =>
        !a.numeroBoucle?.trim() &&
        (a.statut === STATUT_CHEVRE.VIVANTE || a.statut === STATUT_CHEVRE.ABATTOIR) &&
        !idsVendus.has(a.id),
    ),
    existante?.id,
  );
  /** Les animaux et les lots réservés par cette commande redeviennent disponibles. */
  /** Les animaux que les ventes de ce bon ont vendus. */
  const animauxVendusDuBon = ventesLues
    .filter((v) => existante?.venteIds?.includes(v.id))
    .flatMap((v) => idsDesAnimaux(v))
    .map((id) => animaux.find((a) => a.id === id))
    .filter((a): a is Chevre => !!a);
  const libererLesAnimaux = async () => {
    for (const a of reserves) await saveChevre(liberer(a));
    await libererLotsReserves((existante?.lignes ?? []).flatMap((l) => l.lotIds ?? []));
  };
  /** Réserve les animaux choisis pour le client de la commande ; ceux qui ne le sont plus sont libérés. */
  const reserverLesAnimaux = async (choisis: string[]) => {
    setChoixAnimaux(false);
    if (!existante) return;
    const reservation = { client: nomClient, clientId: client?.id, commandeId: existante.id, date: todayISO() };
    for (const a of reserves.filter((r) => !choisis.includes(r.id))) await saveChevre(liberer(a));
    for (const a of aReserver.filter((x) => choisis.includes(x.id))) await saveChevre(reserver(a, reservation));
    setAnimaux(await listTousLesAnimauxDeLEspece());
  };

  const supprimer = async () => {
    setConfirmation(null);
    await libererLesAnimaux();
    if (existante) await supprimerCommande(existante.id);
    router.back();
  };

  const bon = async () => {
    const commande = construire();
    if (!commande) return;
    const enregistree = await enregistrer(commande);
    if (enregistree) await exporterBonLivraisonPdf(enregistree);
  };

  /** Les numéros des lots réservés pour une ligne de la commande. */
  const numerosDesLots = (idLigne: string): string[] => {
    const ids = existante?.lignes.find((e) => e.id === idLigne)?.lotIds ?? [];
    return ids.map((id) => lotsDuStock.find((lot) => lot.id === id)?.numero).filter((n): n is string => !!n);
  };

  const optionsClients = [
    { value: '', label: T.clientPlaceholder },
    ...clients.map(optionClient),
  ];
  /** Le stock qu'il reste de chaque produit : dans la liste, et sous la ligne avec ce qui reste après la commande. */
  const enStock = (article: string): number => niveaux.get(article) ?? 0;
  const optionsFromages = fromages.map((f) => ({
    value: f.cle,
    label: `${f.libelle} (${T.enStock(enStock(f.cle))})`,
  }));

  return (
    <Screen>
      {existante ? (
        <Text style={commonStyles.lineBold}>
          {existante.numero} · {LABEL_STATUT_COMMANDE[statut]}
          {existante.dateLivraison
            ? ` · ${TEXTES.commercial.commande.livrer.livree(formatDateFR(existante.dateLivraison))}`
            : ''}
        </Text>
      ) : null}

      <SectionForm>
        <SelectField
          label={T.client}
          value={clientId}
          options={optionsClients}
          onChange={changerClient}
          searchable
        />
        {!clientId ? (
          <FormField
            label={T.clientLibre}
            aide={T.clientLibreAide}
            value={clientLibre}
            onChangeText={setClientLibre}
          />
        ) : null}
        <DateField label={T.date} value={date} onChange={setDate} />
        <DateField label={T.livraison} value={livraison} onChange={setLivraison} />
        <ChampCircuit value={circuit} onChange={setCircuit} />
      </SectionForm>

      <SectionForm titre={T.lignes}>
        {fromages.length === 0 ? <Text style={commonStyles.note}>{T.aucunFromage}</Text> : null}
        {lignes.map((l) => (
          <View key={l.id} style={styles.carte}>
            <SelectField
              label={T.fromage}
              value={l.article}
              options={optionsFromages}
              onChange={(article) => changerFromage(l.id, article)}
            />
            {/* Les lots réservés pour cette ligne : leurs numéros (suivi), repris par la vente à la facturation. */}
            {numerosDesLots(l.id).length > 0 ? (
              <Text style={commonStyles.note}>{T.lotsReserves(numerosDesLots(l.id).join(', '))}</Text>
            ) : null}
            {/* Ce qui reste en stock de ce produit, et ce qu'il en restera une fois la commande livrée. */}
            <Text style={commonStyles.note}>
              {T.resteEnStock(
                enStock(l.article),
                enStock(l.article) - Math.round(parseDecimal(l.quantite)),
              )}
            </Text>
            <View style={styles.champsLigne}>
              <View style={styles.champLigne}>
                <FormField
                  label={T.quantite}
                  value={l.quantite}
                  onChangeText={(quantite) => changerLigne(l.id, { quantite })}
                  // Des lots réservés : leur nombre fait la quantité.
                  editable={numerosDesLots(l.id).length === 0}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.champLigne}>
                <FormField
                  label={T.prix}
                  value={l.prix}
                  onChangeText={(prix) => changerLigne(l.id, { prix })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.ligneMontant}>
              <Text style={commonStyles.lineBold}>
                {formatMontant(
                  totalLigne({
                    quantite: Math.round(parseDecimal(l.quantite)),
                    prixUnitaire: parseDecimal(l.prix),
                  }),
                )}
              </Text>
              <Button
                variant="secondary"
                label={TEXTES.commun.general.supprimer}
                onPress={() => setLignes((courantes) => courantes.filter((c) => c.id !== l.id))}
              />
            </View>
          </View>
        ))}
        <Button variant="secondary" label={T.ajouterLigne} onPress={ajouterLigne} />
        <Text style={commonStyles.lineBold}>{T.total(formatMontant(total))}</Text>
      </SectionForm>

      {/* Les animaux que ce bon a déjà vendus (par ses ventes) : ils restent référencés dans la commande. */}
      {animauxVendusDuBon.length > 0 ? (
        <SectionForm titre={TEXTES.cheptel.reservation.vendusDuBon}>
          {animauxVendusDuBon.map((a) => (
            <LigneChevre key={a.id} chevre={a} onPress={() => router.push(ROUTES.ficheChevreDepuis(a.id, retour))} />
          ))}
        </SectionForm>
      ) : null}

      {/* Le bon de commande réserve des animaux sans boucle (ils restent au troupeau jusqu'à leur vente). */}
      {existante && ouverte ? (
        <SectionForm titre={TEXTES.cheptel.reservation.section}>
          {reserves.length === 0 ? <Text style={commonStyles.note}>{TEXTES.cheptel.reservation.aucun}</Text> : null}
          {reserves.map((a) => (
            <LigneChevre key={a.id} chevre={a} onPress={() => router.push(ROUTES.ficheChevreDepuis(a.id, retour))} />
          ))}
          <Button
            variant="secondary"
            label={TEXTES.cheptel.reservation.reserverDesAnimaux}
            onPress={() => setChoixAnimaux(true)}
          />
        </SectionForm>
      ) : null}

      <SectionForm>
        <FormField
          label={T.note}
          value={note}
          onChangeText={setNote}
          placeholder={T.notePlaceholder}
          multiline
        />
        {declaree && ouverte ? (
          <FormField
            label={T.numeroFacture}
            aide={T.numeroFactureAide}
            value={numeroFacture}
            onChangeText={setNumeroFacture}
          />
        ) : null}
        <Checkbox
          label={T.pasEncaissee}
          value={enAttente}
          onChange={(attente) => {
            setEnAttente(attente);
            if (attente && !echeance) setEcheance(ajouterMois(todayISO(), 1));
          }}
        />
        {enAttente ? (
          <DateField
            label={TEXTES.comptabilite.tresorerie.paiement.echeance}
            value={echeance}
            onChange={setEcheance}
          />
        ) : null}
      </SectionForm>

      {erreur ? <Text style={styles.alerte}>{erreur}</Text> : null}

      <View style={styles.actions}>
        {ouverte ? <Button label={T.enregistrer} onPress={enregistrerEtQuitter} /> : null}
        {existante && statut === STATUT_COMMANDE.A_PREPARER ? (
          <Button
            variant="secondary"
            label={T.actions.preparer}
            onPress={() => changerStatut(STATUT_COMMANDE.PREPAREE)}
          />
        ) : null}
        {existante && ouverte ? (
          <Button label={T.actions.livrer} onPress={() => setConfirmation('livrer')} />
        ) : null}
        {existante && statut === STATUT_COMMANDE.LIVREE ? (
          <Button variant="secondary" label={T.actions.defaire} onPress={() => setConfirmation('defaire')} />
        ) : null}
        {existante && ouverte ? (
          <Button
            variant="secondary"
            label={T.actions.annuler}
            onPress={() => changerStatut(STATUT_COMMANDE.ANNULEE)}
          />
        ) : null}
        {existante && statut === STATUT_COMMANDE.ANNULEE ? (
          <Button
            variant="secondary"
            label={T.actions.rouvrir}
            onPress={() => changerStatut(STATUT_COMMANDE.A_PREPARER)}
          />
        ) : null}
        {existante ? <Button variant="secondary" label={T.actions.bon} onPress={bon} /> : null}
        {existante ? (
          <Button variant="danger" label={T.supprimer} onPress={() => setConfirmation('supprimer')} />
        ) : null}
      </View>

      <SelectModalMultiple<string>
        // Recréée à chaque ouverture : les animaux déjà réservés sont cochés d'emblée.
        key={choixAnimaux ? 'ouverte' : 'fermee'}
        visible={choixAnimaux}
        titre={TEXTES.cheptel.reservation.titreChoix}
        options={aReserver.map((a) => ({ value: a.id, label: libelleChevreAvecDate(a) }))}
        initiales={reserves.map((a) => a.id)}
        libelleValider={TEXTES.cheptel.reservation.valider}
        onValider={reserverLesAnimaux}
        onClose={() => setChoixAnimaux(false)}
      />
      <ConfirmModal
        visible={confirmation === 'livrer'}
        title={T.livrer.titre}
        message={T.livrer.message(lignesFinales().length, formatMontant(total))}
        confirmLabel={T.livrer.confirmer}
        onCancel={() => setConfirmation(null)}
        onConfirm={livrer}
      />
      <ConfirmModal
        visible={confirmation === 'defaire'}
        title={T.defaire.titre}
        message={T.defaire.message}
        confirmLabel={T.defaire.confirmer}
        onCancel={() => setConfirmation(null)}
        onConfirm={defaire}
      />
      <ConfirmModal
        visible={confirmation === 'supprimer'}
        title={T.supprimerTitre}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setConfirmation(null)}
        onConfirm={supprimer}
      />
    </Screen>
  );
}
