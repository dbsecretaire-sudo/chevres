import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { CATEGORIE_CLIENT_PAR_DEFAUT } from '@/shared/constants/clients';
import {
  categoriesClientParDefaut,
  type CategorieClientReglage,
} from '@/shared/dictionnaire/categoriesClient';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.clients.categories;

/**
 * Organisation › Clients et fournisseurs › Catégories de client : la liste proposée dans la fiche d'un client. Chaque catégorie se renomme
 * d'un crayon, se retire (sauf « Particulier », celle d'office) et règle ce qu'elle change dans les ventes : déclarée d'office ou non,
 * prix libre. On peut en ajouter. Tout s'enregistre tout seul.
 */
export default function RubriqueCategoriesClient() {
  const { settings, loaded, patchSettings } = useAppSettings();
  const infos = settings.exploitation;

  const [categories, setCategories] = useState<CategorieClientReglage[]>(
    () => infos?.categoriesClient ?? categoriesClientParDefaut(),
  );
  /** La catégorie qu'on renomme (son identifiant), ou rien. */
  const [renommage, setRenommage] = useState<string | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [aRetirer, setARetirer] = useState<string | null>(null);

  useEffect(() => {
    // Chargement initial unique depuis les réglages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) setCategories(settings.exploitation?.categoriesClient ?? categoriesClientParDefaut());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const enregistrer = async (): Promise<boolean> => {
    await patchSettings({ exploitation: { ...infos, categoriesClient: categories } });
    return true;
  };
  useEnregistrementAuto({ actif: loaded, signature: JSON.stringify(categories), enregistrer });

  const maj = (id: string, patch: Partial<CategorieClientReglage>) =>
    setCategories((liste) => liste.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <Screen>
      <Text style={styles.aide}>{T.aide}</Text>
      {categories.map((c) => (
        <Card key={c.id}>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>{c.nom}</Text>
            <Pressable onPress={() => setRenommage(c.id)} hitSlop={8} accessibilityLabel={T.renommer}>
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </Pressable>
          </View>
          <Checkbox label={T.declaree} value={c.declaree} onChange={(declaree) => maj(c.id, { declaree })} />
          <Checkbox
            label={T.prixLibre}
            value={c.prixLibre}
            onChange={(prixLibre) => maj(c.id, { prixLibre })}
          />
          {c.id === CATEGORIE_CLIENT_PAR_DEFAUT ? (
            <Text style={commonStyles.note}>{T.parDefaut}</Text>
          ) : (
            <Button variant="danger" label={T.supprimer} onPress={() => setARetirer(c.id)} />
          )}
        </Card>
      ))}
      <Button variant="secondary" label={T.ajouter} onPress={() => setAjoutOuvert(true)} />

      <NomModal
        visible={!!renommage}
        titre={T.renommer}
        valeurInitiale={categories.find((c) => c.id === renommage)?.nom ?? ''}
        placeholder={T.exempleNom}
        onValider={(nom) => {
          if (renommage) maj(renommage, { nom });
          setRenommage(null);
        }}
        onAnnuler={() => setRenommage(null)}
      />
      <NomModal
        visible={ajoutOuvert}
        titre={T.nomCategorie}
        placeholder={T.exempleNom}
        onValider={(nom) => {
          setCategories((liste) => [...liste, { id: generateId(), nom, declaree: true, prixLibre: false }]);
          setAjoutOuvert(false);
        }}
        onAnnuler={() => setAjoutOuvert(false)}
      />
      <ConfirmModal
        visible={!!aRetirer}
        title={T.supprimerQuestion}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setARetirer(null)}
        onConfirm={() => {
          setCategories((liste) => liste.filter((c) => c.id !== aRetirer));
          setARetirer(null);
        }}
      />
    </Screen>
  );
}
