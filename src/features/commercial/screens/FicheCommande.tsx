import { useCallback, useState } from 'react';
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
import { articlesDuGenre, type ArticleAffiche } from '@/features/stock/services/stock';
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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [existante, setExistante] = useState<Commande | undefined>();
  const [clients, setClients] = useState<Client[]>([]);
  const [fromages, setFromages] = useState<ArticleAffiche[]>([]);
  const [prixInventaire, setPrixInventaire] = useState<Record<string, number>>({});
  const [commercial, setCommercial] = useState<ArchiveCommercial | null>(null);

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
      ]).then(([listeClients, stock, archive, commande]) => {
        setClients(listeClients);
        setFromages(articlesDuGenre(GENRE_ARTICLE.FROMAGE, stock));
        setPrixInventaire(stock.prix);
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
    const enregistree = await enregistrer({ ...commande, statut: nouveau });
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

  const supprimer = async () => {
    setConfirmation(null);
    if (existante) await supprimerCommande(existante.id);
    router.back();
  };

  const bon = async () => {
    const commande = construire();
    if (!commande) return;
    const enregistree = await enregistrer(commande);
    if (enregistree) await exporterBonLivraisonPdf(enregistree);
  };

  const optionsClients = [
    { value: '', label: T.clientPlaceholder },
    ...clients.map((c) => ({ value: c.id, label: nomComplet(c) })),
  ];
  const optionsFromages = fromages.map((f) => ({ value: f.cle, label: f.libelle }));

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
            <View style={styles.champsLigne}>
              <View style={styles.champLigne}>
                <FormField
                  label={T.quantite}
                  value={l.quantite}
                  onChangeText={(quantite) => changerLigne(l.id, { quantite })}
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
