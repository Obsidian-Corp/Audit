/**
 * Management Representations Types (AU-C 580)
 * Type definitions for management representation letters
 */

// ============================================
// Core Types
// ============================================

export type RepresentationCategory =
  | 'financial_statements'
  | 'completeness_information'
  | 'fraud'
  | 'laws_regulations'
  | 'related_parties'
  | 'subsequent_events'
  | 'going_concern'
  | 'estimates'
  | 'litigation'
  | 'commitments'
  | 'specific_assertions'
  | 'other';

export type LetterStatus =
  | 'draft'
  | 'pending_review'
  | 'sent_to_management'
  | 'signed'
  | 'received';

export interface ManagementRepresentationLetter {
  id: string;
  engagementId: string;

  // Letter details
  letterDate: Date;
  periodEndDate: Date;
  addressee: string;

  // Management signatories
  signatories: LetterSignatory[];

  // Representations
  representations: ManagementRepresentation[];

  // Status
  status: LetterStatus;
  sentDate?: Date;
  signedDate?: Date;
  receivedDate?: Date;

  // Document
  documentPath?: string;
  documentHash?: string;

  // Sign-off
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface LetterSignatory {
  id: string;
  name: string;
  title: string;
  email?: string;
  signed: boolean;
  signedDate?: Date;
}

export interface ManagementRepresentation {
  id: string;
  letterId: string;

  // Representation details
  category: RepresentationCategory;
  standardRepresentation: boolean;
  representationText: string;

  // Source
  sourceStandard?: string; // e.g., "AU-C 580.A36"
  isRequired: boolean;

  // Customization
  isCustomized: boolean;
  customizationReason?: string;

  // Verification
  relatedProcedures?: string[];
  corroboratingEvidence?: string;

  // Order
  orderNumber: number;
}

// ============================================
// Standard Representations
// ============================================

export const STANDARD_REPRESENTATIONS: Record<
  RepresentationCategory,
  Array<{
    text: string;
    required: boolean;
    source: string;
  }>
> = {
  financial_statements: [
    {
      text: 'We have fulfilled our responsibilities, as set out in the terms of the audit engagement, for the preparation and fair presentation of the financial statements in accordance with accounting principles generally accepted in the United States of America.',
      required: true,
      source: 'AU-C 580.10',
    },
    {
      text: 'The financial statements are fairly presented, in all material respects, in accordance with accounting principles generally accepted in the United States of America.',
      required: true,
      source: 'AU-C 580.10',
    },
    {
      text: 'We believe the significant accounting estimates and assumptions are reasonable.',
      required: true,
      source: 'AU-C 580.10',
    },
  ],
  completeness_information: [
    {
      text: 'We have provided you with access to all information of which we are aware that is relevant to the preparation of the financial statements, such as records, documentation, and other matters.',
      required: true,
      source: 'AU-C 580.11',
    },
    {
      text: 'We have provided you with additional information that you have requested from us for the purpose of the audit.',
      required: true,
      source: 'AU-C 580.11',
    },
    {
      text: 'We have provided you with unrestricted access to persons within the entity from whom you determined it necessary to obtain audit evidence.',
      required: true,
      source: 'AU-C 580.11',
    },
    {
      text: 'All transactions have been recorded in the accounting records and are reflected in the financial statements.',
      required: true,
      source: 'AU-C 580.11',
    },
  ],
  fraud: [
    {
      text: 'We acknowledge our responsibility for the design, implementation, and maintenance of internal control relevant to the preparation and fair presentation of financial statements that are free from material misstatement, whether due to fraud or error.',
      required: true,
      source: 'AU-C 580.10',
    },
    {
      text: 'We have disclosed to you the results of our assessment of the risk that the financial statements may be materially misstated as a result of fraud.',
      required: true,
      source: 'AU-C 580.12',
    },
    {
      text: 'We have disclosed to you all information in relation to fraud or suspected fraud that we are aware of and that affects the entity.',
      required: true,
      source: 'AU-C 580.12',
    },
    {
      text: 'We have disclosed to you all information in relation to allegations of fraud, or suspected fraud, affecting the entity\'s financial statements communicated by employees, former employees, analysts, regulators, or others.',
      required: true,
      source: 'AU-C 580.12',
    },
  ],
  laws_regulations: [
    {
      text: 'We have disclosed to you all known instances of noncompliance or suspected noncompliance with laws and regulations whose effects should be considered when preparing the financial statements.',
      required: true,
      source: 'AU-C 580.13',
    },
  ],
  related_parties: [
    {
      text: 'We have disclosed to you the identity of the entity\'s related parties and all the related party relationships and transactions of which we are aware.',
      required: true,
      source: 'AU-C 580.14',
    },
    {
      text: 'All related party transactions have been properly recorded and disclosed in the financial statements.',
      required: true,
      source: 'AU-C 550',
    },
  ],
  subsequent_events: [
    {
      text: 'All events occurring subsequent to the date of the financial statements and for which accounting principles generally accepted in the United States of America require adjustment or disclosure have been adjusted or disclosed.',
      required: true,
      source: 'AU-C 560',
    },
  ],
  going_concern: [
    {
      text: 'We have disclosed to you all information relevant to the use of the going concern assumption in the financial statements.',
      required: false,
      source: 'AU-C 570',
    },
    {
      text: 'Our plans for dealing with the adverse effects of conditions and events that raise substantial doubt about the entity\'s ability to continue as a going concern are feasible, and management intends to implement them.',
      required: false,
      source: 'AU-C 570',
    },
  ],
  estimates: [
    {
      text: 'The methods, significant assumptions, and data used in making accounting estimates, and their related disclosures are appropriate to achieve recognition, measurement, or disclosure that is reasonable in the context of the applicable financial reporting framework.',
      required: false,
      source: 'AU-C 540',
    },
  ],
  litigation: [
    {
      text: 'We have disclosed to you all litigation, claims, and assessments whose effects should be considered when preparing the financial statements.',
      required: true,
      source: 'AU-C 501',
    },
    {
      text: 'We have recorded or disclosed, as appropriate, all liabilities, both actual and contingent.',
      required: true,
      source: 'AU-C 501',
    },
  ],
  commitments: [
    {
      text: 'The entity has satisfactory title to all owned assets, and there are no liens or encumbrances on such assets nor has any asset been pledged as collateral, except as disclosed in the financial statements.',
      required: false,
      source: 'AU-C 580',
    },
    {
      text: 'We have complied with all aspects of contractual agreements that would have a material effect on the financial statements in the event of noncompliance.',
      required: false,
      source: 'AU-C 580',
    },
  ],
  specific_assertions: [
    // These would be customized based on the specific engagement
  ],
  other: [
    // Additional representations as needed
  ],
};

// ============================================
// Helper Functions
// ============================================

export function getCategoryLabel(category: RepresentationCategory): string {
  const labels: Record<RepresentationCategory, string> = {
    financial_statements: 'Financial Statements',
    completeness_information: 'Completeness of Information',
    fraud: 'Fraud',
    laws_regulations: 'Laws and Regulations',
    related_parties: 'Related Parties',
    subsequent_events: 'Subsequent Events',
    going_concern: 'Going Concern',
    estimates: 'Accounting Estimates',
    litigation: 'Litigation and Claims',
    commitments: 'Commitments and Contingencies',
    specific_assertions: 'Specific Assertions',
    other: 'Other Matters',
  };
  return labels[category];
}

export function getLetterStatusLabel(status: LetterStatus): string {
  const labels: Record<LetterStatus, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    sent_to_management: 'Sent to Management',
    signed: 'Signed',
    received: 'Received',
  };
  return labels[status];
}

/**
 * Generate standard representation letter content
 */
export function generateRepresentationLetter(params: {
  firmName: string;
  firmAddress: string;
  clientName: string;
  periodEndDate: Date;
  signatories: Array<{ name: string; title: string }>;
  representations: ManagementRepresentation[];
}): string {
  const dateStr = params.periodEndDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let letter = `${params.firmName}
${params.firmAddress}

In connection with your audit of the financial statements of ${params.clientName} as of and for the year ended ${dateStr}, for the purpose of expressing an opinion as to whether the financial statements present fairly, in all material respects, the financial position, results of operations, and cash flows of ${params.clientName} in accordance with accounting principles generally accepted in the United States of America, we confirm, to the best of our knowledge and belief, the following representations made to you during your audit:

`;

  // Group representations by category
  const byCategory = params.representations.reduce(
    (acc, rep) => {
      if (!acc[rep.category]) acc[rep.category] = [];
      acc[rep.category].push(rep);
      return acc;
    },
    {} as Record<string, ManagementRepresentation[]>
  );

  let repNumber = 1;
  Object.entries(byCategory).forEach(([category, reps]) => {
    letter += `${getCategoryLabel(category as RepresentationCategory)}\n\n`;
    reps.forEach((rep) => {
      letter += `${repNumber}. ${rep.representationText}\n\n`;
      repNumber++;
    });
  });

  // Signature block
  letter += `
_____________________________
Signature

_____________________________
Name and Title

_____________________________
Date
`;

  return letter;
}

/**
 * Validate representation letter completeness
 */
export function validateRepresentationLetter(
  representations: ManagementRepresentation[]
): {
  isComplete: boolean;
  missingRequired: string[];
} {
  const missingRequired: string[] = [];

  // Check each required representation category
  Object.entries(STANDARD_REPRESENTATIONS).forEach(([category, stdReps]) => {
    const requiredReps = stdReps.filter((r) => r.required);
    const categoryReps = representations.filter((r) => r.category === category);

    requiredReps.forEach((reqRep) => {
      const found = categoryReps.some(
        (r) => r.representationText.includes(reqRep.text.substring(0, 50))
      );
      if (!found) {
        missingRequired.push(`${getCategoryLabel(category as RepresentationCategory)}: ${reqRep.text.substring(0, 100)}...`);
      }
    });
  });

  return {
    isComplete: missingRequired.length === 0,
    missingRequired,
  };
}
