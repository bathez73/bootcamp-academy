import { hasCohortAccess } from '@/lib/cohort-access';
import { getServiceRoleClient } from '@/lib/supabase/server';

export async function getCohortAccess(userId: string) {
  const service = await getServiceRoleClient();
  if (!service) return { available: false, approved: false };

  const { data, error } = await service.from('profiles').select('cohort_access_approved').eq('id', userId).maybeSingle();
  if (error) return { available: false, approved: false };

  return { available: true, approved: hasCohortAccess(data) };
}
