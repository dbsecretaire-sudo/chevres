import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { enregistrerLaVente, sortirLesAnimauxDeLaVente } from '@/features/comptabilite/hooks/nouvelleEcriture/enregistrement';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { saveChevre } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { libelleChevre } from '@/features/cheptel/utils/chevreLabel';
import { especeDe } from '@/features/cheptel/utils/espece';
import { ControlePrix } from '@/features/production/simple/ControlePrix';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import type { ArchiveStock } from '@/features/stock/types';
import { cleLigneDeViande, detailEtPrixDeLaVente, prixAuKilo, roleDeLAnimalVendu, totalDeLAnimal } from '@/features/production/simple/prixViande';
import { lireArchiveStock } from '@/features/stock/repository';
import { PageSimplePoidsClient } from '@/features/production/simple/PageSimplePoidsClient';
import { animauxSansBoucleAVendre, joursDeVie } from '@/features/production/simple/viandeAVendre';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { GrosBouton } from '@/shared/components/GrosBouton';
import { agePetitMax } from '@/shared/constants/cheptel';
import { CATEGORIE_VENTE, TYPE_CHOIX_FACTURE, UNITE_VENTE } from '@/shared/constants/comptabilite';
import { CIRCUIT_VENTE } from '@/shared/constants/commercial';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { ROLE_VIANDE } from '@/shared/constants/stock';
import { tauxTvaDeLaVente } from '@/shared/dictionnaire/tauxParProduit';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { loadAllYears } from '@/shared/storage/localStore';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { ageAtteint } from '@/shared/utils/age';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';

const T = TEXTES.production.viande;
const S = TEXTES.production.viande.simple;

/** Où l'on en est : la chèvre (la liste), son poids et son client, vivante ou morte, le prix et le paiement, puis la vente est notée. */
type Etape =
  | { nom: 'infos' }
  | { nom: 'etat'; poids?: number; client?: Client }
  | { nom: 'prix'; poids?: number; client?: Client; etat: 'vivants' | 'morts'; calcul?: string }
  | { nom: 'fait'; resume: string };

/**
 * « Viande à vendre » au plus simple : une tuile par chèvre sans boucle à vendre. Un appui demande le poids et le client, puis si le client la veut vivante ou morte (deux gros
 * boutons : vivante à gauche, morte à droite), puis le prix total et si c'est payé. La vente est notée sans facture, par la vente à la ferme, dans la catégorie Animaux, avec
 * l'animal déjà choisi : elle se retrouve dans les ventes du mode avancé, comme n'importe quelle vente.
 */
function ViandeAVendreContenu({ onRetour }: { onRetour?: () => void }) {
  const router = useRouter();
  const { espece } = useEtablissement();
  const [animaux, setAnimaux] = useState<Chevre[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [choisi, setChoisi] = useState<Chevre | null>(null);
  const [etape, setEtape] = useState<Etape>({ nom: 'infos' });
  const [prix, setPrix] = useState('');
  /** Les prix de l'inventaire (par ligne de viande) : de quoi calculer le prix total. */
  const [prixLignes, setPrixLignes] = useState<Record<string, number>>({});
  const [stock, setStock] = useState<ArchiveStock | null>(null);
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(
    () =>
      Promise.all([loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL) as Promise<Chevre[]>, listToutesVentes(), listClients(), lireArchiveStock()])
        .then(([cheptel, ventes, tous, stock]) => {
          setClients(tous);
          setPrixLignes(stock.prix);
          setStock(stock);
          setAnimaux(
            animauxSansBoucleAVendre(
              cheptel.filter((a) => especeDe(a) === espece),
              new Set(ventes.flatMap((v) => idsDesAnimaux(v))),
            ),
          );
        })
        .catch(() => undefined),
    [espece],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  /** Note la vente (sans facture, vente à la ferme, catégorie Animaux) : l'animal sort du cheptel. */
  const vendre = async (animal: Chevre, e: { poids?: number; client?: Client; etat: 'vivants' | 'morts' }, paye: boolean) => {
    if (enCours) return;
    const total = parseDecimal(prix);
    if (!(total > 0)) return;
    setEnCours(true);
    try {
      if (e.poids !== undefined && e.poids !== animal.poidsKg) await saveChevre({ ...animal, poidsKg: e.poids });
      const prixTotal = Math.round(total * 100) / 100;
      // Le détail (la ligne de l'inventaire) et le prix unitaire : sans eux, la fiche de la vente du mode avancé ne retrouverait pas le total.
      const role = roleDeLAnimalVendu(!ageAtteint(animal.dateNaissance, agePetitMax(), todayISO()), e.etat);
      const detail = stock ? detailEtPrixDeLaVente(stock, espece, role, prixTotal, e.poids ?? animal.poidsKg) : {};
      const vente = await enregistrerLaVente({
        activite: espece,
        date: todayISO(),
        categorie: CATEGORIE_VENTE.VIANDE,
        quantite: 1,
        unite: UNITE_VENTE.PIECE,
        prix: prixTotal,
        ...detail,
        tauxTva: tauxTvaDeLaVente(CATEGORIE_VENTE.VIANDE),
        client: e.client ? nomComplet(e.client) : undefined,
        poidsKg: e.poids,
        jeune: !ageAtteint(animal.dateNaissance, agePetitMax(), todayISO()) ? true : undefined,
        etatAnimaux: e.etat,
        animaux: animal.id,
        choixFacture: TYPE_CHOIX_FACTURE.SANS_FACTURE,
        circuit: CIRCUIT_VENTE.FERME,
        payee: paye ? undefined : false,
      });
      await sortirLesAnimauxDeLaVente(vente);
      setEtape({ nom: 'fait', resume: S.venteDetail(e.client ? nomComplet(e.client) : '', formatMontant(vente.prix ?? 0), paye) });
      await charger();
    } finally {
      setEnCours(false);
    }
  };

  /** Passe au prix : le total est le poids × le prix de l'inventaire (au kilo pour un petit ou un adulte mort, à la tête pour un adulte vivant), proposé d'avance. */
  const versLePrix = (animal: Chevre, poids: number | undefined, client: Client | undefined, etat: 'vivants' | 'morts') => {
    const role = roleDeLAnimalVendu(!ageAtteint(animal.dateNaissance, agePetitMax(), todayISO()), etat);
    const unitaire = prixLignes[cleLigneDeViande(espece, role)];
    const kilos = poids ?? animal.poidsKg;
    const total = totalDeLAnimal(unitaire, role, kilos);
    setPrix(total === undefined ? '' : String(total).replace('.', ','));
    const calcul =
      total === undefined
        ? undefined
        : prixAuKilo(role)
          ? S.calculKilo(String(kilos ?? 1).replace('.', ','), formatMontant(unitaire))
          : S.calculTete(formatMontant(unitaire));
    setEtape({ nom: 'prix', poids, client, etat, calcul });
  };

  const retourListe = () => {
    setChoisi(null);
    setEtape({ nom: 'infos' });
  };

  if (choisi && etape.nom === 'infos') {
    const jours = joursDeVie(choisi.dateNaissance, todayISO());
    return (
      <PageSimplePoidsClient
        titre={TEXTES.accueil.ferme.terrain.tuiles.viandeAVendre}
        detail={[libelleChevre(choisi), jours === undefined ? '' : S.jours(jours)].filter(Boolean).join(' · ')}
        poidsInitial={choisi.poidsKg}
        clients={clients}
        libelleValider={S.suivant}
        enCours={false}
        onValider={(poids, clientId) => {
          setPrix('');
          setEtape({ nom: 'etat', poids, client: clients.find((c) => c.id === clientId) });
        }}
        onRetour={retourListe}
      />
    );
  }

  if (choisi && etape.nom === 'etat') {
    const { poids, client } = etape;
    return (
      <View style={styles.contenu}>
        <Text style={styles.titre}>{S.vivantOuMort}</Text>
        <View style={styles.grille}>
          <GrosBouton libelle={S.vivant} onPress={() => versLePrix(choisi, poids, client, 'vivants')} icone={<Ionicons name="paw" size={44} color={colors.blanc} />} />
          <GrosBouton libelle={S.mort} onPress={() => versLePrix(choisi, poids, client, 'morts')} icone={<Ionicons name="restaurant" size={44} color={colors.blanc} />} />
        </View>
        <Button label={TEXTES.production.fabricationSimple.retour} variant="secondary" onPress={() => setEtape({ nom: 'infos' })} />
      </View>
    );
  }

  if (choisi && etape.nom === 'prix') {
    const e = etape;
    const valide = parseDecimal(prix) > 0;
    return (
      <View style={styles.contenu}>
        <Text style={styles.detail}>{`${libelleChevre(choisi)} · ${e.etat === 'vivants' ? S.vivant : S.mort}`}</Text>
        <Text style={styles.titre}>{S.prixTotal}</Text>
        {e.calcul ? <Text style={styles.detail}>{e.calcul}</Text> : null}
        <FormField label={S.prixEnEuros} value={prix} onChangeText={setPrix} keyboardType="decimal-pad" autoFocus />
        <Text style={styles.message}>{S.paye}</Text>
        {/* Payé ? : « Oui » ou « Non » note la vente. */}
        <View style={styles.grille}>
          <GrosBouton libelle={S.oui} onPress={() => (valide ? vendre(choisi, e, true) : undefined)} icone={<Ionicons name="checkmark" size={44} color={colors.blanc} />} />
          <GrosBouton libelle={S.non} onPress={() => (valide ? vendre(choisi, e, false) : undefined)} icone={<Ionicons name="close" size={44} color={colors.blanc} />} />
        </View>
        <Button label={TEXTES.production.fabricationSimple.retour} variant="secondary" onPress={() => setEtape({ nom: 'etat', poids: e.poids, client: e.client })} />
      </View>
    );
  }

  if (etape.nom === 'fait')
    return (
      <View style={styles.contenu}>
        <Ionicons name="checkmark-circle" size={96} color={colors.primary} style={styles.coche} />
        <Text style={styles.message}>{S.venteEnregistree}</Text>
        <Text style={styles.detail}>{etape.resume}</Text>
        <Button label={S.terminer} onPress={retourListe} />
      </View>
    );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{TEXTES.accueil.ferme.terrain.tuiles.viandeAVendre}</Text>
      {animaux !== null && animaux.length === 0 ? <Text style={styles.detail}>{T.rienAVendre}</Text> : null}
      <ListeDeChoix
        presentation="tuiles"
        choix={(animaux ?? []).map((a) => {
          const jours = joursDeVie(a.dateNaissance, todayISO());
          return {
            cle: a.id,
            libelle: jours === undefined ? libelleChevre(a) : `${libelleChevre(a)}\n${S.jours(jours)}`,
            icone: 'food-steak' as const,
          };
        })}
        onChoisir={(c) => {
          setEtape({ nom: 'infos' });
          setChoisi((animaux ?? []).find((a) => a.id === c.cle) ?? null);
        }}
      />
      <Pressable style={styles.discret} onPress={onRetour ?? (() => router.back())} accessibilityRole="button">
        <Text style={styles.discretTexte}>{TEXTES.production.fabricationSimple.retour}</Text>
      </Pressable>
    </ScrollView>
  );
}

/** La viande à vendre : avant la liste, le prix du kilo des petits est vérifié dans l'inventaire (et demandé, avec une page simple, s'il manque). */
export function ViandeAVendreSimple({ onRetour }: { onRetour?: () => void }) {
  const { espece } = useEtablissement();
  return (
    <ControlePrix cle={cleLigneDeViande(espece, ROLE_VIANDE.JEUNE)} unite="kilo">
      <ViandeAVendreContenu onRetour={onRetour} />
    </ControlePrix>
  );
}
