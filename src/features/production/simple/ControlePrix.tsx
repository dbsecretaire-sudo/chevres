import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre, definirPrixArticle } from '@/features/stock/services/stock';
import type { GenreArticle } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { TEXTES } from '@/shared/textes';
import { parseDecimal } from '@/shared/utils/nombres';

const S = TEXTES.production.viande.simple.prixUnitaire;

/** Ce que le prix de l'article compte : le kilo (un petit, un animal sur pied), la tête (un animal vivant), le litre (le lait) ou la pièce (un fromage, un savon, un plat). */
export type UnitePrix = keyof typeof S.unites;

/**
 * Vérifie, avant de vendre un produit, que son prix est fixé dans l'inventaire (au kilo, à la tête, au litre ou à la pièce, selon ce qui se vend). S'il manque, une page simple
 * le demande et le garde dans l'inventaire ; « Passer » laisse la vente se faire sans prix. Une fois le prix connu (ou passé), `children` s'affiche.
 * `cle` : l'article de l'inventaire (« viande:chevres_jeune », « fromage:frais »…) ou « lait ».
 */
export function ControlePrix({
  cle,
  unite,
  onChange,
  children,
}: {
  cle: string;
  unite: UnitePrix;
  /** Appelé quand le prix vient d'être gardé dans l'inventaire. */
  onChange?: () => void;
  children: ReactNode;
}) {
  const [etat, setEtat] = useState<'verif' | 'saisie' | 'ok'>('verif');
  const [libelle, setLibelle] = useState('');
  const [saisie, setSaisie] = useState('');
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    let annule = false;
    lireArchiveStock()
      .then((archive) => {
        if (annule) return;
        const genre = cle.split(':')[0] as GenreArticle;
        const trouve = (Object.values(GENRE_ARTICLE) as string[]).includes(genre)
          ? articlesDuGenre(genre, archive).find((a) => a.cle === cle)?.libelle
          : undefined;
        setLibelle(trouve ?? TEXTES.production.ventesSimple.lait);
        setEtat(archive.prix[cle] ? 'ok' : 'saisie');
      })
      .catch(() => !annule && setEtat('ok'));
    return () => {
      annule = true;
    };
  }, [cle]);

  if (etat === 'verif') return null;
  if (etat === 'ok') return <>{children}</>;

  const enregistrer = async () => {
    const prix = parseDecimal(saisie);
    if (!(prix > 0) || enCours) return;
    setEnCours(true);
    try {
      await definirPrixArticle(cle, Math.round(prix * 100) / 100);
      onChange?.();
      setEtat('ok');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <View style={styles.contenu}>
      <Text style={styles.detail}>{libelle}</Text>
      <Text style={styles.titre}>{S.unites[unite].titre}</Text>
      <Text style={styles.detail}>{S.aide}</Text>
      <FormField label={S.unites[unite].champ} value={saisie} onChangeText={setSaisie} keyboardType="decimal-pad" autoFocus />
      <Button label={S.enregistrer} loading={enCours} disabled={!(parseDecimal(saisie) > 0)} onPress={enregistrer} />
      <Pressable style={styles.discret} onPress={() => setEtat('ok')} accessibilityRole="button">
        <Text style={styles.discretTexte}>{S.passer}</Text>
      </Pressable>
    </View>
  );
}
