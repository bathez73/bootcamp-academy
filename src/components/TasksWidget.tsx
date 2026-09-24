'use client';
import { useCallback, useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';

const TASKS = [
  'Définis ton service',
  'Choisis ta niche',
  'Construis ton offre',
  'Fixe ton prix',
  'Crée ton premier exemple',
];

const STORAGE_KEY = 'novenetech-tasks';
const DAY_OFFSET = 1; // première ligne du challenge = jour 1

type Sync = 'none' | 'supabase';

function loadLocal(): boolean[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as boolean[];
      if (Array.isArray(arr)) return arr;
    }
  } catch {
    /* stockage illisible */
  }
  return null;
}

export default function TasksWidget() {
  const [done, setDone] = useState<boolean[]>(TASKS.map((_, i) => i < 2));
  const [sync, setSync] = useState<Sync>('none');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const sb = getBrowserClient();
    if (!sb) {
      // Mode démo : rechargement du stockage local en micro-tâche.
      void Promise.resolve().then(() => {
        const local = loadLocal();
        if (local) setDone(local);
      });
      return;
    }
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) {
        const local = loadLocal();
        if (local) setDone(local);
        return;
      }
      setUserId(data.user.id);
      setSync('supabase');
      sb.from('progress')
        .select('day, done')
        .in('day', TASKS.map((_, i) => i + DAY_OFFSET))
        .then(({ data: rows }) => {
          if (!rows) return;
          const arr = TASKS.map((_, i) => i < 2);
          rows.forEach((r) => {
            const idx = (r.day as number) - DAY_OFFSET;
            if (idx >= 0 && idx < TASKS.length) arr[idx] = Boolean(r.done);
          });
          setDone(arr);
        });
    });
  }, []);

  const persist = useCallback(
    (i: number, arr: boolean[]) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      } catch {
        /* stockage indisponible */
      }
      if (sync === 'supabase' && userId) {
        const sb = getBrowserClient();
        if (!sb) return;
        sb.from('progress')
          .upsert({ user_id: userId, day: i + DAY_OFFSET, done: arr[i] }, { onConflict: 'user_id,day' })
          .then(({ error }) => {
            if (error) console.error('Erreur sauvegarde progression:', error.message);
          });
      }
    },
    [sync, userId],
  );

  function toggle(i: number) {
    setDone((d) => {
      const next = [...d];
      next[i] = !next[i];
      persist(i, next);
      return next;
    });
  }

  const count = done.filter(Boolean).length;
  const pct = Math.round((count / TASKS.length) * 100);

  return (
    <>
      <div className="card">
        <p style={{ margin: '0 0 6px', color: 'var(--muted)' }}>
          Progression globale — <b style={{ color: 'var(--fg)' }}>{pct}%</b>
        </p>
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          {count} réalisation{count > 1 ? 's' : ''} sur {TASKS.length}
          {sync === 'supabase' ? ' — synchronisée avec ton compte.' : ' — coche tes tâches au fil de la semaine.'}
        </p>
        <div className="progress"><span style={{ width: `${pct}%` }} /></div>
      </div>

      <section className="section" style={{ paddingTop: 36 }}>
        <h2>Cette semaine</h2>
        {TASKS.map((x, i) => (
          <div className="day" key={x}>
            <span>Jour {i + DAY_OFFSET} — {x}</span>
            <button
              type="button"
              className={`day-status${done[i] ? ' done' : ''}`}
              onClick={() => toggle(i)}
              aria-pressed={done[i]}
              aria-label={`${x} : ${done[i] ? 'terminé' : 'à faire'}`}
              title={done[i] ? 'Marquer comme à faire' : 'Marquer comme terminé'}
            >
              {done[i] ? '✓' : '→'}
            </button>
          </div>
        ))}
      </section>
    </>
  );
}