import { useCallback, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { OngletsSaisie, type OngletSaisie } from '@/shared/components/OngletsSaisie';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChampPaiement } from '@/features/comptabilite/components/ChampPaiement';
import { ChampCircuit } from '@/features/commercial/components/ChampCircuit';
import { avecPaiement } from '@/features/comptabilite/utils/paiement';
import { Checkbox } from '@/shared/components/Checkbox';
import { Interrupteur } from '@/shared/components/Interrupteur';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { useFromagesDuStock } from '@/features/stock/hooks/useFromagesDuStock';
import { useViandesDuStock } from '@/features/stock/hooks/useViandesDuStock';
import { lireArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';
import { ligneDeLaCategorie, roleDeLaViande, totalDeLaVente, type FiltreStock } from '@/features/stock/services/stock';
import { ROUTES } from '@/shared/constants/routes';
import { ROLE_VIANDE, SECTION_STOCK } from '@/shared/constants/stock';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import {
  estClientAbattoir,
  fraisAbattoirFacturesAuClient,
  numeroFactureLibre,
  prixLibre,
  prixPersonnaliseAuClient,
  reajustementPossible,
} from '@/features/clients/services/categorie';
import { ChampEtatAnimaux } from '@/features/comptabilite/components/ChampEtatAnimaux';
import type { Client } from '@/features/clients/types';
import { ChampNumeroFacture } from '@/features/comptabilite/components/ChampNumeroFacture';
import type { Vente } from '@/features/comptabilite/types';
import { SectionForm } from '@/shared/components/SectionForm';
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
import {
  idsDesAnimaux,
  libelleCategorieVente,
  reglageEtatAnimaux,
  venteADeclarer,
} from '@/features/comptabilite/utils/ventes';
import { ChampTauxTva } from '@/features/comptabilite/components/ecriture/ChampTauxTva';
import { parseDecimal } from '@/shared/utils/nombres';
import { ChampFraisAbattoir } from '@/features/comptabilite/components/ChampFraisAbattoir';
import { useFraisAbattoir } from '@/features/lots-animaux/hooks/useFraisAbattoir';
import { nomComplet } from '@/shared/utils/personne';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { optionClient } from '@/features/contacts/services/optionsContacts';

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
  /** Le rôle de la ligne choisie comme détail : cabris, animal sur pied ou animal vivant. */
  const detailChoisi = viandes.find((v) => v.libelle === form.precision);
  const roleDuDetail = detailChoisi ? roleDeLaViande(detailChoisi.cle) : undefined;
  const detailsVente = viandes
    .filter((v) => ligneDeLaCategorie(v.cle, form.categorie))
    .map((v) => ({ value: v.libelle, label: v.libelle }));
  if (form.precision && !detailsVente.some((d) => d.value === form.precision))
    detailsVente.unshift({ value: form.precision, label: form.precision });
  /** Les fromages du stock (le type déjà enregistré y reste) : leur menu, avec le crayon vers le stock. */
  const fromages = useFromagesDuStock();
  const optionsFromage = optionsFromages(fromages);
  const ajouteChoisi = fromageAjouteChoisi(fromages, form.typeFromage, form.typeFromageLibre);
  /** L'inventaire (prix de vente) : il fait le prix total de la vente, jamais saisi. */
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  // Les frais d'abattoir du lot de la vente (sa facture liée) : la case « Facturer les frais » les reprend.
  const fraisDuJour = useFraisAbattoir();
  const propositionFrais = fraisDuJour(form.dateAbattoir, idsDesAnimaux(form).length);
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then(setArchive);
    }, []),
  );
  const prixInventaire =
    (CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(form.categorie) &&
    !prixLibre(client) &&
    // Des animaux vivants vendus au poids vif : le prix est saisi, l'inventaire n'en donne pas.
    (!form.venduAuPoids || !!form.prixUnitairePersonnalise) &&
    !form.commandeId;
  const totalInventaire = archive ? totalDeLaVente(form, archive, prixDuContact) : undefined;
  const animalEntier = form.categorie === CATEGORIE_VENTE.VIANDE;
  /** Vente offerte : chaque ligne (les animaux, les frais d'abattoir) a son bouton « Cadeau » (actif : offerte ; désactivé : facturée). */
  const produitOffert = !!form.offert && form.cadeauProduit !== false;
  // Les frais d'abattoir s'offrent à part, sur une vente avec facture : même sans offrir le reste de la vente.
  const fraisOfferts = form.cadeauFrais ?? !((form.fraisAbattoir ?? 0) > 0);
  /** Les frais d'abattoir refacturés comptent dans le prix total (viande à l'inventaire seulement). */
  // Un animal vivant ne passe pas par l'abattoir : pas de frais d'abattoir.
  const frais = animalEntier && roleDuDetail !== ROLE_VIANDE.VIVANT && prixInventaire && !fraisOfferts ? (form.fraisAbattoir ?? 0) : 0;
  /** Le poids d'un lot d'abattoir ne se modifie que dans la fiche du lot (Production › Viande). */
  const poidsDuLotDAbattoir = animalEntier && !!form.dateAbattoir;
  /** Un récolteur peut cocher « Réajustement » (vente de lait déclarée) : plus de litrage ni de numéro de facture saisis. */
  const peutReajuster = reajustementPossible(client, form.categorie, venteADeclarer(form));
  const reajustement = peutReajuster && !!form.reajustement;

  /** Les volets de la modification : Général (la date, le client, la facture), Détails (ce qui est vendu), Coût (le prix et le règlement). */
  const [onglet, setOnglet] = useState<'general' | 'details' | 'cout'>('general');
  /** « Prix du produit personnalisé » : cochée, le prix de l'unité se saisit pour cette vente (il remplace celui de l'inventaire). */
  const [prixPersoCoche, setPrixPersoCoche] = useState(!!form.prixUnitairePersonnalise);
  /** Le prix de l'unité tel que saisi (la virgule se garde pendant la frappe). */
  const [prixUnitaireTexte, setPrixUnitaireTexte] = useState(
    form.prixUnitairePersonnalise ? String(form.prixUnitairePersonnalise).replace('.', ',') : '',
  );
  /** L'unité du prix personnalisé : celle du calcul du total (au kilo pour un petit ou un animal sur pied, au litre pour le lait, à la pièce sinon). */
  const auKilo = roleDuDetail !== undefined && (roleDuDetail !== ROLE_VIANDE.VIVANT || !!form.venduAuPoids);
  const unitePrix = form.categorie === CATEGORIE_VENTE.LAIT ? 'litre' : auKilo ? 'kg' : 'piece';
  const onglets: OngletSaisie<'general' | 'details' | 'cout'>[] = [
    { value: 'general', label: TEXTES.comptabilite.ficheFacture.ongletGeneral },
    { value: 'details', label: TEXTES.comptabilite.ficheFacture.ongletDetails },
    { value: 'cout', label: TEXTES.comptabilite.ficheFacture.ongletCout },
  ];

  return (
    <>
      <OngletsSaisie onglets={onglets} valeur={onglet} onChange={setOnglet} />

      {/* L'identification : la date, le client, la déclaration de la vente (n° de facture) et le circuit — comme à la création. */}
      {onglet === 'general' ? (
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
            ...clientsPourLaRecette(clients, form.categorie, activite, form.client).map(optionClient),
            ...(client || !form.client ? [] : [{ value: CLIENT_HORS_LISTE, label: form.client }]),
          ]}
          parCategories
          onEdit={() => router.push(ROUTES.clientsDepuis(retour))}
        />

        {/* Le client souhaite-t-il que la vente soit déclarée (avec facture) ? Coché d'office, comme à la création. */}
        <Interrupteur
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

        <ChampCircuit
          value={form.circuit ?? ''}
          onChange={(circuit) => onChange({ ...form, circuit: circuit || undefined })}
        />
      </SectionForm>
      ) : null}

      {/* Les informations : la catégorie, ce qui est vendu. */}
      {onglet === 'details' ? (
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
          <ChampEtatAnimaux
            reglage={reglageEtatAnimaux({
              clientAbattoir: estClientAbattoir(client),
              role: roleDuDetail,
              declaree: venteADeclarer(form),
            })}
            clientAbattoir={estClientAbattoir(client)}
            role={roleDuDetail}
            value={form.etatAnimaux}
            onChange={(etat) => onChange({ ...form, etatAnimaux: etat as 'vivants' | 'morts' })}
          />
        ) : null}

        {animalEntier && roleDuDetail === ROLE_VIANDE.VIVANT ? (
          <Checkbox
            label={T.venduAuPoids}
            value={!!form.venduAuPoids}
            onChange={(v) => onChange({ ...form, venduAuPoids: v ? true : undefined })}
          />
        ) : null}
        {/* Un animal vivant vendu à la tête n'a pas de poids ; au poids vif, ce n'est qu'une estimation. */}
        {animalEntier && (roleDuDetail !== ROLE_VIANDE.VIVANT || form.venduAuPoids) ? (
          <FormField
            label={roleDuDetail === ROLE_VIANDE.VIVANT ? T.poidsEstime : TEXTES.commun.general.poidsKg}
            required
            value={form.poidsKg !== undefined ? String(form.poidsKg) : ''}
            onChangeText={(valeur) =>
              onChange({ ...form, poidsKg: Number(valeur.replace(',', '.')) || undefined })
            }
            keyboardType="decimal-pad"
            editable={!poidsDuLotDAbattoir}
            style={poidsDuLotDAbattoir ? commonStyles.verrouille : undefined}
            aide={poidsDuLotDAbattoir ? T.poidsDuLot : undefined}
            placeholder={T.ex2}
          />
        ) : animalEntier ? null : (
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
        {/* Les animaux vendus (et les lots) se changent ici, avec ce qui est vendu. */}
        {complement}
      </SectionForm>
      ) : null}

      {onglet === 'cout' ? (
      <>
      <SectionForm>
        {/* Le prix total vient de l'inventaire (prix défini × quantité ou × poids) : on ne le saisit pas. */}
        <Interrupteur
          label={TEXTES.comptabilite.nouvelleEcriture.offert}
          value={!!form.offert}
          onChange={(offert) => onChange({ ...form, offert: offert ? true : undefined })}
        />
        {/* La séparation entre ce qui est offert et le prix total de la vente. */}
        {/* Les frais d'abattoir refacturés au client, ou offerts (seulement pour une vente offerte et avec facture) : même bulle que l'offre. */}
        {animalEntier && roleDuDetail !== ROLE_VIANDE.VIVANT && (prixInventaire || fraisAbattoirFacturesAuClient(client)) ? (
          <ChampFraisAbattoir
            valeur={form.fraisAbattoir ? String(form.fraisAbattoir).replace('.', ',') : ''}
            taux={form.tauxTvaFrais !== undefined ? String(form.tauxTvaFrais) : ''}
            onTaux={(taux) => onChange({ ...form, tauxTvaFrais: Number(taux) })}
            tauxParDefaut={String(form.tauxTva ?? '')}
            montantViande={produitOffert ? 0 : (totalInventaire ?? 0)}
            cadeau={
              // « Abattoir offert » ne se propose qu'à une vente avec facture ; il est indépendant de l'offre du reste.
              venteADeclarer(form)
                ? {
                    actif: fraisOfferts,
                    // Facturer les frais : ceux de la facture de l'abattoir liée au lot (ou ceux déjà enregistrés).
                    onChange: (actif) =>
                      onChange(
                        actif
                          ? { ...form, cadeauFrais: true }
                          : {
                              ...form,
                              cadeauFrais: false,
                              fraisAbattoir: form.fraisAbattoir ?? propositionFrais?.montant,
                              tauxTvaFrais: form.tauxTvaFrais ?? propositionFrais?.tauxTva,
                            },
                      ),
                  }
                : undefined
            }
            proposition={propositionFrais?.montant}
            duLot={!!propositionFrais || !!form.dateAbattoir}
            onFacturer={(facturer) =>
              onChange({
                ...form,
                fraisAbattoir: facturer ? propositionFrais?.montant : undefined,
                tauxTvaFrais: facturer ? (propositionFrais?.tauxTva ?? form.tauxTvaFrais) : form.tauxTvaFrais,
              })
            }
          />
        ) : null}
      </SectionForm>
      <SectionForm>
        {/* Le prix total et, à côté, « personnaliser » : le prix unitaire propre à cette vente. */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <FormField
              label={TEXTES.comptabilite.ficheVente.prixTotal}
              required
              value={
                produitOffert
                  ? '0,00'
                  : prixInventaire
                    ? totalInventaire !== undefined
                      ? String(Math.round((totalInventaire + frais) * 100) / 100).replace('.', ',')
                      : ''
                    : montantTexte
              }
              onChangeText={onChangerMontant}
              editable={!prixInventaire && !produitOffert}
              style={prixInventaire || produitOffert ? commonStyles.verrouille : undefined}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
          </View>
          {prixInventaire && (prixPersonnaliseAuClient(client) || prixPersoCoche) ? (
            <View style={{ width: 170 }}>
              <Interrupteur
                label="personnaliser"
                value={prixPersoCoche}
                onChange={(coche) => {
                  setPrixPersoCoche(coche);
                  if (!coche) {
                    setPrixUnitaireTexte('');
                    onChange({ ...form, prixUnitairePersonnalise: undefined });
                  }
                }}
              />
            </View>
          ) : null}
        </View>
        {prixInventaire && totalInventaire === undefined ? (
          <Text style={commonStyles.note}>{T.aucunPrixInventaire}</Text>
        ) : null}
        {/* Le prix personnalisé (exceptionnel, pour cette vente) : l'unité se saisit, et le total suit l'inventaire recalculé. */}
        {prixInventaire && (prixPersonnaliseAuClient(client) || prixPersoCoche) ? (
          <>
            {prixPersoCoche ? (
              <>
                <FormField
                  label={T.prixParUnite[unitePrix]}
                  value={prixUnitaireTexte}
                  onChangeText={(valeur) => {
                    setPrixUnitaireTexte(valeur);
                    onChange({ ...form, prixUnitairePersonnalise: parseDecimal(valeur) || undefined });
                  }}
                  keyboardType="decimal-pad"
                  placeholder={T.ex2}
                />
                <Text style={commonStyles.note}>{T.prixPersonnaliseAide}</Text>
              </>
            ) : null}
          </>
        ) : null}
        {/* Le taux de TVA de la vente : le HT et la TVA du total s'en déduisent. */}
        <ChampTauxTva
          value={form.tauxTva !== undefined ? String(form.tauxTva) : ''}
          onChange={(taux) => onChange({ ...form, tauxTva: Number(taux) })}
          ttc={produitOffert ? 0 : prixInventaire ? (totalInventaire ?? 0) + frais : parseDecimal(montantTexte)}
        />
        {/* Le paiement : encaissée (la date du jour s'enregistre en la cochant payée), ou pas encore, avec la date prévue. */}
        <ChampPaiement
          libellePayee="Encaissé"
          libelleAttente="À encaisser"
          enAttente={form.payee === false}
          onEnAttente={(attente) => onChange(avecPaiement(form, attente))}
          echeance={form.echeance ?? ''}
          onEcheance={(echeance) => onChange({ ...form, echeance })}
        />
      </SectionForm>
      </>
      ) : null}

    </>
  );
}
