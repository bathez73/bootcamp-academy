'use client';
import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';

const STATUTS = ['À contacter', 'Contacté', 'Intéressé'] as const;
type Statut = typeof STATUTS[number] | 'Client';
type Prospect = { id: string; entreprise: string; contact: string; statut: Statut; createdAt: string };
type Mode = 'loading' | 'local' | 'supabase';

const STORAGE_KEY = 'novenetech-prospects';

function statutSuivant(s: Statut): Statut {
  if (s === 'À contacter') return 'Contacté';
  if (s === 'Contacté') return 'Intéressé';
  if (s === 'Intéressé') return 'Client';
  return s;
}

function loadLocal(): Prospect[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as Prospect[];
      if (Array.isArray(arr)) return arr;
    }
  } catch {
    /* stockage illisible */
  }
  return [];
}

function saveLocal(list: Prospect[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* stockage indisponible */
  }
}

export default function CRM() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [mode, setMode] = useState<Mode>('loading');
  const [entreprise, setEntreprise] = useState('');
  const [contact, setContact] = useState('');
  const [statut, setStatut] = useState<Statut>('À contacter');

  useEffect(() => {
    const sb = getBrowserClient();
    if (!sb) {
      setProspects(loadLocal());
      setMode('local');
      return;
    }
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setMode('supabase');
        sb.from('crm_prospects')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data: rows, error }) => {
            if (error) {
              console.error('Erreur chargement CRM:', error.message);
              return;
            }
            setProspects(
              (rows ?? []).map((r) => ({
                id: r.id as string,
                entreprise: r.entreprise as string,
                contact: (r.contact as string) || '—',
                statut: (r.statut as Statut) || 'À contacter',
                createdAt: r.created_at as string,
              })),
            );
          });
      } else {
        setProspects(loadLocal());
        setMode('local');
      }
    });
  }, []);

  useEffect(() => {
    if (mode === 'local') saveLocal(prospects);
  }, [prospects, mode]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!entreprise.trim()) return;
    const p: Prospect = {
      id: crypto.randomUUID(),
      entreprise: entreprise.trim(),
      contact: contact.trim() || '—',
      statut,
      createdAt: new Date().toISOString(),
    };

    const sb = getBrowserClient();
    if (mode === 'supabase' && sb) {
      const { data, error } = await sb
        .from('crm_prospects')
        .insert({ entreprise: p.entreprise, contact: p.contact, statut: p.statut })
        .select('id, created_at')
        .single();
      if (error) {
        console.error('Erreur insertion CRM:', error.message);
        return;
      }
      setProspects((list) => [{ ...p, id: data?.id ?? p.id, createdAt: (data?.created_at as string) ?? p.createdAt }, ...list]);
    } else {
      setProspects((list) => [p, ...list]);
    }

    setEntreprise('');
    setContact('');
    setStatut('À contacter');
  }

  async function changerStatut(id: string, statut: Statut) {
    const sb = getBrowserClient();
    if (mode === 'supabase' && sb) {
      const { error } = await sb.from('crm_prospects').update({ statut }).eq('id', id);
      if (error) console.error('Erreur maj statut:', error.message);
    }
    setProspects((list) => list.map((x) => (x.id === id ? { ...x, statut } : x)));
  }

  function avancer(id: string, statut: Statut) {
    changerStatut(id, statutSuivant(statut));
  }

  async function supprimer(id: string) {
    const sb = getBrowserClient();
    if (mode === 'supabase' && sb) {
      const { error } = await sb.from('crm_prospects').delete().eq('id', id);
      if (error) console.error('Erreur suppression:', error.message);
    }
    setProspects((list) => list.filter((x) => x.id !== id));
  }

  const compter = (s: Statut) => prospects.filter((p) => p.statut === s).length;
  const enAttente = prospects.filter((p) => p.statut === 'À contacter' || p.statut === 'Contacté').length;

  return (
    <div className="wrap">
      <p className="accent eyebrow"><b>CRM ÉTUDIANT</b></p>
      <h1>Mes prospects</h1>
      {mode === 'supabase' && <p className="muted" style={{ fontSize: 13 }}>Synchronisé avec ton compte — accessible partout.</p>}

      <div className="grid">
        <div className="card"><b style={{ fontSize: 28 }}>{enAttente}</b><p className="muted">À contacter / contactés</p></div>
        <div className="card"><b style={{ fontSize: 28 }}>{compter('Intéressé')}</b><p className="muted">Intéressés</p></div>
        <div className="card"><b style={{ fontSize: 28 }}>{compter('Client')}</b><p className="muted">Clients</p></div>
      </div>

      <section className="section" style={{ paddingTop: 36 }}>
        <div className="card" style={{ maxWidth: 520 }}>
          <h2>Ajouter un prospect</h2>
          <form onSubmit={ajouter}>
            <label htmlFor="crm-entreprise">Entreprise</label>
            <input id="crm-entreprise" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder="Entreprise" required />
            <label htmlFor="crm-contact">Contact / WhatsApp</label>
            <input id="crm-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact / WhatsApp" />
            <label htmlFor="crm-statut">Statut initial</label>
            <select id="crm-statut" value={statut} onChange={(e) => setStatut(e.target.value as Statut)}>
              {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="Client">Client</option>
            </select>
            <button type="submit" className="btn">Ajouter</button>
          </form>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h2>Pipeline ({prospects.length})</h2>
          {prospects.length === 0 ? (
            <p className="muted">Aucun prospect pour l&apos;instant. Ajoute ta première entreprise cible ci-dessus.</p>
          ) : (
            prospects.map((p) => (
              <div className="day" key={p.id}>
                <div>
                  <b>{p.entreprise}</b>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: 15 }}>{p.contact}</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    aria-label={`Statut de ${p.entreprise}`}
                    value={p.statut}
                    onChange={(e) => changerStatut(p.id, e.target.value as Statut)}
                    style={{ width: 'auto', margin: 0 }}
                  >
                    {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="Client">Client</option>
                  </select>
                  {p.statut !== 'Client' && (
                    <button type="button" className="btn" style={{ width: 'auto', padding: '11px 16px' }} onClick={() => avancer(p.id, p.statut)}>
                      Faire avancer
                    </button>
                  )}
                  <button type="button" className="btn btn2" style={{ width: 'auto', padding: '11px 16px', margin: 0, color: 'var(--accent)' }} onClick={() => supprimer(p.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}