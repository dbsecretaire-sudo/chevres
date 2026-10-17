import { useCallback, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { ChampPaiement } from '@/features/comptabilite/components/ChampPaiement';
import { ChampCircuit } from '@/features/commercial/components/ChampCircuit';
import { avecPaiement } from '@/features/comptabilite/utils/paiement';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { useFromagesDuStock } from '@/features/stock/hooks/useFromagesDuStock';
import { useViandesDuStock } from '@/features/stock/hooks/useViandesDuStock';
import { lireArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';
import { roleDeLaViande, totalDeLaVente, type FiltreStock } from '@/features/stock/services/stock';
import { ROUTES } from '@/shared/constants/routes';
import { SECTION_STOCK } from '@/shared/constants/stock';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { numeroFactureLibre, prixLibre, reajustementPossible } from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import { ChampNumeroFacture } from '@/features/comptabilite/components/ChampNumeroFacture';
import type { Vente } from '@/features/comptabilite/types';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { SectionForm } from '@/shared/components/SectionForm';
import { especesActives, plusieursEspeces } from '@/shared/dictionnaire/animaux';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import {
  fromageAjouteChoisi,
  optionsFromages,
  typeDuChoix,
  valeurFromage,
} from '@/features/comptabilite/utils/fromages';
import {
  CATEGORIES_VENTE_ANIMAUX,
  CATEGORIES_VENTE_PRIX_INVENTAIRE,
  CATEGORIES_VENTE_VIANDE,
  CATEGORIE_VENTE,
  TYPE_CHOIX_FACTURE,
  TYPE_FROMAGE,
} from '@/shared/constants/comptabilite';
import {
  categoriesRecetteActivite,
  clientsPourLaRecette,
  estCategorieVente,
} from '@/features/comptabilite/utils/recettes';
import { libelleCategorieVente, venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { ChampFraisAbattoir } from '@/features/comptabilite/components/ChampFraisAbattoir';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Produits proposés pour l'espèce de la vente (le produit déjà enregistré y reste, même s'il n'en fait plus partie). */
function optionsProduit(vente: Vente) {
  const categories = categoriesRecetteActivite(activiteVente(vente)).filter((c): c is Vente['categorie'] =>
    estCategorieVente(c),
  );
  if (!categories.includes(vente.categorie)) categories.unshift(vente.categorie);
  return categories.map((categorie) => ({
    value: categorie,
    label: libelleCategorieVente({ categorie, activite: vente.activite }),
  }));
}

interface Props {
  form: Vente;
  /** La fiche du client de la vente : sa catégorie (récolteur) rend le prix et le numéro de facture libres. */
  client?: Client;
  /** Les prix de la catégorie du client, par article (la grille de tarifs) : ils passent avant ceux de l'inventaire. */
  prixDuContact?: Record<string, number>;
  /** Les clients de l'établissement : le client de la vente se choisit dans cette liste. */
  clients: Client[];
  onChange: (form: Vente) => void;
  onChangerCategorie: (categorie: Vente['categorie']) => void;
  /** Texte tel que saisi pour le prix (évite de perdre la virgule en cours de frappe). */
  montantTexte: string;
  onChangerMontant: (valeur: string) => void;
  onEnregistrer: () => void;
  /** Ce que la vente a de plus (les animaux vendus, les lots) : à la fin du bloc des informations, avant le bouton. */
  complement?: ReactNode;
}

const T = TEXTES.comptabilite.nouvelleEcriture;

/** La valeur de la liste pour un client de la vente qui n'est plus dans les fiches : il reste affiché sous son nom. */
const CLIENT_HORS_LISTE = '__hors_liste__';

/** Formulaire de modification d'une vente de production. */
export function VenteFormulaire({
  form,
  client,
  prixDuContact,
  clients,
  onChange,
  onChangerCategorie,
  montantTexte,
  onChangerMontant,
  onEnregistrer,
  complement,
}: Props) {
  const estViande = (CATEGORIES_VENTE_VIANDE as readonly string[]).includes(form.categorie);
  const estAnimal = (CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(form.categorie);
  const estFromage = form.categorie === CATEGORIE_VENTE.FROMAGE;
  const router = useRouter();
  const retour = useAdresseCourante();
  const activite = activiteVente(form);
  /** L'espèce du stock regardé : toutes quand la vente est « commune » (comme à la création). */
  const especeDuStock = activite === ACTIVITE_COMMUNE ? undefined : (activite as FiltreStock);
  /** Les détails de la vente de viande : les lignes de l'inventaire de l'espèce (le détail déjà enregistré y reste). */
  const viandes = useViandesDuStock(especeDuStock);
  const detailsVente = viandes
    .filter((v) => (roleDeLaViande(v.cle) !== undefined) === (form.categorie === CATEGORIE_VENTE.VIANDE))
    .map((v) => ({ value: v.libelle, label: v.libelle }));
  if (form.precision && !detailsVente.some((d) => d.value === form.precision))
    detailsVente.unshift({ value: form.precision, label: form.precision });
  /** Les fromages du stock (le type déjà enregistré y reste) : leur menu, avec le crayon vers le stock. */
  const fromages = useFromagesDuStock();
  const optionsFromage = optionsFromages(fromages);
  const ajouteChoisi = fromageAjouteChoisi(fromages, form.typeFromage, form.typeFromageLibre);
  /** L'inventaire (prix de vente) : il fait le prix total de la vente, jamais saisi. */
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then(setArchive);
    }, []),
  );
  const prixInventaire =
    (CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(form.categorie) &&
    !prixLibre(client) &&
    !form.commandeId;
  const totalInventaire = archive ? totalDeLaVente(form, archive, prixDuContact) : undefined;
  const animalEntier = form.categorie === CATEGORIE_VENTE.VIANDE;
  /** Les frais d'abattoir refacturés comptent dans le prix total (viande à l'inventaire seulement). */
  const frais = animalEntier && prixInventaire ? (form.fraisAbattoir ?? 0) : 0;
  /** Un récolteur peut cocher « Réajustement » (vente de lait déclarée) : plus de litrage ni de numéro de facture saisis. */
  const peutReajuster = reajustementPossible(client, form.categorie, venteADeclarer(form));
  const reajustement = peutReajuster && !!form.reajustement;

  return (
    <>
      {/* Comme à la création : l'activité en tête, d'une puce (un établissement à plusieurs espèces seulement). */}
      {plusieursEspeces() ? (
        <LigneFiltres>
          <ChoixDeroulant
            titre={TEXTES.comptabilite.activite.activite}
            valeur={activite}
            options={especesActives().map((a) => ({ value: a, label: LABEL_ACTIVITE_COMPTABLE[a] }))}
            onChoisir={(nouvelle) => onChange({ ...form, activite: nouvelle })}
          />
        </LigneFiltres>
      ) : null}

      {/* L'identification : la date, le client, la déclaration de la vente (n° de facture) et le paiement — comme à la création. */}
      <SectionForm>
        <DateField
          label={TEXTES.commun.general.date}
          required
          value={form.date}
          onChange={(date) => onChange({ ...form, date })}
        />

        {/* Le client : la liste des clients, avec le crayon qui mène aux fiches ; un client qui n'y est plus reste choisi sous son nom. */}
        <SelectFieldEditable
          label={T.clientOrganisme}
          required
          searchable
          placeholder={TEXTES.commun.general.choixDuClient}
          value={client?.id ?? (form.client ? CLIENT_HORS_LISTE : '')}
          onChange={(id) => {
            const choisi = clients.find((c) => c.id === id);
            if (choisi) onChange({ ...form, client: nomComplet(choisi) });
          }}
          options={[
            ...clientsPourLaRecette(clients, form.categorie, activite, form.client).map((c) => ({
              value: c.id,
              label: nomComplet(c),
            })),
            ...(client || !form.client ? [] : [{ value: CLIENT_HORS_LISTE, label: form.client }]),
          ]}
          onEdit={() => router.push(ROUTES.clientsDepuis(retour))}
        />

        {/* Le client souhaite-t-il que la vente soit déclarée (avec facture) ? Coché d'office, comme à la création. */}
        <Checkbox
          label={T.declarerLaVente}
          value={venteADeclarer(form)}
          onChange={(declaree) =>
            onChange({
              ...form,
              choixFacture: declaree ? TYPE_CHOIX_FACTURE.AVEC_FACTURE : TYPE_CHOIX_FACTURE.SANS_FACTURE,
              // Avec facture, les animaux ont une boucle ; sans, ils n'en ont pas : ceux déjà choisis ne conviennent plus.
              animaux: undefined,
              jeune: undefined,
            })
          }
        />
        {venteADeclarer(form) ? (
          <ChampNumeroFacture
            value={form.numeroFacture ?? ''}
            onChange={(numeroFacture) => onChange({ ...form, numeroFacture })}
            libre={numeroFactureLibre(client)}
            reajustementPossible={peutReajuster}
            reajustement={reajustement}
            onReajustement={(coche) =>
              onChange({
                ...form,
                reajustement: coche ? true : undefined,
                quantite: coche ? 0 : form.quantite,
              })
            }
          />
        ) : null}

        {/* Le paiement : encaissée (la date du jour s'enregistre en la cochant payée), ou pas encore, avec la date prévue. */}
        <ChampPaiement
          libelle={TEXTES.comptabilite.tresorerie.paiement.pasEncaissee}
          enAttente={form.payee === false}
          onEnAttente={(attente) => onChange(avecPaiement(form, attente))}
          echeance={form.echeance ?? ''}
          onEcheance={(echeance) => onChange({ ...form, echeance })}
        />
        <ChampCircuit
          value={form.circuit ?? ''}
          onChange={(circuit) => onChange({ ...form, circuit: circuit || undefined })}
        />
      </SectionForm>

      {/* Les informations : la catégorie, ce qui est vendu et son prix. */}
      <SectionForm>
        <SelectField
          label={T.categorieDeRecette}
          value={form.categorie}
          onChange={onChangerCategorie}
          options={optionsProduit(form)}
        />
        {estFromage ? (
          <>
            <SelectFieldEditable<string>
              label={T.typeDeFromage}
              required
              value={ajouteChoisi ? valeurFromage(ajouteChoisi) : (form.typeFromage ?? '')}
              // Un autre fromage : les lots déjà choisis sont ceux d'un autre fromage.
              onChange={(valeur) =>
                onChange({ ...form, ...typeDuChoix(fromages, valeur), fromages: undefined })
              }
              options={optionsFromage}
              placeholder={T.typeDeFromage}
              onEdit={() => router.push(ROUTES.stockDepuis(retour, SECTION_STOCK.FROMAGES, especeDuStock))}
            />
            {form.typeFromage === TYPE_FROMAGE.AUTRE && !ajouteChoisi ? (
              <FormField
                label={T.preciserLeType}
                required
                value={form.typeFromageLibre ?? ''}
                onChangeText={(typeFromageLibre) =>
                  onChange({ ...form, typeFromageLibre, fromages: undefined })
                }
              />
            ) : null}
          </>
        ) : null}

        {estViande && detailsVente.length > 0 ? (
          <SelectFieldEditable<string>
            label={T.detailDeLaVente}
            required
            searchable
            placeholder={T.choixDuDetail}
            value={form.precision ?? ''}
            onChange={(precision) =>
              // Un autre détail : les animaux déjà choisis ne valent plus (comme à la création).
              onChange({
                ...form,
                precision,
                ...(precision !== form.precision
                  ? { animaux: undefined, jeune: undefined, fromages: undefined }
                  : {}),
              })
            }
            options={detailsVente}
            onEdit={() =>
              router.push(
                ROUTES.stockDepuis(
                  retour,
                  animalEntier ? SECTION_STOCK.ANIMAUX : SECTION_STOCK.VIANDE,
                  especeDuStock,
                ),
              )
            }
          />
        ) : estViande ? (
          <Text style={commonStyles.note}>{T.aucuneViandeAuStock}</Text>
        ) : null}

        {animalEntier ? (
          <FormField
            label={TEXTES.commun.general.poidsKg}
            required
            value={form.poidsKg !== undefined ? String(form.poidsKg) : ''}
            onChangeText={(valeur) =>
              onChange({ ...form, poidsKg: Number(valeur.replace(',', '.')) || undefined })
            }
            keyboardType="decimal-pad"
            placeholder={T.ex2}
          />
        ) : (
          <View style={commonStyles.row}>
            {reajustement ? null : (
              <View style={commonStyles.flex1}>
                <FormField
                  label={TEXTES.commun.general.quantite}
                  required
                  value={String(form.quantite)}
                  // Des fromages désignés par leur lot : leur nombre fait la quantité.
                  editable={!form.fromages}
                  onChangeText={(valeur) =>
                    onChange({ ...form, quantite: Number(valeur.replace(',', '.')) || 0 })
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
            )}
            {estAnimal && (
              <View style={commonStyles.flex1}>
                <FormField
                  label={TEXTES.commun.general.poidsKg}
                  value={form.poidsKg !== undefined ? String(form.poidsKg) : ''}
                  onChangeText={(valeur) =>
                    onChange({ ...form, poidsKg: Number(valeur.replace(',', '.')) || undefined })
                  }
                  keyboardType="decimal-pad"
                  placeholder={TEXTES.commun.general.facultatif}
                />
              </View>
            )}
          </View>
        )}
        {/* Le prix total vient de l'inventaire (prix défini × quantité ou × poids) : on ne le saisit pas. */}
        <FormField
          label={TEXTES.comptabilite.ficheVente.prixTotal}
          required
          value={
            prixInventaire
              ? totalInventaire !== undefined
                ? String(Math.round((totalInventaire + frais) * 100) / 100).replace('.', ',')
                : ''
              : montantTexte
          }
          onChangeText={onChangerMontant}
          editable={!prixInventaire}
          style={prixInventaire ? commonStyles.verrouille : undefined}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />
        {prixInventaire && totalInventaire === undefined ? (
          <Text style={commonStyles.note}>{T.aucunPrixInventaire}</Text>
        ) : null}
        {/* Les frais d'abattoir refacturés au client : leur montant et leur taux de TVA. */}
        {animalEntier && prixInventaire ? (
          <ChampFraisAbattoir
            key={`${form.dateAbattoir ?? ''}-${form.quantite}-${form.fraisAbattoir ?? ''}`}
            valeur={form.fraisAbattoir ? String(form.fraisAbattoir).replace('.', ',') : ''}
            onChange={(texte) => onChange({ ...form, fraisAbattoir: parseDecimal(texte) > 0 ? parseDecimal(texte) : undefined })}
            taux={form.tauxTvaFrais !== undefined ? String(form.tauxTvaFrais) : ''}
            onTaux={(taux) => onChange({ ...form, tauxTvaFrais: Number(taux) })}
            tauxParDefaut={String(form.tauxTva ?? '')}
            montantViande={totalInventaire ?? 0}
          />
        ) : null}

        {complement}
      </SectionForm>

      <Button label={TEXTES.commun.general.enregistrer} onPress={onEnregistrer} />
    </>
  );
}
