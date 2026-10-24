import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { joursAbattusAFacturer, type JourAbattu } from '@/features/comptabilite/utils/animauxVendus';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { saveChevre } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { especeDe } from '@/features/cheptel/utils/espece';
import { poidsTotal } from '@/features/cheptel/utils/poids';
import { useInconsommables } from '@/features/lots-animaux/hooks/useInconsommables';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { PageSimplePoidsClient } from '@/features/production/simple/PageSimplePoidsClient';
import { repartirLePoids } from '@/features/production/simple/repartitionDuPoids';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { loadAllYears } from '@/shared/storage/localStore';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.production.viande;
const S = TEXTES.production.viande.simple;

/** Un jour d'abattage à facturer : sa date et ses animaux (avec boucle). */
interface JourChoisi {
  date: string;
  animaux: Chevre[];
}

/**
 * « Viande à facturer » au plus simple : une tuile par jour d'abattage dont la viande n'est pas encore facturée (le jour, le nombre d'animaux, le poids). Un appui
 * ouvre une page de deux réponses — le poids total (kg) et le client à facturer — puis la facture de viande de ce jour s'ouvre, remplie.
 */
export function ViandeSimple({ onRetour }: { onRetour?: () => void }) {
  const router = useRouter();
  const { espece } = useEtablissement();
  const inconsommables = useInconsommables();
  const [jours, setJours] = useState<JourAbattu[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [choisi, setChoisi] = useState<JourChoisi | null>(null);
  const [enCours, setEnCours] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL) as Promise<Chevre[]>, listToutesVentes(), listClients()])
        .then(([cheptel, ventes, tous]) => {
          setClients(tous);
          setJours(
            joursAbattusAFacturer(
              cheptel.filter((a) => especeDe(a) === espece),
              ventes,
            ),
          );
        })
        .catch(() => undefined);
    }, [espece]),
  );

  // Seuls les animaux avec boucle se facturent ici (une bête déclarée inconsommable est abattue mais ne se facture pas).
  const groupes: JourChoisi[] = (jours ?? [])
    .map((j) => ({
      date: j.date,
      animaux: j.animaux.filter((a) => !!a.numeroBoucle?.trim() && !inconsommables.has(a.id)),
    }))
    .filter((g) => g.animaux.length > 0);

  /** Le poids saisi s'écrit sur les animaux (réparti), puis la facture de viande de ce jour s'ouvre avec le client. */
  const facturer = async (jour: JourChoisi, total: number | undefined, clientId: string) => {
    if (enCours) return;
    setEnCours(true);
    try {
      if (total !== undefined && total !== poidsTotal(jour.animaux)) {
        for (const a of repartirLePoids(jour.animaux, total)) await saveChevre(a);
      }
      router.push({
        pathname: ROUTES.COMPTABILITE_NOUVELLE,
        params: {
          type: TYPE_FACTURE.EMISE,
          categorie: CATEGORIE_RECETTE.VIANDE,
          abattoir: jour.date,
          ...(clientId ? { client: clientId } : {}),
        },
      });
      setChoisi(null);
    } finally {
      setEnCours(false);
    }
  };

  if (choisi)
    return (
      <PageSimplePoidsClient
        titre={TEXTES.accueil.ferme.terrain.tuiles.viandeAFacturer}
        detail={`${T.abattoirLe(formatDateFR(choisi.date))} · ${T.animaux(choisi.animaux.length)}`}
        poidsInitial={poidsTotal(choisi.animaux)}
        clients={clients}
        libelleValider={S.facturer}
        enCours={enCours}
        onValider={(total, clientId) => facturer(choisi, total, clientId)}
        onRetour={() => setChoisi(null)}
      />
    );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{TEXTES.accueil.ferme.terrain.tuiles.viandeAFacturer}</Text>
      {jours !== null && groupes.length === 0 ? <Text style={styles.detail}>{T.rienAFacturer}</Text> : null}
      <ListeDeChoix
        presentation="tuiles"
        choix={groupes.map((g) => {
          const total = poidsTotal(g.animaux);
          return {
            cle: g.date,
            libelle: `${T.abattoirLe(formatDateFR(g.date))}\n${[T.animaux(g.animaux.length), total ? T.poids(String(total).replace('.', ',')) : ''].filter(Boolean).join(' · ')}`,
            icone: 'food-steak' as const,
          };
        })}
        onChoisir={(c) => setChoisi(groupes.find((g) => g.date === c.cle) ?? null)}
      />
      <Pressable style={styles.discret} onPress={onRetour ?? (() => router.back())} accessibilityRole="button">
        <Text style={styles.discretTexte}>{TEXTES.production.fabricationSimple.retour}</Text>
      </Pressable>
    </ScrollView>
  );
}
