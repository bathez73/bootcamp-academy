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

  const studentId = String(formData.get('student_id') || '');
  const approve = formData.get('approve') === 'true';
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) redirect('/admin?approval=invalid');

  const service = await getServiceRoleClient();
  if (!service) redirect('/admin?approval=unavailable');

  if (approve) {
    const { data: payments, error: paymentsError } = await service
      .from('payments')
      .select('amount, verified')
      .eq('user_id', studentId)
      .eq('formation', 'Challenge 28 jours')
      .eq('verified', true);
    if (paymentsError || (payments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0) < 25000) {
      redirect('/admin?approval=not_settled');
    }
  }

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