# À faire valider avec le comptable

L'application calcule des chiffres qui peuvent servir à une déclaration. Les règles ci-dessous sont celles que le code applique **aujourd'hui** :
elles sont cohérentes entre elles et testées (`npm test`), mais ce sont des **valeurs indicatives**, pas un avis comptable ni fiscal.
À relire une fois avec le comptable (ou le CGA), puis à corriger si besoin : chaque ligne dit où elle se trouve dans le code.

## Taux de TVA proposés (modifiables dans chaque écriture)

| Cas | Taux proposé | Où |
| --- | --- | --- |
| Achat courant | 2,1 % | `TAUX_TVA_ACHAT_DEFAUT` |
| Carburant | 13 % | `TAUX_TVA_CARBURANT` |
| Lait, fromage, charcuterie / boucherie, animal mort, œufs | 5,5 % | `TAUX_TVA_VENTE_PAR_CATEGORIE` |
| Cabris, viande, animal sur pied ou vivant | 10 % | `TAUX_TVA_VENTE_PAR_CATEGORIE` |
| Entreprise assujettie : dépense | 20 % | `TAUX_TVA_ACHAT_ENTREPRISE_DEFAUT` |
| Entreprise assujettie : recettes | 20 % (prestations, marchandises, bar), 10 % (hébergement, restauration), 0 % (aides, dons, cotisations…) | `TAUX_TVA_RECETTE_ENTREPRISE` |

Questions : ces taux conviennent-ils à l'exploitation (en Corse notamment : 13 % sur le carburant, 2,1 % sur les achats) ?
Les taux de la liste (0 ; 2,1 ; 5,5 ; 10 ; 13 ; 20) sont-ils les bons ?

## Régime de TVA (écran de pilotage)

Quatre régimes : franchise en base, remboursement forfaitaire agricole (RFA), réel simplifié, réel normal (`src/shared/constants/tva.ts`,
`src/features/comptabilite/services/pilotageTva.ts`).

- **RFA** : pas de TVA déclarée ; l'application calcule un remboursement = taux saisi × recettes hors taxes. Le taux est celui que
  l'utilisateur saisit (aucune valeur d'office) : à confirmer.
- **Réel** : TVA collectée − TVA déductible, par période (mois, trimestre ou année). Une dépense « sans facture » n'ouvre pas de TVA
  déductible. Les périodes et échéances de dépôt sont-elles les bonnes ?

## Trésorerie

(`src/features/comptabilite/services/tresorerie.ts`)

- Une facture ou une vente **non payée** est « à encaisser » / « à payer » à sa date d'échéance ; en retard, elle compte à la date du jour.
- Les catégories « hors trésorerie » (`CATEGORIES_RECETTE_HORS_TRESORERIE`, `CATEGORIES_DEPENSE_HORS_TRESORERIE`) ne comptent pas :
  la liste est-elle complète (emprunts, apports, immobilisations…) ?
- Les mensualités d'un emprunt sont reportées une par mois, au dernier jour du mois quand il n'existe pas (31 → 30 ; 28/29 en février).

## Amortissement de la fromagerie

(`src/features/comptabilite/services/amortissement.ts`)

- Linéaire : montant ÷ durée. **Durée proposée si l'utilisateur n'en donne pas : 10 ans** (`DUREE_AMORTISSEMENT_DEFAUT`) — à fixer avec le comptable,
  élément par élément (local, cuve, matériel…).
- L'amortissement n'entre dans la simulation que si l'utilisateur le choisit. Aucun prorata la première année.

## Entreprise (hors élevage)

(`src/shared/constants/entreprise.ts`)

- Plafonds et abattements des régimes micro (indicatifs, ils changent chaque année) : BNC 77 700 € / 34 %, BIC services 77 700 € / 50 %,
  BIC vente 188 700 € / 71 %.
- Taux URSSAF du micro-entrepreneur (indicatifs) : vente de marchandises 12,3 %, services commerciaux 21,2 %, services libéraux 25,6 %.
  Le taux saisi dans les informations de l'entreprise l'emporte.

## Aides et primes (cheptel)

Les montants et plafonds (ICHN par zone, stabilisateur du paiement de base, réduction budgétaire, primes) sont des valeurs d'office par
année ou saisies par l'utilisateur ; ils se vérifient chaque campagne auprès de l'ODARC / de la DDTM (notes de cadrage), pas avec le
comptable.

## Ce que l'application ne fait pas

Elle ne remplace pas la liasse fiscale, la déclaration de TVA ni le bilan : ses états (rentabilité, TVA, trésorerie) servent à **piloter**
l'exploitation et à préparer les documents du comptable.
