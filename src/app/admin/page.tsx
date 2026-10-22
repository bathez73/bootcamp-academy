import MasterclassMeasurementAdmin from '@/components/MasterclassMeasurementAdmin';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import StudentNav from '@/components/StudentNav';
import { getServerClient, getServiceRoleClient } from '@/lib/supabase/server';
import { setCohortAccessApproval } from './actions';

const APPROVAL_MESSAGES: Record<string, string> = {
  approved: 'Accès autorisé. Un email a été envoyé à l’étudiant.',
  email_failed: 'Accès autorisé, mais l’email étudiant n’a pas pu être envoyé. Vérifie la configuration Brevo.',
  revoked: 'Accès étudiant retiré.',
  not_found: 'Aucun compte avec cet email. Demande à l’acheteur de créer son compte sur le site avec l’email utilisé sur Chariow, puis réessaie.',
};

export default async function Admin({ searchParams }: { searchParams: Promise<{ approval?: string }> }) {
  // Accès limité aux comptes marqués is_admin.
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
  }
  if (!isAdmin) {
    redirect('/dashboard');
  }

  const { approval } = await searchParams;
  let students: Array<{ id: string; email: string | null; cohort_access_approved_at: string | null }> = [];
  const sb = await getServiceRoleClient();
  if (sb) {
    const { data } = await sb
      .from('profiles')
      .select('id, email, cohort_access_approved_at')
      .eq('cohort_access_approved', true)
      .order('cohort_access_approved_at', { ascending: false });
    students = data || [];
  }

  return (
    <div className="wrap">
      <div className="page-tools"><ThemeToggle /></div>
      <p className="accent eyebrow"><b>ADMIN NOVENETECH</b></p>
      <StudentNav/><h1>Pilotage de la cohorte</h1>
      <MasterclassMeasurementAdmin />
      {!sb && <p className="muted" style={{ fontSize: 14 }}>Supabase non configuré : la gestion des accès est indisponible.</p>}
      {approval && <p role="status" className="card">{APPROVAL_MESSAGES[approval] || 'La validation n’a pas abouti. Réessaie.'}</p>}

      <section className="section" style={{ paddingTop: 36 }}>
        <h2>Autoriser un acheteur Chariow</h2>
        <p className="muted">Vérifie la vente dans ton tableau de bord Chariow, puis saisis l’email du compte de l’acheteur sur le site.</p>
        <form action={setCohortAccessApproval} className="card" style={{ maxWidth: 520 }}>
          <label htmlFor="student-email" style={{ marginTop: 0 }}>Email de l’acheteur</label>
          <input id="student-email" name="email" type="email" required placeholder="acheteur@exemple.com" />
          <input type="hidden" name="approve" value="true" />
          <button className="btn" type="submit">Autoriser l’accès et notifier</button>
        </form>
      </section>

      <section className="section">
        <h2>Étudiants autorisés ({students.length})</h2>
        {students.length ? (
          <div className="grid">
            {students.map((student) => (
              <article className="card" key={student.id}>
                <h3>{student.email || 'Étudiant'}</h3>
                {student.cohort_access_approved_at && <p className="muted">Autorisé le {new Date(student.cohort_access_approved_at).toLocaleDateString('fr-FR')}</p>}
                <form action={setCohortAccessApproval}>
                  <input type="hidden" name="student_id" value={student.id} />
                  <input type="hidden" name="approve" value="false" />
                  <button className="btn btn2" type="submit">Retirer l’accès</button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Aucun étudiant autorisé pour le moment.</p>
        )}
      </section>
    </div>
  );
}
