import { useEffect, useState } from 'react';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { Text } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { LigneInfo } from '@/shared/components/LigneInfo';
import { SelectField } from '@/shared/components/SelectField';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { montantTaxeSejourDe, type InfosEntreprise } from '@/features/settings/settings';
import { tauxUrssafDe } from '@/features/entreprise/services/urssaf';
import { NATURE_URSSAF, REGIME_TVA_PAR_DEFAUT, TAUX_URSSAF_PAR_NATURE } from '@/shared/constants/entreprise';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import {
  LABEL_NATURE_URSSAF,
  LABEL_REGIME_FISCAL,
  LABEL_REGIME_TVA,
  LABEL_STATUT_JURIDIQUE,
} from '@/shared/textes/libelles';
import { formatMontant } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.entreprise.informations;

/** Les natures de recette de la déclaration URSSAF, dans l'ordre de la déclaration. */
const NATURES_URSSAF = Object.values(NATURE_URSSAF);

/** Les taux URSSAF saisis, en texte (virgule comme séparateur), par nature de recette. */
const tauxEnTexte = (infos?: InfosEntreprise): Record<string, string> =>
  Object.fromEntries(
    NATURES_URSSAF.flatMap((n) => {
      const taux = infos?.tauxUrssaf?.[n];
      return taux === undefined ? [] : [[n, String(taux).replace('.', ',')]];
    }),
  );

/** Les taux saisis en nombres : ceux qui restent vides gardent le taux indicatif (rien n'est enregistré pour eux). */
const tauxDesTextes = (textes: Record<string, string>): InfosEntreprise['tauxUrssaf'] => {
  const taux: NonNullable<InfosEntreprise['tauxUrssaf']> = {};
  for (const n of NATURES_URSSAF) {
    const valeur = parseDecimal(textes[n] ?? '');
    if (valeur > 0) taux[n] = valeur;
  }
  return Object.keys(taux).length > 0 ? taux : undefined;
};

const options = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/** Texte d'un montant de taxe de séjour en cours de saisie (virgule comme séparateur). */
const montantEnTexte = (montant?: number) => (montant === undefined ? '' : String(montant).replace('.', ','));

/**
 * Informations de l'entreprise (à la place des informations de l'exploitation pour un établissement qui n'est pas un
 * élevage) : identité, statut, régimes fiscal et de TVA, taxe de séjour. Tout reste modifiable à tout moment.
 */
export function InformationsEntreprise() {
  const { settings, patchSettings, loaded } = useAppSettings();
  const { actif } = useEtablissement();
  const infos = settings.exploitation?.entreprise;
  const [form, setForm] = useState<InfosEntreprise>(infos ?? {});
  const [montantTaxe, setMontantTaxe] = useState(montantEnTexte(montantTaxeSejourDe(infos)));
  /** Les taux de cotisations URSSAF en cours de saisie, par nature de recette. */
  const [tauxUrssaf, setTauxUrssaf] = useState(tauxEnTexte(infos));
  const [montantNuit, setMontantNuit] = useState(montantEnTexte(infos?.tarifNuit));
  const [montantRepas, setMontantRepas] = useState(montantEnTexte(infos?.tarifRepas));
  const [editing, setEditing] = useState(false);

  // La taxe de séjour ne concerne que les associations (gîte, hébergement) ; suivie par défaut, désactivable.
  const concerneTaxeSejour = !!actif.activites?.includes(ACTIVITE_SOCIETE.ASSOCIATION);
  const taxeSejourSuivie = (valeur?: InfosEntreprise) => valeur?.taxeSejour ?? true;

  const charger = () => {
    setForm(infos ?? {});
    setMontantTaxe(montantEnTexte(montantTaxeSejourDe(infos)));
    setTauxUrssaf(tauxEnTexte(infos));
    setMontantNuit(montantEnTexte(infos?.tarifNuit));
    setMontantRepas(montantEnTexte(infos?.tarifRepas));
  };

  useEffect(() => {
    // Chargement initial unique depuis les réglages — pas de re-render en cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  /** Enregistré tout seul (`auto`), il laisse l'écran en modification. */
  const enregistrer = async (auto = false) => {
    const entreprise: InfosEntreprise = {
      ...form,
      tauxUrssaf: tauxDesTextes(tauxUrssaf),
      regimeTva: form.tvaApplicable ? (form.regimeTva ?? REGIME_TVA_PAR_DEFAUT) : undefined,
      tarifNuit: concerneTaxeSejour ? parseDecimal(montantNuit) || undefined : undefined,
      tarifRepas: concerneTaxeSejour ? parseDecimal(montantRepas) || undefined : undefined,
      montantTaxeSejour:
        concerneTaxeSejour && taxeSejourSuivie(form) ? parseDecimal(montantTaxe) || undefined : undefined,
      taxeSejourParNuit: undefined,
    };
    await patchSettings({ exploitation: { ...settings.exploitation, entreprise } });
    if (!auto) setEditing(false);
  };

  // Tout changement s'enregistre tout seul.
  useEnregistrementAuto({
    actif: editing,
    signature: JSON.stringify([form, montantTaxe, tauxUrssaf, montantNuit, montantRepas]),
    enregistrer: () => enregistrer(true),
  });

  const maj = (patch: Partial<InfosEntreprise>) => setForm((prev) => ({ ...prev, ...patch }));
  const champ = (label: string, cle: keyof InfosEntreprise, extra?: object) => (
    <FormField
      label={label}
      value={String(form[cle] ?? '')}
      onChangeText={(v) => maj({ [cle]: v })}
      {...extra}
    />
  );

  const ouiNon = (valeur: boolean) => (valeur ? T.ouiValeur : T.nonValeur);

  return (
    <Screen>
      <Text style={styles.info}>{T.cesInformations}</Text>

      <Text style={styles.titreSection}>{T.titreIdentite}</Text>
      <Card>
        {editing ? (
          <>
            {champ(T.nomEntreprise, 'nomEntreprise')}
            {champ(T.dirigeant, 'dirigeant')}
            {champ(T.adresse, 'adresse', { multiline: true, style: styles.textareaBasse })}
            {champ(T.siret, 'siret', { keyboardType: 'number-pad' })}
            {champ(T.codeApe, 'codeApe')}
            {champ(T.numeroTva, 'numeroTva')}
          </>
        ) : (
          <>
            <LigneInfo label={T.nomEntreprise} valeur={infos?.nomEntreprise} />
            <LigneInfo label={T.dirigeant} valeur={infos?.dirigeant} />
            <LigneInfo label={T.adresse} valeur={infos?.adresse} />
            <LigneInfo label={T.siret} valeur={infos?.siret} />
            <LigneInfo label={T.codeApe} valeur={infos?.codeApe} />
            <LigneInfo label={T.numeroTva} valeur={infos?.numeroTva} />
          </>
        )}
      </Card>

      <Text style={styles.titreSection}>{T.titreStatut}</Text>
      <Text style={styles.aide}>{T.aideStatut}</Text>
      <Card>
        {editing ? (
          <>
            <SelectField<string>
              label={T.statut}
              value={form.statut ?? ''}
              placeholder={T.choisir}
              options={options(LABEL_STATUT_JURIDIQUE)}
              onChange={(v) => maj({ statut: v as InfosEntreprise['statut'] })}
            />
            <SelectField<string>
              label={T.regimeFiscal}
              value={form.regimeFiscal ?? ''}
              placeholder={T.choisir}
              options={options(LABEL_REGIME_FISCAL)}
              onChange={(v) => maj({ regimeFiscal: v as InfosEntreprise['regimeFiscal'] })}
            />
          </>
        ) : (
          <>
            <LigneInfo
              label={T.statut}
              valeur={infos?.statut ? LABEL_STATUT_JURIDIQUE[infos.statut] : undefined}
            />
            <LigneInfo
              label={T.regimeFiscal}
              valeur={infos?.regimeFiscal ? LABEL_REGIME_FISCAL[infos.regimeFiscal] : undefined}
            />
          </>
        )}
      </Card>

      <Text style={styles.titreSection}>{T.titreTauxUrssaf}</Text>
      <Text style={styles.aide}>{T.aideTauxUrssaf}</Text>
      <Card>
        {NATURES_URSSAF.map((nature) =>
          editing ? (
            <FormField
              key={nature}
              label={LABEL_NATURE_URSSAF[nature]}
              value={tauxUrssaf[nature] ?? ''}
              onChangeText={(texte) => setTauxUrssaf((prev) => ({ ...prev, [nature]: texte }))}
              keyboardType="decimal-pad"
              placeholder={String(TAUX_URSSAF_PAR_NATURE[nature]).replace('.', ',')}
            />
          ) : (
            <LigneInfo
              key={nature}
              label={LABEL_NATURE_URSSAF[nature]}
              valeur={`${String(tauxUrssafDe(nature, infos)).replace('.', ',')} %${infos?.tauxUrssaf?.[nature] === undefined ? ` (${T.tauxIndicatif})` : ''}`}
            />
          ),
        )}
      </Card>

      <Text style={styles.titreSection}>{T.titreTva}</Text>
      <Card>
        {editing ? (
          <>
            <Checkbox
              label={T.assujettiTva}
              value={!!form.tvaApplicable}
              onChange={(coche) =>
                maj({
                  tvaApplicable: coche,
                  regimeTva: coche ? (form.regimeTva ?? REGIME_TVA_PAR_DEFAUT) : undefined,
                })
              }
            />
            <Text style={styles.aide}>{T.aideTva}</Text>
            {form.tvaApplicable ? (
              <SelectField<string>
                label={T.regimeTva}
                value={form.regimeTva ?? REGIME_TVA_PAR_DEFAUT}
                options={options(LABEL_REGIME_TVA)}
                onChange={(v) => maj({ regimeTva: v as InfosEntreprise['regimeTva'] })}
              />
            ) : null}
          </>
        ) : (
          <>
            <LigneInfo label={T.assujettiTva} valeur={ouiNon(!!infos?.tvaApplicable)} />
            {infos?.tvaApplicable ? (
              <LigneInfo
                label={T.regimeTva}
                valeur={LABEL_REGIME_TVA[infos.regimeTva ?? REGIME_TVA_PAR_DEFAUT]}
              />
            ) : null}
          </>
        )}
      </Card>

      {concerneTaxeSejour ? (
        <>
          <Text style={styles.titreSection}>{T.titreTarifs}</Text>
          <Text style={styles.aide}>{T.aideTarifs}</Text>
          <Card>
            {editing ? (
              <>
                <FormField
                  label={T.tarifNuit}
                  value={montantNuit}
                  onChangeText={setMontantNuit}
                  keyboardType="decimal-pad"
                  placeholder={T.exempleMontant}
                />
                <FormField
                  label={T.tarifRepas}
                  value={montantRepas}
                  onChangeText={setMontantRepas}
                  keyboardType="decimal-pad"
                  placeholder={T.exempleMontant}
                />
                <Checkbox
                  label={T.suivreTaxeSejour}
                  value={taxeSejourSuivie(form)}
                  onChange={(coche) => maj({ taxeSejour: coche })}
                />
                <Text style={styles.aide}>{T.aideTaxeSejour}</Text>
                {taxeSejourSuivie(form) ? (
                  <FormField
                    label={T.montantTaxeSejour}
                    value={montantTaxe}
                    onChangeText={setMontantTaxe}
                    keyboardType="decimal-pad"
                    placeholder={T.exempleMontant}
                  />
                ) : null}
              </>
            ) : (
              <>
                <LigneInfo
                  label={T.tarifNuit}
                  valeur={infos?.tarifNuit !== undefined ? formatMontant(infos.tarifNuit) : undefined}
                />
                <LigneInfo
                  label={T.tarifRepas}
                  valeur={infos?.tarifRepas !== undefined ? formatMontant(infos.tarifRepas) : undefined}
                />
                <LigneInfo label={T.suivreTaxeSejour} valeur={ouiNon(taxeSejourSuivie(infos))} />
                {taxeSejourSuivie(infos) ? (
                  <LigneInfo
                    label={T.montantTaxeSejour}
                    valeur={
                      montantTaxeSejourDe(infos) !== undefined
                        ? formatMontant(montantTaxeSejourDe(infos)!)
                        : undefined
                    }
                  />
                ) : null}
              </>
            )}
          </Card>
        </>
      ) : null}

      {/* En modification, tout s'enregistre tout seul : plus de bouton Enregistrer. */}
      {editing ? null : (
        <Button
          label={TEXTES.exploitation.informationsExploitation.modifier}
          variant="secondary"
          onPress={() => setEditing(true)}
        />
      )}
    </Screen>
  );
}
