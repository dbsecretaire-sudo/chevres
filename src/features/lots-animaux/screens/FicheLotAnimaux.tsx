import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { ListRow } from '@/shared/components/ListRow';
import { SelectField } from '@/shared/components/SelectField';
import { listChevresVivantes, listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { CATEGORIE_LOT } from '@/shared/constants/lots';
import { ChampBoucles } from '@/features/lots-animaux/components/ChampBoucles';
import { useLots } from '@/features/lots-animaux/hooks/useLots';
import { useTiptags } from '@/features/stock/hooks/useTiptags';
import { listTousTraitements } from '@/features/sante/repository/traitements';
import { animauxEnDelai, finDuDelai, finLaPlusTardive } from '@/features/sante/services/delaisAttente';
import {
  animauxDuLot,
  bouclesDuLot,
  nomDeLotPris,
  estCategorieVerrouillee,
  estLotAutomatique,
  estLotVerrouille,
  traitementsDuLot,
} from '@/features/lots-animaux/services/lots';
import {
  anneeDeLotPrise,
  anneeDuLot,
  avecAnnee,
  estCategorieAnnuelle,
  nomDuLotAnnuel,
  type CategorieAnnuelle,
} from '@/features/lots-animaux/services/lotsAnnuels';
import type { Traitement } from '@/features/sante/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { currentYear, formatDateFR, todayISO } from '@/shared/utils/dates';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

const T = TEXTES.cheptel.lots;
const TT = TEXTES.cheptel.traitements;

type OngletLot = 'lot' | 'animaux' | 'suivi';

/**
 * Un lot d'animaux (libre, ou qui se crée chaque année : mises à la reproduction, avortements, renouvellement) : son nom et sa catégorie, ses animaux (leurs boucles se choisissent dans le
 * cheptel) et son suivi sanitaire — les animaux du lot en délai d'attente aujourd'hui et les traitements qu'on lui a donnés, d'où l'on peut en donner un nouveau à tout le lot d'un appui.
 * Le bon de livraison de l'abattoir a sa propre fiche (FicheBonDeLivraison).
 */
export default function FicheLotAnimaux() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const { id, categorie: categorieDemandee, onglet: ongletDemande } = useLocalSearchParams<{ id?: string; categorie?: string; onglet?: string }>();
  const { lots, creer, modifier, modifierRenouvellement, supprimer, categories } = useLots();
  /** La catégorie du lot (vide : « Autres lots »). */
  const [categorie, setCategorie] = useState(
    categorieDemandee && categorieDemandee !== 'autres' ? categorieDemandee : '',
  );
  const existant = id ? lots.find((l) => l.id === id) : undefined;
  /** Règle d'or : tout tiptag est destiné à l'abattoir (pas au renouvellement). */
  const tiptags = useTiptags();
  // Un lien (le didacticiel) peut ouvrir un onglet du lot : il s'ouvre dessus, et change d'onglet quand l'adresse en demande un autre.
  const ongletValide = (o?: string): OngletLot | undefined =>
    (['lot', 'animaux', 'suivi'] as string[]).includes(o ?? '') ? (o as OngletLot) : undefined;
  const [onglet, setOnglet] = useState<OngletLot>(ongletValide(ongletDemande) ?? 'lot');
  const [ongletVu, setOngletVu] = useState(ongletDemande);
  if (ongletDemande !== ongletVu) {
    setOngletVu(ongletDemande);
    const demande = ongletValide(ongletDemande);
    if (demande) setOnglet(demande);
  }
  const [nom, setNom] = useState('');
  const [boucles, setBoucles] = useState('');
  /** Un lot d'une année (mises à la reproduction, avortements, renouvellement) : son année, saisie. */
  const [anneeLot, setAnneeLot] = useState('');
  const [charge, setCharge] = useState(false);
  /** Pourquoi la saisie d'un lot déjà créé n'est pas enregistrée (année prise, nom manquant…) : elle s'enregistre dès qu'elle est valide. */
  const [erreur, setErreur] = useState('');
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  const [traitements, setTraitements] = useState<Traitement[]>([]);

  // Les valeurs du lot, une fois les réglages lus.
  useEffect(() => {
    if (existant && !charge) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNom(existant.nom);
      setBoucles(existant.boucles);
      setCategorie(existant.categorie ?? '');
      setAnneeLot(String(anneeDuLot(existant) ?? ''));
      setCharge(true);
    }
  }, [existant, charge]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listChevresVivantes(), listTousTraitements()])
        .then(([a, t]) => {
          setAnimaux(a);
          setTraitements(t);
        })
        .catch(() => undefined);
      // L'espèce courante change ce qui est lu : l'écran se recharge avec elle.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [espece]),
  );

  /**
   * Enregistre le lot. Un lot déjà créé s'enregistre tout seul (`auto` : sans message ni retour en arrière, le refus s'écrit sous le formulaire) ;
   * un nouveau lot a son bouton « Enregistrer ».
   */
  const enregistrer = async (auto = false): Promise<boolean> => {
    const refuser = (message: string) => {
      setErreur(message);
      if (!auto) Alert.alert(message);
      return false;
    };
    setErreur('');
    // Un lot qui se crée tout seul chaque année (mises à la reproduction, avortements, renouvellement) : le nom suit l'année, que l'on peut
    // changer ; les animaux s'ajoutent et se retirent.
    if (existant && estLotAutomatique(existant)) {
      const annee = Number(anneeLot);
      if (!(annee >= 2000 && annee < 2100)) return refuser(T.anneeInvalideLot);
      if (anneeDeLotPrise(lots, existant, annee)) return refuser(T.anneeDejaPrise);
      const sansTiptag =
        existant.categorie === CATEGORIE_LOT.RENOUVELLEMENT
          ? bouclesDuLot({ boucles })
              .filter((b) => !tiptags.has(b))
              .join(', ')
          : boucles.trim();
      const base = { ...existant, boucles: sansTiptag };
      const modifie = annee === anneeDuLot(existant) ? base : avecAnnee(base, annee);
      if (existant.categorie === CATEGORIE_LOT.RENOUVELLEMENT)
        await modifierRenouvellement(modifie, await listTousLesAnimauxDeLEspece());
      else await modifier(modifie);
      if (!auto) retournerALaPageDAvant(router);
      return true;
    }
    const nomFinal = nom.trim();
    if (!nomFinal) return refuser(T.nomRequis);
    if (nomDeLotPris(nomFinal, lots, existant?.id)) return refuser(T.nomPris);
    if (existant)
      await modifier({
        ...existant,
        nom: nomFinal,
        boucles: boucles.trim(),
        categorie: categorie || undefined,
        factureId: undefined,
        // Pas de montant sans facture : les frais d'abattoir sont ceux de la facture liée.
        fraisAbattoir: undefined,
      });
    else
      await creer(nomFinal, boucles, {
        categorie: categorie || undefined,
      });
    if (!auto) retournerALaPageDAvant(router);
    return true;
  };

  const automatique = !!existant && estLotAutomatique(existant);
  // Un lot déjà créé s'enregistre tout seul, peu après chaque changement.
  useEnregistrementAuto({
    actif: !!existant && charge,
    signature: JSON.stringify([nom, boucles, categorie, anneeLot]),
    enregistrer: () => enregistrer(true),
  });
  /** Les onglets d'un lot selon sa catégorie. Un nouveau lot n'a pas d'onglet. */
  const onglets: OngletLot[] = !existant
    ? []
    : estCategorieAnnuelle(existant.categorie)
      ? // Un lot d'une année (mises à la reproduction, avortements, renouvellement) n'a pas d'onglet « Lot » : son année suit les fiches des femelles ; on y voit les animaux et leur suivi.
        ['animaux', 'suivi']
      : ['lot', 'animaux', 'suivi'];
  const ongletActif: OngletLot = onglets.includes(onglet) ? onglet : (onglets[0] ?? 'lot');
  /** Vrai pour ce qui s'affiche sur l'onglet actif ; un nouveau lot montre tout sur une seule page. */
  const surLaPage = (o: OngletLot) => !existant || ongletActif === o;
  const libelleOnglet = (o: OngletLot): string => (o === 'animaux' ? T.onglets.animaux(bouclesDuLot({ boucles }).length) : T.onglets[o]);
  /** Un lot qui se crée tout seul (année) : on n'y change que les animaux. */
  const verrouille = !!existant && estLotVerrouille(existant);
  const membres = existant ? animauxDuLot({ boucles }, animaux) : [];
  const idsMembres = new Set(membres.map((a) => a.id));
  const aujourdhui = todayISO();
  const enLait = animauxEnDelai(animaux, traitements, aujourdhui, 'lait').filter((a) => idsMembres.has(a.animal.id));
  const enViande = animauxEnDelai(animaux, traitements, aujourdhui, 'viande').filter((a) => idsMembres.has(a.animal.id));
  const finLait = finLaPlusTardive(enLait);
  const finViande = finLaPlusTardive(enViande);
  const duLot = existant ? traitementsDuLot(existant, traitements) : [];

  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Screen>
        {/* Chaque lot a ses onglets (le nom, les animaux, le suivi sanitaire) : une page courte plutôt qu'une longue colonne. */}
        {existant ? (
          <>
            <Text style={commonStyles.cardTitle}>{existant.nom}</Text>
            <PucesDefilantes<OngletLot>
              puces={onglets.map((valeur) => ({ valeur, label: libelleOnglet(valeur) }))}
              valeur={ongletActif}
              onChoisir={setOnglet}
            />
          </>
        ) : null}

        {/* Le lot lui-même : son nom et sa catégorie (ou son année, pour un lot qui se crée chaque année). */}
        {surLaPage('lot') ? (
          automatique && existant ? (
            <>
              <Text style={commonStyles.note}>{T.nom}</Text>
              <Text style={commonStyles.lineSemiBold}>
                {nomDuLotAnnuel(existant.categorie as CategorieAnnuelle, Number(anneeLot) || (anneeDuLot(existant) ?? currentYear()))}
              </Text>
              <FormField label={T.anneeDuLot} value={anneeLot} onChangeText={setAnneeLot} keyboardType="number-pad" aide={T.anneeDuLotAide} />
              <Text style={commonStyles.note}>
                {existant.categorie === CATEGORIE_LOT.RENOUVELLEMENT
                  ? T.aideRenouvellement
                  : existant.categorie === CATEGORIE_LOT.AVORTEMENT
                    ? T.aideAvortement
                    : T.aideReproduction}
              </Text>
            </>
          ) : verrouille && existant ? (
            <>
              <Text style={commonStyles.note}>{T.nom}</Text>
              <Text style={commonStyles.lineSemiBold}>{existant.nom}</Text>
              <Text style={commonStyles.note}>{T.aideVerrouille}</Text>
            </>
          ) : (
            <>
              <FormField label={T.nom} required value={nom} onChangeText={setNom} placeholder={T.exemple} />
              <SelectField<string>
                label={T.categories.categorie}
                value={categorie}
                onChange={setCategorie}
                options={[
                  { value: '', label: T.categories.autres },
                  ...categories.filter((c) => !estCategorieVerrouillee(c.id)).map((c) => ({ value: c.id, label: c.nom })),
                ]}
              />
            </>
          )
        ) : null}

        {/* Les boucles du lot ne s'écrivent pas à la main : elles se choisissent dans le cheptel, où celles du lot sont déjà cochées. */}
        {surLaPage('animaux') ? (
          <>
            <ChampBoucles
              value={boucles}
              onChange={setBoucles}
              sansLots
              enColonnes
              date={automatique && /^\d{4}$/.test(anneeLot) ? `${anneeLot}-01-01` : undefined}
              metEnEvidenceSansMiseBas={existant?.categorie === CATEGORIE_LOT.REPRODUCTION}
              exclure={existant?.categorie === CATEGORIE_LOT.RENOUVELLEMENT ? tiptags : undefined}
              femellesSeulement={existant?.categorie === CATEGORIE_LOT.REPRODUCTION || existant?.categorie === CATEGORIE_LOT.AVORTEMENT}
              anneeDuLot={
                existant?.categorie === CATEGORIE_LOT.REPRODUCTION || existant?.categorie === CATEGORIE_LOT.AVORTEMENT
                  ? Number(anneeLot) || anneeDuLot(existant)
                  : undefined
              }
              texteVide={T.aucunAnimalDansLeLot}
            />
            <Text style={commonStyles.note}>{T.aideBoucles}</Text>
            {existant ? <Text style={commonStyles.note}>{T.animaux(membres.length, bouclesDuLot({ boucles }).length)}</Text> : null}
          </>
        ) : null}

        {/* Un lot déjà créé s'enregistre tout seul ; seul un nouveau lot a son bouton. */}
        {erreur && existant ? <Text style={[commonStyles.note, commonStyles.required]}>{erreur}</Text> : null}
        {existant ? null : <Button label={TEXTES.commun.general.enregistrer} onPress={() => enregistrer()} />}
        {existant && !verrouille && ongletActif === 'lot' ? (
          <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} />
        ) : null}

        {/* Le suivi sanitaire : les délais d'attente des animaux du lot et les traitements qu'on lui a donnés. */}
        {existant && ongletActif === 'suivi' ? (
          <>
            <Card style={commonStyles.gap8}>
              <Text style={commonStyles.cardTitle}>{T.suivi}</Text>
              {finLait ? (
                <Text style={[commonStyles.lineBold, { color: colors.danger }]}>{TT.laitEnDelai(enLait.length, formatDateFR(finLait))}</Text>
              ) : null}
              {finViande ? (
                <Text style={[commonStyles.lineBold, { color: colors.danger }]}>{TT.viandeEnDelai(enViande.length, formatDateFR(finViande))}</Text>
              ) : null}
              {!finLait && !finViande ? <Text style={commonStyles.mutedItalic}>{TT.aucunEnCours}</Text> : null}
              <Button variant="secondary" label={T.nouveauTraitement} onPress={() => router.push(ROUTES.traitementPourLot(existant.id) as never)} />
            </Card>
            <View style={commonStyles.gap10}>
              <Text style={commonStyles.cardTitle}>{T.traitementsDuLot(duLot.length)}</Text>
              {duLot.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunTraitement}</Text> : null}
              {duLot.map((t) => (
                <ListRow
                  key={t.id}
                  title={t.produit}
                  subtitle={[
                    formatDateFR(t.date),
                    finDuDelai(t, 'lait') ? TT.delaiLait(t.delaiLaitJours ?? 0, formatDateFR(finDuDelai(t, 'lait')!)) : undefined,
                    finDuDelai(t, 'viande') ? TT.delaiViande(t.delaiViandeJours ?? 0, formatDateFR(finDuDelai(t, 'viande')!)) : undefined,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  onPress={() => router.push(ROUTES.traitement(t.id) as never)}
                />
              ))}
            </View>
          </>
        ) : null}
        <ConfirmModal
          visible={suppressionOuverte}
          title={T.supprimerQuestion}
          message={T.supprimerMessage}
          confirmLabel={TEXTES.commun.general.supprimer}
          onCancel={() => setSuppressionOuverte(false)}
          onConfirm={async () => {
            if (existant) await supprimer(existant.id);
            retournerALaPageDAvant(router);
          }}
        />
      </Screen>
    </AccentColorProvider>
  );
}
