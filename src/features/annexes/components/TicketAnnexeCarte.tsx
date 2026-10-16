import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { lignesDuTicket, totalTicket } from '@/features/annexes/services/tickets';
import type { ArticleAnnexe, CategorieAnnexe, TicketAnnexe } from '@/features/annexes/types';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { NOMBRE_MAX_ARTICLES_TICKET } from '@/shared/constants/annexes';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/bar/Bar.styles';
import { styles as stylesTicket } from '@/shared/styles/annexes/Annexes.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

const T = TEXTES.annexes.ticket;

interface Props {
  ticket: TicketAnnexe;
  articles: ArticleAnnexe[];
  categories: CategorieAnnexe[];
  replie: boolean;
  onBasculer: () => void;
  onRenommer: () => void;
  onChangerDate: (date: string) => void;
  /** Les repas de ce jour déjà réservés et payés (le restaurant) : une ligne d'information, hors du total. */
  repasReserves?: number;
  /** Ouvre la réservation de ce ticket (sa ligne de repas devient un lien). */
  onOuvrirReservation?: () => void;
  /** Le taux de TVA de l'activité (celui du ticket quand il n'a pas le sien). */
  tauxTvaActivite?: number;
  onChangerTva: (taux: number | undefined) => void;
  onAjouter: (articleId: string, quantite: number) => void;
  onRetirer: (articleId: string) => void;
  onVendre: () => void;
  /** Le crayon à côté de la liste : l'inventaire, où se gèrent les articles, leurs prix et leurs catégories. */
  onEditerInventaire: () => void;
}

/**
 * Un ticket d'une activité annexe : son nom (renommable) et sa date, les articles commandés, le choix d'un article de
 * l'inventaire (le crayon mène à sa gestion) avec sa quantité et « OK », le total, et « Enregistrer la vente ».
 */
export function TicketAnnexeCarte({
  ticket,
  articles,
  categories,
  replie: replieDemande,
  onBasculer,
  onRenommer,
  onChangerDate,
  repasReserves,
  onOuvrirReservation,
  tauxTvaActivite,
  onChangerTva,
  onAjouter,
  onRetirer,
  onVendre,
  onEditerInventaire,
}: Props) {
  const [categorieId, setCategorieId] = useState('');
  const [articleId, setArticleId] = useState('');
  const [quantite, setQuantite] = useState(1);

  const lignes = lignesDuTicket(ticket, articles);
  // Sur ordinateur, tous les tickets sont dépliés.
  const replie = !estBureau() && replieDemande;
  const total = totalTicket(lignes);
  const proposes = articles.filter((a) => !categorieId || a.categorieId === categorieId);

  const ajouter = () => {
    if (!articleId) return;
    onAjouter(articleId, quantite);
    setArticleId('');
    setQuantite(1);
  };

  return (
    <Card>
      <View style={styles.enteteTicket}>
        <View style={styles.ticketTitre}>
          <Text style={styles.nomTicket}>{ticket.nom}</Text>
          <Pressable onPress={onRenommer} hitSlop={8} accessibilityLabel={T.renommer}>
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={commonStyles.muted}>{ticket.date ?? todayISO()}</Text>
        {replie ? <Text style={styles.totalTicketReplie}>{formatMontant(total)}</Text> : null}
        {estBureau() ? null : (
          <Pressable onPress={onBasculer} hitSlop={8} accessibilityLabel={replie ? T.deplier : T.replier}>
            <Ionicons name={replie ? 'chevron-down' : 'chevron-up'} size={24} color={colors.primary} />
          </Pressable>
        )}
      </View>

      {replie ? null : (
        <>
          {repasReserves ? (
            <Pressable
              style={stylesTicket.bandeauRepas}
              onPress={onOuvrirReservation}
              disabled={!onOuvrirReservation}
              accessibilityLabel={T.ouvrirReservation}
            >
              <Ionicons name="restaurant" size={18} color={colors.primaryDark} />
              <Text style={stylesTicket.texteBandeau}>{T.repasReserves(repasReserves)}</Text>
              {onOuvrirReservation ? (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.primaryDark}
                  style={stylesTicket.flecheBandeau}
                />
              ) : null}
            </Pressable>
          ) : null}

          {lignes.length > 0 ? (
            <View style={stylesTicket.lignes}>
              {lignes.map(({ article, quantite: nombre }, index) => (
                <View key={article.id} style={[stylesTicket.ligne, index > 0 && stylesTicket.ligneSeparee]}>
                  <View style={stylesTicket.ligneTexte}>
                    <Text style={stylesTicket.ligneNom}>{article.nom}</Text>
                    <Text style={stylesTicket.ligneDetail}>
                      {T.detailLigne(nombre, formatMontant(article.prix))}
                    </Text>
                  </View>
                  <Text style={stylesTicket.ligneMontant}>{formatMontant(article.prix * nombre)}</Text>
                  <Pressable
                    style={stylesTicket.retirer}
                    onPress={() => onRetirer(article.id)}
                    hitSlop={8}
                    accessibilityLabel={T.retirerLigne}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {ticket.vendu ? (
            <Text style={commonStyles.lineBold}>{T.venduLibelle}</Text>
          ) : (
            <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
              <View style={stylesTicket.ajout}>
                <Text style={stylesTicket.titreAjout}>{T.ajouterUneLigne}</Text>
                {categories.length > 0 ? (
                  <SelectField<string>
                    label={T.categorie}
                    libelleCache
                    value={categorieId}
                    options={[
                      { value: '', label: T.toutesCategories },
                      ...categories.map((c) => ({ value: c.id, label: c.nom })),
                    ]}
                    onChange={(valeur) => {
                      setCategorieId(valeur);
                      setArticleId('');
                    }}
                  />
                ) : null}
                <View>
                  <SelectFieldEditable<string>
                    label={T.article}
                    libelleCache
                    searchable
                    placeholder={T.choixDeLArticle}
                    value={articleId}
                    options={proposes.map((a) => ({
                      value: a.id,
                      label: `${a.nom} — ${formatMontant(a.prix)}`,
                    }))}
                    onChange={setArticleId}
                    onEdit={onEditerInventaire}
                  />
                </View>
                <View style={stylesTicket.rangeeAjout}>
                  <View style={stylesTicket.compteur}>
                    <Pressable
                      style={stylesTicket.boutonCompteur}
                      onPress={() => setQuantite((q) => Math.max(1, q - 1))}
                      hitSlop={6}
                      accessibilityLabel={T.moins}
                    >
                      <Ionicons name="remove" size={20} color={colors.ajout} />
                    </Pressable>
                    <Text style={stylesTicket.valeurCompteur}>{quantite}</Text>
                    <Pressable
                      style={stylesTicket.boutonCompteur}
                      onPress={() => setQuantite((q) => Math.min(NOMBRE_MAX_ARTICLES_TICKET, q + 1))}
                      hitSlop={6}
                      accessibilityLabel={T.plus}
                    >
                      <Ionicons name="add" size={20} color={colors.ajout} />
                    </Pressable>
                  </View>
                  <Button
                    style={stylesTicket.boutonAjouter}
                    label={T.ajouter}
                    disabled={!articleId}
                    onPress={ajouter}
                  />
                </View>
              </View>
            </AccentColorProvider>
          )}

          {ticket.vendu ? (
            <Text style={stylesTicket.total}>{formatMontant(total)}</Text>
          ) : (
            <View style={stylesTicket.pied}>
              <View style={stylesTicket.tva}>
                <Text style={stylesTicket.libelleTva}>{T.tva}</Text>
                <View style={commonStyles.flex1}>
                  <SelectField<string>
                    label={T.tva}
                    libelleCache
                    value={String(ticket.tauxTva ?? tauxTvaActivite ?? '')}
                    options={[{ value: '', label: '—' }, ...OPTIONS_TAUX_TVA]}
                    onChange={(valeur) => onChangerTva(valeur === '' ? undefined : Number(valeur))}
                  />
                </View>
              </View>
              <Text style={stylesTicket.total}>{formatMontant(total)}</Text>
            </View>
          )}
          {ticket.vendu ? null : (
            <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
              <Button label={T.enregistrerVente} disabled={total <= 0} onPress={onVendre} />
            </AccentColorProvider>
          )}
        </>
      )}
    </Card>
  );
}
