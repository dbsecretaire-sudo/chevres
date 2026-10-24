import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { HistoriqueStock } from '@/features/stock/components/HistoriqueStock';
import { lireArchiveStock } from '@/features/stock/repository';
import type { FiltreStock } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { CATEGORIE_VENTE, CATEGORIES_VENTE_ANIMAUX } from '@/shared/constants/comptabilite';
import { FILTRE_STOCK_TOUT } from '@/shared/constants/stock';

type VenteLait = { id: string; date: string; litres: number };
type VenteAnimaux = { id: string; date: string; nombre: number; categorie: string; activite: string };

/**
 * L'historique du stock, sur un écran à part : les mouvements par type de stock, mois par mois. Il s'ouvre sur l'animal
 * regardé dans le stock (paramètre `espece`), sinon sur l'animal actif.
 */
export default function HistoriqueStockEcran() {
  const { especes, espece: especeActive } = useEtablissement();
  const { espece } = useLocalSearchParams<{ espece?: string }>();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [ventesLait, setVentesLait] = useState<VenteLait[]>([]);
  const [ventesAnimaux, setVentesAnimaux] = useState<VenteAnimaux[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([lireArchiveStock(), listToutesVentes()]).then(
        ([stock, ventes]) => {
          setArchive(stock);
          setVentesLait(
            ventes
              .filter((v) => v.categorie === CATEGORIE_VENTE.LAIT && v.quantite)
              .map((v) => ({ id: v.id, date: v.date, litres: v.quantite ?? 0 })),
          );
          setVentesAnimaux(
            ventes
              .filter(
                (v) => v.quantite && (CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(v.categorie),
              )
              .map((v) => ({
                id: v.id,
                date: v.date,
                nombre: v.quantite ?? 0,
                categorie: v.categorie,
                activite: activiteVente(v),
              })),
          );
        },
      );
    }, []),
  );

  const voulu = (espece ?? especeActive) as FiltreStock;
  const filtreInitial: FiltreStock =
    voulu === FILTRE_STOCK_TOUT || especes.includes(voulu) ? voulu : FILTRE_STOCK_TOUT;

  return (
    <Screen>
      {archive ? (
        <HistoriqueStock
          archive={archive}
          especes={especes}
          filtreInitial={filtreInitial}
          ventesLait={ventesLait}
          ventesAnimaux={ventesAnimaux}
        />
      ) : null}
    </Screen>
  );
}
