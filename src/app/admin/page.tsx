import ThemeToggle from '@/components/ThemeToggle';
import { getServiceRoleClient } from '@/lib/supabase/server';

export default async function Admin() {
  let ventes = 0;
  let chiffreAffaires = 0;
  let enAttente = 0;

  const sb = await getServiceRoleClient();
  if (sb) {
    const { data: rows } = await sb.from('payments').select('amount, status');
    if (rows) {
      ventes = rows.filter((r) => r.status === 'succes' || r.status === 'email_echo').length;
      enAttente = rows.filter((r) => r.status === 'pending').length;
      chiffreAffaires = rows
        .filter((r) => r.status === 'succes' || r.status === 'email_echo')
        .reduce((s, r) => s + Number(r.amount), 0);
    }
  }

  return (
    <div className="wrap">
      <div className="page-tools"><ThemeToggle /></div>
      <p className="accent eyebrow"><b>ADMIN NOVENETECH</b></p>
      <h1>Pilotage de la cohorte</h1>
      {!sb && (
        <p className="muted" style={{ fontSize: 14 }}>
          Supabase non configuré : ces compteurs se rempliront dès que le webhook de paiement sera branché.
        </p>
      )}
      <div className="grid">
        <div className="card"><b style={{ fontSize: 28 }}>{ventes}</b><p className="muted">Ventes réussies</p></div>
        <div className="card"><b style={{ fontSize: 28 }}>{chiffreAffaires.toLocaleString('fr-FR')} FCFA</b><p className="muted">Chiffre d'affaires</p></div>
        <div className="card"><b style={{ fontSize: 28 }}>{enAttente}</b><p className="muted">Paiements en attente</p></div>
      </div>
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="card"><h2>Prochaines fonctions</h2><p className="muted">Gestion des cohortes, cours, missions, étudiants, validations et attestations.</p></div>
      </section>
    </div>
  );
}