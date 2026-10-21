import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { DateField } from '@/shared/components/DateField';
import { Button } from '@/shared/components/Button';
import { InfoModal } from '@/shared/components/InfoModal';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { AncreVisite } from '@/features/didacticiel/components/AncreVisite';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { YearPicker } from '@/shared/components/YearPicker';
import { colors } from '@/shared/theme/colors';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import {
  SectionDepenseContact,
  SectionDepenseDetail,
} from '@/features/comptabilite/components/ecriture/SectionDepense';
import {
  SectionRecetteContact,
  SectionRecetteVente,
} from '@/features/comptabilite/components/ecriture/SectionRecette';
import { SelectModal } from '@/shared/components/SelectModal';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { commandeOuverte, totalCommande } from '@/features/commercial/services/commandes';
import type { Commande } from '@/features/commercial/types';
import { elementsAFacturer, type ElementACommande } from '@/features/commercial/services/commandes';
import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import { reservesDeLaCommande } from '@/features/cheptel/services/reservations';
import { etatCommunDesReservations } from '@/features/commercial/services/reservations';
import type { Chevre } from '@/features/cheptel/types';
import { SelectModalMultiple } from '@/shared/components/SelectModalMultiple';
import { estUnAbattoir } from '@/features/fournisseurs/services/abattoirs';
import { useNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import type { CategorieDepense, CategorieRecette, TypeFacture } from '@/features/comptabilite/types';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE, OBJET_ASSURANCE, TYPE_FACTURE, VOLET_COOPERATIVE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { especesActives, plusieursEspeces } from '@/shared/dictionnaire/animaux';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { currentYear, formatMontant } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const OPTIONS_TYPE = [
  { value: TYPE_FACTURE.RECUE, label: TEXTES.commun.general.debit },
  { value: TYPE_FACTURE.EMISE, label: TEXTES.commun.general.credit },
];

export default function NouvelleFacture() {
  useAjoutTabBarBleu();
  const params = useLocalSearchParams<{
    type?: TypeFacture;
    categorie?: CategorieRecette;
    abattoir?: string;
    facture?: string;
    /** Le client d'ouverture (sa fiche) et les animaux à vendre (leurs identifiants séparés par « ; »), depuis la réservation. */
    client?: string;
    animaux?: string;
    /** Des lots à vendre (identifiants séparés par « ; »), leur produit (« fromage:frais ») et son nom. */
    fromages?: string;
    produit?: string;
    produitLibelle?: string;
    /** L'état des animaux (depuis leur réservation) : « vivants » ou « morts ». */
    etat?: string;
    /** Un bon de commande à transformer en vente tout de suite (depuis la validation de la préparation). */
    commande?: string;
    /** Seulement ces lignes du bon (identifiants séparés par « ; ») : la facturation depuis les lots d'un produit. */
    lignes?: string;
    /** « vente » : s'ouvre sur la 2e étape (ce qui est vendu ou acheté), sans passer par le contact : le didacticiel y montre ses champs. */
    etape?: string;
    /** La catégorie de dépense d'ouverture (une facture reçue) : le didacticiel y montre ses champs. */
    depense?: string;
    /** Le lot d'abattoir à facturer (depuis son assistant) : sa dépense se rattache à lui, sans choisir d'animaux. */
    lot?: string;
    /** Le contact (fournisseur) choisi d'office : l'abattoir du lot. */
    fournisseur?: string;
    /** Le motif d'office (la résiliation d'une assurance : le trop-perçu de prime). */
    motif?: string;
    /** Le volet d'une association ou d'une coopérative agricole, choisi d'office (depuis la page du groupement). */
    volet?: string;
    /** Ce qu'une assurance couvre, choisi d'office (« vehicule », depuis la fiche d'un véhicule). */
    objet?: string;
    /** Le véhicule de la flotte choisi d'office (depuis sa fiche : une réparation, une prime d'assurance). */
    vehicule?: string;
    /** « 1 » : le premier contact de catégorie Abattoir est choisi d'office (amener des animaux à l'abattoir : « Suivant » mène au choix des animaux). */
    abattoirContact?: string;
  }>();
  // La catégorie de recette d'ouverture : seulement une catégorie connue.
  const categorie = (Object.values(CATEGORIE_RECETTE) as string[]).includes(params.categorie ?? '')
    ? params.categorie
    : undefined;
  const e = useNouvelleEcriture(
    params.type,
    categorie,
    params.abattoir,
    params.facture === 'non',
    params.client,
    params.animaux ? params.animaux.split(';').filter(Boolean) : undefined,
    params.fromages
      ? {
          fromages: params.fromages.split(';').filter(Boolean),
          produit: params.produit,
          libelle: params.produitLibelle,
        }
      : undefined,
    params.etat,
    params.lot,
  );
  // La catégorie de dépense demandée par l'adresse (une catégorie connue) : elle se choisit d'office, et change quand l'adresse en demande une autre.
  const [depenseVue, setDepenseVue] = useState<string | undefined>(undefined);
  if (params.depense !== depenseVue) {
    setDepenseVue(params.depense);
    if (params.depense && (Object.values(CATEGORIE_DEPENSE) as string[]).includes(params.depense)) e.changerCategorieDepense(params.depense as CategorieDepense);
  }
  // Amener des animaux à l'abattoir : une fois la dépense « Animaux vivants (sortie) » choisie, le premier abattoir des contacts est sélectionné.
  const [abattoirChoisi, setAbattoirChoisi] = useState(false);
  if (
    params.abattoirContact === '1' &&
    !abattoirChoisi &&
    e.fournisseurs.length > 0 &&
    e.categorieDepense === CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE
  ) {
    setAbattoirChoisi(true);
    const abattoir = e.fournisseurs.find(estUnAbattoir);
    if (abattoir) e.changerFournisseur(abattoir.id);
  }
  // Le contact demandé par l'adresse (l'abattoir du lot) : il est choisi d'office, une fois les contacts chargés.
  const [fournisseurChoisi, setFournisseurChoisi] = useState(false);
  if (params.fournisseur && !fournisseurChoisi && e.fournisseurs.some((f) => f.id === params.fournisseur)) {
    setFournisseurChoisi(true);
    e.changerFournisseur(params.fournisseur);
  }
  // Le motif donné par l'adresse : il pré-remplit le champ, une fois.
  const [motifVu, setMotifVu] = useState(false);
  if (params.motif && !motifVu) {
    setMotifVu(true);
    e.setMotif(params.motif);
  }
  // Le volet demandé par l'adresse (depuis la page de l'association ou de la coopérative) : il est choisi d'office, une fois.
  const [voletVu, setVoletVu] = useState(false);
  if (params.volet && !voletVu) {
    setVoletVu(true);
    if ((Object.values(VOLET_COOPERATIVE) as string[]).includes(params.volet)) e.setVoletCooperative(params.volet);
  }
  // Le véhicule demandé par l'adresse (depuis sa fiche) : il est choisi d'office, une fois.
  const [vehiculeVu, setVehiculeVu] = useState(false);
  if (params.vehicule && !vehiculeVu) {
    setVehiculeVu(true);
    e.setVehiculeId(params.vehicule);
    if (params.objet && (Object.values(OBJET_ASSURANCE) as string[]).includes(params.objet)) e.setObjetAssurance(params.objet);
  }
  /** Les années proposées : celles qui ont des écritures, l'année en cours et la précédente (pour saisir ce qui a été oublié). */
  const [annees, setAnnees] = useState<number[]>([e.anneeActive]);
  useFocusEffect(
    useCallback(() => {
      toutesLesAnneesConnues().then((connues) => setAnnees([...new Set([...connues, currentYear() - 1])]));
    }, []),
  );
  /**
   * Une écriture se saisit en deux étapes, pour une dépense comme pour une recette : le contact (la date, le tiers, la facture), puis
   * ce qui est acheté ou vendu (son détail, son montant, son paiement).
   */
  const [etape, setEtape] = useState<'contact' | 'vente'>(params.etape === 'vente' ? 'vente' : 'contact');
  // L'adresse demande une autre étape (le didacticiel passe d'une étape de la saisie à l'autre) : l'écran la suit.
  const [etapeDemandeeVue, setEtapeDemandeeVue] = useState(params.etape);
  if (params.etape !== etapeDemandeeVue) {
    setEtapeDemandeeVue(params.etape);
    setEtape(params.etape === 'vente' ? 'vente' : 'contact');
  }
  // Une écriture enchaînée, ou un autre type d'écriture (dépense, recette), repart de la première étape.
  const [enchaineesVues, setEnchaineesVues] = useState(0);
  if (enchaineesVues !== e.enchainees) {
    setEnchaineesVues(e.enchainees);
    setEtape('contact');
  }
  const [typeVu, setTypeVu] = useState(e.type);
  if (typeVu !== e.type) {
    setTypeVu(e.type);
    setEtape('contact');
  }
  /** Les commandes à transformer en vente : celles qui restent à préparer ou à livrer. */
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [choixCommande, setChoixCommande] = useState(false);
  /** Les animaux de l'espèce : ceux réservés par un bon de commande se facturent avec lui. */
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  /** Le bon choisi quand il a plusieurs éléments : on choisit de tout facturer, ou une partie. */
  const [partie, setPartie] = useState<{ commande: Commande; elements: ElementACommande[]; ids: string[] } | null>(null);
  const ouvrirLesCommandes = async () => {
    const [archive, tous] = await Promise.all([lireArchiveCommercial(), listTousLesAnimauxDeLEspece()]);
    setAnimaux(tous);
    // Les bons ouverts qui ont encore quelque chose à facturer.
    setCommandes(
      archive.commandes.filter(
        (c) =>
          commandeOuverte(c) &&
          elementsAFacturer(c, reservesDeLaCommande(tous, c.id).map((a) => a.id)).length > 0,
      ),
    );
    setChoixCommande(true);
  };
  /** Reprend un bon de commande : ses lignes et ses animaux réservés ; plusieurs éléments, on choisit ce qu'on facture maintenant. */
  const commencer = (commande: Commande, tous: Chevre[], seulementLignes?: string[]) => {
    const reserves = reservesDeLaCommande(tous, commande.id);
    const ids = reserves.map((a) => a.id);
    const tousLesElements = elementsAFacturer(commande, ids, etatCommunDesReservations(reserves));
    // Depuis les lots d'un produit : seulement les lignes de ces lots (le reste du bon reste à facturer).
    const elements = seulementLignes
      ? tousLesElements.filter((el) => el.type === 'ligne' && seulementLignes.includes(el.ligne.id))
      : tousLesElements;
    if (elements.length <= 1) e.demarrerCommande(commande, elements, ids);
    else setPartie({ commande, elements, ids });
  };
  // Ouvert avec un bon de commande : il est repris d'office.
  useEffect(() => {
    if (!params.commande) return;
    Promise.all([lireArchiveCommercial(), listTousLesAnimauxDeLEspece()]).then(([archive, tous]) => {
      const bon = archive.commandes.find((c) => c.id === params.commande);
      if (bon) commencer(bon, tous, params.lignes ? params.lignes.split(';').filter(Boolean) : undefined);
    });
    // Une seule fois, à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.commande]);
  const libelleElement = (el: ElementACommande): string =>
    el.type === 'ligne'
      ? `${el.ligne.quantite} × ${el.ligne.libelle}`
      : TEXTES.comptabilite.nouvelleEcriture.animauxReserves(el.ids.length);
  // L'activité se choisit par une puce (comme dans la liste) ; elle n'apparaît que pour un établissement à plusieurs espèces.
  const activites = [...especesActives(), ...(e.avecCommunActivite ? [ACTIVITE_COMMUNE] : [])];

  /** La date de l'écriture : en tête de la première section (l'identification), pour un débit comme pour un crédit. */
  const champDate = (
    <DateField
      label={TEXTES.commun.general.date}
      required
      value={e.date}
      onChange={e.setDate}
      anneeImposee={e.anneeImposee}
      jourMoisAnnee
    />
  );

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <LigneFiltres>
          <YearPicker
            annees={annees}
            value={e.anneeActive}
            onChange={e.setAnneeActive}
            tout={e.toutesAnnees}
            onChoisirTout={e.choisirToutesAnnees}
          />
          <ChoixDeroulant
            titre={TEXTES.commun.general.type}
            valeur={e.type}
            options={OPTIONS_TYPE}
            onChoisir={e.setType}
          />
          {plusieursEspeces() ? (
            <AncreVisite id="ecriture.activite">
              <ChoixDeroulant
                titre={TEXTES.comptabilite.activite.activite}
                valeur={e.activite}
                options={activites.map((a) => ({ value: a, label: LABEL_ACTIVITE_COMPTABLE[a] }))}
                onChoisir={e.changerActivite}
              />
            </AncreVisite>
          ) : null}
        </LigneFiltres>

        {e.type === TYPE_FACTURE.RECUE ? (
          etape === 'contact' ? (
            <SectionDepenseContact e={e} date={champDate} />
          ) : (
            <SectionDepenseDetail e={e} />
          )
        ) : etape === 'contact' ? (
          <>
            <SectionRecetteContact e={e} date={champDate} onCommande={ouvrirLesCommandes} />
            {e.commande ? (
              <Text style={commonStyles.note}>
                {TEXTES.comptabilite.nouvelleEcriture.commandeEnCours(
                  e.commande.numero,
                  e.elementsDeLaCommande.length,
                )}
              </Text>
            ) : null}
          </>
        ) : (
          <SectionRecetteVente e={e} />
        )}

        {e.enchainees > 0 ? (
          <Text style={commonStyles.note}>
            {TEXTES.comptabilite.nouvelleEcriture.enchainees(e.enchainees)}
          </Text>
        ) : null}
        {etape === 'contact' ? (
          // Première étape : annuler, ou passer à la suite.
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={e.annuler}
            />
            <Button
              style={commonStyles.flex1}
              label={TEXTES.comptabilite.nouvelleEcriture.suivant}
              onPress={() => {
                // Le circuit de vente d'une vente de production est obligatoire : on ne passe pas à la suite sans lui.
                if (e.estProductionVente && !e.circuit) {
                  e.setErreur({ titre: TEXTES.comptabilite.nouvelleEcriture.circuitRequis });
                  return;
                }
                setEtape('vente');
              }}
            />
          </View>
        ) : (
          <>
            <Button
              variant="secondary"
              label={TEXTES.comptabilite.nouvelleEcriture.enregistrerEtAjouter}
              onPress={() => e.enregistrer(true)}
              loading={e.enregistrement}
            />
            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.comptabilite.nouvelleEcriture.precedent}
                onPress={() => setEtape('contact')}
              />
              <Button
                style={commonStyles.flex1}
                label={TEXTES.commun.general.enregistrer}
                onPress={() => e.enregistrer()}
                loading={e.enregistrement}
              />
            </View>
          </>
        )}
      </Screen>

      <SelectModal<string>
        visible={choixCommande}
        titre={TEXTES.comptabilite.nouvelleEcriture.choisirCommande}
        value={e.commande?.id ?? ''}
        options={commandes.map((c) => ({
          value: c.id,
          label: `${c.numero} · ${c.client} · ${formatMontant(totalCommande(c))}`,
        }))}
        onSelect={(id) => {
          const choisie = commandes.find((c) => c.id === id);
          setChoixCommande(false);
          if (!choisie) return;
          // Un seul élément : on le reprend ; sinon on choisit de tout facturer ou seulement une partie du bon.
          commencer(choisie, animaux);
        }}
        onClose={() => setChoixCommande(false)}
      />
      <SelectModalMultiple<string>
        key={partie ? partie.commande.id : 'aucun'}
        visible={!!partie}
        titre={TEXTES.comptabilite.nouvelleEcriture.queFacturer}
        options={(partie?.elements ?? []).map((el, i) => ({ value: String(i), label: libelleElement(el) }))}
        initiales={(partie?.elements ?? []).map((_, i) => String(i))}
        libelleValider={TEXTES.comptabilite.nouvelleEcriture.facturerLaSelection}
        onValider={(valeurs) => {
          if (partie) {
            const choisis = valeurs.map(Number).sort((a, b) => a - b).map((i) => partie.elements[i]);
            if (choisis.length > 0) e.demarrerCommande(partie.commande, choisis, partie.ids);
          }
          setPartie(null);
        }}
        onClose={() => setPartie(null)}
      />
      <InfoModal
        visible={!!e.erreur}
        title={e.erreur?.titre ?? ''}
        message={e.erreur?.message}
        onClose={() => e.setErreur(null)}
      />
    </AccentColorProvider>
  );
}
