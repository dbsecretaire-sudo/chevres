import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Fab } from '@/shared/components/Fab';
import { ROUTES } from '@/shared/constants/routes';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { lireArchiveStock } from '@/features/stock/repository';
import { enregistrerRecette, supprimerRecette } from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, RecetteDeFabrication } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { FormField } from '@/shared/components/FormField';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { Screen } from '@/shared/components/Screen';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.recettes;
const P = T.page;

/** L'ordre des produits dans la bibliothèque. */
const PRODUITS = ['fromage', 'charcuterie', 'plat', 'savon'] as const;

/**
 * La bibliothèque de recettes de l'atelier (Atelier › Recettes) : celles des fromages, de la charcuterie, des plats préparés et des savons, chacune avec ses
 * ingrédients et son explicatif. On y renomme une recette, on en complète les notes (le cahier des charges d'une AOP…) ou on la supprime ; une recette se crée depuis
 * une fabrication (« Enregistrer comme recette »), avec les ingrédients qui y sont saisis.
 */
export default function RecettesDeFabrication() {
  const router = useRouter();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [aRenommer, setARenommer] = useState<RecetteDeFabrication | null>(null);
  const [aSupprimer, setASupprimer] = useState<RecetteDeFabrication | null>(null);
  const charger = useCallback(
    () =>
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const enregistrer = async (recette: RecetteDeFabrication) => {
    await enregistrerRecette(recette);
    await charger();
  };
  const toutes = archive?.recettes ?? [];

  return (
    // Le « + » reste en bas de l'écran, comme partout : il est hors de la liste qui défile.
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
      <Text style={commonStyles.note}>{P.intro}</Text>
      {toutes.length === 0 ? <Text style={commonStyles.mutedItalic}>{P.aucune}</Text> : null}
      {PRODUITS.map((produit) => {
        const recettes = toutes.filter((r) => r.produit === produit).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        if (recettes.length === 0 || !archive) return null;
        return (
          <GroupeAccueil key={produit} titre={P.produit[produit]}>
            <View style={commonStyles.gap10}>
              {recettes.map((r) => (
                <Card key={r.id}>
                  <Text style={commonStyles.cardTitle}>{r.nom}</Text>
                  {r.article ? <Text style={commonStyles.muted}>{libelleArticle(r.article, archive)}</Text> : null}
                  {r.ingredients.length === 0 ? (
                    <Text style={commonStyles.mutedItalic}>{P.sansIngredient}</Text>
                  ) : (
                    r.ingredients.map((i) => (
                      <Text key={i.article} style={commonStyles.line}>
                        {`${String(i.quantite).replace('.', ',')} × ${libelleArticle(i.article, archive)}`}
                      </Text>
                    ))
                  )}
                  <FormField
                    label={T.notes}
                    defaultValue={r.notes ?? ''}
                    onEndEditing={(ev) => {
                      const texte = ev.nativeEvent.text.trim();
                      if (texte !== (r.notes ?? '')) enregistrer({ ...r, notes: texte || undefined });
                    }}
                    multiline
                    style={commonStyles.textarea}
                  />
                  <View style={commonStyles.gap10}>
                    <Button variant="secondary" label={T.edition.modifier} onPress={() => router.push(ROUTES.productionRecette(r.id) as never)} />
                    <Button variant="secondary" label={P.renommer} onPress={() => setARenommer(r)} />
                    <Button variant="danger" label={T.supprimer} onPress={() => setASupprimer(r)} />
                  </View>
                </Card>
              ))}
            </View>
          </GroupeAccueil>
        );
      })}
      </ScrollView>
      <NomModal
        visible={!!aRenommer}
        titre={P.renommerTitre}
        valeurInitiale={aRenommer?.nom}
        onValider={(nom) => {
          const r = aRenommer;
          setARenommer(null);
          if (r && nom.trim()) enregistrer({ ...r, nom: nom.trim() });
        }}
        onAnnuler={() => setARenommer(null)}
      />
      <ConfirmModal
        visible={!!aSupprimer}
        title={T.supprimerQuestion(aSupprimer?.nom ?? '')}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={async () => {
          const r = aSupprimer;
          setASupprimer(null);
          if (r) {
            await supprimerRecette(r.id);
            await charger();
          }
        }}
      />
      <Fab
        options={PRODUITS.map((p) => ({
          label: `${T.edition.ajouter} · ${P.produit[p]}`,
          icon: 'add-circle' as const,
          onPress: () => router.push(ROUTES.productionRecette(undefined, p) as never),
        }))}
      />
    </Screen>
  );
}
