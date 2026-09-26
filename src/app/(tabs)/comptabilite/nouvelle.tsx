import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { DateField } from '@/components/DateField';
import { SelectField } from '@/components/SelectField';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InfoModal } from '@/components/InfoModal';
import { colors } from '@/theme/colors';
import { enregistrerFacture, enregistrerVente } from '@/storage/repositories';
import { listFournisseurs } from '@/storage/fournisseurs';
import { todayISO } from '@/utils/dates';
import { generateId } from '@/utils/id';
import { useAjoutTabBarBleu } from '@/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/theme/AccentColorContext';
import {
  COMPTE_PAR_DEPENSE,
  COMPTE_PAR_RECETTE,
  LABEL_CATEGORIE_DEPENSE,
  LABEL_CATEGORIE_RECETTE,
  LABEL_TYPE_ALIMENT,
  LABEL_TYPE_AIDE,
  LABEL_TYPE_CARBURANT,
  TAUX_IMPOSITION_TYPE_AIDE,
} from '@/utils/planComptable';
import type { CategorieDepense, CategorieRecette, Fournisseur, TypeAide, TypeAliment, TypeCarburant, TypeFacture, TypeFromage, UniteVente } from '@/types/models';

/** Sentinelle pour "fournisseur non enregistré" dans le sélecteur — révèle alors la saisie libre. */
const FOURNISSEUR_AUTRE = '__autre__';

interface LigneAlimentForm {
  key: string;
  type: TypeAliment;
  montant: string;
  quantiteKg: string;
  typeLibre: string;
}

export default function NouvelleFacture() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: TypeFacture }>();
  const [type, setType] = useState<TypeFacture>(params.type === 'emise' ? 'emise' : 'recue');
  const [date, setDate] = useState(todayISO());
  const [tiers, setTiers] = useState('');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<{ titre: string; message?: string } | null>(null);

  // Reçue
  const [categorieDepense, setCategorieDepense] = useState<CategorieDepense>('alimentation');
  const [lignesAlimentation, setLignesAlimentation] = useState<LigneAlimentForm[]>([
    { key: generateId(), type: 'mais', montant: '', quantiteKg: '', typeLibre: '' },
  ]);

  // Émise
  const [categorieRecette, setCategorieRecette] = useState<CategorieRecette>('lait');
  const [typeFromage, setTypeFromage] = useState<TypeFromage>('frais');
  const [typeFromageLibre, setTypeFromageLibre] = useState('');
  const [quantite, setQuantite] = useState('');
  const [unite, setUnite] = useState<UniteVente>('piece');
  const [typeAide, setTypeAide] = useState<TypeAide>('paiement_base');
  const [typeAideLibre, setTypeAideLibre] = useState('');
  const [tauxImpositionLibre, setTauxImpositionLibre] = useState(String(TAUX_IMPOSITION_TYPE_AIDE.paiement_base));
  const [litrage, setLitrage] = useState('');
  const [typeCarburant, setTypeCarburant] = useState<TypeCarburant>('gazoil');
  const [compteDepenseAutre, setCompteDepenseAutre] = useState(COMPTE_PAR_DEPENSE.autre.numero);
  const [compteRecetteAutre, setCompteRecetteAutre] = useState(COMPTE_PAR_RECETTE.autre.numero);
  const [tauxTvaVente, setTauxTvaVente] = useState('');
  const [tauxTvaAchat, setTauxTvaAchat] = useState('');
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [fournisseurId, setFournisseurId] = useState(FOURNISSEUR_AUTRE);

  useFocusEffect(
    useCallback(() => {
      listFournisseurs().then(setFournisseurs);
    }, []),
  );

  const changerFournisseur = (id: string) => {
    setFournisseurId(id);
    if (id === FOURNISSEUR_AUTRE) {
      setTiers('');
    } else {
      setTiers(fournisseurs.find((f) => f.id === id)?.nomEntreprise ?? '');
    }
  };

  const estProductionVente = type === 'emise' && ['lait', 'fromage', 'cabris'].includes(categorieRecette);
  const totalAlimentation = lignesAlimentation.reduce((s, l) => s + (Number(l.montant.replace(',', '.')) || 0), 0);

  const changerTypeAide = (v: TypeAide) => {
    setTypeAide(v);
    setTauxImpositionLibre(String(v === 'autre' ? 0 : TAUX_IMPOSITION_TYPE_AIDE[v]));
  };

  const TAUX_TVA_PAR_CATEGORIE_VENTE: Record<'lait' | 'fromage' | 'cabris', string> = {
    lait: '',
    fromage: '5.5',
    cabris: '10',
  };
  const changerCategorieRecette = (v: CategorieRecette) => {
    setCategorieRecette(v);
    if (v === 'lait' || v === 'fromage' || v === 'cabris') {
      setTauxTvaVente(TAUX_TVA_PAR_CATEGORIE_VENTE[v]);
    }
  };

  const majLigne = (key: string, patch: Partial<LigneAlimentForm>) => {
    setLignesAlimentation((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const supprimerLigne = (key: string) => {
    setLignesAlimentation((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  const enregistrer = async () => {
    setEnregistrement(true);
    try {
      if (estProductionVente) {
        const quantiteNum = Number(quantite.replace(',', '.'));
        if (!quantiteNum || quantiteNum <= 0) {
          setErreur({ titre: 'Quantité invalide' });
          return;
        }
        let prixNum: number | undefined;
        if (categorieRecette !== 'lait') {
          prixNum = Number(montant.replace(',', '.'));
          if (!prixNum || prixNum < 0) {
            setErreur({ titre: 'Prix invalide' });
            return;
          }
        }
        await enregistrerVente({
          date,
          categorie: categorieRecette as 'lait' | 'fromage' | 'cabris',
          typeFromage: categorieRecette === 'fromage' ? typeFromage : undefined,
          typeFromageLibre: categorieRecette === 'fromage' && typeFromage === 'autre' ? typeFromageLibre.trim() : undefined,
          quantite: quantiteNum,
          unite: categorieRecette === 'lait' ? 'litres' : categorieRecette === 'cabris' ? 'piece' : unite,
          prix: prixNum,
          tauxTva: tauxTvaVente ? Number(tauxTvaVente.replace(',', '.')) || undefined : undefined,
        });
        router.back();
        return;
      }

      if (!tiers.trim()) {
        setErreur({ titre: type === 'recue' ? 'Fournisseur requis' : 'Client requis' });
        return;
      }

      const estAlimentation = type === 'recue' && categorieDepense === 'alimentation';
      let montantFinal: number;
      let lignesFinales: { type: TypeAliment; montant: number; quantiteKg?: number; typeLibre?: string }[] | undefined;

      if (estAlimentation) {
        lignesFinales = lignesAlimentation
          .map((l) => ({
            type: l.type,
            montant: Number(l.montant.replace(',', '.')),
            quantiteKg: Number(l.quantiteKg.replace(',', '.')) || undefined,
            typeLibre: l.type === 'autre' ? l.typeLibre.trim() || undefined : undefined,
          }))
          .filter((l) => l.montant > 0);
        if (lignesFinales.length === 0) {
          setErreur({ titre: 'Montant invalide', message: 'Ajoutez au moins un montant pour un aliment.' });
          return;
        }
        montantFinal = totalAlimentation;
      } else {
        montantFinal = Number(montant.replace(',', '.'));
        if (!montantFinal || montantFinal <= 0) {
          setErreur({ titre: 'Montant invalide' });
          return;
        }
      }

      await enregistrerFacture({
        date,
        type,
        tiers: tiers.trim(),
        description: description.trim(),
        montant: montantFinal,
        categorieDepense: type === 'recue' ? categorieDepense : undefined,
        lignesAlimentation: lignesFinales,
        categorieRecette: type === 'emise' ? categorieRecette : undefined,
        typeAide: type === 'emise' && categorieRecette === 'aide' ? typeAide : undefined,
        typeAideLibre:
          type === 'emise' && categorieRecette === 'aide' && typeAide === 'autre'
            ? typeAideLibre.trim() || undefined
            : undefined,
        tauxImposition:
          type === 'emise' && categorieRecette === 'aide'
            ? Math.min(100, Math.max(0, Number(tauxImpositionLibre.replace(',', '.')) || 0))
            : undefined,
        litrage:
          type === 'recue' && categorieDepense === 'carburant' && litrage
            ? Number(litrage.replace(',', '.')) || undefined
            : undefined,
        typeCarburant: type === 'recue' && categorieDepense === 'carburant' ? typeCarburant : undefined,
        compteManuel:
          type === 'recue' && categorieDepense === 'autre'
            ? compteDepenseAutre
            : type === 'emise' && categorieRecette === 'autre'
              ? compteRecetteAutre
              : undefined,
        tauxTva:
          type === 'recue' && tauxTvaAchat ? Number(tauxTvaAchat.replace(',', '.')) || undefined : undefined,
      });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  const OPTIONS_COMPTE_DEPENSE = Object.values(COMPTE_PAR_DEPENSE).map((c) => ({
    value: c.numero,
    label: `${c.numero} — ${c.libelle}`,
  }));
  const OPTIONS_COMPTE_RECETTE = Object.values(COMPTE_PAR_RECETTE).map((c) => ({
    value: c.numero,
    label: `${c.numero} — ${c.libelle}`,
  }));

  const compteAffiche =
    type === 'recue'
      ? categorieDepense === 'autre'
        ? (Object.values(COMPTE_PAR_DEPENSE).find((c) => c.numero === compteDepenseAutre) ?? COMPTE_PAR_DEPENSE.autre)
        : COMPTE_PAR_DEPENSE[categorieDepense]
      : categorieRecette === 'autre'
        ? (Object.values(COMPTE_PAR_RECETTE).find((c) => c.numero === compteRecetteAutre) ?? COMPTE_PAR_RECETTE.autre)
        : COMPTE_PAR_RECETTE[categorieRecette];

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
    <Screen>
      <SelectField
        label="Type"
        required
        value={type}
        onChange={setType}
        options={[
          { value: 'recue', label: 'Débit' },
          { value: 'emise', label: 'Crédit' },
        ]}
      />
      <DateField label="Date" required value={date} onChange={setDate} />

      {type === 'recue' && (
        <SelectField
          label="Catégorie de dépense"
          required
          value={categorieDepense}
          onChange={setCategorieDepense}
          options={Object.entries(LABEL_CATEGORIE_DEPENSE).map(([value, label]) => ({ value: value as CategorieDepense, label }))}
        />
      )}
      {type === 'emise' && (
        <SelectField
          label="Catégorie de recette"
          required
          value={categorieRecette}
          onChange={changerCategorieRecette}
          options={Object.entries(LABEL_CATEGORIE_RECETTE).map(([value, label]) => ({ value: value as CategorieRecette, label }))}
        />
      )}

      {type === 'recue' && categorieDepense === 'autre' && (
        <SelectField
          label="Compte PCG"
          required
          value={compteDepenseAutre}
          onChange={setCompteDepenseAutre}
          options={OPTIONS_COMPTE_DEPENSE}
        />
      )}
      {type === 'emise' && categorieRecette === 'autre' && (
        <SelectField
          label="Compte PCG"
          required
          value={compteRecetteAutre}
          onChange={setCompteRecetteAutre}
          options={OPTIONS_COMPTE_RECETTE}
        />
      )}

      <Text style={styles.compte}>
        Compte PCG indicatif : {compteAffiche.numero} — {compteAffiche.libelle}
      </Text>

      {type === 'recue' && (
        <>
          <SelectField
            label="Fournisseur"
            required
            value={fournisseurId}
            onChange={changerFournisseur}
            options={[
              ...fournisseurs.map((f) => ({ value: f.id, label: f.nomEntreprise })),
              { value: FOURNISSEUR_AUTRE, label: 'Autre (non enregistré)' },
            ]}
          />
          <Button
            label="+ Gérer les fournisseurs"
            variant="secondary"
            onPress={() => router.push('/fournisseurs')}
          />
        </>
      )}

      {!estProductionVente && (type === 'emise' || fournisseurId === FOURNISSEUR_AUTRE) && (
        <FormField
          label={type === 'recue' ? 'Nom du fournisseur' : 'Client / organisme'}
          required
          value={tiers}
          onChangeText={setTiers}
        />
      )}

      {type === 'recue' && categorieDepense === 'alimentation' && (
        <Card style={styles.lignesCard}>
          <Text style={styles.lignesTitre}>Détail par aliment</Text>
          {lignesAlimentation.map((ligne, index) => (
            <View key={ligne.key} style={styles.ligneBloc}>
              <SelectField
                label={`Aliment ${index + 1}`}
                value={ligne.type}
                onChange={(v) => majLigne(ligne.key, { type: v })}
                options={Object.entries(LABEL_TYPE_ALIMENT).map(([value, label]) => ({ value: value as TypeAliment, label }))}
              />
              {ligne.type === 'autre' && (
                <FormField
                  label="Préciser"
                  value={ligne.typeLibre}
                  onChangeText={(v) => majLigne(ligne.key, { typeLibre: v })}
                  placeholder="ex: Frais de livraison, compléments…"
                />
              )}
              <View style={styles.ligneRow}>
                <View style={styles.ligneMontant}>
                  <FormField
                    label="Montant (€)"
                    value={ligne.montant}
                    onChangeText={(v) => majLigne(ligne.key, { montant: v })}
                    keyboardType="decimal-pad"
                    placeholder="ex: 120"
                  />
                </View>
                <View style={styles.ligneMontant}>
                  <FormField
                    label="Quantité (kg)"
                    value={ligne.quantiteKg}
                    onChangeText={(v) => majLigne(ligne.key, { quantiteKg: v })}
                    keyboardType="decimal-pad"
                    placeholder="Facultatif"
                  />
                </View>
                {lignesAlimentation.length > 1 && (
                  <Button label="✕" variant="danger" onPress={() => supprimerLigne(ligne.key)} />
                )}
              </View>
            </View>
          ))}
          <Button
            label="+ Ajouter un aliment"
            variant="secondary"
            onPress={() =>
              setLignesAlimentation((prev) => [
                ...prev,
                { key: generateId(), type: 'mais', montant: '', quantiteKg: '', typeLibre: '' },
              ])
            }
          />
          <Text style={styles.totalAlimentation}>Total facture : {totalAlimentation.toFixed(2).replace('.', ',')} €</Text>
        </Card>
      )}

      {type === 'recue' && categorieDepense !== 'alimentation' && (
        <FormField label="Montant (€)" required value={montant} onChangeText={setMontant} keyboardType="decimal-pad" />
      )}
      {type === 'recue' && categorieDepense === 'carburant' && (
        <>
          <SelectField
            label="Type de carburant"
            required
            value={typeCarburant}
            onChange={setTypeCarburant}
            options={Object.entries(LABEL_TYPE_CARBURANT).map(([value, label]) => ({ value: value as TypeCarburant, label }))}
          />
          <FormField
            label="Litrage (L)"
            value={litrage}
            onChangeText={setLitrage}
            keyboardType="decimal-pad"
            placeholder="Facultatif — utile pour les aides calculées au litre (GNR…)"
          />
        </>
      )}

      {type === 'emise' && categorieRecette === 'autre' && (
        <FormField label="Montant (€)" required value={montant} onChangeText={setMontant} keyboardType="decimal-pad" />
      )}

      {type === 'emise' && categorieRecette === 'aide' && (
        <>
          <SelectField
            label="Type d’aide"
            required
            value={typeAide}
            onChange={changerTypeAide}
            options={Object.entries(LABEL_TYPE_AIDE).map(([value, label]) => ({ value: value as TypeAide, label }))}
          />
          {typeAide === 'autre' && (
            <FormField
              label="Préciser le type d’aide"
              value={typeAideLibre}
              onChangeText={setTypeAideLibre}
              placeholder="ex: Aide GNR (guerre Ukraine), Aide gros rouleurs…"
            />
          )}
          <FormField label="Montant (€)" required value={montant} onChangeText={setMontant} keyboardType="decimal-pad" />
          <FormField
            label="Taux d’imposition (%)"
            value={tauxImpositionLibre}
            onChangeText={setTauxImpositionLibre}
            keyboardType="decimal-pad"
            placeholder="0-100"
          />
          <Text style={styles.tauxFixe}>
            Part du montant incluse dans les recettes brutes imposables. Pré-rempli à titre indicatif — à
            confirmer aide par aide avec votre comptable/CGA (certaines aides d’investissement peuvent être
            étalées sur plusieurs années, voir notice de l’écran Impôts).
          </Text>
        </>
      )}

      {type === 'emise' && categorieRecette === 'fromage' && (
        <>
          <SelectField
            label="Type de fromage"
            required
            value={typeFromage}
            onChange={setTypeFromage}
            options={[
              { value: 'frais', label: 'Frais' },
              { value: 'affine', label: 'Affiné (vieux)' },
              { value: 'crottin', label: 'Crottin' },
              { value: 'brocciu', label: 'Brocciu' },
              { value: 'autre', label: 'Autre' },
            ]}
          />
          {typeFromage === 'autre' && (
            <FormField label="Préciser le type" value={typeFromageLibre} onChangeText={setTypeFromageLibre} />
          )}
          <SelectField
            label="Unité"
            required
            value={unite}
            onChange={setUnite}
            options={[
              { value: 'piece', label: 'Pièce' },
              { value: 'kg', label: 'Kg' },
            ]}
          />
        </>
      )}

      {estProductionVente && (
        <FormField
          label={categorieRecette === 'lait' ? 'Litrage' : categorieRecette === 'cabris' ? 'Nombre de cabris' : 'Quantité'}
          required
          value={quantite}
          onChangeText={setQuantite}
          keyboardType="decimal-pad"
          placeholder={categorieRecette === 'lait' ? 'ex: 12.5' : 'ex: 2'}
        />
      )}
      {estProductionVente && categorieRecette !== 'lait' && (
        <FormField label="Prix total (€)" required value={montant} onChangeText={setMontant} keyboardType="decimal-pad" />
      )}
      {estProductionVente && (
        <FormField
          label="Taux de TVA (%)"
          value={tauxTvaVente}
          onChangeText={setTauxTvaVente}
          keyboardType="decimal-pad"
          placeholder="Facultatif — ex: 5.5 pour le fromage, 10 pour les cabris"
        />
      )}

      {type === 'recue' && (
        <FormField
          label="Taux de TVA (%)"
          value={tauxTvaAchat}
          onChangeText={setTauxTvaAchat}
          keyboardType="decimal-pad"
          placeholder="Facultatif — tel qu’indiqué sur la facture"
        />
      )}

      {!estProductionVente && (
        <FormField
          label="Note"
          value={description}
          onChangeText={setDescription}
          placeholder="Facultatif — n° de facture, précisions…"
        />
      )}

      <View style={styles.row}>
        <Button style={styles.flex1} variant="secondary" label="Annuler" onPress={() => router.back()} />
        <Button style={styles.flex1} label="Enregistrer" onPress={enregistrer} loading={enregistrement} />
      </View>
    </Screen>

    <InfoModal
      visible={!!erreur}
      title={erreur?.titre ?? ''}
      message={erreur?.message}
      onClose={() => setErreur(null)}
    />
    </AccentColorProvider>
  );
}

const styles = StyleSheet.create({
  compte: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  tauxFixe: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  lignesCard: { gap: 10 },
  lignesTitre: { fontSize: 14, fontWeight: '700', color: colors.text },
  ligneBloc: { gap: 8 },
  ligneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  ligneMontant: { flex: 1 },
  totalAlimentation: { fontSize: 14, fontWeight: '700', color: colors.ajout, marginTop: 4 },
});
