import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { FormulaireEspece } from '@/features/especes/components/FormulaireEspece';
import { enregistrerEspece, supprimerEspece } from '@/features/especes/repository';
import { definitionActuelle, estEspeceOffice, toutesLesEspeces } from '@/features/especes/services/registre';
import { listEtablissements } from '@/features/etablissements/repository';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';

const T = TEXTES.especes;

/** L'identifiant du menu « nouvelle espèce » (les autres portent l'identifiant de leur espèce). */
const NOUVELLE = 'nouvelle';

interface Props {
  visible: boolean;
  /** Appelé à la fermeture, et à chaque ajout, modification ou suppression (la liste des espèces se relit). */
  onChange: () => void;
  onFermer: () => void;
}

/**
 * La fenêtre des espèces, ouverte par le + du formulaire d'établissement : une nouvelle espèce (son nom, ses âges, ses mots) et
 * celles qui existent, modifiables de la même façon. Un menu déroulant à la fois.
 */
export function GestionEspeces({ visible, onChange, onFermer }: Props) {
  const [ouvert, setOuvert] = useState<string | null>(NOUVELLE);
  const [version, setVersion] = useState(0);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture démarre sur la nouvelle espèce.
    if (visible) setOuvert(NOUVELLE); // eslint-disable-line react-hooks/set-state-in-effect
  }, [visible]);

  const apres = () => {
    setVersion((v) => v + 1);
    onChange();
  };

  const supprimer = async () => {
    const id = aSupprimer;
    setASupprimer(null);
    if (!id) return;
    const nom = LABEL_TYPE_ANIMAL_ETABLISSEMENT[id] ?? id;
    if ((await listEtablissements()).some((e) => e.animaux?.includes(id))) return setMessage(T.utilisee(nom));
    await supprimerEspece(id);
    setOuvert(null);
    apres();
  };

  /** Un menu déroulant : le titre, et le formulaire une fois déroulé. */
  const menu = (id: string, titre: string, sousTitre: string | undefined, contenu: React.ReactNode) => {
    const deroule = ouvert === id;
    return (
      <Card key={`${id}-${version}`} style={commonStyles.gap10}>
        <Pressable
          style={commonStyles.rowFin}
          onPress={() => setOuvert(deroule ? null : id)}
          accessibilityRole="button"
          accessibilityState={{ expanded: deroule }}
        >
          <Ionicons name={deroule ? 'chevron-down' : 'chevron-forward'} size={20} color={colors.textMuted} />
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.lineBold}>{titre}</Text>
            {sousTitre ? <Text style={commonStyles.note}>{sousTitre}</Text> : null}
          </View>
        </Pressable>
        {deroule ? contenu : null}
      </Card>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onFermer}>
      <SafeAreaView style={commonStyles.screenBg} edges={['top', 'bottom']}>
        <View style={commonStyles.fenetre}>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={commonStyles.heading}>{T.titre}</Text>
            <Pressable onPress={onFermer} hitSlop={8} accessibilityLabel={T.fermer}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView
            style={commonStyles.flex1}
            contentContainerStyle={commonStyles.gap10}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={commonStyles.note}>{T.aide}</Text>
            {menu(
              NOUVELLE,
              T.nouvelle,
              undefined,
              <FormulaireEspece
                libelleValider={T.ajouter}
                onValider={async (definition) => {
                  const id = `perso_${generateId()}`;
                  await enregistrerEspece({ id, ...definition });
                  setOuvert(id);
                  apres();
                }}
              />,
            )}
            {toutesLesEspeces().map((id) =>
              menu(
                id,
                LABEL_TYPE_ANIMAL_ETABLISSEMENT[id] ?? id,
                estEspeceOffice(id) ? T.parDefaut : undefined,
                <FormulaireEspece
                  initial={definitionActuelle(id)}
                  libelleValider={T.enregistrer}
                  onValider={async (definition) => {
                    await enregistrerEspece({ id, ...definition });
                    apres();
                  }}
                  onSupprimer={estEspeceOffice(id) ? undefined : () => setASupprimer(id)}
                />,
              ),
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ConfirmModal
        visible={!!aSupprimer}
        title={T.supprimerQuestion}
        message={T.supprimerMessage(
          aSupprimer ? (LABEL_TYPE_ANIMAL_ETABLISSEMENT[aSupprimer] ?? aSupprimer) : '',
        )}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={supprimer}
      />
      <InfoModal
        visible={!!message}
        title={T.supprimer}
        message={message ?? undefined}
        onClose={() => setMessage(null)}
      />
    </Modal>
  );
}
