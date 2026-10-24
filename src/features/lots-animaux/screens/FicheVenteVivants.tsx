import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { useActionsDocumentCirculation } from '@/features/comptabilite/hooks/useActionsDocumentCirculation';
import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { ChampBoucles } from '@/features/lots-animaux/components/ChampBoucles';
import { ChoixAcheteurDuDepart, useClientsDuDepart } from '@/features/lots-animaux/components/ChoixAcheteurDuDepart';
import { useVentesVivants } from '@/features/lots-animaux/hooks/useVentesVivants';
import { animauxDuLot } from '@/features/lots-animaux/services/lots';
import { titreDeLaVenteVivants } from '@/features/lots-animaux/services/ventesVivants';
import { exporterDocumentCirculationAbattoirPdf } from '@/features/export/documents/documentCirculationPdf';
import { ApercuPiece } from '@/features/fichiers/components/ApercuPiece';
import { CATEGORIE_RECETTE, SEPARATEUR_ANIMAUX } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { nomComplet } from '@/shared/utils/personne';

const T = TEXTES.exploitation.ventesVivants;
const C = TEXTES.cheptel.circulation;

/**
 * La fiche d'une vente d'animaux vivants : son acheteur (le client chez qui son document de circulation se range), ses animaux, son document de circulation (à générer,
 * puis à téléverser une fois signé) et, une fois le document déposé, la facture au détenteur d'arrivée. Elle s'enregistre toute seule.
 */
export default function FicheVenteVivants() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { ventes, modifier, supprimer } = useVentesVivants();
  const existant = id ? ventes.find((v) => v.id === id) : undefined;
  const [boucles, setBoucles] = useState('');
  const [acheteur, setAcheteur] = useState('');
  const [lu, setLu] = useState(false);
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  const [menu, setMenu] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const clients = useClientsDuDepart();
  const { options } = useActionsDocumentCirculation(() => undefined);

  useEffect(() => {
    listTousLesAnimauxDeLEspece()
      .then(setAnimaux)
      .catch(() => undefined);
  }, []);
  // La vente se lit une fois, dès que les réglages sont là.
  useEffect(() => {
    if (!existant || lu) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLu(true);
    setBoucles(existant.boucles);
    setAcheteur(existant.contactCle ?? '');
  }, [existant, lu]);

  useEnregistrementAuto({
    actif: !!existant && lu,
    signature: JSON.stringify([boucles, acheteur]),
    enregistrer: async () => {
      if (existant) await modifier({ ...existant, boucles: boucles.trim(), contactCle: acheteur || undefined });
      return true;
    },
  });

  const date = existant?.date ?? '';
  const idsDesAnimaux = animauxDuLot({ boucles }, animaux).map((a) => a.id);
  const client = clients.find((c) => c.id === acheteur);
  const genererLeModele = () =>
    exporterDocumentCirculationAbattoirPdf(date, idsDesAnimaux, client ? nomComplet(client) : undefined, false).catch(() => undefined);
  const document = existant?.documentCirculation;
  const titre = existant ? titreDeLaVenteVivants(existant) : T.titre;

  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Screen>
        <Text style={commonStyles.cardTitle}>{titre}</Text>

        {/* L'acheteur : le document de circulation de cette vente se range dans ses documents. */}
        <SectionForm titre={TEXTES.cheptel.lots.depart.acheteur.titre} aide={TEXTES.cheptel.lots.depart.acheteur.aide}>
          <ChoixAcheteurDuDepart valeur={acheteur} onChange={setAcheteur} />
        </SectionForm>

        <SectionForm titre={TEXTES.cheptel.lots.depart.animaux}>
          <ChampBoucles value={boucles} onChange={setBoucles} sansLots enColonnes date={date || undefined} />
        </SectionForm>

        <SectionForm titre={TEXTES.cheptel.lots.depart.document.titre}>
          <Button variant="secondary" label={C.boutonVente} badge={!document} onPress={() => setMenu(true)} />
          {document ? <ApercuPiece piece={document.piece} /> : <Text style={[commonStyles.note, { color: colors.danger }]}>{TEXTES.cheptel.lots.depart.document.manque}</Text>}
        </SectionForm>

        {/* La vente elle-même, au nom de l'acheteur (le détenteur d'arrivée) : après le document de circulation. */}
        <Button
          label={C.facturerLeDepart}
          disabled={!document || !existant}
          onPress={() =>
            existant &&
            router.push(
              `${ROUTES.COMPTABILITE_NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.ANIMAL_VIVANT}&lot=${existant.id}&animaux=${idsDesAnimaux.join(SEPARATEUR_ANIMAUX)}&etat=vivants${acheteur ? `&client=${acheteur}` : ''}` as never,
            )
          }
        />
        {document ? null : <Text style={commonStyles.note}>{C.facturerApresDocument}</Text>}

        {existant ? <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} /> : null}
        <ConfirmModal
          visible={suppressionOuverte}
          title={T.supprimerQuestion}
          message={T.supprimerMessage}
          confirmLabel={TEXTES.commun.general.supprimer}
          onCancel={() => setSuppressionOuverte(false)}
          onConfirm={async () => {
            setSuppressionOuverte(false);
            if (existant) await supprimer(existant.id);
            retournerALaPageDAvant(router);
          }}
        />
      </Screen>
      <OptionsModal
        visible={menu}
        onClose={() => setMenu(false)}
        title={titre}
        options={
          existant
            ? options({ type: 'vivants', id: existant.id, depose: existant.documentCirculation }, { modele: genererLeModele }).map((o) => ({
                ...o,
                onPress: () => {
                  setMenu(false);
                  o.onPress();
                },
              }))
            : []
        }
      />
    </AccentColorProvider>
  );
}
