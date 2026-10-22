import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { ChampImageArticle } from '@/features/stock/components/ChampImageArticle';
import type { ChoixImage } from '@/features/stock/services/imagesArticles';
import { ChampPrixParCategorie } from '@/features/stock/components/ChampPrixParCategorie';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { categoriesClient } from '@/shared/dictionnaire/categoriesClient';
import { formatMontant } from '@/shared/utils/dates';
import { parseDecimal, parseMontant } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  titre: string;
  nom?: string;
  /** Le prix de vente actuel ; le champ n'est proposé que pour un article qui se vend (`avecPrix`). */
  prix?: number;
  avecPrix: boolean;
  /** L'identifiant de l'article (fromage, viande) : ses prix selon la catégorie de contact se règlent sous son prix de base. */
  cle?: string;
  /** Les litres de lait par fromage : le champ n'est proposé que pour un fromage (`avecLitres`). */
  litresParFromage?: number;
  avecLitres?: boolean;
  /** Le nom du champ des litres quand il diffère (brocciu : le lait versé dans le lactosérum). */
  libelleLitres?: string;
  /** Le prix se compte au kilo (les lignes d'animaux de la viande). */
  parKg?: boolean;
  /** Un libellé de prix particulier (le litre de lait, l'œuf) : il n'y a alors que le prix à modifier, sans nom à changer. */
  libellePrix?: string;
  /** Le dessin d'origine de la carte : quand il est donné (avec `cle`), la fenêtre propose de choisir une image à sa place. */
  emoji?: string;
  onValider: (nom: string, prix?: number, litres?: number, image?: ChoixImage) => void;
  /** Quand il est donné, un bouton permet de supprimer l'article (après confirmation). */
  onSupprimer?: () => void;
  onAnnuler: () => void;
}

const T = TEXTES.stock.articleModal;

/** Petite fenêtre pour modifier un article du stock : son nom et, pour un fromage ou une viande, son prix de vente. */
export function ArticleStockModal({
  visible,
  titre,
  nom,
  cle,
  prix,
  avecPrix,
  litresParFromage,
  avecLitres,
  libelleLitres,
  parKg,
  libellePrix,
  emoji,
  onValider,
  onSupprimer,
  onAnnuler,
}: Props) {
  const [nomSaisi, setNomSaisi] = useState('');
  const [prixSaisi, setPrixSaisi] = useState('');
  const [litresSaisis, setLitresSaisis] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [choixImage, setChoixImage] = useState<ChoixImage | null>(null);
  /** Les prix de l'article selon la catégorie de contact (particulier, professionnel…). */
  const [tarifsLus, setTarifsLus] = useState<{ cle: string; prix: Record<string, number> } | null>(null);
  const tarifs = cle && tarifsLus?.cle === cle ? tarifsLus.prix : null;

  useEffect(() => {
    if (visible && cle && avecPrix) {
      lireArchiveCommercial().then((archive) => setTarifsLus({ cle, prix: archive.tarifs[cle] ?? {} }));
    }
  }, [visible, cle, avecPrix]);

  useEffect(() => {
    // Chaque ouverture repart de l'article modifié.
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNomSaisi(nom ?? '');
      setPrixSaisi(prix ? formatMontant(prix) : '');
      setLitresSaisis(litresParFromage ? String(litresParFromage).replace('.', ',') : '');
      setErreur(null);
      setChoixImage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const valider = () => {
    if (!libellePrix && !nomSaisi.trim()) return setErreur(T.nomRequis);
    const montant = parseMontant(prixSaisi);
    if (prixSaisi.trim() && !(montant > 0)) return setErreur(T.prixInvalide);
    const litres = parseDecimal(litresSaisis);
    if (avecLitres && litresSaisis.trim() && !(litres > 0)) return setErreur(T.litresInvalide);
    onValider(
      nomSaisi.trim(),
      montant > 0 ? montant : undefined,
      litres > 0 ? litres : undefined,
      choixImage ?? undefined,
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <Pressable style={commonStyles.backdrop} onPress={onAnnuler}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{titre}</Text>
          {libellePrix ? null : (
            <FormField label={T.nom} required value={nomSaisi} onChangeText={setNomSaisi} />
          )}
          {/* Un fromage ou une viande : le prix de vente et ceux des catégories de contact, en une seule ligne (catégorie, prix). */}
          {avecPrix && cle && tarifs ? (
            <ChampPrixParCategorie
              article={cle}
              categories={categoriesClient()}
              tarifs={tarifs}
              prixDeVente={prixSaisi}
              onPrixDeVente={setPrixSaisi}
              parKg={parKg}
            />
          ) : avecPrix ? (
            <FormField
              label={libellePrix ?? (parKg ? T.prixKg : T.prix)}
              value={prixSaisi}
              onChangeText={setPrixSaisi}
              onBlur={() =>
                parseMontant(prixSaisi) > 0 && setPrixSaisi(formatMontant(parseMontant(prixSaisi)))
              }
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
          ) : null}
          {avecLitres ? (
            <FormField
              label={libelleLitres ?? T.litresFromage}
              value={litresSaisis}
              onChangeText={setLitresSaisis}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          ) : null}
          {cle && emoji ? <ChampImageArticle cle={cle} emoji={emoji} choix={choixImage} onChoix={setChoixImage} /> : null}
          {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onAnnuler}
            />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={valider} />
          </View>
          {onSupprimer ? <Button variant="danger" label={T.supprimer} onPress={onSupprimer} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
