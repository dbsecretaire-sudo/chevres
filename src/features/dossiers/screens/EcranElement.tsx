import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { YearPicker } from '@/shared/components/YearPicker';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { InfoModal } from '@/shared/components/InfoModal';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { ListeFichiers } from '@/features/fichiers/components/ListeFichiers';
import { FacturationModal } from '@/features/dossiers/components/FacturationModal';
import { SectionFacturation } from '@/features/dossiers/components/SectionFacturation';
import {
  ajouterFacturation,
  retirerFacturation,
  type SaisieFacturation,
} from '@/features/dossiers/services/facturation';
import { natureDesServices } from '@/features/entreprise/services/urssaf';
import { getClient } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { nomComplet } from '@/shared/utils/personne';
import {
  choisirFichiers,
  piecesDisponibles,
  rangerFichier,
  supprimerPiece,
} from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import {
  enregistrerElement,
  getElement,
  lireArchiveDossiers,
  getSousDossier,
  supprimerElement,
} from '@/features/dossiers/repository';
import type { Facturation, SousDossier, StatutElement } from '@/features/dossiers/types';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { estEnRetard } from '@/features/dossiers/services/recherche';
import { SEPARATEUR_ETIQUETTES, STATUT_ELEMENT, TYPE_FACTURATION } from '@/shared/constants/dossiers';
import { LABEL_STATUT_ELEMENT } from '@/shared/textes/libelles';
import { cheminDansLeClient } from '@/features/dossiers/services/arborescence';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { currentYear, estDateISO, memeJourDansLAnnee, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const PUCES_AVANCEMENT = Object.entries(LABEL_STATUT_ELEMENT).map(([valeur, label]) => ({ valeur, label }));

/** Saisie ou modification d'un contenu (note, courrier, démarche…) rangé dans un sous-dossier. */
export default function EcranElement() {
  const router = useRouter();
  const { id, dossierId: dossierParam } = useLocalSearchParams<{ id?: string; dossierId?: string }>();
  const T = TEXTES.dossiers.element;
  const existant = !!id;
  const { settings } = useAppSettings();
  const infos = settings.exploitation?.entreprise;

  const [dossierId, setDossierId] = useState(dossierParam ?? '');
  const [titre, setTitre] = useState('');
  const [texte, setTexte] = useState('');
  const [date, setDate] = useState(todayISO());
  const [echeance, setEcheance] = useState('');
  const [statut, setStatut] = useState<StatutElement>(STATUT_ELEMENT.A_FAIRE);
  const [etiquettes, setEtiquettes] = useState('');
  const [fichiers, setFichiers] = useState<PieceJointe[]>([]);
  /** Les fichiers retirés : leur copie n'est effacée de l'appareil qu'à l'enregistrement. */
  const [retires, setRetires] = useState<PieceJointe[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  /** Les dossiers du client (où ranger ce contenu) et les années proposées pour sa date. */
  const [dossiersDuClient, setDossiersDuClient] = useState<SousDossier[]>([]);
  const [annees, setAnnees] = useState<number[]>([currentYear()]);
  /** Ce qui est facturé pour ce contenu, le client de son dossier, et la fenêtre de facturation ouverte (facture ou acompte). */
  const [facturations, setFacturations] = useState<Facturation[]>([]);
  const [client, setClient] = useState<Client | undefined>();
  const [facturer, setFacturer] = useState<
    typeof TYPE_FACTURATION.FACTURE | typeof TYPE_FACTURATION.ACOMPTE | null
  >(null);
  const [aRetirer, setARetirer] = useState<Facturation | null>(null);

  useEffect(() => {
    if (!id) return;
    getElement(id).then((e) => {
      if (!e) return;
      setDossierId(e.dossierId);
      setTitre(e.titre);
      setTexte(e.texte ?? '');
      setDate(e.date);
      setEcheance(e.echeance ?? '');
      setStatut(statutEffectif(e));
      setEtiquettes((e.etiquettes ?? []).join(`${SEPARATEUR_ETIQUETTES} `));
      setFichiers(e.fichiers ?? []);
      setFacturations(e.facturations ?? []);
      getClient(e.clientId).then(setClient);
    });
  }, [id]);

  // Les dossiers du client du dossier actuel : on peut y déplacer le contenu.
  useEffect(() => {
    lireArchiveDossiers().then((archive) => {
      const courant = archive.sousDossiers.find((d) => d.id === dossierId);
      setDossiersDuClient(courant ? archive.sousDossiers.filter((d) => d.clientId === courant.clientId) : []);
    });
  }, [dossierId]);

  // Les années qui ont des écritures, l'année en cours, la précédente et la suivante (pour ce qui se prépare).
  useEffect(() => {
    toutesLesAnneesConnues().then((connues) =>
      setAnnees([...new Set([...connues, currentYear() - 1, currentYear() + 1])]),
    );
  }, []);

  /** L'année de la date du contenu : la puce du haut la change, le champ de date ne saisit que le jour et le mois. */
  const anneeDuContenu = estDateISO(date) ? Number(date.slice(0, 4)) : currentYear();

  /** Facture (ou prend l'acompte, ou ajoute sur la note) : enregistré tout de suite, le contenu est relu avec sa facturation. */
  const validerFacturation = async (saisie: SaisieFacturation) => {
    setFacturer(null);
    const element = id ? await getElement(id) : undefined;
    if (!element || !client) return;
    try {
      const mis = await ajouterFacturation(element, saisie, client, infos);
      setFacturations(mis.facturations ?? []);
    } catch (e: any) {
      setErreur(e?.message ?? TEXTES.commun.general.erreur);
    }
  };

  const retirerLaFacturation = async () => {
    const ligne = aRetirer;
    setARetirer(null);
    const element = id ? await getElement(id) : undefined;
    if (!element || !ligne) return;
    const mis = await retirerFacturation(element, ligne.id);
    setFacturations(mis.facturations ?? []);
  };

  const ajouterFichiers = async () => {
    if (!piecesDisponibles()) return setErreur(TEXTES.fichiers.indisponibleWeb);
    try {
      const nouveaux: PieceJointe[] = [];
      for (const choisi of await choisirFichiers(TYPES_FICHIERS_ACCEPTES, true)) {
        nouveaux.push(await rangerFichier(choisi));
      }
      setFichiers((actuels) => [...actuels, ...nouveaux]);
    } catch (e: any) {
      setErreur(e?.message ?? TEXTES.fichiers.erreurAjout);
    }
  };

  const retirerFichier = (piece: PieceJointe) => {
    setFichiers((actuels) => actuels.filter((f) => f.id !== piece.id));
    setRetires((actuels) => [...actuels, piece]);
  };

  const enregistrer = async () => {
    if (!titre.trim()) return setErreur(T.titreRequis);
    if (!estDateISO(date) || (echeance && !estDateISO(echeance)))
      return setErreur(TEXTES.commun.dateField.invalide);
    const dossier = await getSousDossier(dossierId);
    if (!dossier) return setErreur(TEXTES.dossiers.sousDossier.introuvable);
    await enregistrerElement({
      id,
      clientId: dossier.clientId,
      dossierId,
      titre: titre.trim(),
      texte: texte.trim() || undefined,
      date,
      echeance: echeance || undefined,
      statut,
      fichiers: fichiers.length > 0 ? fichiers : undefined,
      facturations: facturations.length > 0 ? facturations : undefined,
      etiquettes: etiquettes
        .split(SEPARATEUR_ETIQUETTES)
        .map((e) => e.trim())
        .filter(Boolean),
    });
    for (const piece of retires) await supprimerPiece(piece);
    router.back();
  };

  const supprimer = async () => {
    if (id) await supprimerElement(id);
    setSuppressionOuverte(false);
    router.back();
  };

  return (
    <AccentColorProvider
      color={existant ? colors.primary : colors.ajout}
      softColor={existant ? colors.badgeBg : colors.ajoutBadgeBg}
    >
      <Screen>
        <Stack.Screen
          options={{
            title: existant ? titre || T.nouveau : T.nouveau,
            // Le menu : supprimer le contenu (il n'y a rien à supprimer tant qu'il n'est pas enregistré).
            headerRight: existant
              ? () => (
                  <Pressable
                    style={commonStyles.boutonEnteteDroite}
                    onPress={() => setMenuOuvert(true)}
                    hitSlop={10}
                    accessibilityLabel={T.menu}
                  >
                    <Ionicons name="menu" size={26} color={colors.blanc} />
                  </Pressable>
                )
              : undefined,
          }}
        />
        <LigneFiltres>
          <YearPicker
            annees={annees}
            value={anneeDuContenu}
            onChange={(annee) => setDate(memeJourDansLAnnee(estDateISO(date) ? date : todayISO(), annee))}
          />
          {dossiersDuClient.length > 1 ? (
            <ChoixDeroulant
              titre={T.dossier}
              valeur={dossierId}
              options={dossiersDuClient
                .map((d) => ({ value: d.id, label: cheminDansLeClient(d.id, dossiersDuClient) }))
                .sort((a, b) => a.label.localeCompare(b.label))}
              onChoisir={setDossierId}
            />
          ) : null}
        </LigneFiltres>
        <FormField
          label={T.titre}
          required
          value={titre}
          onChangeText={setTitre}
          placeholder={T.exempleTitre}
        />
        <FormField
          label={T.texte}
          value={texte}
          onChangeText={setTexte}
          multiline
          style={styles.textareaBasse}
        />
        {/* La date et l'échéance (facultative) côte à côte : un bouton pour l'ajouter, une croix rouge pour la retirer. */}
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <DateField
              label={T.date}
              required
              value={date}
              onChange={setDate}
              anneeImposee={anneeDuContenu}
              jourMoisAnnee
            />
          </View>
          <View style={[commonStyles.flex1, commonStyles.finDeColonne]}>
            {echeance ? (
              <View style={commonStyles.rowFin}>
                <View style={commonStyles.flex1}>
                  <DateField label={T.echeance} value={echeance} onChange={setEcheance} />
                </View>
                <Pressable
                  onPress={() => setEcheance('')}
                  hitSlop={8}
                  accessibilityLabel={T.retirerEcheance}
                  style={commonStyles.boutonPastille}
                >
                  <Ionicons name="close-circle" size={36} color={colors.danger} />
                </Pressable>
              </View>
            ) : (
              <Button variant="secondary" label={T.echeance} onPress={() => setEcheance(todayISO())} />
            )}
          </View>
        </View>

        <View style={commonStyles.gap6}>
          <Text style={commonStyles.lineSemiBold}>{T.avancement}</Text>
          <PucesDefilantes<string>
            puces={PUCES_AVANCEMENT}
            valeur={statut}
            onChoisir={(v) => setStatut(v as StatutElement)}
          />
          {estEnRetard({ echeance: echeance || undefined, statut }, todayISO()) ? (
            <Text style={commonStyles.required}>{T.enRetardInfo}</Text>
          ) : null}
        </View>
        <FormField
          label={T.etiquettes}
          value={etiquettes}
          onChangeText={setEtiquettes}
          placeholder={T.exempleEtiquettes}
        />

        <ListeFichiers
          titre={TEXTES.fichiers.titre}
          libelleAjout={TEXTES.fichiers.ajouter}
          aide={TEXTES.fichiers.aide}
          pieces={fichiers}
          onAjouter={ajouterFichiers}
          onRetirer={retirerFichier}
        />

        {existant ? (
          <SectionFacturation
            facturations={facturations}
            termine={statut === STATUT_ELEMENT.TERMINE}
            onFacturer={() => setFacturer(TYPE_FACTURATION.FACTURE)}
            onAcompte={() => setFacturer(TYPE_FACTURATION.ACOMPTE)}
            onRetirer={setARetirer}
          />
        ) : null}

        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={TEXTES.commun.general.annuler}
            onPress={() => router.back()}
          />
          <Button
            style={commonStyles.flex1}
            label={TEXTES.commun.general.enregistrer}
            onPress={enregistrer}
          />
        </View>
        <OptionsModal
          visible={menuOuvert}
          onClose={() => setMenuOuvert(false)}
          title={titre || T.nouveau}
          options={[
            {
              label: T.supprimer,
              icon: 'trash',
              color: colors.danger,
              onPress: () => {
                setMenuOuvert(false);
                setSuppressionOuverte(true);
              },
            },
          ]}
        />

        <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
        <FacturationModal
          mode={client ? facturer : null}
          nomClient={client ? nomComplet(client) : ''}
          titre={titre}
          natureParDefaut={natureDesServices(infos)}
          onValider={validerFacturation}
          onFermer={() => setFacturer(null)}
        />
        <ConfirmModal
          visible={!!aRetirer}
          title={TEXTES.dossiers.facturation.retirerQuestion}
          message={TEXTES.dossiers.facturation.retirerMessage}
          confirmLabel={TEXTES.commun.general.supprimer}
          onCancel={() => setARetirer(null)}
          onConfirm={retirerLaFacturation}
        />
        <ConfirmModal
          visible={suppressionOuverte}
          title={T.supprimerQuestion}
          message={T.supprimerMessage}
          confirmLabel={TEXTES.commun.general.supprimer}
          onCancel={() => setSuppressionOuverte(false)}
          onConfirm={supprimer}
        />
      </Screen>
    </AccentColorProvider>
  );
}
