import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { ListeFichiers } from '@/features/fichiers/components/ListeFichiers';
import { choisirFichiers, piecesDisponibles, rangerFichier, supprimerPiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { laboratoiresDeLaListe } from '@/features/exploitation/services/laboratoires';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import {
  PARAMETRES,
  evaluer,
  nombreSaisi,
  produitAnalyse,
  type ParametreAnalyse,
  type Verdict,
} from '@/features/analyses/services/analysesProduits';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { AnalyseProduit, ProduitAnalyse, ResultatParametre } from '@/features/settings/settings';
import { TYPES_ANALYSES_ACCEPTES } from '@/shared/constants/fichiers';
import { ROUTES } from '@/shared/constants/routes';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { generateId } from '@/shared/utils/id';
import { fabricationsDuRegistre } from '@/features/analyses/services/registreAnalyses';
import { lireArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';
import { estDateISO, formatDateShortFR, todayISO } from '@/shared/utils/dates';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

const T = TEXTES.analysesProduits;

/** Ce qu'on saisit pour un paramètre : « absence », « presence » ou un nombre en texte ; vide : non analysé. */
type Saisie = Record<string, string>;

const COULEUR_VERDICT: Record<Verdict, string> = {
  conforme: colors.success,
  surveiller: '#C98A2B',
  non_conforme: colors.danger,
};

/** Le résultat d'un paramètre d'après ce qui est saisi. */
function resultatDe(parametre: ParametreAnalyse, texte: string | undefined): ResultatParametre | undefined {
  if (!texte) return undefined;
  if (parametre.type === 'absence') return texte === 'absence' || texte === 'presence' ? texte : undefined;
  return nombreSaisi(texte);
}

/**
 * Une analyse d'un produit fini (fromage ou charcuterie) : la date, le laboratoire, le produit et son lot, le résultat de chaque paramètre avec son
 * jugement tout de suite, et le rapport du laboratoire en pièce jointe. Une analyse déjà enregistrée s'ouvre par son identifiant (`?id=`).
 */
export default function NouvelleAnalyseProduit() {
  const router = useRouter();
  const retour = useAdresseCourante();
  const { produit: demande, id, fabrication: fabricationDemandee } = useLocalSearchParams<{
    produit?: string;
    id?: string;
    fabrication?: string;
  }>();
  const { settings, patchSettings } = useAppSettings();
  const infos = settings.exploitation;
  const existante = id ? infos?.analysesProduits?.find((a) => a.id === id) : undefined;
  const produit: ProduitAnalyse = existante?.produit ?? produitAnalyse(demande);

  const [date, setDate] = useState(todayISO());
  const [laboratoireId, setLaboratoireId] = useState('');
  const [numeroRapport, setNumeroRapport] = useState('');
  const [echantillon, setEchantillon] = useState('');
  const [lot, setLot] = useState('');
  /** La fabrication analysée (le registre en rassemble les analyses) et celles qu'on peut choisir. */
  const [fabricationId, setFabricationId] = useState('');
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [saisie, setSaisie] = useState<Saisie>({});
  const [notes, setNotes] = useState('');
  const [fichiers, setFichiers] = useState<PieceJointe[]>([]);
  /** Les fichiers retirés : leur copie n'est effacée de l'appareil qu'à l'enregistrement. */
  const [retires, setRetires] = useState<PieceJointe[]>([]);
  const [laboratoires, setLaboratoires] = useState<Fournisseur[]>([]);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [charge, setCharge] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listFournisseurs().then((f) => setLaboratoires(laboratoiresDeLaListe(f)));
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined);
    }, []),
  );

  // Les valeurs d'une analyse déjà enregistrée, une fois les réglages lus.
  useEffect(() => {
    if (existante && !charge) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(existante.date);
      setLaboratoireId(existante.laboratoireId ?? '');
      setNumeroRapport(existante.numeroRapport ?? '');
      setEchantillon(existante.echantillon ?? '');
      setLot(existante.lot ?? '');
      setFabricationId(existante.fabricationId ?? '');
      setNotes(existante.notes ?? '');
      setFichiers(existante.fichiers ?? []);
      setSaisie(Object.fromEntries(Object.entries(existante.resultats).map(([cle, v]) => [cle, String(v).replace('.', ',')])));
      setCharge(true);
    }
  }, [existante, charge]);

  const majSaisie = (cle: string, valeur: string) => setSaisie((s) => ({ ...s, [cle]: valeur }));

  const fabrications = archive ? fabricationsDuRegistre(archive, infos?.analysesProduits, produit) : [];
  /** Choisir une fabrication reprend son produit et ses numéros de lot, tant qu'on ne les a pas saisis. */
  const choisirFabrication = (cle: string) => {
    setFabricationId(cle);
    const f = fabrications.find((x) => x.id === cle);
    if (!f) return;
    setEchantillon((actuel) => actuel || f.libelle);
    setLot((actuel) => actuel || f.numeros);
  };
  // Le registre ouvre une nouvelle analyse déjà rattachée à sa fabrication.
  useEffect(() => {
    if (!existante && fabricationDemandee && fabrications.some((f) => f.id === fabricationDemandee) && !fabricationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      choisirFabrication(fabricationDemandee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archive, fabricationDemandee]);

  const ajouterFichiers = async () => {
    if (!piecesDisponibles()) return Alert.alert(TEXTES.fichiers.indisponibleWeb);
    try {
      const nouveaux: PieceJointe[] = [];
      for (const choisi of await choisirFichiers(TYPES_ANALYSES_ACCEPTES, true)) nouveaux.push(await rangerFichier(choisi));
      setFichiers((actuels) => [...actuels, ...nouveaux]);
    } catch (e: unknown) {
      Alert.alert(e instanceof Error ? e.message : TEXTES.fichiers.erreurAjout);
    }
  };
  const retirerFichier = (piece: PieceJointe) => {
    setFichiers((actuels) => actuels.filter((f) => f.id !== piece.id));
    setRetires((actuels) => [...actuels, piece]);
  };

  const enregistrer = async () => {
    if (!estDateISO(date)) return Alert.alert(TEXTES.commun.dateField.invalide);
    const resultats: Record<string, ResultatParametre> = {};
    for (const p of PARAMETRES[produit]) {
      const r = resultatDe(p, saisie[p.id]);
      if (r !== undefined) resultats[p.id] = r;
    }
    const analyse: AnalyseProduit = {
      id: existante?.id ?? generateId(),
      produit,
      date,
      laboratoireId: laboratoireId || undefined,
      numeroRapport: numeroRapport.trim() || undefined,
      echantillon: echantillon.trim() || undefined,
      lot: lot.trim() || undefined,
      fabricationId: fabricationId || undefined,
      resultats,
      fichiers: fichiers.length > 0 ? fichiers : undefined,
      notes: notes.trim() || undefined,
    };
    const autres = (infos?.analysesProduits ?? []).filter((a) => a.id !== analyse.id);
    await patchSettings({ exploitation: { ...infos, analysesProduits: [...autres, analyse] } });
    for (const piece of retires) await supprimerPiece(piece);
    retournerALaPageDAvant(router);
  };

  const supprimer = async () => {
    if (!existante) return;
    const autres = (infos?.analysesProduits ?? []).filter((a) => a.id !== existante.id);
    await patchSettings({ exploitation: { ...infos, analysesProduits: autres.length > 0 ? autres : undefined } });
    for (const piece of [...fichiers, ...retires]) await supprimerPiece(piece);
    setSuppressionOuverte(false);
    retournerALaPageDAvant(router);
  };

  return (
    <Screen>
      <DateField label={T.champs.date} required value={date} onChange={setDate} />
      <SelectFieldEditable
        label={T.champs.laboratoire}
        placeholder={T.champs.laboratoireChoisir}
        aide={T.champs.laboratoireAide}
        value={laboratoireId}
        onChange={setLaboratoireId}
        options={[{ value: '', label: T.champs.laboratoireAucun }, ...laboratoires.map((f) => ({ value: f.id, label: f.nomEntreprise }))]}
        onEdit={() => router.push(ROUTES.fournisseursDepuis(retour) as never)}
      />
      {fabrications.length > 0 ? (
        <SelectField<string>
          label={T.champs.fabrication}
          value={fabricationId}
          onChange={choisirFabrication}
          options={[
            { value: '', label: T.champs.fabricationAucune },
            ...fabrications.map((f) => ({ value: f.id, label: `${f.libelle} · ${formatDateShortFR(f.date)} · ${f.numeros}` })),
          ]}
        />
      ) : null}
      <FormField
        label={T.champs.echantillon}
        value={echantillon}
        onChangeText={setEchantillon}
        placeholder={T.produits[produit].echantillonExemple}
      />
      <FormField label={T.champs.lot} value={lot} onChangeText={setLot} placeholder={T.champs.lotExemple} />
      <FormField label={T.champs.rapport} value={numeroRapport} onChangeText={setNumeroRapport} />

      <Text style={commonStyles.lineBold}>{T.champs.resultats}</Text>
      <Text style={commonStyles.note}>{T.reperes[produit]}</Text>
      {PARAMETRES[produit].map((p) => {
        const texte = T.parametres[p.id];
        const verdict = evaluer(p, resultatDe(p, saisie[p.id]));
        const critere =
          p.type === 'absence'
            ? texte.critere
            : p.m !== undefined && p.M !== undefined
              ? T.seuils(p.m, p.M)
              : T.sansSeuil;
        return (
          <Card key={p.id}>
            <Text style={commonStyles.cardTitle}>{texte.nom}</Text>
            <Text style={commonStyles.note}>{critere}</Text>
            {p.type === 'absence' ? (
              <SelectField<string>
                label={texte.nom}
                libelleCache
                value={saisie[p.id] ?? ''}
                onChange={(v) => majSaisie(p.id, v)}
                options={[
                  { value: '', label: T.nonAnalyse },
                  { value: 'absence', label: T.absence },
                  { value: 'presence', label: T.presence },
                ]}
              />
            ) : (
              <FormField
                label={T.ufc}
                value={saisie[p.id] ?? ''}
                onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && majSaisie(p.id, v)}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            )}
            {verdict ? (
              <Text style={[commonStyles.lineBold, { color: COULEUR_VERDICT[verdict] }]}>{T.verdicts[verdict]}</Text>
            ) : null}
          </Card>
        );
      })}

      <FormField label={T.champs.notes} value={notes} onChangeText={setNotes} multiline style={commonStyles.textarea} />
      <ListeFichiers
        titre={T.champs.fichiers}
        libelleAjout={TEXTES.fichiers.ajouter}
        aide={T.aideFichiers}
        pieces={fichiers}
        onAjouter={ajouterFichiers}
        onRetirer={retirerFichier}
      />

      <View style={commonStyles.gap10}>
        <Button label={T.enregistrer} onPress={enregistrer} />
        {existante ? <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} /> : null}
      </View>
      <ConfirmModal
        visible={suppressionOuverte}
        title={T.supprimerQuestion}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={supprimer}
      />
    </Screen>
  );
}
