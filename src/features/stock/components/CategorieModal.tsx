import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import type { DonneesCategorie, ErreurCategorie } from '@/features/stock/services/structure';
import type { InfosCategorie } from '@/features/stock/utils/categories';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.structure;

interface Props {
  /** Ouverte (nouvelle catégorie, ou celle qu'on modifie) ; fermée quand elle est absente. */
  ouverte: boolean;
  /** La catégorie qu'on modifie (son nom et sa classe) ; absente pour une nouvelle catégorie. */
  categorie?: InfosCategorie;
  /** Enregistre la catégorie : rend ce qui ne va pas (affiché dans la fenêtre), ou rien quand c'est fait. */
  onValider: (donnees: DonneesCategorie) => Promise<ErreurCategorie | null>;
  onFermer: () => void;
}

/**
 * La fenêtre d'une catégorie de l'inventaire, au même titre que « 32. Autres approvisionnements » : son nom, son numéro de
 * classe et (à la création) les débuts de compte que ses listes pourront avoir.
 */
export function CategorieModal({ ouverte, categorie, onValider, onFermer }: Props) {
  const [nom, setNom] = useState('');
  const [classe, setClasse] = useState('');
  const [comptes, setComptes] = useState('');
  const [erreur, setErreur] = useState<ErreurCategorie | null>(null);

  useEffect(() => {
    // Chaque ouverture repart de la catégorie modifiée, ou d'un formulaire vide.
    if (ouverte) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNom(categorie?.nom ?? '');
      setClasse(categorie?.classe ?? '');
      setComptes('');
      setErreur(null);
    }
  }, [ouverte, categorie]);

  const valider = async () => setErreur(await onValider({ nom, classe, comptes }));

  return (
    <Modal visible={ouverte} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{categorie ? T.modifierCategorie : T.ajouterCategorie}</Text>
          <FormField
            label={T.categorie.nom}
            required
            value={nom}
            onChangeText={(texte) => {
              setNom(texte);
              setErreur(null);
            }}
            placeholder={T.categorie.exempleNom}
          />
          <FormField
            label={T.categorie.classe}
            required
            value={classe}
            onChangeText={(texte) => {
              setClasse(texte);
              setErreur(null);
            }}
            keyboardType="number-pad"
            placeholder={T.categorie.exempleClasse}
          />
          {categorie ? null : (
            <>
              <FormField
                label={T.categorie.comptes}
                required
                value={comptes}
                onChangeText={(texte) => {
                  setComptes(texte);
                  setErreur(null);
                }}
                placeholder={T.categorie.exempleComptes}
              />
              <Text style={commonStyles.note}>{T.categorie.aideComptes}</Text>
            </>
          )}
          {erreur ? <Text style={commonStyles.required}>{T.categorie.erreurs[erreur]}</Text> : null}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onFermer}
            />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={valider} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
