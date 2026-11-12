import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { CarteSauvegarde } from '@/features/settings/components/CartesDonnees';
import { useExportEtSauvegarde } from '@/features/settings/hooks/useExportEtSauvegarde';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

/** La sauvegarde locale (exporter ou importer toutes les données), sur son propre écran. Sur Windows, aussi les copies automatiques. */
export default function EcranSauvegarde() {
  const donnees = useExportEtSauvegarde();
  const router = useRouter();
  const copies = TEXTES.settings.reglages.copiesAutomatiques;
  return (
    <Screen>
      <CarteSauvegarde d={donnees} />
      {estBureau() ? (
        <BlocLignes>
          <ListRow
            title={copies.entree}
            subtitle={copies.entreeDetail}
            icone="time-outline"
            onPress={() => router.push(ROUTES.COPIES_AUTOMATIQUES as never)}
          />
        </BlocLignes>
      ) : null}
    </Screen>
  );
}
