import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { InfoModal } from '@/shared/components/InfoModal';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { ListeFichiers } from '@/features/fichiers/components/ListeFichiers';
import {
  choisirFichiers,
  piecesDisponibles,
  rangerCapture,
  supprimerPiece,
} from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { TYPES_CAPTURES_ACCEPTES } from '@/shared/constants/fichiers';
import { SelectField } from '@/shared/components/SelectField';
import { enregistrerTrade, getTrade, listTrades, supprimerTrade } from '@/features/trading/repository';
import {
  supprimerFactureTrade,
  synchroniserFactureTrade,
} from '@/features/trading/services/comptabiliteTrade';
import { dureeJours, multipleR, resultatTrade, risqueInitial } from '@/features/trading/services/calculs';
import type { EtatEsprit, SensTrade, Trade, TypeInstrument } from '@/features/trading/types';
import { SEPARATEUR_ETIQUETTES } from '@/shared/constants/dossiers';
import { PLAN_RESPECTE, SENS_TRADE } from '@/shared/constants/trading';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import {
  LABEL_ETAT_ESPRIT,
  LABEL_PLAN_RESPECTE,
  LABEL_SENS_TRADE,
  LABEL_TYPE_INSTRUMENT,
} from '@/shared/textes/libelles';
import { estDateISO, formatMontant, todayISO } from '@/shared/utils/dates';
import { useAnneeImposee } from '@/features/settings/hooks/useAnneeImposee';
import { parseDecimal } from '@/shared/utils/nombres';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { styles as stylesTrading } from '@/shared/styles/trading/Trading.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.trading.trade;

const PUCES_SENS = Object.values(SENS_TRADE).map((valeur) => ({ valeur, label: LABEL_SENS_TRADE[valeur] }));

const options = (labels: Record<string, string>, vide?: string) => [
  ...(vide !== undefined ? [{ value: '', label: vide }] : []),
  ...Object.entries(labels).map(([value, label]) => ({ value, label })),
];

/** Un nombre saisi à l'écran (virgule décimale), vide pour absent. */
const enTexte = (nombre: number | undefined): string =>
  nombre === undefined ? '' : String(nombre).replace('.', ',');

/** Un nombre saisi, ou undefined si le champ est vide. */
const nombreOuVide = (texte: string): number | undefined => (texte.trim() ? parseDecimal(texte) : undefined);

/**
 * Saisie ou modification d'un trade : l'instrument, le sens, l'entrée, le stop et l'objectif prévus, puis (à la
 * clôture) la sortie. Le résultat net, le risque pris et le résultat en R se calculent à l'écran.
 */
export default function EcranTrade() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existant = !!id;

  const [instrument, setInstrument] = useState('');
  const [typeInstrument, setTypeInstrument] = useState<TypeInstrument | ''>('');
  const [sens, setSens] = useState<SensTrade>(SENS_TRADE.ACHAT);
  const [dateEntree, setDateEntree] = useState(todayISO());
  const [prixEntree, setPrixEntree] = useState('');
  const [quantite, setQuantite] = useState('');
  const [stop, setStop] = useState('');
  const [objectif, setObjectif] = useState('');
  const [frais, setFrais] = useState('');
  const [clos, setClos] = useState(false);
  // La clôture d'un nouveau trade crée une écriture : sa date est dans l'année active (libre avec « Tout »).
  const { anneeImposee, dateDuJour } = useAnneeImposee();
  const [dateSortie, setDateSortie] = useState(id ? todayISO() : dateDuJour);
  const [prixSortie, setPrixSortie] = useState('');
  const [strategie, setStrategie] = useState('');
  const [plan, setPlan] = useState('');
  const [etatEsprit, setEtatEsprit] = useState<EtatEsprit | ''>('');
  const [factureId, setFactureId] = useState<string | undefined>();
  const [captures, setCaptures] = useState<PieceJointe[]>([]);
  /** Les captures retirées : leur copie n'est effacée de l'appareil qu'à l'enregistrement. */
  const [retirees, setRetirees] = useState<PieceJointe[]>([]);
  const [notes, setNotes] = useState('');
  const [etiquettes, setEtiquettes] = useState('');
  const [strategies, setStrategies] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  useEffect(() => {
    // Les stratégies déjà utilisées, les plus fréquentes d'abord : proposées d'un geste.
    listTrades().then((trades) => {
      const compte = new Map<string, number>();
      for (const t of trades) {
        const nom = t.strategie?.trim();
        if (nom) compte.set(nom, (compte.get(nom) ?? 0) + 1);
      }
      setStrategies([...compte.entries()].sort((a, b) => b[1] - a[1]).map(([nom]) => nom));
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    getTrade(id).then((t) => {
      if (!t) return;
      setInstrument(t.instrument);
      setTypeInstrument(t.typeInstrument ?? '');
      setSens(t.sens);
      setDateEntree(t.dateEntree);
      setPrixEntree(enTexte(t.prixEntree));
      setQuantite(enTexte(t.quantite));
      setStop(enTexte(t.stop));
      setObjectif(enTexte(t.objectif));
      setFrais(enTexte(t.frais));
      setClos(t.dateSortie !== undefined && t.prixSortie !== undefined);
      setDateSortie(t.dateSortie ?? todayISO());
      setPrixSortie(enTexte(t.prixSortie));
      setStrategie(t.strategie ?? '');
      setPlan(t.planRespecte === undefined ? '' : t.planRespecte ? PLAN_RESPECTE.OUI : PLAN_RESPECTE.NON);
      setEtatEsprit(t.etatEsprit ?? '');
      setFactureId(t.factureId);
      setCaptures(t.captures ?? []);
      setNotes(t.notes ?? '');
      setEtiquettes((t.etiquettes ?? []).join(`${SEPARATEUR_ETIQUETTES} `));
    });
  }, [id]);

  /** Le trade tel qu'il est saisi, pour calculer son résultat à l'écran et pour l'enregistrer. */
  const construire = (): Omit<Trade, 'id'> => ({
    instrument: instrument.trim(),
    typeInstrument: typeInstrument || undefined,
    sens,
    dateEntree,
    prixEntree: parseDecimal(prixEntree),
    quantite: parseDecimal(quantite),
    dateSortie: clos && prixSortie.trim() ? dateSortie : undefined,
    prixSortie: clos && prixSortie.trim() ? parseDecimal(prixSortie) : undefined,
    frais: nombreOuVide(frais),
    stop: nombreOuVide(stop),
    objectif: nombreOuVide(objectif),
    strategie: strategie.trim() || undefined,
    planRespecte: plan === '' ? undefined : plan === PLAN_RESPECTE.OUI,
    etatEsprit: etatEsprit || undefined,
    notes: notes.trim() || undefined,
    etiquettes: etiquettes
      .split(SEPARATEUR_ETIQUETTES)
      .map((e) => e.trim())
      .filter(Boolean),
  });

  /** Les images et captures d'écran du téléphone sont transformées en PDF en les ajoutant. */
  const ajouterCaptures = async () => {
    if (!piecesDisponibles()) return setErreur(TEXTES.fichiers.indisponibleWeb);
    try {
      const nouvelles: PieceJointe[] = [];
      for (const choisie of await choisirFichiers(TYPES_CAPTURES_ACCEPTES, true)) {
        nouvelles.push(await rangerCapture(choisie));
      }
      setCaptures((actuelles) => [...actuelles, ...nouvelles]);
    } catch (e: any) {
      setErreur(e?.message ?? TEXTES.fichiers.erreurAjout);
    }
  };

  const retirerCapture = (piece: PieceJointe) => {
    setCaptures((actuelles) => actuelles.filter((c) => c.id !== piece.id));
    setRetirees((actuelles) => [...actuelles, piece]);
  };

  const enregistrer = async () => {
    const trade = construire();
    if (!trade.instrument) return setErreur(T.instrumentRequis);
    if (!(trade.prixEntree > 0)) return setErreur(T.prixEntreeInvalide);
    if (!(trade.quantite > 0)) return setErreur(T.quantiteInvalide);
    if (clos) {
      if (!prixSortie.trim()) return setErreur(T.prixSortieRequis);
      if (!estDateISO(dateSortie) || dateSortie < dateEntree) return setErreur(T.sortieAvantEntree);
    }
    const enregistre = await enregistrerTrade({
      ...trade,
      id,
      factureId,
      captures: captures.length > 0 ? captures : undefined,
    });
    // Le gain ou la perte d'un trade clos suit en comptabilité ; un trade rouvert en est retiré.
    const nouvelle = await synchroniserFactureTrade(enregistre);
    if (nouvelle !== enregistre.factureId) await enregistrerTrade({ ...enregistre, factureId: nouvelle });
    for (const piece of retirees) await supprimerPiece(piece);
    router.back();
  };

  const supprimer = async () => {
    const trade = id ? await getTrade(id) : undefined;
    if (trade) {
      await supprimerFactureTrade(trade);
      for (const piece of trade.captures ?? []) await supprimerPiece(piece);
      await supprimerTrade(trade.id);
    }
    setSuppressionOuverte(false);
    router.back();
  };

  // Aperçu : seulement quand l'essentiel est saisi.
  const apercu: Trade = { ...construire(), id: id ?? '' };
  const complet = apercu.prixEntree > 0 && apercu.quantite > 0;
  const resultat = complet ? resultatTrade(apercu) : undefined;
  const risque = complet ? risqueInitial(apercu) : undefined;
  const multiple = complet ? multipleR(apercu) : undefined;
  const duree = complet ? dureeJours(apercu) : undefined;

  return (
    <AccentColorProvider
      color={existant ? colors.primary : colors.ajout}
      softColor={existant ? colors.badgeBg : colors.ajoutBadgeBg}
    >
      <Screen>
        <Stack.Screen options={{ title: existant ? T.modifier : T.nouveau }} />

        <FormField
          label={T.instrument}
          required
          value={instrument}
          onChangeText={setInstrument}
          placeholder={T.exempleInstrument}
          autoCapitalize="characters"
        />
        <SelectField<string>
          label={T.typeInstrument}
          value={typeInstrument}
          placeholder={T.nonRenseigne}
          options={options(LABEL_TYPE_INSTRUMENT, T.nonRenseigne)}
          onChange={(v) => setTypeInstrument(v as TypeInstrument | '')}
        />

        <View style={commonStyles.gap6}>
          <Text style={commonStyles.lineSemiBold}>{T.sens}</Text>
          <PucesDefilantes<SensTrade> puces={PUCES_SENS} valeur={sens} onChoisir={setSens} />
        </View>

        <DateField label={T.dateEntree} required value={dateEntree} onChange={setDateEntree} />
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <FormField
              label={T.prixEntree}
              required
              value={prixEntree}
              onChangeText={setPrixEntree}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
          </View>
          <View style={commonStyles.flex1}>
            <FormField
              label={T.quantite}
              required
              value={quantite}
              onChangeText={setQuantite}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
        </View>
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <FormField
              label={T.stop}
              value={stop}
              onChangeText={setStop}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
          </View>
          <View style={commonStyles.flex1}>
            <FormField
              label={T.objectif}
              value={objectif}
              onChangeText={setObjectif}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
          </View>
        </View>
        <FormField
          label={T.frais}
          value={frais}
          onChangeText={setFrais}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />

        {clos ? (
          <>
            <DateField
              label={T.dateSortie}
              required
              value={dateSortie}
              onChange={setDateSortie}
              anneeImposee={existant ? undefined : anneeImposee}
              jourMoisAnnee
            />
            <FormField
              label={T.prixSortie}
              required
              value={prixSortie}
              onChangeText={setPrixSortie}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
            <Button variant="secondary" label={T.rouvrir} onPress={() => setClos(false)} />
          </>
        ) : (
          <Button variant="secondary" label={T.cloturer} onPress={() => setClos(true)} />
        )}

        <Card>
          <Text style={commonStyles.cardTitle}>{T.resume}</Text>
          <View style={stylesTrading.resume}>
            {resultat === undefined ? (
              <Text style={commonStyles.mutedItalic}>{T.encoreOuvert}</Text>
            ) : (
              <Text
                style={[
                  stylesTrading.resultatLigne,
                  resultat >= 0 ? stylesTrading.gain : stylesTrading.perte,
                ]}
              >
                {T.resultat(formatMontant(resultat))}
              </Text>
            )}
            {risque !== undefined ? (
              <Text style={commonStyles.muted}>{T.risque(formatMontant(risque))}</Text>
            ) : null}
            {multiple !== undefined ? (
              <Text style={commonStyles.muted}>{T.multiple(String(multiple).replace('.', ','))}</Text>
            ) : null}
            {duree !== undefined ? <Text style={commonStyles.muted}>{T.duree(duree)}</Text> : null}
          </View>
        </Card>

        <FormField
          label={T.strategie}
          value={strategie}
          onChangeText={setStrategie}
          placeholder={T.exempleStrategie}
        />
        {strategies.length > 0 ? (
          <PucesDefilantes<string>
            puces={strategies.map((s) => ({ valeur: s, label: s }))}
            valeur={strategie.trim()}
            onChoisir={setStrategie}
          />
        ) : null}

        <SelectField<string>
          label={T.planRespecte}
          value={plan}
          placeholder={T.nonRenseigne}
          options={options(LABEL_PLAN_RESPECTE, T.nonRenseigne)}
          onChange={setPlan}
        />
        <SelectField<string>
          label={T.etatEsprit}
          value={etatEsprit}
          placeholder={T.nonRenseigne}
          options={options(LABEL_ETAT_ESPRIT, T.nonRenseigne)}
          onChange={(v) => setEtatEsprit(v as EtatEsprit | '')}
        />

        <FormField
          label={T.notes}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.textareaBasse}
        />
        <FormField
          label={T.etiquettes}
          value={etiquettes}
          onChangeText={setEtiquettes}
          placeholder={T.exempleEtiquettes}
        />

        <ListeFichiers
          titre={TEXTES.fichiers.captures.titre}
          libelleAjout={TEXTES.fichiers.captures.ajouter}
          aide={TEXTES.fichiers.captures.aide}
          aucun={TEXTES.fichiers.captures.aucune}
          pieces={captures}
          onAjouter={ajouterCaptures}
          onRetirer={retirerCapture}
        />

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
        {existant ? (
          <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} />
        ) : null}

        <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
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
