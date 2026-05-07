/**
 * Compliance helper for Kastj to avoid financial/investment language.
 */

export const PROHIBITED_FINANCIAL_TERMS = [
  // English
  "ROI", "APY", "APR", "yield", "profit share", "revenue share", "dividend", "interest rate", 
  "loan", "lending", "debt", "repayment", "equity", "shareholder", "security token",
  "investment", "investor", "earn interest", "buyback", "staking yield", "guaranteed return",
  "passive income", "tokenomics",
  // Spanish
  "rentabilidad", "beneficio compartido", "dividendos", "inversión", "inversor", "préstamo", 
  "interés", "reparto de ingresos", "reparto de beneficios", "equity", "valor financiero",
  "ingresos pasivos", "recompra", "garantizado", "tokenomics"
];

export function findProhibitedFinancialTerms(input: string): string[] {
  if (!input) return [];
  const found: string[] = [];
  const lowerInput = input.toLowerCase();

  for (const term of PROHIBITED_FINANCIAL_TERMS) {
    if (lowerInput.includes(term.toLowerCase())) {
      found.push(term);
    }
  }

  return found;
}

export function validateNoFinancialPromises(fields: { 
  title?: string; 
  summary?: string; 
  description?: string 
}): { valid: boolean; terms: string[] } {
  const allTerms: Set<string> = new Set();

  if (fields.title) {
    findProhibitedFinancialTerms(fields.title).forEach(t => allTerms.add(t));
  }
  if (fields.summary) {
    findProhibitedFinancialTerms(fields.summary).forEach(t => allTerms.add(t));
  }
  if (fields.description) {
    findProhibitedFinancialTerms(fields.description).forEach(t => allTerms.add(t));
  }

  const terms = Array.from(allTerms);
  return {
    valid: terms.length === 0,
    terms
  };
}

export type CampaignType = "donation" | "collective_purchase" | "non_financial_reward";

export interface ComplianceMetadata {
  campaignType: CampaignType;
  creatorComplianceAccepted: boolean;
  creatorComplianceAcceptedAt: string;
  complianceVersion: string;
  prohibitedTermsSnapshot?: string[];
}
