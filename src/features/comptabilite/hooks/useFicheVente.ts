import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { listClients } from '@/features/clients/repository';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import {
  estClientAbattoir,
  numeroFactureLibre,
  prixLibre,
  reajustementPossible,
} from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import { getVente, saveVente, supprimerVente } from '@/features/comptabilite/repository/ventes';
import { declarerStatutChevre } from '@/features/cheptel/repository/chevres';
import {
  idsDesAnimaux,
  reglageEtatAnimaux,
  sortieDesAnimauxDeLaVente,
  venteADeclarer,
} from '@/features/comptabilite/utils/ventes';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { lireArchiveStock } from '@/features/stock/repository';
import { estVenteDeCabris, totalDeLaVente } from '@/features/stock/services/stock';
import { fromagesRequis } from '@/features/stock/services/lots';
import { roleDuDetailDeVente } from '@/features/comptabilite/utils/animauxVendus';
import type { Vente } from '@/features/comptabilite/types';
import {
  CATEGORIES_VENTE_ANIMAUX,
  CATEGORIES_VENTE_AVEC_DETAIL,
  CATEGORIES_VENTE_PRIX_INVENTAIRE,
  CATEGORIES_VENTE_VIANDE,
  CATEGORIE_VENTE,
  TYPE_FROMAGE,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';
import { MOTIF_NUMERO_FACTURE_NUMERIQUE } from '@/shared/constants/clients';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';

const montantEnTexte = (v: Vente | null | undefined) =>
  v?.prix != null ? String(v.prix).replace('.', ',') : '';

/** État et actions de la fiche d'une vente : chargement, modification (avec tampon de saisie du prix), suppression. */
export function useFicheVente(id: string | undefined) {
  const router = useRouter();

  const [vente, setVente] = useState<Vente | null>(null);
  const [form, setForm] = useState<Vente | null>(null);
  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [montantTexte, setMontantTexte] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  /** La grille de tarifs (prix par catégorie de contact) : le prix de la vente suit la catégorie de son client. */
  const [tarifs, setTarifs] = useState<Record<string, Record<string, number>>>({});
  const [erreur, setErreur] = useState<{ titre: string; message?: string } | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    const v = await getVente(id);
    setVente(v ?? null);
    setForm(v ?? null);
    setMontantTexte(montantEnTexte(v));
    setClients(await listClients());
    setTarifs((await lireArchiveCommercial()).tarifs);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  /** La fiche du client de la vente (retrouvée par son nom) : sa catégorie règle le prix et le numéro de facture. */
  const clientDeLaVente = clients.find((c) => nomComplet(c) === form?.client?.trim());
  const prixLibreVente = prixLibre(clientDeLaVente);
  /** Les prix de la catégorie du client de la vente, par article : ils passent avant les prix de l'inventaire. */
  const prixDuContact: Record<string, number> = {};
  if (clientDeLaVente?.categorie) {
    for (const [article, parCategorie] of Object.entries(tarifs)) {
      const prix = parCategorie[clientDeLaVente.categorie];
      if (prix !== undefined) prixDuContact[article] = prix;
    }
  }

  /** L'unité est fixe pour lait/cabris, comme à la création. */
  const changerCategorie = (categorie: Vente['categorie']) => {
    if (!form) return;
    const unite: Vente['unite'] =
      categorie === CATEGORIE_VENTE.LAIT
        ? UNITE_VENTE.LITRES
        : categorie === CATEGORIE_VENTE.OEUFS
          ? UNITE_VENTE.PIECE
          : (CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(categorie) ||
              (CATEGORIES_VENTE_VIANDE as readonly string[]).includes(categorie)
            ? UNITE_VENTE.PIECE
            : form.unite === UNITE_VENTE.KG
              ? UNITE_VENTE.KG
              : UNITE_VENTE.PIECE;
    // Un autre produit : le détail, les animaux et le fromage choisis pour le précédent ne valent plus (leurs listes diffèrent).
    const change = categorie !== form.categorie;
    setForm({
      ...form,
      categorie,
      unite,
      ...(change
        ? {
            precision: undefined,
            animaux: undefined,
            jeune: undefined,
            ...(categorie === CATEGORIE_VENTE.FROMAGE
              ? {}
              : { typeFromage: undefined, typeFromageLibre: undefined }),
          }
        : {}),
    });
  };

  /** Autorise uniquement des chiffres et une virgule ou un point, et garde le texte saisi tel quel. */
  const changerMontant = (valeur: string) => {
    if (!form || !/^\d*[,.]?\d*$/.test(valeur)) return;
    setMontantTexte(valeur);
    const texte = valeur.replace(',', '.');
    setForm({ ...form, prix: texte === '' || texte === '.' ? undefined : Number(texte) });
  };

  /** Enregistré tout seul (`auto`), il ne dit rien d'une saisie incomplète et laisse la fiche en modification. */
  const enregistrerModifications = async (auto = false): Promise<boolean> => {
    if (!form) return false;
    const refuser = (e: { titre: string; message?: string }) => {
      if (!auto) setErreur(e);
      return false;
    };

    // La quantité d'une vente de viande (animaux entiers) est le nombre d'animaux choisis : on ne la saisit pas.
    const sansQuantite = form.categorie === CATEGORIE_VENTE.VIANDE;
    const reajustement =
      !!form.reajustement && reajustementPossible(clientDeLaVente, form.categorie, venteADeclarer(form));
    if (!sansQuantite && !reajustement && (!form.quantite || form.quantite <= 0)) {
      return refuser({ titre: TEXTES.commun.general.quantiteInvalide });
    }
    if (
      (CATEGORIES_VENTE_AVEC_DETAIL as readonly string[]).includes(form.categorie) &&
      !form.precision?.trim()
    ) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.detailRequis });
    }
    if (
      form.categorie === CATEGORIE_VENTE.FROMAGE &&
      (!form.typeFromage || (form.typeFromage === TYPE_FROMAGE.AUTRE && !form.typeFromageLibre?.trim()))
    ) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.typeFromageRequis });
    }
    if (!form.client?.trim()) {
      return refuser({ titre: TEXTES.commun.general.clientRequis });
    }
    // Un fromage qui a des lots en stock se vend lot par lot : on les désigne.
    if (fromagesRequis(await lireArchiveStock(), form)) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.lotsRequis });
    }
    // Une vente que le client souhaite déclarer a un numéro de facture.
    if (venteADeclarer(form) && !reajustement && !form.numeroFacture?.trim()) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.numeroFactureRequis });
    }
    if (
      venteADeclarer(form) &&
      !reajustement &&
      !numeroFactureLibre(clientDeLaVente) &&
      !MOTIF_NUMERO_FACTURE_NUMERIQUE.test(form.numeroFacture ?? '')
    ) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.numeroFactureNumerique });
    }
    if (form.categorie === CATEGORIE_VENTE.VIANDE && !(form.poidsKg && form.poidsKg > 0)) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.poidsRequis });
    }

    // Un animal sur pied, vivant ou un petit ne se vend pas sans dire lesquels : au moins une fiche du cheptel.
    const animauxForm = idsDesAnimaux(form);
    if (
      sansQuantite &&
      animauxForm.length === 0 &&
      (await roleDuDetailDeVente(activiteVente(form), form.precision))
    ) {
      return refuser({
        titre: TEXTES.comptabilite.nouvelleEcriture.animauxRequis,
        message: TEXTES.comptabilite.nouvelleEcriture.animauxRequisMessage,
      });
    }

    // Le prix total vient de l'inventaire (prix défini × quantité ou × poids) : il n'est jamais saisi.
    const quantite = sansQuantite ? Math.max(1, animauxForm.length) : form.quantite;
    let prix = form.prix;
    const frais = form.categorie === CATEGORIE_VENTE.VIANDE && !form.offert ? (form.fraisAbattoir ?? 0) : 0;
    const prixDeLInventaire =
      (CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(form.categorie) && !prixLibreVente;
    if (prixDeLInventaire) {
      prix = totalDeLaVente({ ...form, quantite }, await lireArchiveStock(), prixDuContact);
      // Les frais d'abattoir refacturés s'ajoutent au prix de la viande.
      if (prix !== undefined && frais > 0) prix = Math.round((prix + frais) * 100) / 100;
    }
    // Une vente offerte (un cadeau) a un prix de 0 €.
    if (form.offert) prix = 0;
    if (!form.offert && (!prix || prix < 0)) {
      return refuser(
        prixDeLInventaire
          ? {
              titre: TEXTES.comptabilite.nouvelleEcriture.prixAFixerTitre,
              message: TEXTES.comptabilite.nouvelleEcriture.prixAFixerMessage,
            }
          : { titre: TEXTES.commun.general.prixInvalide },
      );
    }

    try {
      // L'état des animaux d'une vente de viande : voir reglageEtatAnimaux (abattoir : vivants ; cabris avec facture : morts ; sinon morts par défaut).
      const reglage = reglageEtatAnimaux({
        clientAbattoir: estClientAbattoir(clientDeLaVente),
        cabris: form.categorie === CATEGORIE_VENTE.VIANDE && estVenteDeCabris(form, await lireArchiveStock()),
        declaree: venteADeclarer(form),
      });
      const nettoye: Vente = {
        ...form,
        prix,
        quantite: reajustement ? 0 : quantite,
        reajustement: reajustement ? true : undefined,
        offert: form.offert ? true : undefined,
        etatAnimaux:
          form.categorie !== CATEGORIE_VENTE.VIANDE
            ? undefined
            : reglage.choix
              ? form.etatAnimaux === 'vivants'
                ? 'vivants'
                : 'morts'
              : reglage.etat,
        client: form.client?.trim() || undefined,
        fraisAbattoir: prixDeLInventaire && frais > 0 ? frais : undefined,
        tauxTvaFrais: prixDeLInventaire && frais > 0 ? (form.tauxTvaFrais ?? form.tauxTva) : undefined,
        precision: form.precision?.trim() || undefined,
        numeroFacture: venteADeclarer(form) && !reajustement ? form.numeroFacture?.trim() : undefined,
        // Pas de date d'abattoir quand la vente n'est pas déclarée : l'animal passe en « morte ».
        dateAbattoir: venteADeclarer(form) ? form.dateAbattoir : undefined,
      };
      await saveVente(nettoye);
      // Un animal retiré de la vente ne change pas de statut : une facture modifiée ne ressuscite personne (la fiche remet un animal dans le
      // cheptel actif, sur demande). Ceux de la vente passent « vendus » à sa date.
      // Les animaux vendus : « abattoir » pour une vente de viande déclarée (à la date d'abattoir), « morte » si elle ne l'est pas, « vendus » sinon.
      const sortie = sortieDesAnimauxDeLaVente(nettoye);
      for (const id of animauxForm) await declarerStatutChevre(id, sortie.statut, sortie.date);
      setVente(nettoye);
      if (!auto) {
        setForm(nettoye);
        setEditing(false);
      }
      return true;
    } catch (error) {
      console.error(error);
      return refuser({
        titre: TEXTES.commun.general.erreur,
        message: TEXTES.commun.general.impossibleDEnregistrerLesModifications,
      });
    }
  };

  // Tout changement de la fiche s'enregistre tout seul.
  useEnregistrementAuto({
    actif: editing,
    signature: JSON.stringify(form),
    enregistrer: () => enregistrerModifications(true),
  });

  const supprimerDefinitivement = async () => {
    if (!vente) return;
    try {
      await supprimerVente(vente.id);
      // Annuler une facture ne ressuscite pas les animaux : ils gardent leur statut (à l'abattoir, ils reviennent dans les animaux à
      // facturer et dans leur lot d'abattoir) ; la fiche d'un animal le remet dans le cheptel actif, sur demande.
      router.back();
    } catch (error) {
      console.error(error);
      setErreur({
        titre: TEXTES.commun.general.erreur,
        message: TEXTES.comptabilite.ficheVente.impossibleDeSupprimerLaVente,
      });
    }
  };

  return {
    vente,
    form,
    setForm,
    editing,
    setEditing,
    menuOuvert,
    setMenuOuvert,
    suppressionOuverte,
    setSuppressionOuverte,
    montantTexte,
    changerMontant,
    clientDeLaVente,
    prixDuContact,
    clients,
    changerCategorie,
    enregistrerModifications,
    supprimerDefinitivement,
    erreur,
    setErreur,
  };
}
