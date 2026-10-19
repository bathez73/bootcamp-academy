import { getServiceRoleClient } from '@/lib/supabase/server';

async function loadMeasurement() {
  const service = await getServiceRoleClient();
  if (!service) return null;
  const since = new Date(Date.now() - 29 * 86400000).toLocaleDateString('en-CA', { timeZone: 'Africa/Porto-Novo' });
  const [registrations, views] = await Promise.all([
    service.from('masterclass_registrations').select('id', { count: 'exact', head: true }),
    service.from('internal_pageview_daily').select('day,path,views').gte('day', since).order('day', { ascending: false }),
  ]);
  return { registrations, views };
}

// Render only inside the existing authenticated administrator page.
export default async function MasterclassMeasurementAdmin() {
  const measurement = await loadMeasurement();
  if (!measurement) return <p role="status">Mesure interne indisponible.</p>;
  const { registrations, views } = measurement;
  const rows = views.data ?? [];
  return <section className="card" aria-label="Mesure interne masterclass">
    <h2>Mesure interne masterclass</h2>
    <p>Inscriptions enregistrées (total) : <b>{registrations.error ? 'Indisponible' : registrations.count ?? 0}</b></p>
    <p>Vues de /masterclass (30 jours) : <b>{views.error ? 'Indisponible' : rows.filter(row => row.path === '/masterclass').reduce((total, row) => total + Number(row.views), 0)}</b></p>
    <p className="muted">Sans cookie publicitaire. Les vues ne représentent pas des visiteurs uniques ni des conversions attribuées par Meta. Les inscriptions couvrent toutes les dates présentes dans la base.</p>
    {views.error ? <p role="status">Compteur de vues indisponible : vérifier la migration et le service serveur.</p> :
      <details><summary>Vues commerciales quotidiennes (30 jours, heure du Bénin)</summary>
        <ul>{rows.map(row => <li key={row.day + row.path}>{row.day} · {row.path} : {row.views}</li>)}</ul>
      </details>}
  </section>;
}
