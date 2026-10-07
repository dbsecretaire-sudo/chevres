import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import type { ArticleAnnexe, CategorieAnnexe } from '@/features/annexes/types';
import { formatMontant } from '@/shared/utils/dates';
import { parseDecimal, parseMontant } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.annexes;

interface Props {
  visible: boolean;
  /** Les catégories de l'activité de l'article. */
  categories: CategorieAnnexe[];
  /** Quand il y a plusieurs activités à choisir (un nouvel article ajouté depuis l'inventaire) : leur liste et celle choisie. */
  activites?: { id: string; nom: string }[];
  activiteId?: string;
  onChangerActivite?: (id: string) => void;
  /** L'article qu'on modifie ; absent pour en créer un. */
  article?: ArticleAnnexe;
  /** La catégorie proposée pour un nouvel article. */
  categorieInitiale?: string;
  onValider: (donnees: Pick<ArticleAnnexe, 'nom' | 'categorieId' | 'prix' | 'suiviStock' | 'stock'>) => void;
  onSupprimer: () => void;
  onFermer: () => void;
}

/** Petite fenêtre pour créer ou modifier un article d'une activité : nom, catégorie, prix de vente, et suivi du stock. */
export function ArticleAnnexeModal({
  visible,
  categories,
  activites,
  activiteId,
  onChangerActivite,
  article,
  categorieInitiale,
  onValider,
  onSupprimer,
  onFermer,
}: Props) {
  const [nom, setNom] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [prix, setPrix] = useState('');
  const [suiviStock, setSuiviStock] = useState(false);
  const [stock, setStock] = useState('0');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart de l'article modifié, ou d'un formulaire vide.
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNom(article?.nom ?? '');
      setCategorieId(article?.categorieId ?? categorieInitiale ?? '');
      setPrix(article ? formatMontant(article.prix) : '');
      setSuiviStock(article?.suiviStock ?? false);
      setStock(String(article?.stock ?? 0));
      setErreur(null);
    }
  }, [visible, article, categorieInitiale]);

  const valider = () => {
    if (!nom.trim()) return setErreur(T.article.nomRequis);
    const montant = parseMontant(prix);
    if (!(montant > 0)) return setErreur(T.article.prixInvalide);
    const niveau = parseDecimal(stock);
    if (suiviStock && !Number.isFinite(niveau)) return setErreur(T.article.stockInvalide);
    onValider({
      nom: nom.trim(),
      categorieId: categorieId || undefined,
      prix: montant,
      suiviStock,
      stock: suiviStock ? niveau : 0,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>
            {article ? T.catalogue.modifierArticle : T.catalogue.ajouterArticle}
          </Text>
          <ScrollView style={commonStyles.listeDeFenetre} contentContainerStyle={commonStyles.gap10}>
            {activites && activites.length > 0 ? (
              <SelectField<string>
                label={T.article.activite}
                required
                value={activiteId ?? ''}
                onChange={(id) => {
                  setCategorieId('');
                  onChangerActivite?.(id);
                }}
                options={activites.map((a) => ({ value: a.id, label: a.nom }))}
              />
            ) : null}
            <FormField
              label={T.article.nom}
              required
              value={nom}
              onChangeText={setNom}
              placeholder={T.article.nomPlaceholder}
            />
            <SelectField<string>
              label={T.article.categorie}
              value={categorieId}
              onChange={setCategorieId}
              options={[
                { value: '', label: T.article.aucuneCategorie },
                ...categories.map((c) => ({ value: c.id, label: c.nom })),
              ]}
            />
            <FormField
              label={T.article.prix}
              required
              value={prix}
              onChangeText={setPrix}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
            <Checkbox label={T.article.suiviStock} value={suiviStock} onChange={setSuiviStock} />
            {suiviStock ? (
              <FormField
                label={T.article.stock}
                value={stock}
                onChangeText={setStock}
                keyboardType="decimal-pad"
              />
            ) : null}
          </ScrollView>
          {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onFermer}
            />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={valider} />
          </View>
          {article ? (
            <Button variant="danger" label={T.catalogue.supprimerArticle} onPress={onSupprimer} />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
