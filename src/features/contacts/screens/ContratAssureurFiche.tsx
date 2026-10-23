import { useCallback, useRef, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChampObjetAssurance } from '@/features/comptabilite/components/ChampObjetAssurance';
import { ChampVehicule } from '@/features/comptabilite/components/ChampVehicule';
import { assurerEntreeDuContact, listContacts } from '@/features/contacts/repository';
import type { Contact } from '@/features/contacts/services/contacts';
import { getControle, listTousControles, modifierEntree } from '@/features/exploitation/repository/controles';
import { avecDossier } from '@/features/exploitation/services/dossiersDeContenus';
import type { Controle } from '@/features/exploitation/types';
import { enregistrerFournisseur, listFournisseurs } from '@/features/fournisseurs/repository';
import { avecContrat, estUnAssureur, sansContrat } from '@/features/fournisseurs/services/contratsAssureur';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { SelectField } from '@/shared/components/SelectField';
import { OBJET_ASSURANCE } from '@/shared/constants/comptabilite';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts.contrat;

/**
 * Un contrat d'un assureur : sa dénomination, son numéro (c'est lui qui s'inscrit comme numéro de la facture), ce qu'il couvre (et le véhicule, quand on le souscrit
 * depuis sa fiche) et le dossier de l'assureur où ranger ses papiers — un dossier à son nom se crée d'un appui. Ouvert sans identifiant : un nouveau contrat, que les
 * écritures d'assurance de cet assureur proposent ensuite.
 */
export default function ContratAssureurFiche() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fournisseur?: string; id?: string; vehicule?: string }>();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [controles, setControles] = useState<Controle[]>([]);
  const [assureurId, setAssureurId] = useState(params.fournisseur ?? '');
  const [denomination, setDenomination] = useState('');
  const [numero, setNumero] = useState('');
  const [objet, setObjet] = useState(params.vehicule ? OBJET_ASSURANCE.VEHICULE : '');
  const [vehiculeId, setVehiculeId] = useState(params.vehicule ?? '');
  const [dossierId, setDossierId] = useState('');
  const [creerDossier, setCreerDossier] = useState(!params.id);
  const [suppression, setSuppression] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  /** Le contrat modifié est lu une seule fois : ses champs ne se refont pas à chaque retour sur l'écran. */
  const lu = useRef(false);

  const charger = useCallback(async () => {
    const [f, c, ctrl] = await Promise.all([listFournisseurs(), listContacts(), listTousControles()]);
    setFournisseurs(f);
    setContacts(c);
    setControles(ctrl);
    if (params.id && !lu.current) {
      for (const assureur of f) {
        const existant = assureur.contrats?.find((x) => x.id === params.id);
        if (!existant) continue;
        lu.current = true;
        setAssureurId(assureur.id);
        setDenomination(existant.denomination);
        setNumero(existant.numero);
        setObjet(existant.objet ?? '');
        setVehiculeId(existant.vehiculeId ?? '');
        setDossierId(existant.dossierId ?? '');
        break;
      }
    }
  }, [params.id]);
  useFocusEffect(
    useCallback(() => {
      charger().catch(() => undefined);
    }, [charger]),
  );

  const assureur = fournisseurs.find((f) => f.id === assureurId);
  const contactDeLAssureur = contacts.find((c) => c.fournisseur?.id === assureurId);
  const entree = contactDeLAssureur
    ? controles.find((c) => c.famille === FAMILLE_CONTROLE.GROUPEMENT && c.fournisseurId === assureurId)
    : undefined;
  const dossiers = entree?.dossiers ?? [];

  const enregistrer = async () => {
    if (!assureur) return Alert.alert(T.assureurRequis);
    if (!denomination.trim()) return Alert.alert(T.denominationRequise);
    setEnregistrement(true);
    try {
      let dossier = dossierId;
      // Un dossier à son nom, dans celui de l'assureur : créé une fois, avec ses papiers à venir.
      if (creerDossier && !dossier && contactDeLAssureur) {
        const idEntree = await assurerEntreeDuContact(contactDeLAssureur);
        await modifierEntree(idEntree, (e) => avecDossier(e, denomination));
        const apres = await getControle(idEntree);
        dossier = [...(apres?.dossiers ?? [])].reverse().find((d) => d.nom === denomination.trim())?.id ?? '';
      }
      await enregistrerFournisseur(
        avecContrat(assureur, {
          id: params.id,
          denomination: denomination.trim(),
          numero: numero.trim(),
          objet: vehiculeId ? OBJET_ASSURANCE.VEHICULE : objet || undefined,
          vehiculeId: vehiculeId || undefined,
          dossierId: dossier || undefined,
        }),
      );
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async () => {
    setSuppression(false);
    if (assureur && params.id) await enregistrerFournisseur(sansContrat(assureur, params.id));
    router.back();
  };

  return (
    <Screen>
      <SectionForm titre={T.titre} aide={T.aide}>
        <SelectField
          label={T.assureur}
          required
          searchable
          placeholder={T.choisirAssureur}
          value={assureurId}
          onChange={(id) => {
            setAssureurId(id);
            setDossierId('');
          }}
          options={fournisseurs
            .filter((f) => estUnAssureur(f) || f.id === assureurId)
            .map((f) => ({ value: f.id, label: f.nomEntreprise || f.nom }))}
        />
        <FormField label={T.denomination} required value={denomination} onChangeText={setDenomination} placeholder={T.exempleDenomination} />
        <FormField label={T.numero} value={numero} onChangeText={setNumero} placeholder={T.exempleNumero} />
        <Text style={commonStyles.note}>{T.numeroAide}</Text>
        <ChampObjetAssurance
          value={objet}
          onChange={(o) => {
            setObjet(o);
            if (o !== OBJET_ASSURANCE.VEHICULE) setVehiculeId('');
          }}
        />
        {objet === OBJET_ASSURANCE.VEHICULE || vehiculeId ? <ChampVehicule value={vehiculeId} onChange={setVehiculeId} /> : null}
      </SectionForm>
      <SectionForm titre={T.dossier} aide={T.dossierAide}>
        {dossiers.length > 0 ? (
          <SelectField
            label={T.dossierDeLAssureur}
            value={dossierId}
            onChange={(id) => {
              setDossierId(id);
              if (id) setCreerDossier(false);
            }}
            options={[{ value: '', label: T.aucunDossier }, ...dossiers.map((d) => ({ value: d.id, label: d.nom }))]}
          />
        ) : null}
        {!dossierId && contactDeLAssureur ? (
          <Checkbox label={T.creerDossier} value={creerDossier} onChange={setCreerDossier} />
        ) : null}
      </SectionForm>
      <Button label={TEXTES.commun.general.enregistrer} onPress={enregistrer} loading={enregistrement} />
      {params.id ? <Button variant="danger" label={T.supprimer} onPress={() => setSuppression(true)} /> : null}
      <ConfirmModal
        visible={suppression}
        title={T.supprimerQuestion}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setSuppression(false)}
        onConfirm={supprimer}
      />
    </Screen>
  );
}
