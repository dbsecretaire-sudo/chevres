import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';

import { colors } from '@/shared/theme/colors';
import {
  getComptePcg,
  listComptesPcg,
  enregistrerComptePcg,
  retablirCompte,
  retirerComptePourEspece,
  supprimerComptePcg,
  type CompteComptableEnregistre,
} from '@/features/comptes-pcg/repository';
import { ChoixSuiviCompte, useSuiviCompte } from '@/features/comptes-pcg/components/ChoixSuiviCompte';
import {
  ajouterListe,
  listesDuCompte,
  compteAvecMouvements,
  retablirDansLInventaire,
  retirerDeLInventaire,
  retirerDeLInventairePourEspece,
  suivreLeCompte,
} from '@/features/stock/services/structure';
import { commonStyles } from '@/shared/styles/commonStyles';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

export default function FicheComptePcg() {
  const { id, espece } = useLocalSearchParams<{ id: string; espece?: string }>();
  const router = useRouter();

  const [compte, setCompte] = useState<CompteComptableEnregistre | null>(null);
  const [form, setForm] = useState<CompteComptableEnregistre | null>(null);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  /** Les numéros des autres comptes : un compte n'y figure qu'une fois. */
  const [autresNumeros, setAutresNumeros] = useState<string[]>([]);

  const charger = useCallback(async () => {
    if (!id) return;
    const c = await getComptePcg(id);
    setCompte(c ?? null);
    setForm(c ?? null);
    setAutresNumeros((await listComptesPcg()).filter((x) => x.id !== id).map((x) => x.numero));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const dejaEnregistre = !!form && autresNumeros.includes(form.numero.trim());
  const suiviCompte = useSuiviCompte(form?.numero ?? '');
  const { archive } = suiviCompte;
  /** Le compte est inventorié aujourd'hui (il a une liste) : le type affiché au départ de la modification. */
  const inventorieAvant = !!compte && !!archive && listesDuCompte(archive, compte.numero).length > 0;
  /** Le retrait de l'inventaire (avec les articles de ses listes) attend la confirmation. */
  const [retraitOuvert, setRetraitOuvert] = useState(false);
  // On modifie un compte inventorié : la puce « Inventaire » est celle choisie au départ.
  const [editingVu, setEditingVu] = useState(false);
  if (editing !== editingVu) {
    setEditingVu(editing);
    if (editing) suiviCompte.setSuivi(inventorieAvant ? 'inventaire' : 'service');
  }

  const enregistrerModifications = async (retraitConfirme = false) => {
    if (!form || dejaEnregistre || suiviCompte.impossible) return;
    if (!form.numero.trim()) return setErreur(TEXTES.commun.general.nRequis);
    if (!form.libelle.trim()) return setErreur(TEXTES.commun.general.descriptionRequise);

    const nettoye: CompteComptableEnregistre = {
      ...form,
      numero: form.numero.trim(),
      libelle: form.libelle.trim(),
    };
    // Un compte dont l'inventaire a des mouvements y reste ; sinon il perd sa liste, avec ses articles : on le confirme d'abord.
    if (suiviCompte.suivi === 'service' && inventorieAvant && (await compteAvecMouvements(compte!.numero))) {
      return setErreur(TEXTES.comptesPcg.ficheComptePcg.compteAvecMouvements(compte!.numero));
    }
    if (suiviCompte.suivi === 'service' && inventorieAvant && !retraitConfirme) return setRetraitOuvert(true);
    await enregistrerComptePcg(nettoye);
    if (suiviCompte.suivi === 'service') {
      await retirerDeLInventaire(compte!.numero);
    } else if (inventorieAvant) {
      await suivreLeCompte(compte!.numero, { numero: nettoye.numero, libelle: nettoye.libelle });
    } else if (suiviCompte.categorie) {
      await ajouterListe(suiviCompte.categorie.categorie, nettoye.libelle, {
        numero: nettoye.numero,
        libelle: nettoye.libelle,
      });
    }
    setRetraitOuvert(false);
    setCompte(nettoye);
    setForm(nettoye);
    setEditing(false);
  };

  /** Ouverte depuis la liste d'une espèce : le compte n'est retiré que pour elle, les autres espèces le gardent. */
  const pourUneEspece = !!espece;
  const nomEspece = espece ? LABEL_ACTIVITE_COMPTABLE[espece as keyof typeof LABEL_ACTIVITE_COMPTABLE] : '';

  const supprimerDefinitivement = async () => {
    if (!compte) return;
    // Des mouvements de stock sont enregistrés sur son inventaire : le compte reste.
    if (await compteAvecMouvements(compte.numero, espece)) {
      setSuppressionOuverte(false);
      return setErreur(TEXTES.comptesPcg.ficheComptePcg.compteAvecMouvements(compte.numero));
    }
    if (espece) {
      await retirerComptePourEspece(compte.id, espece);
      await retirerDeLInventairePourEspece(compte.numero, espece);
    } else {
      await retirerDeLInventaire(compte.numero);
      await supprimerComptePcg(compte.id);
    }
    retournerALaPageDAvant(router);
  };

  const retablir = async () => {
    if (!compte) return;
    await retablirCompte(compte.id);
    await retablirDansLInventaire(compte.numero);
    await charger();
  };

  if (!compte || !form) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{TEXTES.comptesPcg.ficheComptePcg.compteIntrouvable}</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.header}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.title}>{compte.numero}</Text>
            <Text style={commonStyles.subtitle}>{compte.libelle}</Text>
          </View>
          <Pressable style={commonStyles.boutonMenu} onPress={() => setMenuOuvert(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>

        <OptionsModal
          visible={menuOuvert}
          onClose={() => setMenuOuvert(false)}
          title={compte.numero}
          options={[
            {
              label: TEXTES.commun.general.modifierLaFiche,
              icon: 'create',
              onPress: () => {
                setMenuOuvert(false);
                setEditing(true);
              },
            },
            {
              label: pourUneEspece
                ? TEXTES.comptesPcg.ficheComptePcg.retirerPourEspece(nomEspece)
                : TEXTES.commun.general.supprimerDefinitivement,
              icon: 'trash',
              color: colors.danger,
              onPress: () => {
                setMenuOuvert(false);
                setSuppressionOuverte(true);
              },
            },
          ]}
        />

        {!editing ? (
          <Card>
            <Text style={commonStyles.line}>N° : {compte.numero}</Text>
            <Text style={commonStyles.line}>
              {TEXTES.comptesPcg.ficheComptePcg.typeDeuxPoints}
              {TEXTES.comptesPcg.nouveauComptePcg.suivi[inventorieAvant ? 'inventaire' : 'service']}
            </Text>
            <Text style={commonStyles.line}>
              {TEXTES.comptesPcg.ficheComptePcg.descriptionDeuxPoints}
              {compte.libelle}
            </Text>
            {compte.masquePour?.length ? (
              <>
                <Text style={commonStyles.note}>
                  {TEXTES.comptesPcg.ficheComptePcg.retireePour(
                    compte.masquePour
                      .map((e) => LABEL_ACTIVITE_COMPTABLE[e as keyof typeof LABEL_ACTIVITE_COMPTABLE] ?? e)
                      .join(', '),
                  )}
                </Text>
                <Button
                  label={TEXTES.comptesPcg.ficheComptePcg.retablir}
                  variant="secondary"
                  onPress={retablir}
                />
              </>
            ) : null}

            <Button
              label={TEXTES.commun.general.modifierLaFiche}
              variant="secondary"
              onPress={() => setEditing(true)}
            />
          </Card>
        ) : (
          <Card>
            <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.modifierLaFiche}</Text>

            <FormField
              label="N°"
              required
              value={form.numero}
              onChangeText={(v) => setForm({ ...form, numero: v })}
              keyboardType="number-pad"
              erreur={dejaEnregistre ? TEXTES.comptesPcg.numeroDejaEnregistre : undefined}
            />
            <FormField
              label={TEXTES.commun.general.description}
              required
              value={form.libelle}
              onChangeText={(v) => setForm({ ...form, libelle: v })}
            />
            <ChoixSuiviCompte etat={suiviCompte} numero={form.numero} />

            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.commun.general.annuler}
                onPress={() => {
                  setForm(compte);
                  setEditing(false);
                }}
              />
              <Button
                style={commonStyles.flex1}
                label={TEXTES.commun.general.enregistrer}
                onPress={() => enregistrerModifications()}
              />
            </View>
          </Card>
        )}
      </ScrollView>

      <ConfirmModal
        visible={suppressionOuverte}
        title={
          pourUneEspece
            ? TEXTES.comptesPcg.ficheComptePcg.retirerPourEspeceQuestion(nomEspece)
            : TEXTES.commun.general.supprimerDefinitivementQuestion
        }
        message={
          pourUneEspece
            ? TEXTES.comptesPcg.ficheComptePcg.retirerPourEspeceMessage(
                compte.numero,
                compte.libelle,
                nomEspece,
              )
            : TEXTES.comptesPcg.ficheComptePcg.cetteActionSupprimeraDefinitivementLe(
                compte.numero,
                compte.libelle,
              )
        }
        confirmLabel={
          pourUneEspece
            ? TEXTES.comptesPcg.ficheComptePcg.retirerPourEspece(nomEspece)
            : TEXTES.commun.general.supprimerDefinitivement
        }
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={supprimerDefinitivement}
      />

      <ConfirmModal
        visible={retraitOuvert}
        title={TEXTES.comptesPcg.ficheComptePcg.retirerDeLInventaire}
        message={TEXTES.comptesPcg.ficheComptePcg.retraitMessage}
        confirmLabel={TEXTES.comptesPcg.ficheComptePcg.retirer}
        onCancel={() => setRetraitOuvert(false)}
        onConfirm={() => enregistrerModifications(true)}
      />

      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </Screen>
  );
}
