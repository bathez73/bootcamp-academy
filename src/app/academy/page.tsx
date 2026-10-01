import AcademyCheckout from '@/components/AcademyCheckout';
import { getCohortAccess } from '@/lib/cohort-server';
import { getServerClient, getServiceRoleClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Formations Academy | Novenetech', description: 'Formations pratiques en IA, marketing digital et digitalisation des entreprises.' };
export default async function Academy() {
 const sb = await getServerClient();
 const user = sb ? (await sb.auth.getUser()).data.user : null;
 const service = await getServiceRoleClient();
 let purchased: string[] = [];
 let checkoutReady = false;
 let cohortApproved = false;
 let remainingToUnlock = 25000;
 if (user && service) {
  const { data, error } = await service.from('payments').select('formation, amount, verified').eq('user_id', user.id).eq('verified', true);
    purchased = error ? [] : (data || []).map(row => String(row.formation));
    const cohortAccess = await getCohortAccess(user.id);
    cohortApproved = cohortAccess.state.hasAccess;
    remainingToUnlock = cohortAccess.state.remaining;
  checkoutReady = !error && Boolean(user.email_confirmed_at && process.env.SITE_URL && process.env.BREVO_API_KEY && process.env.SENDER_EMAIL && process.env.KKIAPAY_WEBHOOK_SECRET);
 }
 return <AcademyCheckout email={user?.email || ''} userId={user?.id || ''} purchased={purchased} checkoutReady={checkoutReady} cohortApproved={cohortApproved} remainingToUnlock={remainingToUnlock} />;
}
