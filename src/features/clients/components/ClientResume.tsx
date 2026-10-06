import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { ListRow } from '@/shared/components/ListRow';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import {
  libelleUnite,
  type EcritureClient,
  type ResumeClient,
} from '@/features/clients/services/resumeClient';
import { SOURCE_TRANSACTION } from '@/shared/constants/comptabilite';
import { styles } from '@/shared/styles/clients/FicheClient.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.clients.ficheClient;

function LigneTotal({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View style={commonStyles.rowSpaceBetween}>
      <Text style={commonStyles.line}>{libelle}</Text>
      <Text style={commonStyles.lineBold}>{valeur}</Text>
    </View>
  );
}

/** Carte « Résumé » : ce que ce client a acheté ou reçu, par catégorie, et le total payé. */
export function ClientResume({ resume }: { resume: ResumeClient }) {
  const [detailFromageOuvert, setDetailFromageOuvert] = useState(false);

  return (
    <Card style={commonStyles.gap8}>
      <Text style={commonStyles.cardTitle}>{T.resume}</Text>

      {resume.aLait && <LigneTotal libelle={T.laitVendu} valeur={`${resume.totalLitresLait} L`} />}

      {resume.aFromage && (
        <View style={styles.resumeBlocFromage}>
          <LigneTotal
            libelle={T.fromageVendu}
            valeur={`${resume.totalFromage}${resume.uniteFromageUniforme ? ` ${libelleUnite(resume.uniteFromage)}` : ''}`}
          />
          <Pressable onPress={() => setDetailFromageOuvert((v) => !v)}>
            <Text style={styles.lienDetails}>
              {detailFromageOuvert ? T.masquerLesDetails : T.voirLesDetails}
            </Text>
          </Pressable>
          {detailFromageOuvert && (
            <View style={styles.resumeDetailBloc}>
              {resume.detailFromage.map((d) => (
                <View key={d.type} style={commonStyles.rowSpaceBetween}>
                  <Text style={commonStyles.muted}>{d.libelle}</Text>
                  <Text style={commonStyles.mutedBold}>
                    {d.quantite} {libelleUnite(d.unite)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {resume.aCabris && (
        <LigneTotal
          libelle={T.cabrisVendus}
          valeur={`${resume.nombreCabris}${resume.kgCabris > 0 ? T.kgcabrisKg(resume.kgCabris) : ''}`}
        />
      )}
      {resume.aAutresVentes && (
        <LigneTotal libelle={T.autresVentes} valeur={formatMontant(resume.montantAutresVentes)} />
      )}
      {resume.aAide && <LigneTotal libelle={T.aidesSubventions} valeur={formatMontant(resume.montantAide)} />}
      {resume.aAutre && (
        <LigneTotal libelle={TEXTES.commun.general.autre} valeur={formatMontant(resume.montantAutre)} />
      )}

      <View style={styles.resumeSeparateur} />
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={styles.resumeTotalLabel}>{T.totalPayeParCeClient}</Text>
        <Text style={styles.resumeTotalValeur}>{formatMontant(resume.totalPaye)}</Text>
      </View>
    </Card>
  );
}

interface EcrituresProps {
  ecritures: EcritureClient[];
  onOuvrir: (ecriture: EcritureClient) => void;
}

/** Liste des écritures (ventes et factures) liées au client. */
export function ClientEcritures({ ecritures, onOuvrir }: EcrituresProps) {
  return (
    <View style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>
        {TEXTES.commun.general.ecrituresLiees}
        {ecritures.length > 0 ? ` (${ecritures.length})` : ''}
      </Text>
      {ecritures.length === 0 ? (
        <Text style={commonStyles.mutedItalic}>{T.aucuneEcritureLieeACe}</Text>
      ) : (
        ecritures.map((e) => (
          <ListRow
            key={e.id}
            title={e.titre}
            subtitle={formatDateFR(e.date)}
            trailing={
              <Text style={styles.montantEcriture}>
                {e.montant < 0 ? '−' : '+'}
                {formatMontant(Math.abs(e.montant))}
              </Text>
            }
            onPress={() => onOuvrir(e)}
          />
        ))
      )}
    </View>
  );
}

export const estVente = (e: EcritureClient) => e.source === SOURCE_TRANSACTION.VENTE;
