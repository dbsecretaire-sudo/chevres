import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ListeFichiers } from '@/features/fichiers/components/ListeFichiers';
import { choisirFichiers, piecesDisponibles, rangerFichier, supprimerPiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { lireArchiveStock } from '@/features/stock/repository';
import { dossierEnRegle, etapesManquantes } from '@/features/stock/services/dossiersSavons';
import { articlesDuProduit, enregistrerEtapeSavon, enregistrerInciSavon } from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, EtapeReglementaire } from '@/features/stock/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { BlocLignes } from '@/shared/components/BlocListe';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { EmptyState } from '@/shared/components/EmptyState';
import { FormField } from '@/shared/components/FormField';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { ROUTES } from '@/shared/constants/routes';
import { ETAPE_SAVON, ETAPES_SAVON_OBLIGATOIRES, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.production.savons.dossier;

/** Les étapes dans l'ordre où on les fait : les obligatoires d'abord, puis celles à vérifier. */
const ETAPES: string[] = [...ETAPES_SAVON_OBLIGATOIRES, ETAPE_SAVON.ANALYSES, ETAPE_SAVON.DECLARATION_ETABLISSEMENT];

/**
 * Le dossier réglementaire des savons (produits cosmétiques, règlement CE n° 1223/2009). Sans savon choisi : la liste des savons, chacun avec ce qui lui manque ; avec un
 * savon (paramètre `article`) : sa liste INCI et chaque étape (DIP, rapport de sécurité, notification CPNP, bonnes pratiques, étiquetage, analyses, déclaration
 * d'établissement) avec sa date, sa référence et ses pièces. Tant qu'une étape obligatoire manque, les lots du savon ne sont pas proposés à la vente.
 */
export default function DossierSavon() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const { article } = useLocalSearchParams<{ article?: string }>();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);

  const charger = useCallback(
    () =>
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  if (!archive) return <Screen>{null}</Screen>;

  if (!article) {
    const savons = articlesDuProduit(PRODUIT_A_LOTS.SAVON, archive, espece);
    return (
      <Screen>
        <Text style={commonStyles.note}>{T.intro}</Text>
        {savons.length === 0 ? (
          <EmptyState title={TEXTES.production.savons.aucun} />
        ) : (
          <BlocLignes>
            {savons.map((s) => {
              const manque = etapesManquantes(archive.dossiersSavons?.[s.cle]);
              return (
                <ListRow
                  key={s.cle}
                  title={s.libelle}
                  subtitle={
                    manque.length === 0
                      ? T.enRegle
                      : T.incomplet(manque.map((e) => T.etapes[e as keyof typeof T.etapes].titre).join(', '))
                  }
                  onPress={() => router.push(ROUTES.productionSavonDossier(s.cle) as never)}
                />
              );
            })}
          </BlocLignes>
        )}
      </Screen>
    );
  }

  const dossier = archive.dossiersSavons?.[article];
  const manque = etapesManquantes(dossier);
  const etape = (e: string): EtapeReglementaire => dossier?.etapes?.[e] ?? {};
  const maj = async (e: string, modification: Partial<EtapeReglementaire>) => {
    await enregistrerEtapeSavon(article, e, modification);
    await charger();
  };
  const ajouterFichiers = async (e: string) => {
    if (!piecesDisponibles()) return Alert.alert(TEXTES.fichiers.indisponibleWeb);
    try {
      const nouveaux: PieceJointe[] = [];
      for (const choisi of await choisirFichiers(TYPES_FICHIERS_ACCEPTES, true)) nouveaux.push(await rangerFichier(choisi));
      await maj(e, { fichiers: [...(etape(e).fichiers ?? []), ...nouveaux] });
    } catch (erreur: unknown) {
      Alert.alert(erreur instanceof Error ? erreur.message : TEXTES.fichiers.erreurAjout);
    }
  };
  const retirerFichier = async (e: string, piece: PieceJointe) => {
    await supprimerPiece(piece);
    await maj(e, { fichiers: (etape(e).fichiers ?? []).filter((f) => f.id !== piece.id) });
  };

  return (
    <Screen>
      <Text style={commonStyles.lineBold}>{libelleArticle(article, archive)}</Text>
      <Text style={commonStyles.note}>{T.intro}</Text>
      <Text style={commonStyles.note}>
        {dossierEnRegle(archive, article)
          ? T.enRegle
          : T.incomplet(manque.map((e) => T.etapes[e as keyof typeof T.etapes].titre).join(', '))}
      </Text>
      <SectionForm titre={T.inci} aide={T.inciAide}>
        <FormField
          label={T.inci}
          // Saisie libre : elle s'enregistre en quittant le champ (une lettre n'écrit pas le stock).
          defaultValue={dossier?.inci ?? ''}
          onEndEditing={(ev) => {
            enregistrerInciSavon(article, ev.nativeEvent.text).then(charger);
          }}
          multiline
        />
      </SectionForm>
      {ETAPES.map((e) => {
        const textes = T.etapes[e as keyof typeof T.etapes];
        const obligatoire = ETAPES_SAVON_OBLIGATOIRES.includes(e);
        const donnees = etape(e);
        return (
          <SectionForm
            key={e}
            titre={`${textes.titre} · ${obligatoire ? T.obligatoire : T.facultatif}`}
            aide={textes.aide}
          >
            <Checkbox
              label={T.fait}
              value={!!donnees.fait}
              onChange={(fait) => maj(e, { fait: fait || undefined, date: fait && !donnees.date ? todayISO() : donnees.date })}
            />
            <DateField label={T.date} value={donnees.date ?? ''} onChange={(date) => maj(e, { date })} />
            <FormField
              label={textes.reference}
              defaultValue={donnees.reference ?? ''}
              onEndEditing={(ev) => {
                maj(e, { reference: ev.nativeEvent.text.trim() || undefined });
              }}
            />
            <View>
              <ListeFichiers
                titre={T.fichiers}
                libelleAjout={T.ajouterFichier}
                pieces={donnees.fichiers ?? []}
                onAjouter={() => ajouterFichiers(e)}
                onRetirer={(piece) => retirerFichier(e, piece)}
              />
            </View>
          </SectionForm>
        );
      })}
    </Screen>
  );
}
