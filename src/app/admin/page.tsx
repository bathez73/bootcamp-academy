export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import StudentNav from '@/components/StudentNav';
import { getServerClient, getServiceRoleClient } from '@/lib/supabase/server';
import { setCohortAccessApproval } from './actions';

const COHORT_NAMES = ['Challenge 28 jours', 'Cohorte 28 jours', 'cohort', 'cohorte'];

export default async function Admin({ searchParams }: { searchParams: Promise<{ approval?: string }> }) {
  // Accès limité aux comptes marqués is_admin (+ mode démo sans Supabase).
  const supabase = await getServerClient();
  let isAdmin = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      isAdmin = Boolean(profile?.is_admin);
    }
  } else {
    isAdmin = false;
  }
  if (!isAdmin) {
    redirect('/dashboard');
  }

  let ventes = 0;
  let chiffreAffaires = 0;
  let enAttente = 0;
  let cohortCandidates: Array<{ id: string; email: string; total: number; approved: boolean }> = [];
  const { approval } = await searchParams;

  const sb = await getServiceRoleClient();
  if (sb) {
    const { data: rows } = await sb.from('payments').select('amount, status, verified, user_id, email, formation');
    if (rows) {
      ventes = rows.filter((r) => r.verified === true).length;
      enAttente = rows.filter((r) => r.status !== 'succes').length;
      chiffreAffaires = rows
        .filter((r) => r.status === 'succes' || r.status === 'email_echo')
        .reduce((s, r) => s + Number(r.amount), 0);

      const totals = new Map<string, { email: string; total: number }>();
      for (const row of rows) {
        if (!row.user_id || !row.verified || !COHORT_NAMES.includes(String(row.formation))) continue;
        const current = totals.get(row.user_id) || { email: String(row.email || ''), total: 0 };
        current.total += Number(row.amount || 0);
        totals.set(row.user_id, current);
      }
      const paidStudentIds = [...totals].filter(([, item]) => item.total >= 25000).map(([id]) => id);
      if (paidStudentIds.length) {
        const { data: profiles } = await sb.from('profiles').select('id, cohort_access_approved').in('id', paidStudentIds);
        const approvals = new Map((profiles || []).map((profile) => [profile.id, profile.cohort_access_approved === true]));
        cohortCandidates = paidStudentIds.map((id) => ({
          id,
          email: totals.get(id)?.email || '',
          total: totals.get(id)?.total || 0,
          approved: approvals.get(id) || false,
        }));
      }
    }
  }

  return (
    <div className="wrap">
      <div className="page-tools"><ThemeToggle /></div>
      <p className="accent eyebrow"><b>ADMIN NOVENETECH</b></p>
      <StudentNav/><h1>Pilotage de la cohorte</h1>
      {!sb && (
        <p className="muted" style={{ fontSize: 14 }}>
          Supabase non configuré : ces compteurs se rempliront dès que le webhook de paiement sera branché.
        </p>
      )}
      {approval && <p role="status" className="card">{
        approval === 'approved' ? 'Accès autorisé. Un email a été envoyé à l’étudiant.'
          : approval === 'email_failed' ? 'Accès autorisé, mais l’email étudiant n’a pas pu être envoyé. Vérifie la configuration Brevo.'
            : approval === 'revoked' ? 'Accès étudiant retiré.'
              : 'La validation n’a pas abouti. Vérifie le paiement et réessaie.'
      }</p>}
      <div className="grid">
        <div className="card"><b style={{ fontSize: 28 }}>{ventes}</b><p className="muted">Ventes réussies</p></div>
        <div className="card"><b style={{ fontSize: 28 }}>{chiffreAffaires.toLocaleString('fr-FR')} FCFA</b><p className="muted">Chiffre d'affaires</p></div>
        <div className="card"><b style={{ fontSize: 28 }}>{enAttente}</b><p className="muted">Livraisons à suivre</p></div>
      </div>
      <section className="section" style={{ paddingTop: 36 }}>
        <h2>Demandes d’accès aux cours</h2>
        {cohortCandidates.length ? (
          <div className="grid">
            {cohortCandidates.map((candidate) => (
              <article className="card" key={candidate.id}>
                <h3>{candidate.email || 'Étudiant'}</h3>
                <p className="muted">Paiement vérifié : {candidate.total.toLocaleString('fr-FR')} FCFA</p>
                <p>{candidate.approved ? 'Accès autorisé' : 'En attente de ton autorisation'}</p>
                <form action={setCohortAccessApproval}>
                  <input type="hidden" name="student_id" value={candidate.id} />
                  <input type="hidden" name="approve" value={String(!candidate.approved)} />
                  <button className="btn" type="submit">{candidate.approved ? 'Retirer l’accès' : 'Autoriser l’accès et notifier'}</button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Aucun règlement complet à autoriser pour le moment.</p>
        )}
      </section>
    </div>
  );
}