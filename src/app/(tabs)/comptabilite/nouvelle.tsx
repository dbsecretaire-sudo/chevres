import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { listClients } from '@/storage/clients';
import { listComptesPcg, type CompteComptableEnregistre } from '@/storage/comptesPcg';
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
  LABEL_UNITE_CONDITIONNEMENT,
  POIDS_UNITE_CONDITIONNEMENT,
  TAUX_IMPOSITION_TYPE_AIDE,
  TYPES_ALIMENT_CONDITIONNES,
} from '@/utils/planComptable';
import type { CategorieDepense, CategorieRecette, Client, Fournisseur, TypeAide, TypeAliment, TypeCarburant, TypeFacture, TypeFromage, UniteConditionnement, UniteVente } from '@/types/models';

/** Taux de TVA applicables en France (taux normal, intermédiaire, réduits, particulier et taux zéro). */
const OPTIONS_TAUX_TVA = [
  { value: '0', label: '0 %' },
  { value: '2.1', label: '2,1 %' },
  { value: '5.5', label: '5,5 %' },
  { value: '10', label: '10 %' },
  { value: '13', label: '13 %' },
  { value: '20', label: '20 %' },
];

interface LigneAlimentForm {
  key: string;
  type: TypeAliment;
  montant: string;
  quantiteKg: string;
  typeLibre: string;
  uniteConditionnement: UniteConditionnement;
  nombreUnitesConditionnement: string;
}

const ligneAlimentVide = (type: TypeAliment = 'mais'): LigneAlimentForm => ({
  key: generateId(),
  type,
  montant: '',
  quantiteKg: '',
  typeLibre: '',
  uniteConditionnement: 'matela',
  nombreUnitesConditionnement: '',
});

interface LigneCarburantForm {
  key: string;
  type: TypeCarburant;
  montant: string;
  litrage: string;
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
  const [lignesAlimentation, setLignesAlimentation] = useState<LigneAlimentForm[]>([ligneAlimentVide()]);
  const [lignesCarburant, setLignesCarburant] = useState<LigneCarburantForm[]>([
    { key: generateId(), type: 'gazoil', montant: '', litrage: '' },
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
  const [compteDepenseAutre, setCompteDepenseAutre] = useState(COMPTE_PAR_DEPENSE.autre.numero);
  const [compteRecetteAutre, setCompteRecetteAutre] = useState(COMPTE_PAR_RECETTE.autre.numero);
  const [tauxTvaVente, setTauxTvaVente] = useState('5.5');
  const [tauxTvaAchat, setTauxTvaAchat] = useState('2.1');
  const [poidsKg, setPoidsKg] = useState('');
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [fournisseurId, setFournisseurId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [comptes, setComptes] = useState<CompteComptableEnregistre[]>([]);

  useFocusEffect(
    useCallback(() => {
      listFournisseurs().then(setFournisseurs);
      listClients().then(setClients);
      listComptesPcg().then(setComptes);
    }, []),
  );

  const changerFournisseur = (id: string) => {
    setFournisseurId(id);
    setTiers(fournisseurs.find((f) => f.id === id)?.nomEntreprise ?? '');
  };

  const clientSelectionne = clients.find((c) => c.id === clientId);

  const estProductionVente = type === 'emise' && ['lait', 'fromage', 'cabris'].includes(categorieRecette);
  const totalAlimentation = lignesAlimentation.reduce((s, l) => s + (Number(l.montant.replace(',', '.')) || 0), 0);
  const totalCarburant = lignesCarburant.reduce((s, l) => s + (Number(l.montant.replace(',', '.')) || 0), 0);

  const changerTypeAide = (v: TypeAide) => {
    setTypeAide(v);
    setTauxImpositionLibre(String(v === 'autre' ? 0 : TAUX_IMPOSITION_TYPE_AIDE[v]));
  };

  const TAUX_TVA_PAR_CATEGORIE_VENTE: Record<'lait' | 'fromage' | 'cabris', string> = {
    lait: '5.5',
    fromage: '5.5',
    cabris: '10',
  };
  const changerCategorieRecette = (v: CategorieRecette) => {
    setCategorieRecette(v);
    if (v === 'lait' || v === 'fromage' || v === 'cabris') {
      setTauxTvaVente(TAUX_TVA_PAR_CATEGORIE_VENTE[v]);
    }
  };

  const changerCategorieDepense = (v: CategorieDepense) => {
    setCategorieDepense(v);
    setTauxTvaAchat(v === 'carburant' ? '13' : '2.1');
  };

  const majLigne = (key: string, patch: Partial<LigneAlimentForm>) => {
    setLignesAlimentation((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const supprimerLigne = (key: string) => {
    setLignesAlimentation((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  const majLigneCarburant = (key: string, patch: Partial<LigneCarburantForm>) => {
    setLignesCarburant((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const supprimerLigneCarburant = (key: string) => {
    setLignesCarburant((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
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
        } else if (montant.trim()) {
          prixNum = Number(montant.replace(',', '.')) || undefined;
        }
        await enregistrerVente({
          date,
          categorie: categorieRecette as 'lait' | 'fromage' | 'cabris',
          typeFromage: categorieRecette === 'fromage' ? typeFromage : undefined,
          typeFromageLibre: categorieRecette === 'fromage' && typeFromage === 'autre' ? typeFromageLibre.trim() : undefined,
          quantite: quantiteNum,
          unite: categorieRecette === 'lait' ? 'litres' : categorieRecette === 'cabris' ? 'piece' : unite,
          prix: prixNum,
          tauxTva: Number(tauxTvaVente.replace(',', '.')),
          client: clientSelectionne ? `${clientSelectionne.nom}${clientSelectionne.prenom ? ` ${clientSelectionne.prenom}` : ''}` : undefined,
          poidsKg: categorieRecette === 'cabris' && poidsKg.trim() ? Number(poidsKg.replace(',', '.')) || undefined : undefined,
        });
        router.back();
        return;
      }

      const tiersFinal =
        type === 'emise' && clientSelectionne
          ? `${clientSelectionne.nom}${clientSelectionne.prenom ? ` ${clientSelectionne.prenom}` : ''}`
          : tiers.trim();

      if (!tiersFinal) {
        setErreur({ titre: type === 'recue' ? 'Fournisseur requis' : 'Client requis' });
        return;
      }

      const estAlimentation = type === 'recue' && categorieDepense === 'alimentation';
      const estCarburant = type === 'recue' && categorieDepense === 'carburant';
      let montantFinal: number;
      let lignesFinales:
        | {
            type: TypeAliment;
            montant: number;
            quantiteKg?: number;
            typeLibre?: string;
            uniteConditionnement?: UniteConditionnement;
            nombreUnitesConditionnement?: number;
          }[]
        | undefined;
      let lignesCarburantFinales: { type: TypeCarburant; montant: number; litrage?: number }[] | undefined;

      if (estAlimentation) {
        lignesFinales = lignesAlimentation
          .map((l) => {
            const estConditionne = TYPES_ALIMENT_CONDITIONNES.includes(l.type);
            const nombreUnites = estConditionne
              ? Number(l.nombreUnitesConditionnement.replace(',', '.')) || undefined
              : undefined;
            return {
              type: l.type,
              montant: Number(l.montant.replace(',', '.')),
              quantiteKg: estConditionne
                ? nombreUnites
                  ? nombreUnites * POIDS_UNITE_CONDITIONNEMENT[l.uniteConditionnement]
                  : undefined
                : Number(l.quantiteKg.replace(',', '.')) || undefined,
              typeLibre: l.type === 'autre' ? l.typeLibre.trim() || undefined : undefined,
              uniteConditionnement: estConditionne ? l.uniteConditionnement : undefined,
              nombreUnitesConditionnement: nombreUnites,
            };
          })
          .filter((l) => l.montant > 0);
        if (lignesFinales.length === 0) {
          setErreur({ titre: 'Montant invalide', message: 'Ajoutez au moins un montant pour un aliment.' });
          return;
        }
        montantFinal = totalAlimentation;
      } else if (estCarburant) {
        lignesCarburantFinales = lignesCarburant
          .map((l) => ({
            type: l.type,
            montant: Number(l.montant.replace(',', '.')),
            litrage: Number(l.litrage.replace(',', '.')) || undefined,
          }))
          .filter((l) => l.montant > 0);
        if (lignesCarburantFinales.length === 0) {
          setErreur({ titre: 'Montant invalide', message: 'Ajoutez au moins un montant pour un carburant.' });
          return;
        }
        montantFinal = totalCarburant;
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
        tiers: tiersFinal,
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
        lignesCarburant: lignesCarburantFinales,
        compteManuel:
          type === 'recue' && categorieDepense === 'autre'
            ? compteDepenseAutre
            : type === 'emise' && categorieRecette === 'autre'
              ? compteRecetteAutre
              : undefined,
        tauxTva: type === 'recue' ? Number(tauxTvaAchat.replace(',', '.')) : undefined,
      });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  const comptesDepenseDisponibles = comptes.filter((c) => c.numero.startsWith('6'));
  const comptesRecetteDisponibles = comptes.filter((c) => c.numero.startsWith('7'));

  const OPTIONS_COMPTE_DEPENSE = comptesDepenseDisponibles.map((c) => ({
    value: c.numero,
    label: `${c.numero} — ${c.libelle}`,
    shortLabel: c.numero,
  }));
  const OPTIONS_COMPTE_RECETTE = comptesRecetteDisponibles.map((c) => ({
    value: c.numero,
    label: `${c.numero} — ${c.libelle}`,
    shortLabel: c.numero,
  }));

  const compteAffiche =
    type === 'recue'
      ? categorieDepense === 'autre'
        ? (comptesDepenseDisponibles.find((c) => c.numero === compteDepenseAutre) ?? COMPTE_PAR_DEPENSE.autre)
        : COMPTE_PAR_DEPENSE[categorieDepense]
      : categorieRecette === 'autre'
        ? (comptesRecetteDisponibles.find((c) => c.numero === compteRecetteAutre) ?? COMPTE_PAR_RECETTE.autre)
        : COMPTE_PAR_RECETTE[categorieRecette];

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
    <Screen>
      <View style={styles.row}>
        <View style={styles.flex1}>
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
        </View>
        <View style={styles.flex1}>
          <DateField label="Date" required value={date} onChange={setDate} />
        </View>
      </View>
      {type === 'recue' ? (
        <>
          <FormField
            label="N° de facture"
            value={description}
            onChangeText={setDescription}
            placeholder="Précisions"
          />
          {categorieDepense === 'autre' ? (
            <View style={styles.rowFin}>
              <View style={styles.flex1}>
                <SelectField
                  label="Catégorie de dépense"
                  required
                  value={categorieDepense}
                  onChange={changerCategorieDepense}
                  options={Object.entries(LABEL_CATEGORIE_DEPENSE).map(([value, label]) => ({ value: value as CategorieDepense, label }))}
                />
              </View>
              <View style={styles.flex1}>
                <SelectField
                  label="Compte PCG"
                  required
                  searchable
                  value={compteDepenseAutre}
                  onChange={setCompteDepenseAutre}
                  options={OPTIONS_COMPTE_DEPENSE}
                />
              </View>
              <Pressable style={styles.boutonIcone} onPress={() => router.push('/comptabilite/comptes-pcg')}>
                <Ionicons name="pencil" size={20} color={colors.ajout} />
              </Pressable>
            </View>
          ) : (
            <SelectField
              label="Catégorie de dépense"
              required
              value={categorieDepense}
              onChange={changerCategorieDepense}
              options={Object.entries(LABEL_CATEGORIE_DEPENSE).map(([value, label]) => ({ value: value as CategorieDepense, label }))}
            />
          )}
        </>
      ) : (
        <>
          {!estProductionVente && (
            <FormField
              label="N° de facture"
              value={description}
              onChangeText={setDescription}
              placeholder="Précisions"
            />
          )}
          {categorieRecette === 'autre' ? (
            <View style={styles.rowFin}>
              <View style={styles.flex1}>
                <SelectField
                  label="Catégorie de recette"
                  required
                  value={categorieRecette}
                  onChange={changerCategorieRecette}
                  options={Object.entries(LABEL_CATEGORIE_RECETTE).map(([value, label]) => ({ value: value as CategorieRecette, label }))}
                />
              </View>
              <View style={styles.flex1}>
                <SelectField
                  label="Compte PCG"
                  required
                  searchable
                  value={compteRecetteAutre}
                  onChange={setCompteRecetteAutre}
                  options={OPTIONS_COMPTE_RECETTE}
                />
              </View>
              <Pressable style={styles.boutonIcone} onPress={() => router.push('/comptabilite/comptes-pcg')}>
                <Ionicons name="pencil" size={20} color={colors.ajout} />
              </Pressable>
            </View>
          ) : (
            <SelectField
              label="Catégorie de recette"
              required
              value={categorieRecette}
              onChange={changerCategorieRecette}
              options={Object.entries(LABEL_CATEGORIE_RECETTE).map(([value, label]) => ({ value: value as CategorieRecette, label }))}
            />
          )}
        </>
      )}

      <Text style={styles.compte}>
        Compte PCG indicatif : {compteAffiche.numero} — {compteAffiche.libelle}
      </Text>

      {type === 'recue' && (
        <View style={styles.rowFin}>
          <View style={styles.flex1}>
            <SelectField
              label="Fournisseur"
              required
              searchable
              placeholder="Choix du fournisseur"
              value={fournisseurId}
              onChange={changerFournisseur}
              options={fournisseurs.map((f) => ({ value: f.id, label: f.nomEntreprise }))}
            />
          </View>
          <Pressable style={styles.boutonIcone} onPress={() => router.push('/comptabilite/fournisseurs')}>
            <Ionicons name="pencil" size={20} color={colors.ajout} />
          </Pressable>
        </View>
      )}

      {!estProductionVente && type === 'emise' && (
        <>
          <View style={styles.rowFin}>
            <View style={styles.flex1}>
              <SelectField
                label="Client / organisme"
                required
                searchable
                placeholder="Choix du client"
                value={clientId}
                onChange={setClientId}
                options={clients.map((c) => ({ value: c.id, label: `${c.nom}${c.prenom ? ` ${c.prenom}` : ''}` }))}
              />
            </View>
            <Pressable style={styles.boutonIcone} onPress={() => router.push('/comptabilite/clients')}>
              <Ionicons name="pencil" size={20} color={colors.ajout} />
            </Pressable>
          </View>
        </>
      )}

      {type === 'recue' && (
        <SelectField
          label="Taux de TVA"
          value={tauxTvaAchat}
          onChange={setTauxTvaAchat}
          options={OPTIONS_TAUX_TVA}
        />
      )}

      {type === 'recue' && categorieDepense === 'alimentation' && (
        <Card style={styles.lignesCard}>
          <View style={styles.lignesEnTete}>
            <Text style={styles.lignesTitre}>Détail par aliment</Text>
            <Pressable
              style={styles.boutonAjoutAliment}
              onPress={() => setLignesAlimentation((prev) => [...prev, ligneAlimentVide()])}
            >
              <Ionicons name="add-circle" size={28} color={colors.ajout} />
            </Pressable>
          </View>
          {lignesAlimentation.map((ligne, index) => (
            <View key={ligne.key} style={styles.ligneBloc}>
              <View style={styles.ligneRow}>
                <View style={styles.ligneMontant}>
                  <SelectField
                    label={`Aliment ${index + 1}`}
                    value={ligne.type}
                    onChange={(v) => majLigne(ligne.key, { type: v })}
                    options={Object.entries(LABEL_TYPE_ALIMENT).map(([value, label]) => ({ value: value as TypeAliment, label }))}
                  />
                </View>
                {!TYPES_ALIMENT_CONDITIONNES.includes(ligne.type) && (
                  <View style={styles.ligneMontant}>
                    <FormField
                      label="Quantité (kg)"
                      value={ligne.quantiteKg}
                      onChangeText={(v) => majLigne(ligne.key, { quantiteKg: v })}
                      keyboardType="decimal-pad"
                      placeholder="ex: 100"
                    />
                  </View>
                )}
                <View style={styles.ligneMontant}>
                  <FormField
                    label="Montant TTC"
                    value={ligne.montant}
                    onChangeText={(v) => majLigne(ligne.key, { montant: v })}
                    keyboardType="decimal-pad"
                    placeholder="ex: 120"
                  />
                </View>
                {lignesAlimentation.length > 1 && (
                  <Pressable style={styles.boutonAjoutAliment} onPress={() => supprimerLigne(ligne.key)}>
                    <Ionicons name="close-circle" size={28} color={colors.danger} />
                  </Pressable>
                )}
              </View>
              {TYPES_ALIMENT_CONDITIONNES.includes(ligne.type) && (
                <>
                  <View style={styles.ligneRow}>
                    <View style={styles.ligneMontant}>
                      <FormField
                        label="Nombre"
                        value={ligne.nombreUnitesConditionnement}
                        onChangeText={(v) => majLigne(ligne.key, { nombreUnitesConditionnement: v })}
                        keyboardType="decimal-pad"
                        placeholder="ex: 3"
                      />
                    </View>
                    <View style={styles.ligneMontant}>
                      <SelectField
                        label="Unité"
                        value={ligne.uniteConditionnement}
                        onChange={(v) => majLigne(ligne.key, { uniteConditionnement: v })}
                        options={Object.entries(LABEL_UNITE_CONDITIONNEMENT).map(([value, label]) => ({
                          value: value as UniteConditionnement,
                          label,
                        }))}
                      />
                    </View>
                  </View>
                  {ligne.nombreUnitesConditionnement ? (
                    <Text style={styles.conditionnementApprox}>
                      ≈{' '}
                      {Math.round(
                        (Number(ligne.nombreUnitesConditionnement.replace(',', '.')) || 0) *
                          POIDS_UNITE_CONDITIONNEMENT[ligne.uniteConditionnement],
                      )}{' '}
                      kg
                    </Text>
                  ) : null}
                </>
              )}
              {ligne.type === 'autre' && (
                <FormField
                  value={ligne.typeLibre}
                  onChangeText={(v) => majLigne(ligne.key, { typeLibre: v })}
                  placeholder="Préciser — ex: Frais de livraison, compléments…"
                />
              )}
            </View>
          ))}
        </Card>
      )}
      {type === 'recue' && categorieDepense === 'alimentation' && (
        <Card style={styles.lignesCard}>
          <Text style={styles.totalAlimentation}>Total facture TTC : {totalAlimentation.toFixed(2).replace('.', ',')} €</Text>
        </Card>
      )}

      {type === 'recue' && categorieDepense === 'carburant' && (
        <Card style={styles.lignesCard}>
          <View style={styles.lignesEnTete}>
            <Text style={styles.lignesTitre}>Détail par carburant</Text>
            <Pressable
              style={styles.boutonAjoutAliment}
              onPress={() =>
                setLignesCarburant((prev) => [
                  ...prev,
                  { key: generateId(), type: 'gazoil', montant: '', litrage: '' },
                ])
              }
            >
              <Ionicons name="add-circle" size={28} color={colors.ajout} />
            </Pressable>
          </View>
          {lignesCarburant.map((ligne, index) => (
            <View key={ligne.key} style={styles.ligneRow}>
              <View style={styles.ligneMontant}>
                <SelectField
                  label={`Type ${index + 1}`}
                  value={ligne.type}
                  onChange={(v) => majLigneCarburant(ligne.key, { type: v })}
                  options={Object.entries(LABEL_TYPE_CARBURANT).map(([value, label]) => ({ value: value as TypeCarburant, label }))}
                />
              </View>
              <View style={styles.ligneMontant}>
                <FormField
                  label="Litrage (L)"
                  value={ligne.litrage}
                  onChangeText={(v) => majLigneCarburant(ligne.key, { litrage: v })}
                  keyboardType="decimal-pad"
                  placeholder="ex:40"
                />
              </View>
              <View style={styles.ligneMontant}>
                <FormField
                  label="Montant TTC"
                  value={ligne.montant}
                  onChangeText={(v) => majLigneCarburant(ligne.key, { montant: v })}
                  keyboardType="decimal-pad"
                  placeholder="ex: 60"
                />
              </View>
              {lignesCarburant.length > 1 && (
                <Pressable style={styles.boutonAjoutAliment} onPress={() => supprimerLigneCarburant(ligne.key)}>
                  <Ionicons name="close-circle" size={28} color={colors.danger} />
                </Pressable>
              )}
            </View>
          ))}
        </Card>
      )}
      {type === 'recue' && categorieDepense === 'carburant' && (
        <Card style={styles.lignesCard}>
          <Text style={styles.totalAlimentation}>Total facture TTC : {totalCarburant.toFixed(2).replace('.', ',')} €</Text>
        </Card>
      )}

      {type === 'recue' && categorieDepense !== 'alimentation' && categorieDepense !== 'carburant' && (
        <FormField label="Montant TTC (€)" required value={montant} onChangeText={setMontant} keyboardType="decimal-pad" />
      )}

      {type === 'emise' && categorieRecette === 'autre' && (
        <FormField label="Montant TTC (€)" required value={montant} onChangeText={setMontant} keyboardType="decimal-pad" />
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
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormField label="Montant TTC (€)" required value={montant} onChangeText={setMontant} keyboardType="decimal-pad" />
            </View>
            <View style={styles.flex1}>
              <FormField
                label="Taux d’imposition (%)"
                value={tauxImpositionLibre}
                onChangeText={setTauxImpositionLibre}
                keyboardType="decimal-pad"
                placeholder="0-100"
              />
            </View>
          </View>
          <Text style={styles.tauxFixe}>
            Part du montant incluse dans les recettes brutes imposables. Pré-rempli à titre indicatif — à
            confirmer aide par aide avec votre comptable/CGA (certaines aides d’investissement peuvent être
            étalées sur plusieurs années, voir notice de l’écran Impôts).
          </Text>
        </>
      )}

      {estProductionVente && (
        <View style={styles.rowFin}>
          <View style={styles.flex1}>
            <SelectField
              label="Client"
              searchable
              placeholder="Choix du client"
              value={clientId}
              onChange={setClientId}
              options={clients.map((c) => ({ value: c.id, label: `${c.nom}${c.prenom ? ` ${c.prenom}` : ''}` }))}
            />
          </View>
          <Pressable style={styles.boutonIcone} onPress={() => router.push('/comptabilite/clients')}>
            <Ionicons name="pencil" size={20} color={colors.ajout} />
          </Pressable>
        </View>
      )}

      {type === 'emise' && categorieRecette === 'lait' && (
        <>
          <FormField
            label="Litrage"
            required
            value={quantite}
            onChangeText={setQuantite}
            keyboardType="decimal-pad"
            placeholder="ex: 12.5"
          />
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormField
                label="Prix total TTC (€)"
                value={montant}
                onChangeText={setMontant}
                keyboardType="decimal-pad"
                placeholder="Facultatif"
              />
            </View>
            <View style={styles.flex1}>
              <SelectField label="Taux de TVA" value={tauxTvaVente} onChange={setTauxTvaVente} options={OPTIONS_TAUX_TVA} />
            </View>
          </View>
        </>
      )}

      {type === 'emise' && categorieRecette === 'fromage' && (
        <>
          <View style={styles.row}>
            <View style={styles.flex1}>
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
            </View>
            <View style={styles.flex1}>
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
            </View>
          </View>
          {typeFromage === 'autre' && (
            <FormField label="Préciser le type" value={typeFromageLibre} onChangeText={setTypeFromageLibre} />
          )}
          <View style={styles.row3}>
            <View style={styles.flex1}>
              <FormField
                label="Quantité"
                required
                value={quantite}
                onChangeText={setQuantite}
                keyboardType="decimal-pad"
                placeholder="ex: 2"
              />
            </View>
            <View style={styles.flex1}>
              <FormField label="Prix total TTC (€)" required value={montant} onChangeText={setMontant} keyboardType="decimal-pad" />
            </View>
            <View style={styles.flex1}>
              <SelectField label="Taux de TVA" value={tauxTvaVente} onChange={setTauxTvaVente} options={OPTIONS_TAUX_TVA} />
            </View>
          </View>
        </>
      )}

      {type === 'emise' && categorieRecette === 'cabris' && (
        <>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormField
                label="Nombre de cabris"
                required
                value={quantite}
                onChangeText={setQuantite}
                keyboardType="decimal-pad"
                placeholder="ex: 2"
              />
            </View>
            <View style={styles.flex1}>
              <FormField label="Poids (kg)" value={poidsKg} onChangeText={setPoidsKg} keyboardType="decimal-pad" placeholder="Facultatif" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormField label="Prix total TTC (€)" required value={montant} onChangeText={setMontant} keyboardType="decimal-pad" />
            </View>
            <View style={styles.flex1}>
              <SelectField label="Taux de TVA" value={tauxTvaVente} onChange={setTauxTvaVente} options={OPTIONS_TAUX_TVA} />
            </View>
          </View>
        </>
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
  row3: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  rowFin: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  boutonIcone: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ajoutBadgeBg,
  },
  lignesCard: { gap: 10 },
  lignesEnTete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lignesTitre: { fontSize: 14, fontWeight: '700', color: colors.text },
  boutonAjoutAliment: { padding: 2 },
  ligneBloc: { gap: 8 },
  ligneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  ligneMontant: { flex: 1 },
  totalAlimentation: { fontSize: 14, fontWeight: '700', color: colors.ajout, marginTop: 4 },
  conditionnementApprox: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
});
