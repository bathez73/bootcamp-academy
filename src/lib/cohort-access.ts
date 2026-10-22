export type CohortProfile = {
  cohort_access_approved?: boolean | null;
};

// Le paiement se fait sur Chariow : seul l'accord explicite d'un administrateur ouvre les cours.
export function hasCohortAccess(profile: CohortProfile | null | undefined) {
  return profile?.cohort_access_approved === true;
}
