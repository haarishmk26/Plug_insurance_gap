export const PREMIUM_BASELINE = 10400
export const SAVINGS_HORIZON_YEARS = 3

export const COST_REDUCTION_ACTIONS = [
  {
    label: 'Get a current roof inspection letter',
    signal: 'Roof is documented as 12 years old, but the dossier only shows inspection status text.',
    recommendation: 'Ask the landlord or a roofing contractor for a dated condition letter before broker submission.',
    reason: 'Roof uncertainty is commonly rated at worst-case in property underwriting.',
    implementationCost: 650,
    annualSavings: 420,
  },
  {
    label: 'Document electrical panel maintenance',
    signal: 'The panel photo supports a modern breaker panel upgraded in 2019.',
    recommendation: 'Add a short electrician service note or thermal-scan report to pair with the photo.',
    reason: 'Electrical proof lowers ambiguity around fire risk and building condition.',
    implementationCost: 500,
    annualSavings: 260,
  },
  {
    label: 'Refresh sprinkler inspection certificate',
    signal: 'Sprinkler presence is confirmed and the intake references a 2026 certificate.',
    recommendation: 'Keep the current certificate attached and renew it before expiration.',
    reason: 'Verified suppression helps the broker argue against neighborhood-level fire assumptions.',
    implementationCost: 450,
    annualSavings: 520,
  },
  {
    label: 'Keep alarm monitoring active',
    signal: 'Alarm system evidence is present, and an active monitoring contract is referenced.',
    recommendation: 'Maintain central-station monitoring and attach the renewal contract annually.',
    reason: 'Active monitoring supports theft and premises-risk credits or surcharge avoidance.',
    implementationCost: 1260,
    annualSavings: 620,
  },
  {
    label: 'Service and photograph extinguisher tags',
    signal: 'Extinguisher evidence shows equipment is present, but tag readability can vary by photo.',
    recommendation: 'Complete annual extinguisher service and upload a close photo of the current tag.',
    reason: 'Low-cost fire-safety documentation strengthens the premises narrative.',
    implementationCost: 180,
    annualSavings: 160,
  },
] as const

export function projectedGrossSavings(action: Pick<(typeof COST_REDUCTION_ACTIONS)[number], 'annualSavings'>): number {
  return action.annualSavings * SAVINGS_HORIZON_YEARS
}

export function projectedNetSavings(
  action: Pick<(typeof COST_REDUCTION_ACTIONS)[number], 'annualSavings' | 'implementationCost'>,
): number {
  return projectedGrossSavings(action) - action.implementationCost
}

export function totalProjectedNetSavings(): number {
  return COST_REDUCTION_ACTIONS.reduce((total, action) => total + projectedNetSavings(action), 0)
}

export function totalProjectedGrossSavings(): number {
  return COST_REDUCTION_ACTIONS.reduce((total, action) => total + projectedGrossSavings(action), 0)
}

export function totalImplementationCost(): number {
  return COST_REDUCTION_ACTIONS.reduce((total, action) => total + action.implementationCost, 0)
}

