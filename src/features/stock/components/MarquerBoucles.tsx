import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { libelleDeLaSorte, marquerBoucles } from '@/features/stock/services/boucles';
import { ARTICLE_BOUCLE, GENRE_ARTICLE } from '@/shared/constants/stock';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.boucles;
const M = T.marquer;

/** Les sortes de boucles qui ont un numéro à l'achat : celles qu'on marque par plage. */
const SORTES = [
  `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.BOUCLES}`,
  `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.TIPTAG}`,
];

/**
 * Le réglage, hors de l'usage courant, de la remarque libre d'une plage de boucles de l'inventaire (commandées en trop, jamais posées…) :
 * un bouton qui ouvre une fenêtre où l'on choisit la sorte, écrit la remarque et donne les numéros de la première et de la dernière
 * boucle. Une remarque vide retire celle des boucles de la plage.
 */
export function MarquerBoucles() {
  const [ouvert, setOuvert] = useState(false);
  const [sorte, setSorte] = useState(SORTES[0]);
  const [remarque, setRemarque] = useState('');
  const [de, setDe] = useState('');
  const [a, setA] = useState('');
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    if (!de.trim() || !a.trim()) return setMessage({ texte: M.numeroRequis, erreur: true });
    setEnCours(true);
    try {
      const nombre = await marquerBoucles(sorte, de, a, remarque);
      setMessage(nombre > 0 ? { texte: M.fait(nombre), erreur: false } : { texte: M.aucuneTrouvee, erreur: true });
    } finally {
      setEnCours(false);
    }
  };

  const fermer = () => {
    setOuvert(false);
    setMessage(null);
  };

  return (
    <>
      <Button label={M.bouton} variant="secondary" onPress={() => setOuvert(true)} />
      <Text style={commonStyles.note}>{M.aide}</Text>
      <Modal visible={ouvert} transparent animationType="fade" onRequestClose={fermer}>
        <Pressable style={commonStyles.backdrop} onPress={fermer}>
          <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={commonStyles.subheading}>{M.titre}</Text>
            <View style={commonStyles.gap10}>
              <SelectField
                label={M.sorte}
                value={sorte}
                onChange={setSorte}
                options={SORTES.map((valeur) => ({ value: valeur, label: libelleDeLaSorte(valeur) }))}
              />
              <FormField label={M.du} value={de} onChangeText={setDe} autoCapitalize="characters" />
              <FormField label={M.au} value={a} onChangeText={setA} autoCapitalize="characters" />
              <FormField
                label={M.remarque}
                value={remarque}
                onChangeText={setRemarque}
                placeholder={M.remarquePlaceholder}
                aide={M.remarqueAide}
                multiline
              />
              {message ? (
                <Text style={[commonStyles.note, message.erreur ? commonStyles.required : null]}>{message.texte}</Text>
              ) : null}
              <Button label={M.valider} onPress={valider} loading={enCours} />
              <Button label={M.fermer} variant="secondary" onPress={fermer} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
