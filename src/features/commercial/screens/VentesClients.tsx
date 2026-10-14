import { useMemo, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ColonnesVerticales } from '@/shared/components/ColonnesVerticales';
import { EmptyState } from '@/shared/components/EmptyState';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { ListRow } from '@/shared/components/ListRow';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import { TuilesChiffres } from '@/features/commercial/components/TuilesChiffres';
import { useDonneesCommerciales } from '@/features/commercial/hooks/useDonneesCommerciales';
import { clientsARelancer, statistiquesVentes } from '@/features/commercial/services/statistiques';
import { JOURS_CLIENT_A_RELANCER, VUE_VENTES, type VueVentes } from '@/shared/constants/commercial';
import { LOCALE } from '@/shared/constants/format';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/commercial/Commercial.styles';
import { NOMS_MOIS_COURTS } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant, todayISO } from '@/shared/utils/dates';
import { nomComplet } from '@/shared/utils/personne';

const T = TEXTES.commercial.ventes;

const nombre = (valeur: number): string => valeur.toLocaleString(LOCALE, { maximumFractionDigits: 2 });

/**
 * Les ventes en chiffres : le chiffre d'affaires, le panier moyen, puis par produit, par client et par mois, ce qui reste à
 * encaisser et les clients à relancer. L'année se choisit comme ailleurs (ou toutes les années ensemble).
 */
export default function VentesClients() {
  const router = useRouter();
  const donnees = useDonneesCommerciales();
  const [vue, setVue] = useState<VueVentes | 'encaisser' | 'relancer'>(VUE_VENTES.PRODUITS);
  const [moisChoisi, setMoisChoisi] = useState<string | null>(null);
  const aujourdhui = todayISO();

  const stats = useMemo(
    () => statistiquesVentes(donnees.ventes, aujourdhui, T.client.sansNom),
    [donnees.ventes, aujourdhui],
  );
  const aRelancer = useMemo(
    () => clientsARelancer(donnees.clients, donnees.toutesVentes, aujourdhui, JOURS_CLIENT_A_RELANCER),
    [donnees.clients, donnees.toutesVentes, aujourdhui],
  );

  const ouvrirClient = (nomAffiche: string) => {
    const fiche = donnees.clients.find((c) => nomComplet(c) === nomAffiche);
    if (fiche) router.push(ROUTES.ficheClient(fiche.id) as never);
  };

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker
          annees={donnees.annees}
          value={donnees.annee}
          onChange={donnees.setAnneeActive}
          tout={donnees.regrouper}
          onChoisirTout={donnees.choisirToutesAnnees}
        />
      </LigneFiltres>
      <TuilesChiffres
        tuiles={[
          { cle: 'total', libelle: T.cartes.total, valeur: formatMontant(stats.total) },
          { cle: 'nombre', libelle: T.cartes.nombre, valeur: String(stats.nombre) },
          { cle: 'panier', libelle: T.cartes.panier, valeur: formatMontant(stats.panierMoyen) },
          ...(stats.totalImpaye > 0
            ? [
                {
                  cle: 'impaye',
                  libelle: T.cartes.aEncaisser,
                  valeur: formatMontant(stats.totalImpaye),
                  alerte: true,
                },
              ]
            : []),
        ]}
      />
      <PucesDefilantes
        puces={[
          { valeur: VUE_VENTES.PRODUITS, label: T.vues.produits },
          { valeur: VUE_VENTES.CLIENTS, label: T.vues.clients },
          { valeur: VUE_VENTES.MOIS, label: T.vues.mois },
          { valeur: 'encaisser', label: T.vues.aEncaisser },
          { valeur: 'relancer', label: T.vues.aRelancer },
        ]}
        valeur={vue}
        onChoisir={setVue}
      />

      {vue === VUE_VENTES.PRODUITS ? (
        stats.produits.length === 0 ? (
          <EmptyState title={T.aucune} />
        ) : (
          <BlocLignes>
            {stats.produits.map((p) => (
              <ListRow
                key={p.cle}
                title={p.libelle}
                subtitle={`${T.produit.detail(
                  nombre(p.quantite),
                  p.unite,
                  p.prixMoyen !== undefined ? formatMontant(p.prixMoyen) : undefined,
                )} · ${T.produit.nombreDeVentes(p.nombre)}`}
                trailing={<Text style={commonStyles.lineBold}>{formatMontant(p.montant)}</Text>}
              />
            ))}
          </BlocLignes>
        )
      ) : null}

      {vue === VUE_VENTES.CLIENTS ? (
        stats.clients.length === 0 ? (
          <EmptyState title={T.aucune} />
        ) : (
          <BlocLignes>
            {stats.clients.map((c) => (
              <ListRow
                key={c.client}
                title={c.client}
                subtitle={T.client.detail(c.nombre, formatDateFR(c.derniere))}
                trailing={<Text style={commonStyles.lineBold}>{formatMontant(c.montant)}</Text>}
                onPress={() => ouvrirClient(c.client)}
              />
            ))}
          </BlocLignes>
        )
      ) : null}

      {vue === VUE_VENTES.MOIS ? (
        stats.total === 0 ? (
          <EmptyState title={T.aucune} />
        ) : (
          <>
            <ColonnesVerticales
              colonnes={stats.parMois.map((valeur, i) => ({
                cle: String(i),
                libelle: NOMS_MOIS_COURTS[i],
                valeur,
                texteValeur: '',
                pleine: valeur === Math.max(...stats.parMois),
              }))}
              choisie={moisChoisi}
              onChoisir={setMoisChoisi}
              titreAxe={T.graphique.axe}
              formaterGraduation={T.graphique.graduation}
            />
            {moisChoisi !== null ? (
              <Text style={commonStyles.lineBold}>
                {T.graphique.mois(
                  NOMS_MOIS_COURTS[Number(moisChoisi)],
                  formatMontant(stats.parMois[Number(moisChoisi)]),
                )}
              </Text>
            ) : null}
          </>
        )
      ) : null}

      {vue === 'encaisser' ? (
        stats.impayes.length === 0 ? (
          <EmptyState title={T.aEncaisser.aucune} />
        ) : (
          <View style={commonStyles.gap6}>
            <Text style={commonStyles.lineBold}>{T.aEncaisser.total(formatMontant(stats.totalImpaye))}</Text>
            <BlocLignes>
              {stats.impayes.map(({ vente, retard }) => (
                <ListRow
                  key={vente.id}
                  title={vente.client || T.client.sansNom}
                  subtitle={
                    <Text style={retard > 0 ? styles.alerte : undefined}>
                      {retard > 0
                        ? T.aEncaisser.retard(retard)
                        : vente.echeance
                          ? T.aEncaisser.echeance(formatDateFR(vente.echeance))
                          : T.aEncaisser.sansEcheance}
                    </Text>
                  }
                  trailing={<Text style={commonStyles.lineBold}>{formatMontant(vente.prix ?? 0)}</Text>}
                  onPress={() => router.push(ROUTES.ficheVente(vente.id) as never)}
                />
              ))}
            </BlocLignes>
          </View>
        )
      ) : null}

      {vue === 'relancer' ? (
        <View style={commonStyles.gap6}>
          <Text style={commonStyles.muted}>{T.aRelancer.aide(JOURS_CLIENT_A_RELANCER)}</Text>
          {aRelancer.length === 0 ? (
            <EmptyState title={T.aRelancer.aucun} />
          ) : (
            <BlocLignes>
              {aRelancer.map((a) => (
                <ListRow
                  key={a.client.id}
                  title={a.nomAffiche}
                  subtitle={T.aRelancer.detail(a.jours, formatDateFR(a.derniere))}
                  trailing={
                    a.client.telephone ? (
                      <Text
                        style={commonStyles.lineBold}
                        onPress={() => Linking.openURL(`tel:${a.client.telephone}`)}
                      >
                        {T.aRelancer.appeler}
                      </Text>
                    ) : undefined
                  }
                  onPress={() => router.push(ROUTES.ficheClient(a.client.id) as never)}
                />
              ))}
            </BlocLignes>
          )}
        </View>
      ) : null}
    </Screen>
  );
}
