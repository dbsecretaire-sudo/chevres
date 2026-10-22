import { useEffect, useState, type ReactNode } from 'react';
import { BadgeDejaGenere } from '@/features/bibliotheque/components/BadgeDejaGenere';
import { useBibliotheque } from '@/features/bibliotheque/hooks/useBibliotheque';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { AncreVisite } from '@/features/didacticiel/components/AncreVisite';
import { useDocumentsCirculationManquants } from '@/features/comptabilite/hooks/useDocumentsCirculationManquants';
import { documentsDuType } from '@/features/bibliotheque/services/recherche';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '@/shared/constants/routes';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { ListRow } from '@/shared/components/ListRow';
import type { Chevre } from '@/features/cheptel/types';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { FenetreEstive } from '@/features/cheptel/components/FenetreEstive';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { anneesDuSuivi } from '@/features/cheptel/services/suiviMouvements';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { exporterBordereauxPertePdf } from '@/features/export/bordereauPertePdf';
import { exporterRecensementPdf } from '@/features/export/recensementPdf';
import { recensementAnnuel } from '@/features/cheptel/services/recensement';
import { exporterSuiviMouvementsPdf, especeDuSuivi } from '@/features/export/suiviMouvementsPdf';
import { loadAllYears } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { currentYear } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.suiviMouvements;

/** Le choix « toutes les années » de la liste. */
const TOUTES = 'toutes';

/** Les documents qui se génèrent d'un appui : un document par ligne. */
type Document = 'suivi' | 'bordereaux' | 'recensement';

/** L'écran du dossier PAC. */
export default function DossierPac() {
  return (
    <Screen>
      <ContenuDossierPac />
    </Screen>
  );
}

/**
 * Le dossier PAC : tous les documents de la campagne, remplis d'après le cheptel, au même endroit. En haut, l'année (et l'espèce) ; dessous,
 * une ligne par document — un appui le génère —, puis l'historique des documents déjà générés. Le détail du calcul du recensement se déplie.
 */
export function ContenuDossierPac({
  partie = 'tout',
  avant,
  apres,
}: {
  /**
   * Ce que la page montre : « registre » (les documents : le suivi des mouvements et les documents déjà générés), « declarations » (les organismes : le
   * recensement annuel et la déclaration d'estive), ou « tout » (l'écran du dossier PAC).
   */
  partie?: 'tout' | 'registre' | 'declarations';
  /** Des lignes de plus avant celles des documents (le carnet de naissance). */
  avant?: ReactNode;
  /** Des lignes de plus à la suite de celles des documents (les terrains, ou les autres documents des animaux). */
  apres?: ReactNode;
}) {
  const registre = partie !== 'declarations';
  const declarations = partie !== 'registre';
  const pourOrganismes = partie !== 'tout';
  const router = useRouter();
  const retour = useAdresseCourante();
  const { espece } = useEtablissement();
  const [annees, setAnnees] = useState<number[]>([]);
  const [choix, setChoix] = useState(String(currentYear()));
  /** Le document en cours de génération (sa ligne montre un indicateur, les autres attendent). */
  const [encours, setEncours] = useState<Document | null>(null);
  /** Vrai quand les bordereaux demandés n'ont aucune perte à déclarer. */
  const [sansPerte, setSansPerte] = useState(false);
  const [estiveOuverte, setEstiveOuverte] = useState(false);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const [animauxDuCheptel, setAnimauxDuCheptel] = useState<Chevre[]>([]);

  useEffect(() => {
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL).then((tous) => {
      setAnnees(anneesDuSuivi(deEspeceCourante(tous), currentYear()));
      setAnimauxDuCheptel(deEspeceCourante(tous));
    });
  }, [espece]);

  const options = [
    { value: TOUTES, label: T.toutesLesAnnees },
    ...[...annees].reverse().map((a) => ({ value: String(a), label: String(a) })),
  ];
  const anneesChoisies = choix === TOUTES ? annees : [Number(choix)];
  const annee = choix === TOUTES ? currentYear() : Number(choix);
  // Le recensement de l'année choisie d'après le cheptel : de quoi expliquer son nombre de petits nés.
  const recensement = animauxDuCheptel.length > 0 ? recensementAnnuel(animauxDuCheptel, annee + 1) : null;
  const rienAFaire = annees.length === 0;
  const generes = useBibliotheque();
  /** Les documents de circulation qui manquent (ventes et dépenses d'animaux vivants) : une pastille sur la ligne. */
  const manquants = useDocumentsCirculationManquants().length;
  const generer = async (document: Document, creer: (annees: number[]) => Promise<number | void>) => {
    setEncours(document);
    setSansPerte(false);
    try {
      const nombre = await creer(anneesChoisies);
      if (nombre === 0) setSansPerte(true);
    } finally {
      setEncours(null);
    }
  };
  /** Un appui sur une ligne la génère, sauf quand il n'y a rien à reporter ou qu'un autre document se prépare. */
  const appui = (document: Document, creer: (annees: number[]) => Promise<number | void>) =>
    encours || rienAFaire ? undefined : () => generer(document, creer);
  /** À droite d'une ligne : un indicateur pendant sa génération, sinon l'icône du document. */
  const droite = (document: Document, racines: string[]) =>
    encours === document ? (
      <ActivityIndicator color={colors.primary} />
    ) : (
      <View style={commonStyles.row}>
        {/* Déjà généré : la date du dernier, en vert. */}
        <BadgeDejaGenere faits={documentsDuType(generes, racines)} />
        <Ionicons name="download-outline" size={22} color={rienAFaire ? colors.textMuted : colors.primary} />
      </View>
    );

  return (
    <>
      {/* L'espèce et l'année, en haut : ce que les documents ci-dessous reprennent. */}
      <LigneFiltres>
        {/* Les organismes (recensement, estive) portent toujours sur la campagne en cours : pas de choix d'année. */}
        {rienAFaire || partie === 'declarations' ? null : (
          <ChoixDeroulant<string>
            titre={T.annee}
            valeur={choix}
            options={options}
            onChoisir={(valeur) => {
              setChoix(valeur);
              setSansPerte(false);
            }}
          />
        )}
        <SelecteurEspece />
      </LigneFiltres>
      {pourOrganismes ? null : <Text style={commonStyles.note}>{T.fenetreAide}</Text>}
      {!especeDuSuivi(espece) ? <Text style={commonStyles.mutedItalic}>{T.pasPourCetteEspece}</Text> : null}
      {rienAFaire ? <Text style={commonStyles.mutedItalic}>{T.aucunAnimal}</Text> : null}

      {/* Les documents : une ligne chacun, un appui le génère. */}
      <BlocLignes>
        {avant}
        {registre ? (
          <ListRow
            title={T.lignes.suivi.titre}
            subtitle={T.lignes.suivi.aide}
            trailing={droite('suivi', ['suivi_mouvements'])}
            onPress={appui('suivi', exporterSuiviMouvementsPdf)}
          />
        ) : null}
        {pourOrganismes ? null : (
          <ListRow
            title={T.lignes.bordereaux.titre}
            subtitle={T.lignes.bordereaux.aide}
            trailing={droite('bordereaux', ['bordereaux_perte'])}
            onPress={appui('bordereaux', exporterBordereauxPertePdf)}
          />
        )}
        {declarations ? (
          <ListRow
            title={`${T.recensement.bouton.replace(' (PDF)', '')} ${annee + 1}`}
            subtitle={T.lignes.recensement.aide(annee)}
            trailing={droite('recensement', ['recensement'])}
            onPress={appui('recensement', async () => exporterRecensementPdf(annee))}
          />
        ) : null}
        {pourOrganismes ? null : (
        <AncreVisite id="dossier.circulation">
        <ListRow
          title={TEXTES.cheptel.circulation.ligneDossier}
          subtitle={TEXTES.cheptel.circulation.aideDossier}
          trailing={
            <View style={commonStyles.row}>
              {manquants > 0 ? <PastilleAlerte taille={18} /> : null}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          }
          onPress={() => router.push(ROUTES.documentsCirculationDepuis(retour) as never)}
        />
        </AncreVisite>
        )}
        {/* La déclaration d'estive se range dans les documents. */}
        {registre ? (
          <ListRow
            title={T.estive.bouton.replace('…', '')}
            subtitle={T.lignes.estive.aide}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
            onPress={() => setEstiveOuverte(true)}
          />
        ) : null}
        {apres}
      </BlocLignes>
      {sansPerte ? <Text style={commonStyles.mutedItalic}>{T.aucunePerte}</Text> : null}

      {/* Le calcul du recensement : replié, pour ne pas allonger la page. */}
      {declarations ? (
        <Pressable onPress={() => setDetailOuvert(!detailOuvert)} hitSlop={8}>
          <Text style={commonStyles.lien}>
            {detailOuvert ? T.lignes.masquerDetail : T.lignes.voirDetail(annee + 1)}
          </Text>
        </Pressable>
      ) : null}
      {declarations && detailOuvert ? (
        <>
          <Text style={commonStyles.note}>{T.recensement.aide(annee)}</Text>
          {recensement && recensement.nesTotal > 0 ? (
            <Text style={commonStyles.note}>
              {T.recensement.detailNes(
                annee,
                recensement.nesTotal,
                recensement.nesSansBoucle,
                recensement.nesMorts,
                recensement.nes,
              )}
            </Text>
          ) : null}
          <Text style={commonStyles.note}>{T.aideBordereaux}</Text>
        </>
      ) : null}

      {/* Tous les PDF déjà générés, pour garder un historique. */}
      {registre ? (
        <BlocLignes>
          <ListRow
            title={TEXTES.export.bibliotheque.bouton}
            subtitle={TEXTES.export.bibliotheque.aide}
            trailing={<Ionicons name="time-outline" size={22} color={colors.primary} />}
            onPress={() => router.push(ROUTES.bibliothequeDepuis(retour) as never)}
          />
        </BlocLignes>
      ) : null}
      <FenetreEstive visible={estiveOuverte} annee={annee} onClose={() => setEstiveOuverte(false)} />
    </>
  );
}
