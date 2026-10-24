import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { saveChevre } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { libelleChevre } from '@/features/cheptel/utils/chevreLabel';
import { especeDe } from '@/features/cheptel/utils/espece';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { PageSimplePoidsClient } from '@/features/production/simple/PageSimplePoidsClient';
import { animauxSansBoucleAVendre, joursDeVie } from '@/features/production/simple/viandeAVendre';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { loadAllYears } from '@/shared/storage/localStore';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.production.viande;
const S = TEXTES.production.viande.simple;

/**
 * « Viande à vendre » au plus simple : une tuile par chèvre sans boucle à vendre. Un appui ouvre la page de deux réponses — le poids (kg) et le client — puis l'écriture de
 * la vente sans facture s'ouvre, avec l'animal et le client.
 */
export function ViandeAVendreSimple({ onRetour }: { onRetour?: () => void }) {
  const router = useRouter();
  const { espece } = useEtablissement();
  const [animaux, setAnimaux] = useState<Chevre[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [choisi, setChoisi] = useState<Chevre | null>(null);
  const [enCours, setEnCours] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL) as Promise<Chevre[]>, listToutesVentes(), listClients()])
        .then(([cheptel, ventes, tous]) => {
          setClients(tous);
          setAnimaux(
            animauxSansBoucleAVendre(
              cheptel.filter((a) => especeDe(a) === espece),
              new Set(ventes.flatMap((v) => idsDesAnimaux(v))),
            ),
          );
        })
        .catch(() => undefined);
    }, [espece]),
  );

  const vendre = async (animal: Chevre, poids: number | undefined, clientId: string) => {
    if (enCours) return;
    setEnCours(true);
    try {
      if (poids !== undefined && poids !== animal.poidsKg) await saveChevre({ ...animal, poidsKg: poids });
      router.push({
        pathname: ROUTES.COMPTABILITE_NOUVELLE,
        params: {
          type: TYPE_FACTURE.EMISE,
          categorie: CATEGORIE_RECETTE.VIANDE,
          facture: 'non',
          animaux: animal.id,
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
        titre={TEXTES.accueil.ferme.terrain.tuiles.viandeAVendre}
        detail={[libelleChevre(choisi), joursDeVie(choisi.dateNaissance, todayISO()) === undefined ? '' : S.jours(joursDeVie(choisi.dateNaissance, todayISO()) as number)].filter(Boolean).join(' · ')}
        poidsInitial={choisi.poidsKg}
        clients={clients}
        libelleValider={S.vendre}
        enCours={enCours}
        onValider={(poids, clientId) => vendre(choisi, poids, clientId)}
        onRetour={() => setChoisi(null)}
      />
    );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{TEXTES.accueil.ferme.terrain.tuiles.viandeAVendre}</Text>
      {animaux !== null && animaux.length === 0 ? <Text style={styles.detail}>{T.rienAVendre}</Text> : null}
      <ListeDeChoix
        presentation="tuiles"
        choix={(animaux ?? []).map((a) => {
          const jours = joursDeVie(a.dateNaissance, todayISO());
          return {
            cle: a.id,
            libelle: jours === undefined ? libelleChevre(a) : `${libelleChevre(a)}\n${S.jours(jours)}`,
            icone: 'food-steak' as const,
          };
        })}
        onChoisir={(c) => setChoisi((animaux ?? []).find((a) => a.id === c.cle) ?? null)}
      />
      <Pressable style={styles.discret} onPress={onRetour ?? (() => router.back())} accessibilityRole="button">
        <Text style={styles.discretTexte}>{TEXTES.production.fabricationSimple.retour}</Text>
      </Pressable>
    </ScrollView>
  );
}
