import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { useRouter } from 'expo-router';
import { laiterieActive } from '@/features/comptabilite/utils/recettes';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.accueil.inventaire;

/**
 * Comptabilité › Inventaire : les stocks (les listes de l'inventaire, avec leurs quantités) et, pour une exploitation qui fait du lait,
 * le conditionnement des fromages (les emballages consommés à chaque vente).
 */
export default function AccueilInventaire() {
  const router = useRouter();
  // Le conditionnement des fromages : pour les espèces qui font du lait (chèvres, brebis, vaches).
  const fromagerie = especesActives().some((espece) => laiterieActive(espece));
  return (
    <Screen>
      <BlocLignes>
        <ListRow
          title={T.stocks}
          subtitle={T.stocksAide}
          icone="clipboard"
          onPress={() => router.push(ROUTES.COMPTABILITE_STOCKS)}
        />
        {fromagerie ? (
          <ListRow
            title={TEXTES.stock.conditionnement.titre}
            subtitle={TEXTES.settings.reglages.aideConditionnement}
            icone="layers"
            onPress={() => router.push(ROUTES.COMPTABILITE_CONDITIONNEMENT)}
          />
        ) : null}
      </BlocLignes>
    </Screen>
  );
}
