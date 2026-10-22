'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient, getServiceRoleClient } from '@/lib/supabase/server';

export async function setCohortAccessApproval(formData: FormData) {
  const supabase = await getServerClient();
  if (!supabase) redirect('/login?redirect=/admin');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin');

  const { data: adminProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (adminProfile?.is_admin !== true) redirect('/dashboard');

  const approve = formData.get('approve') === 'true';
  const service = await getServiceRoleClient();
  if (!service) redirect('/admin?approval=unavailable');

  // Le paiement est vérifié par l'administrateur dans Chariow : on retrouve le compte par son email.
  let studentId = String(formData.get('student_id') || '');
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!studentId && email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect('/admin?approval=invalid');
    const { data: match } = await service.from('profiles').select('id').ilike('email', email.replace(/[%_\\]/g, '\\$&')).maybeSingle();
    if (!match) redirect('/admin?approval=not_found');
    studentId = match.id;
  }
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) redirect('/admin?approval=invalid');

  const { error } = await service.from('profiles').update({
    cohort_access_approved: approve,
    cohort_access_approved_at: approve ? new Date().toISOString() : null,
    course_access_granted_at: approve ? new Date().toISOString() : null,
  }).eq('id', studentId);
  if (error) redirect('/admin?approval=save_failed');

  let notificationFailed = false;
  if (approve) {
    const [{ data: student }, { data: profile }] = await Promise.all([
      service.auth.admin.getUserById(studentId),
      service.from('profiles').select('email').eq('id', studentId).maybeSingle(),
    ]);
    const studentEmail = student.user?.email || profile?.email;
    if (studentEmail && process.env.BREVO_API_KEY && process.env.SENDER_EMAIL && process.env.SITE_URL) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Novenetech Academy', email: process.env.SENDER_EMAIL },
          to: [{ email: studentEmail }],
          subject: 'Ton accès aux cours Novenetech est autorisé',
          htmlContent: `<p>Bonjour,</p><p>Ton paiement complet a été vérifié et ton accès aux cours est maintenant autorisé.</p><p><a href="${process.env.SITE_URL}/dashboard">Accéder à mon espace étudiant</a></p><p>À bientôt,<br>L'équipe Novenetech</p>`,
        }),
      });
      notificationFailed = !response.ok;
    } else {
      notificationFailed = true;
    }
  }

  for (const path of ['/admin', '/dashboard', '/crm', '/ressources', '/academy', '/programme', '/inscription']) revalidatePath(path);
  redirect(`/admin?approval=${notificationFailed ? 'email_failed' : approve ? 'approved' : 'revoked'}`);
}