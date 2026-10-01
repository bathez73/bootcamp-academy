export const COHORT_REGISTRATION_FEE = 5000;
export const COHORT_FULL_PRICE = 25000;
export const COHORT_SPLIT_PAYMENTS = [10000, 10000];

export type CohortPayment = {
  amount: number | string;
  verified?: boolean | null;
};

export function getCohortPaymentState(payments: CohortPayment[] = [], approved = false) {
  const totalPaid = payments.reduce((sum, payment) => {
    if (payment.verified !== true) {
      return sum;
    }

    const amount = Number(payment.amount ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const registrationPaid = totalPaid >= COHORT_REGISTRATION_FEE;
  const settled = totalPaid >= COHORT_FULL_PRICE;
  const hasAccess = settled && approved;
  const remaining = Math.max(0, COHORT_FULL_PRICE - totalPaid);

  return {
    totalPaid,
    registrationPaid,
    settled,
    hasAccess,
    remaining,
    nextStep: hasAccess ? 'access_granted' : settled ? 'admin_approval' : registrationPaid ? 'balance_payment' : 'registration_payment',
    splitInstallments: COHORT_SPLIT_PAYMENTS,
    canComplete: registrationPaid && !hasAccess,
  };
}