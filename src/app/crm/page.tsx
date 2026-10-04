'use client';
import { useEffect, useRef, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import Nav from '@/components/Nav';
import StudentNav from '@/components/StudentNav';

const STATUTS = ['À contacter', 'Contacté', 'Intéressé', 'Client'] as const;
type Statut = (typeof STATUTS)[number];
type Prospect = {
  id: string;
  entreprise: string;
  contact: string;
  statut: Statut;
};

export default function CRM() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [entreprise, setEntreprise] = useState('');
  const [contact, setContact] = useState('');
  const [statut, setStatut] = useState<Statut>('À contacter');
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const lock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const sb = getBrowserClient();
        if (!sb) throw Error();

        const { data, error: loadError } = await sb
          .from('crm_prospects')
          .select('id,entreprise,contact,statut')
          .order('created_at', { ascending: false });

        if (loadError) throw loadError;

        if (active) {
          setProspects(data as Prospect[]);
          setError('');
        }
      } catch {
        if (active) setError('Impossible de charger tes prospects. Réessaie.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [attempt]);

  async function mutate(action: () => Promise<void>) {
    if (lock.current || loading) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      await action();
    } catch {
      setError('La modification n’a pas été enregistrée. Vérifie ta connexion et réessaie.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function reset() {
    setEditing(null);
    setEntreprise('');
    setContact('');
    setStatut('À contacter');
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!entreprise.trim()) return;

    await mutate(async () => {
      const sb = getBrowserClient();
      if (!sb) throw Error();

      const values = { entreprise: entreprise.trim(), contact: contact.trim(), statut };
      const result = editing
        ? await sb.from('crm_prospects').update(values).eq('id', editing).select('id,entreprise,contact,statut').single()
        : await sb.from('crm_prospects').insert(values).select('id,entreprise,contact,statut').single();

      if (result.error || !result.data) throw Error();

      const row = result.data as Prospect;
      setProspects((list) => editing ? list.map((p) => (p.id === editing ? row : p)) : [row, ...list]);
      reset();
      setNotice('Prospect enregistré.');
    });
  }

  async function change(id: string, value: Statut) {
    await mutate(async () => {
      const sb = getBrowserClient();
      if (!sb) throw Error();

      const { data, error: changeError } = await sb.from('crm_prospects').update({ statut: value }).eq('id', id).select('id').single();
      if (changeError || !data) throw Error();

      setProspects((list) => list.map((p) => (p.id === id ? { ...p, statut: value } : p)));
      setNotice('Statut enregistré.');
    });
  }

  async function remove(id: string) {
    await mutate(async () => {
      const sb = getBrowserClient();
      if (!sb) throw Error();

      const { data, error: removeError } = await sb.from('crm_prospects').delete().eq('id', id).select('id').single();
      if (removeError || !data) throw Error();

      setProspects((list) => list.filter((p) => p.id !== id));
      setDeleting(null);
      if (editing === id) reset();
      setNotice('Prospect supprimé.');
    });
  }

  const totalProspects = prospects.length;
  const toContact = prospects.filter((p) => p.statut === 'À contacter').length;
  const hotLeads = prospects.filter((p) => p.statut === 'Intéressé' || p.statut === 'Client').length;
  const won = prospects.filter((p) => p.statut === 'Client').length;
  const visible = prospects.filter(
    (p) =>
      (!filter || p.statut === filter) &&
      (p.entreprise + ' ' + p.contact).toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')),
  );

  return (
    <div className="wrap">
      <Nav />
      <StudentNav />

      <main className="section crm-shell">
        <div className="crm-header">
          <div>
            <p className="accent eyebrow">CRM</p>
            <h1>Mes prospects</h1>
            <p className="crm-subtitle">Organise tes contacts et suis chaque échange.</p>
          </div>

          <div className="crm-summary">
            {[
              { label: 'Total', value: totalProspects },
              { label: 'À contacter', value: toContact },
              { label: 'Chauds', value: hotLeads },
              { label: 'Clients', value: won },
            ].map((item) => (
              <div className="card crm-kpi" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="crm-banner crm-banner--error" role="alert">
            {error}{' '}
            <button
              className="btn btn2"
              disabled={busy || loading}
              onClick={() => {
                setLoading(true);
                setAttempt((value) => value + 1);
              }}
            >
              Recharger
            </button>
          </div>
        )}

        {notice && (
          <p className="crm-banner crm-banner--success" role="status" aria-live="polite">
            {notice}
          </p>
        )}

        <section className="section">
          <div className="card">
            <h2>{editing ? 'Modifier le prospect' : 'Ajouter un prospect'}</h2>
            <form ref={formRef} onSubmit={save}>
              <fieldset disabled={loading || busy}>
                <label htmlFor="entreprise">Entreprise</label>
                <input
                  id="entreprise"
                  required
                  maxLength={160}
                  value={entreprise}
                  onChange={(event) => setEntreprise(event.target.value)}
                />

                <label htmlFor="contact">Contact / WhatsApp</label>
                <input
                  id="contact"
                  maxLength={200}
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                />

                <label htmlFor="statut">Statut</label>
                <select
                  id="statut"
                  value={statut}
                  onChange={(event) => setStatut(event.target.value as Statut)}
                >
                  {STATUTS.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>

                <div className="crm-actions">
                  <button className="btn" type="submit">
                    {busy ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  {editing && (
                    <button type="button" className="btn btn2" onClick={reset}>
                      Annuler
                    </button>
                  )}
                </div>
              </fieldset>
            </form>
          </div>
        </section>

        <section className="card">
          <h2>Mon pipeline</h2>

          <label htmlFor="search">Rechercher une entreprise ou un contact</label>
          <input type="search" id="search" value={query} onChange={(event) => setQuery(event.target.value)} />

          <label htmlFor="filter">Filtrer par statut</label>
          <select id="filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="">Tous les statuts</option>
            {STATUTS.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>

          {loading ? (
            <p role="status">Chargement des prospects…</p>
          ) : visible.length === 0 ? (
            <p>
              {error
                ? 'Les données ne sont pas disponibles.'
                : prospects.length
                  ? 'Aucun résultat pour ces filtres.'
                  : 'Aucun prospect pour le moment. Ajoute ton premier contact.'}
            </p>
          ) : (
            <div className="crm-list">
              {visible.map((prospect) => (
                <div className="day crm-prospect" key={prospect.id}>
                  <div>
                    <h3>{prospect.entreprise}</h3>
                    <p>{prospect.contact || 'Contact non renseigné'}</p>
                  </div>

                  <div className="crm-prospect__actions">
                    <select
                      value={prospect.statut}
                      onChange={(event) => change(prospect.id, event.target.value as Statut)}
                    >
                      <option>{prospect.statut}</option>
                      {STATUTS.filter((status) => status !== prospect.statut).map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="btn btn2"
                      onClick={() => {
                        setEditing(prospect.id);
                        setEntreprise(prospect.entreprise);
                        setContact(prospect.contact);
                        setStatut(prospect.statut);
                        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      className="btn btn2"
                      onClick={() => setDeleting(prospect.id)}
                    >
                      {deleting === prospect.id ? 'Supprimer…' : 'Supprimer'}
                    </button>

                    {deleting === prospect.id && (
                      <button type="button" className="btn" onClick={() => remove(prospect.id)}>
                        Confirmer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
