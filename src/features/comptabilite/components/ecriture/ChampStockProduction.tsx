import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesAchetables, articlesDuGenre } from '@/features/stock/services/stock';
import { derniereBoucle, estArticleBoucle } from '@/features/stock/services/boucles';
import { COMPTE_BOUCLES } from '@/shared/constants/planComptable';
import { FILTRE_STOCK_TOUT, GENRE_ARTICLE } from '@/shared/constants/stock';
import { commonStyles } from '@/shared/styles/commonStyles';
import type { ArticleAffiche } from '@/features/stock/services/stock';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.stockProduction;

interface Props {
  /** Un compte de l'inventaire : seuls les articles de ses listes sont proposés (rien si aucune liste ne l'a). */
  compte?: string;
  /** L'article du stock qui reçoit la quantité (vide : l'achat n'entre pas au stock). */
  article: string;
  quantite?: number;
  /** Un achat de boucles : le numéro de la première (les suivantes se numérotent à la suite, selon la quantité). */
  debut?: string;
  onChange: (article: string, quantite?: number) => void;
  onChangeDebut?: (debut: string) => void;
}

const enNombre = (texte: string): number | undefined => {
  const n = Number(texte.replace(',', '.'));
  return texte === '' || Number.isNaN(n) ? undefined : n;
};

/** Un achat de production (sel, emballages, boucles…) : l'article de l'inventaire acheté et sa quantité, ajoutée au stock. */
export function ChampStockProduction({ compte, article, quantite, debut, onChange, onChangeDebut }: Props) {
  const [articles, setArticles] = useState<ArticleAffiche[]>([]);
  /** Pour un compte de l'inventaire : il a des listes (sinon aucune quantité à noter). */
  const [avecListe, setAvecListe] = useState(true);
  /** Le compte dont les articles sont chargés : tant qu'il n'est pas le compte choisi, les articles sont ceux du compte précédent. */
  const [compteCharge, setCompteCharge] = useState<string | undefined>(undefined);
  const [texte, setTexte] = useState(quantite === undefined ? '' : String(quantite));
  useEffect(() => {
    let actif = true;
    lireArchiveStock().then((archive) => {
      if (!actif) return;
      if (!compte) {
        setArticles(articlesAchetables(archive));
        return setCompteCharge(compte);
      }
      const listes = (archive.listes ?? []).filter((l) => l.compte === compte);
      // Le compte des boucles a sa liste d'office : les deux sortes de boucles.
      const boucles = compte === COMPTE_BOUCLES.numero;
      setAvecListe(listes.length > 0 || boucles);
      setArticles([
        ...listes.flatMap((l) =>
          articlesDuGenre(GENRE_ARTICLE.PERSONNALISE, archive, FILTRE_STOCK_TOUT, l.id),
        ),
        ...(boucles ? articlesDuGenre(GENRE_ARTICLE.BOUCLE, archive) : []),
      ]);
      setCompteCharge(compte);
    });
    return () => {
      actif = false;
    };
  }, [compte]);
  const aJour = compteCharge === compte;
  // Un seul article possible : il est choisi d'office. Un compte sans liste n'en garde aucun (le champ n'est pas affiché).
  useEffect(() => {
    if (!compte || !aJour) return;
    if (!article && articles.length === 1) onChange(articles[0].cle, quantite);
    else if (article && !avecListe) onChange('', undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compte, articles, aJour]);
  // Quand la saisie est vidée de l'extérieur (écriture suivante), le champ se vide aussi.
  const affiche =
    (quantite ?? 0) === (enNombre(texte) ?? 0) ? texte : quantite === undefined ? '' : String(quantite);

  /** Des boucles : leur quantité est un nombre entier, et chacune a son numéro. */
  const boucles = estArticleBoucle(article);
  const dernier = boucles && debut && quantite ? derniereBoucle(debut, quantite) : undefined;

  if (compte && !avecListe) return null;
  if (compte && articles.length === 0) return <Text style={commonStyles.note}>{T.listeVide}</Text>;

  return (
    <>
      <SelectField
        label={compte ? T.articleInventaire : T.article}
        searchable
        value={article}
        onChange={(valeur) => onChange(valeur, valeur ? quantite : undefined)}
        placeholder={T.aucun}
        options={[
          { value: '', label: T.aucun },
          ...articles.map((a) => ({ value: a.cle, label: a.libelle })),
        ]}
        aide={T.aide}
      />
      {article ? (
        <FormField
          label={T.quantite}
          required
          value={affiche}
          onChangeText={(valeur) => {
            if (!(boucles ? /^\d*$/ : /^\d*[.,]?\d*$/).test(valeur)) return;
            setTexte(valeur);
            onChange(article, enNombre(valeur));
          }}
          keyboardType={boucles ? 'number-pad' : 'decimal-pad'}
        />
      ) : null}
      {boucles ? (
        <>
          <FormField
            label={T.premiereBoucle}
            required
            value={debut ?? ''}
            onChangeText={(valeur) => onChangeDebut?.(valeur.trim())}
            keyboardType="default"
          />
          <Text style={commonStyles.note}>{dernier ? T.derniereBoucle(dernier) : T.premiereBoucleAide}</Text>
        </>
      ) : null}
    </>
  );
}
