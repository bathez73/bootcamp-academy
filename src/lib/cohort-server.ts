import { getCohortPaymentState, type CohortPayment } from '@/lib/cohort-access';
import { getServiceRoleClient } from '@/lib/supabase/server';

const COHORT_NAMES = ['Challenge 28 jours', 'Cohorte 28 jours', 'cohort', 'cohorte'];

export async function getCohortAccess(userId: string) {
  const service = await getServiceRoleClient();
  if (!service) {
    return { available: false, approved: false, payments: [], state: getCohortPaymentState() };
  }

  const [paymentsResult, profileResult] = await Promise.all([
    service.from('payments').select('amount, verified, formation').eq('user_id', userId).in('formation', COHORT_NAMES),
    service.from('profiles').select('cohort_access_approved').eq('id', userId).maybeSingle(),
  ]);

  if (paymentsResult.error || profileResult.error) {
    return { available: false, approved: false, payments: [], state: getCohortPaymentState() };
  }

  const payments = (paymentsResult.data || []) as Array<CohortPayment & { formation?: string }>;
  const approved = profileResult.data?.cohort_access_approved === true;
  return {
    available: true,
    approved,
    payments,
    state: getCohortPaymentState(payments, approved),
  };
}

export function isCohortFormation(name: string) {
  return COHORT_NAMES.includes(name);
}