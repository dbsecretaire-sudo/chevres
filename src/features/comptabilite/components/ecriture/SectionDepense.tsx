import { estBoucleNumerotee } from '@/features/stock/services/boucles';
import { AncreVisite } from '@/shared/components/AncreVisite';
import { AnimauxAchetesEditor } from '@/features/comptabilite/components/AnimauxAchetesEditor';
import { LotDAbattoirChoix } from '@/features/comptabilite/components/LotDAbattoirChoix';
import { BoutonCadeau } from '@/features/comptabilite/components/BoutonCadeau';
import { LignesChambreEditor } from '@/features/comptabilite/components/LignesChambreEditor';
import { LignesVeterinaireEditor } from '@/features/comptabilite/components/LignesVeterinaireEditor';
import { LignesProductionEditor } from '@/features/comptabilite/components/LignesProductionEditor';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { Interrupteur } from '@/shared/components/Interrupteur';
import { estUnAssureur } from '@/features/fournisseurs/services/contratsAssureur';
import { SectionForm } from '@/shared/components/SectionForm';
import { FormField } from '@/shared/components/FormField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { ChampTauxTva } from '@/features/comptabilite/components/ecriture/ChampTauxTva';
import { LignesAlimentationEditor } from '@/features/comptabilite/components/LignesAlimentationEditor';
import { ChampStockProduction } from '@/features/comptabilite/components/ecriture/ChampStockProduction';
import { ChampVisite } from '@/features/comptabilite/components/ecriture/ChampVisite';
import { LignesCarburantEditor } from '@/features/comptabilite/components/LignesCarburantEditor';
import {
  ChampCategorieCompte,
  ChampMontantTtc,
  NoteComptePcg,
} from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import type { CategorieDepense } from '@/features/comptabilite/types';
import { categoriesDepenseDuMode } from '@/features/comptabilite/utils/categories';
import {
  categorieDepenseAutorisee,
  depenseImposee,
  fournituresSeulementBoucles,
} from '@/features/fournisseurs/services/categorie';
import {
  categorieFournisseurDe,
  offertAffiche,
  pasPayeeAffichee,
  sansFactureAffichee,
} from '@/shared/dictionnaire/categoriesFournisseur';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { CATEGORIE_DEPENSE, OBJET_ASSURANCE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { formatTotalEuros, parseDecimal } from '@/shared/utils/nombres';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ChampAtelier } from '@/features/comptabilite/components/ChampAtelier';
import { ChampVehicule } from '@/features/comptabilite/components/ChampVehicule';
import { ChampObjetAssurance } from '@/features/comptabilite/components/ChampObjetAssurance';
import { ChampNumeroOuContrat } from '@/features/comptabilite/components/ChampNumeroOuContrat';
import { ChampVoletCooperative } from '@/features/comptabilite/components/ChampVoletCooperative';
import { categorieAvecVehicule } from '@/features/exploitation/services/flotte';
import { ChampElementAgritourisme } from '@/features/comptabilite/components/ChampElementAgritourisme';
import { ATELIER } from '@/shared/constants/ateliers';
import { ChampPaiement } from '@/features/comptabilite/components/ChampPaiement';
import { ajouterMois } from '@/features/comptabilite/services/tresorerie';
import { todayISO } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';
import { optionFournisseur } from '@/features/contacts/services/optionsContacts';
import { useListesPerso } from '@/features/settings/hooks/useListesPerso';
import type { ListePerso } from '@/features/settings/services/listesPerso';

/**
 * Les catégories proposées : celles d'une entreprise, ou celles d'un élevage (sauf celles que l'utilisateur a masquées), puis les siennes (Organisation › Listes de choix).
 * La catégorie déjà choisie reste proposée même masquée.
 */
const optionsCategorieDepense = (fournisseur: Fournisseur | undefined, perso: ListePerso | undefined, choisie: string) => {
  const toutes = categoriesDepenseDuMode();
  const permises = toutes.filter((value) => categorieDepenseAutorisee(fournisseur, value));
  const masques = perso?.masques ?? [];
  // Aucune des dépenses permises n'existe dans ce mode (une activité financière, par exemple) : le choix reste entier.
  const deLApplication = (permises.length > 0 ? permises : toutes)
    .filter((value) => !masques.includes(value) || value === choisie)
    .map((value) => ({ value: value as string, label: LABEL_CATEGORIE_DEPENSE[value] }));
  const deLUtilisateur = (perso?.ajoutes ?? [])
    .filter((a) => !masques.includes(a.id) || a.id === choisie)
    .map((a) => ({ value: a.id, label: a.nom }));
  return [...deLApplication, ...deLUtilisateur];
};

/** La première étape d'une dépense : la date, et les cases qui disent comment la facture est reçue (non facturée, offerte). */
export function SectionDepenseDate({ e, date }: { e: EtatNouvelleEcriture; date: ReactNode }) {
  const router = useRouter();
  const retour = useAdresseCourante();
  /** La catégorie du fournisseur choisi : elle dit quelles cases s'affichent (sans fournisseur choisi, toutes). */
  const categorieDuTiers = e.fournisseurSelectionne
    ? categorieFournisseurDe(e.fournisseurSelectionne.categorie)
    : undefined;

  return (
    <SectionForm>
      {date}
      {/* Le fournisseur : d'abord à qui la facture est, puis le numéro, puis les cases. */}
      <SelectFieldEditable
        label={TEXTES.commun.general.fournisseur}
        required
        searchable
        placeholder={TEXTES.commun.general.choixDuFournisseur}
        value={e.fournisseurId}
        onChange={e.changerFournisseur}
        options={e.fournisseurs.map(optionFournisseur)}
        parCategories
        onEdit={() => router.push(ROUTES.fournisseursDepuis(retour))}
      />
      {/* Le numéro de la facture, ou son objet : un champ libre (pour un assureur, le numéro se choisit parmi ses contrats à l'étape suivante). */}
      <FormField
        label={TEXTES.comptabilite.nouvelleEcriture.nDeFactureOuObjet}
        value={e.description}
        onChangeText={e.setDescription}
        placeholder={TEXTES.comptabilite.nouvelleEcriture.precisions}
      />
      {sansFactureAffichee(categorieDuTiers) ? (
        <Interrupteur
          label={TEXTES.comptabilite.nouvelleEcriture.depenseNonFacturee}
          value={e.sansFacture}
          onChange={e.setSansFacture}
          note={TEXTES.comptabilite.nouvelleEcriture.depenseNonFactureeAide}
        />
      ) : null}
      {/* Offerte par le fournisseur (un cadeau) : les lignes offertes comptent 0 € (le bouton « Cadeau » de chaque ligne, à l'étape suivante). */}
      {offertAffiche(categorieDuTiers) ? (
        <Interrupteur
          label={TEXTES.comptabilite.nouvelleEcriture.offerteFacture}
          value={e.offertDepenseCoche}
          onChange={e.setOffertDepense}
          note={e.offertDepense ? TEXTES.comptabilite.nouvelleEcriture.offertFournisseurAide : undefined}
        />
      ) : null}
    </SectionForm>
  );
}

/** La deuxième étape d'une dépense : le numéro de la facture d'un assureur, qui se choisit parmi ses contrats. Les autres n'ont rien ici. */
export function SectionDepenseContact({ e }: { e: EtatNouvelleEcriture }) {
  if (!e.fournisseurSelectionne || !estUnAssureur(e.fournisseurSelectionne)) return null;

  return (
    <SectionForm>
      <ChampNumeroOuContrat
        fournisseur={e.fournisseurSelectionne}
        label={TEXTES.comptabilite.nouvelleEcriture.nDeFactureOuObjet}
        valeur={e.description}
        onChoix={(numero, contrat) => {
          e.setDescription(numero);
          // Le contrat dit ce qu'il couvre : l'objet de l'assurance et, pour un véhicule, sa plaque.
          if (contrat?.vehiculeId) {
            e.setObjetAssurance(OBJET_ASSURANCE.VEHICULE);
            e.setVehiculeId(contrat.vehiculeId);
          } else if (contrat?.objet) {
            e.setObjetAssurance(contrat.objet);
          }
        }}
        placeholder={TEXTES.comptabilite.nouvelleEcriture.precisions}
      />
    </SectionForm>
  );
}

/** Le montant TTC de la dépense : celui de son détail (lignes, chambre, carburant), sinon le montant saisi. */
function montantDeLaDepense(e: EtatNouvelleEcriture): number {
  if (e.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION) return e.totalAlimentation;
  if (e.categorieDepense === CATEGORIE_DEPENSE.PRODUCTION) return e.totalProduction;
  if (e.categorieDepense === CATEGORIE_DEPENSE.CARBURANT) return e.totalCarburant;
  if (e.estChambre) return e.totalChambre;
  return parseDecimal(e.montant);
}

/**
 * La troisième étape d'une dépense : le montant (ou le total du détail), la TVA et le règlement. Le détail se saisit à l'étape
 * précédente ; son total se lit ici.
 */
export function SectionDepenseMontant({ e }: { e: EtatNouvelleEcriture }) {
  const categorieDuTiers = e.fournisseurSelectionne ? categorieFournisseurDe(e.fournisseurSelectionne.categorie) : undefined;
  const estDetaille =
    e.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION ||
    e.categorieDepense === CATEGORIE_DEPENSE.PRODUCTION ||
    e.categorieDepense === CATEGORIE_DEPENSE.CARBURANT ||
    e.estChambre;

  return (
    <SectionForm>
      {estDetaille ? (
        <Card style={commonStyles.gap10}>
          <Text style={styles.total}>
            {TEXTES.commun.general.totalFactureTtcDeuxPoints}
            {formatTotalEuros(montantDeLaDepense(e))}
          </Text>
        </Card>
      ) : (
        <>
          <ChampMontantTtc value={e.montant} onChange={e.setMontant} />
          {/* Dépense offerte sans détail par ligne : le bouton « Cadeau » du montant (actif d'office : 0 €). */}
          {e.offertDepense ? (
            <BoutonCadeau
              actif={e.cadeauMontantDepense}
              onChange={e.setCadeauMontantDepense}
              ligne={TEXTES.comptabilite.nouvelleEcriture.cadeauMontantDepense}
            />
          ) : null}
        </>
      )}
      {/* Une alimentation a le taux de chacun de ses achats (à l'étape précédente) : pas de taux commun à choisir ici. */}
      {e.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION ? null : (
        <ChampTauxTva value={e.tauxTvaAchat} onChange={e.setTauxTvaAchat} ttc={montantDeLaDepense(e)} />
      )}
      {/* Le règlement : payée à sa date (d'office), ou à payer — la trésorerie la compte à son échéance. */}
      {pasPayeeAffichee(categorieDuTiers) ? (
        <>
          <Text style={commonStyles.lineBold}>Règlement</Text>
          <ChampPaiement
            libellePayee="Payé"
            libelleAttente="À payer"
            desactive={e.offertDepenseCoche}
            enAttente={e.enAttente}
            onEnAttente={(attente) => {
              e.setEnAttente(attente);
              if (attente && !e.echeance) e.setEcheance(ajouterMois(todayISO(), 1));
            }}
            echeance={e.echeance}
            onEcheance={e.setEcheance}
          />
        </>
      ) : null}
    </SectionForm>
  );
}

/** La deuxième étape d'une dépense : la catégorie, ce qui est acheté (le détail) et l'atelier. */
export function SectionDepenseDetail({ e }: { e: EtatNouvelleEcriture }) {
  const router = useRouter();
  const { listes } = useListesPerso();
  const personnalisees = listes.categoriesDepense;
  /** La catégorie de l'utilisateur déjà choisie (son identifiant), retrouvée par son nom ; sinon la catégorie d'office. */
  const categoriePersoChoisie = e.categoriePerso ? (personnalisees?.ajoutes?.find((a) => a.nom === e.categoriePerso)?.id ?? '') : '';
  const categorieChoisie: string = categoriePersoChoisie || e.categorieDepense;
  const choisirCategorie = (valeur: string) => {
    const perso = personnalisees?.ajoutes?.find((a) => a.id === valeur);
    if (!perso) return e.changerCategorieDepense(valeur as CategorieDepense);
    // Une catégorie de l'utilisateur : une dépense « autre » sur le compte qu'il lui a donné.
    e.changerCategorieDepense(CATEGORIE_DEPENSE.AUTRE);
    if (perso.compte) e.setCompteDepenseAutre(perso.compte);
    e.setCategoriePerso(perso.nom);
  };
  const estAlimentation = e.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION;
  const estProduction = e.categorieDepense === CATEGORIE_DEPENSE.PRODUCTION;
  const estCarburant = e.categorieDepense === CATEGORIE_DEPENSE.CARBURANT;
  const estAnimauxVivants = e.categorieDepense === CATEGORIE_DEPENSE.ANIMAUX_VIVANTS;
  return (
    <>
      {/* Les informations : la catégorie, le détail, puis l'atelier. Le montant et la TVA sont à l'étape suivante. */}
      <SectionForm>
        <ChampCategorieCompte
          label={TEXTES.comptabilite.nouvelleEcriture.categorieDeDepense}
          value={categorieChoisie}
          onChange={choisirCategorie}
          options={optionsCategorieDepense(e.fournisseurSelectionne, personnalisees, categorieChoisie)}
          demanderCompte={e.categorieDepense === CATEGORIE_DEPENSE.AUTRE && !e.categoriePerso}
          compte={e.compteDepenseAutre}
          onCompteChange={(numero) => {
            e.setCompteDepenseAutre(numero);
            e.setStockArticle('');
            e.setStockQuantite(undefined);
          }}
          optionsCompte={e.optionsCompteDepense}
          pucesCompte={[
            TEXTES.comptabilite.nouvelleEcriture.groupeInventaire,
            TEXTES.comptabilite.nouvelleEcriture.groupeAutresComptes,
          ]}
          puceCompteParDefaut={TEXTES.comptabilite.nouvelleEcriture.groupeAutresComptes}
          onGererComptes={() => router.push(ROUTES.COMPTES_PCG)}
        />
        <NoteComptePcg compte={e.compteAffiche} />
        {/* Ce qui est propre à la catégorie, puis le montant, la TVA et l'atelier : le même ordre qu'à la modification d'une facture. */}
        {e.categorieDepense === CATEGORIE_DEPENSE.VETERINAIRE && (
          <>
            <ChampVisite
              motif={e.motifVisite}
              ajouter={e.ajouterVisite}
              onMotif={e.setMotifVisite}
              onAjouter={e.setAjouterVisite}
            />
            <LignesVeterinaireEditor
              lignes={e.lignesVeterinaire}
              onChange={e.setLignesVeterinaire}
              dateParDefaut={e.date}
            />
          </>
        )}
        {e.categorieDepense === CATEGORIE_DEPENSE.AUTRE && (
          <ChampStockProduction
            compte={e.compteDepenseAutre}
            article={e.stockArticle}
            quantite={e.stockQuantite}
            debut={e.bouclesDebut}
            onChangeDebut={e.setBouclesDebut}
            onChange={(article, quantite) => {
              e.setStockArticle(article);
              e.setStockQuantite(quantite);
              if (!estBoucleNumerotee(article)) e.setBouclesDebut('');
            }}
          />
        )}
        {estAnimauxVivants && <AnimauxAchetesEditor animaux={e.animauxAchetes} onChange={e.setAnimauxAchetes} />}
        {e.categorieDepense === CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE && (
          <LotDAbattoirChoix
            lotId={e.lotId}
            onChoisir={e.setLotId}
            animauxEnvoyes={e.animauxEnvoyes}
            onAnimaux={e.setAnimauxEnvoyes}
          />
        )}
        {estProduction && (
          <>
            <LignesProductionEditor
              lignes={e.lignesProduction}
              onChange={e.setLignesProduction}
              seulementBoucles={fournituresSeulementBoucles(e.fournisseurSelectionne)}
              offerte={e.offertDepense}
            />
          </>
        )}
        {e.estChambre && (
          <>
            <LignesChambreEditor lignes={e.lignesChambre} onChange={e.setLignesChambre} />
            <LignesProductionEditor
              lignes={e.lignesProduction}
              onChange={e.setLignesProduction}
              seulementBoucles
              titre={TEXTES.fournisseurs.chambre.boucles}
            />
          </>
        )}
        {estAlimentation && (
          <>
            <LignesAlimentationEditor
              lignes={e.lignesAlimentation}
              onChange={e.setLignesAlimentation}
              activite={e.activite}
              offerte={e.offertDepense}
              tauxDefaut={e.tauxTvaAchat ? Number(e.tauxTvaAchat) : undefined}
            />
          </>
        )}
        {estCarburant && (
          <>
            <LignesCarburantEditor lignes={e.lignesCarburant} onChange={e.setLignesCarburant} />
          </>
        )}
        {/* Une association ou une coopérative agricole : son volet (achat groupé, mutualisation, experts, transports). */}
        {e.voletAffiche ? (
          <ChampVoletCooperative value={e.voletCooperative} volets={e.voletsProposes} onChange={e.setVoletCooperative} />
        ) : null}
        {/* Une réparation ou une prime d'assurance : le véhicule de la flotte, par sa plaque. */}
        {e.categorieDepense === CATEGORIE_DEPENSE.ASSURANCES ? (
          <ChampObjetAssurance
            value={e.objetAssurance}
            onChange={(objet) => {
              e.setObjetAssurance(objet);
              if (objet !== OBJET_ASSURANCE.VEHICULE) e.setVehiculeId('');
            }}
          />
        ) : null}
        {categorieAvecVehicule(e.categorieDepense, undefined, e.objetAssurance) ? (
          <ChampVehicule value={e.vehiculeId} onChange={e.setVehiculeId} />
        ) : null}
        {/* Le motif d'une réparation : il est exigé quand un véhicule est choisi, et mis en avant dans la liste du véhicule. */}
        {e.categorieDepense === CATEGORIE_DEPENSE.REPARATION ? (
          <FormField
            label={TEXTES.flotte.motif.reparation}
            required={!!e.vehiculeId}
            value={e.motif}
            onChangeText={e.setMotif}
            placeholder={TEXTES.flotte.motif.exempleReparation}
            aide={TEXTES.flotte.motif.aide}
          />
        ) : null}
        {/* L'atelier de la charge (facultatif) : la marge par atelier de la rentabilité. */}
        {/* Un fournisseur dont la catégorie impose la dépense (un vétérinaire) n'en demande pas l'atelier. */}
        {depenseImposee(e.fournisseurSelectionne) ? null : (
          <AncreVisite id="ecriture.atelier">
            <ChampAtelier value={e.atelier} onChange={e.setAtelier} activite={e.activite} />
          </AncreVisite>
        )}
        {e.atelier === ATELIER.AGRITOURISME ? (
          <ChampElementAgritourisme value={e.elementAgri} onChange={e.setElementAgri} />
        ) : null}
      </SectionForm>
    </>
  );
}
