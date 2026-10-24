import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { Screen } from '@/shared/components/Screen';
import { AncreVisite } from '@/shared/components/AncreVisite';
import { useAccueilEnDeuxColonnes, useLigneActive } from '@/bureau/colonnes';
import { TuilesChiffres, type TuileChiffre } from '@/features/commercial/components/TuilesChiffres';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { commandeOuverte } from '@/features/commercial/services/commandes';
import { clientsARelancer } from '@/features/commercial/services/statistiques';
import { listClients } from '@/features/clients/repository';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { JOURS_CLIENT_A_RELANCER } from '@/shared/constants/commercial';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatMontant, todayISO } from '@/shared/utils/dates';

const T = TEXTES.commercial.accueil;

interface Resume {
  commandesOuvertes: number;
  aEncaisser: number;
  enRetard: boolean;
  aRelancer: number;
}

/**
 * L'onglet Commercial d'un élevage : un résumé de ce qui attend (commandes à préparer, paiements à encaisser, clients à relancer),
 * puis les volets — ventes et clients, tarifs, commandes et livraisons, circuits de vente.
 */
export default function CommercialAccueil() {
  const router = useRouter();
  const ouvrir = useOuvrir();
  const estActive = useLigneActive();
  // Deux colonnes : le menu est déjà à gauche, la colonne de droite montre le chiffre d'affaires.
  const redirection = useAccueilEnDeuxColonnes(ROUTES.COMMERCIAL_VENTES);
  const [resume, setResume] = useState<Resume>({
    commandesOuvertes: 0,
    aEncaisser: 0,
    enRetard: false,
    aRelancer: 0,
  });

  useFocusEffect(
    useCallback(() => {
      Promise.all([lireArchiveCommercial(), listToutesVentes(), listClients()]).then(
        ([archive, ventes, clients]) => {
          const aujourdhui = todayISO();
          const impayees = ventes.filter((v) => v.payee === false);
          setResume({
            commandesOuvertes: archive.commandes.filter(commandeOuverte).length,
            aEncaisser: impayees.reduce((t, v) => t + (v.prix ?? 0), 0),
            enRetard: impayees.some((v) => !!v.echeance && v.echeance < aujourdhui),
            aRelancer: clientsARelancer(clients, ventes, aujourdhui, JOURS_CLIENT_A_RELANCER).length,
          });
        },
      );
    }, []),
  );

  type Ligne = {
    cle: string;
    titre: string;
    aide: string;
    icone: keyof typeof Ionicons.glyphMap;
    route: string;
    alerte?: boolean;
  };
  const groupes: { titre: string; lignes: Ligne[] }[] = [
    {
      titre: T.groupes.ventes,
      lignes: [
        {
          cle: 'ventes',
          ...T.ventes,
          icone: 'stats-chart',
          route: ROUTES.COMMERCIAL_VENTES,
          alerte: resume.enRetard,
        },
        { cle: 'tarifs', ...T.tarifs, icone: 'pricetags', route: ROUTES.COMMERCIAL_TARIFS },
        {
          cle: 'commandes',
          titre: T.commandes.titre,
          aide:
            resume.commandesOuvertes > 0 ? T.commandes.ouvertes(resume.commandesOuvertes) : T.commandes.aide,
          icone: 'cube',
          route: ROUTES.COMMERCIAL_COMMANDES,
        },
        { cle: 'circuits', ...T.circuits, icone: 'git-network', route: ROUTES.COMMERCIAL_CIRCUITS },
      ],
    },
    {
      titre: T.groupes.reseau,
      lignes: [
        {
          cle: 'contacts',
          ...T.contacts,
          icone: 'people',
          route: ROUTES.CONTACTS,
        },
      ],
    },
  ];

  const tuiles: TuileChiffre[] = [
    ...(resume.commandesOuvertes > 0
      ? [
          {
            cle: 'commandes',
            libelle: T.resume.aPreparer,
            valeur: String(resume.commandesOuvertes),
            onPress: () => router.push(ROUTES.COMMERCIAL_COMMANDES as never),
          },
        ]
      : []),
    ...(resume.aEncaisser > 0
      ? [
          {
            cle: 'encaisser',
            libelle: T.resume.aEncaisser,
            valeur: formatMontant(resume.aEncaisser),
            alerte: resume.enRetard,
            onPress: () => router.push(ROUTES.commercialVentes('encaisser') as never),
          },
        ]
      : []),
    ...(resume.aRelancer > 0
      ? [
          {
            cle: 'relancer',
            libelle: T.resume.aRelancer,
            valeur: String(resume.aRelancer),
            onPress: () => router.push(ROUTES.commercialVentes('relancer') as never),
          },
        ]
      : []),
  ];

  if (redirection) return redirection;
  return (
    <Screen>
      {tuiles.length > 0 ? <TuilesChiffres tuiles={tuiles} /> : null}
      {groupes.map((groupe) => (
        <GroupeAccueil key={groupe.titre} titre={groupe.titre}>
          <BlocLignes>
            {groupe.lignes.map((l) => (
              <AncreVisite key={l.cle} id={`rubrique:${l.route}`}>
                <ListRow
                  title={l.titre}
                  subtitle={l.aide}
                  icone={l.icone}
                  actif={estActive(l.route)}
                  trailing={
                    l.alerte ? (
                      <View style={commonStyles.row}>
                        <PastilleAlerte />
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                      </View>
                    ) : undefined
                  }
                  onPress={() => ouvrir(l.route)}
                />
              </AncreVisite>
            ))}
          </BlocLignes>
        </GroupeAccueil>
      ))}
    </Screen>
  );
}
