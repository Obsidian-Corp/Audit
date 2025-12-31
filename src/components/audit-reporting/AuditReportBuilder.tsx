/**
 * Audit Report Builder Component
 * Generates audit reports based on opinion type and findings
 */

'use client';

import { useState, useMemo } from 'react';
import {
  AuditOpinion,
  OpinionType,
  KeyAuditMatter,
  EmphasisOfMatter,
  getOpinionTypeLabel,
  getEOMTypeLabel,
  REPORT_TEMPLATES,
} from '@/lib/audit-reporting';
import {
  useAuditOpinion,
  useAuditReport,
  useAuditReporting,
} from '@/hooks/useAuditReporting';

interface AuditReportBuilderProps {
  engagementId: string;
  userId: string;
  userRole: 'preparer' | 'reviewer' | 'partner';
  clientName: string;
  periodEndDate: Date;
  financialStatementDescription?: string;
  onComplete?: () => void;
}

export function AuditReportBuilder({
  engagementId,
  userId,
  userRole,
  clientName,
  periodEndDate,
  financialStatementDescription = 'balance sheet, income statement, statement of cash flows, and related notes',
  onComplete,
}: AuditReportBuilderProps) {
  const { data: auditOpinion, isLoading } = useAuditOpinion(engagementId);
  const { data: auditReport } = useAuditReport(engagementId);

  const [activeStep, setActiveStep] = useState<
    'opinion' | 'kams' | 'eom_omp' | 'preview' | 'issuance'
  >('opinion');

  // Opinion form state
  const [opinionType, setOpinionType] = useState<OpinionType>('unmodified');
  const [modificationReason, setModificationReason] = useState('');
  const [basisParagraph, setBasisParagraph] = useState('');

  // KAMs state
  const [kams, setKams] = useState<Partial<KeyAuditMatter>[]>([]);
  const [showAddKam, setShowAddKam] = useState(false);
  const [newKam, setNewKam] = useState({
    title: '',
    description: '',
    auditResponse: '',
    reference: '',
  });

  // EOM/OMP state
  const [eomItems, setEomItems] = useState<Partial<EmphasisOfMatter>[]>([]);
  const [showAddEom, setShowAddEom] = useState(false);
  const [newEom, setNewEom] = useState({
    type: 'going_concern' as EmphasisOfMatter['type'],
    title: '',
    paragraphText: '',
    noteReference: '',
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const addKam = () => {
    setKams([
      ...kams,
      {
        id: `kam-${Date.now()}`,
        ...newKam,
      },
    ]);
    setShowAddKam(false);
    setNewKam({ title: '', description: '', auditResponse: '', reference: '' });
  };

  const addEom = () => {
    setEomItems([
      ...eomItems,
      {
        id: `eom-${Date.now()}`,
        ...newEom,
      },
    ]);
    setShowAddEom(false);
    setNewEom({ type: 'going_concern', title: '', paragraphText: '', noteReference: '' });
  };

  // Generate report preview
  const reportPreview = useMemo(() => {
    const template = REPORT_TEMPLATES[opinionType];
    if (!template) return '';

    let report = `INDEPENDENT AUDITOR'S REPORT

To the Board of Directors and Shareholders of ${clientName}

${template.opinionParagraph}

We have audited the ${financialStatementDescription} of ${clientName} as of and for the year ended ${formatDate(periodEndDate)}.

`;

    // Add basis for opinion
    if (opinionType !== 'unmodified' && basisParagraph) {
      report += `Basis for ${getOpinionTypeLabel(opinionType)}

${basisParagraph}

`;
    }

    // Add KAMs if present
    if (kams.length > 0) {
      report += `Key Audit Matters

Key audit matters are those matters that, in our professional judgment, were of most significance in our audit of the financial statements of the current period.

`;
      kams.forEach((kam) => {
        report += `${kam.title}

${kam.description}

How We Addressed the Matter: ${kam.auditResponse}

`;
      });
    }

    // Add EOM/OMP if present
    eomItems.forEach((eom) => {
      const isEom = ['going_concern', 'significant_uncertainty', 'other_eom'].includes(
        eom.type || ''
      );
      report += `${isEom ? 'Emphasis of Matter' : 'Other Matter'} - ${eom.title}

${eom.paragraphText}

${eom.noteReference ? `See Note ${eom.noteReference} to the financial statements.` : ''}

`;
    });

    // Add standard paragraphs
    report += `Responsibilities of Management for the Financial Statements

Management is responsible for the preparation and fair presentation of these financial statements in accordance with accounting principles generally accepted in the United States of America, and for the design, implementation, and maintenance of internal control relevant to the preparation and fair presentation of financial statements that are free from material misstatement, whether due to fraud or error.

Auditor's Responsibilities for the Audit of the Financial Statements

Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion.

[Signature]
[Date]
[Location]`;

    return report;
  }, [opinionType, basisParagraph, kams, eomItems, clientName, periodEndDate, financialStatementDescription]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading audit report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Audit Report Builder</h2>
          <p className="text-sm text-gray-600">
            Generate the auditor&apos;s report based on audit findings
          </p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {(['opinion', 'kams', 'eom_omp', 'preview', 'issuance'] as const).map(
              (step, idx) => {
                const steps = ['opinion', 'kams', 'eom_omp', 'preview', 'issuance'];
                const currentIdx = steps.indexOf(activeStep);
                const isActive = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                const labels = {
                  opinion: 'Opinion',
                  kams: 'KAMs',
                  eom_omp: 'EOM/OMP',
                  preview: 'Preview',
                  issuance: 'Issuance',
                };

                return (
                  <div key={step} className="flex items-center">
                    <button
                      onClick={() => setActiveStep(step)}
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        isActive
                          ? isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                    <span
                      className={`ml-2 text-sm ${
                        isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {labels[step]}
                    </span>
                    {idx < 4 && (
                      <div
                        className={`w-12 h-0.5 mx-4 ${
                          idx < currentIdx ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {activeStep === 'opinion' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opinion Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    ['unmodified', 'qualified', 'adverse', 'disclaimer'] as OpinionType[]
                  ).map((type) => (
                    <label
                      key={type}
                      className={`flex items-start p-4 rounded-lg border cursor-pointer ${
                        opinionType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="opinionType"
                        value={type}
                        checked={opinionType === type}
                        onChange={() => setOpinionType(type)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {getOpinionTypeLabel(type)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {type === 'unmodified'
                            ? 'Financial statements present fairly in all material respects'
                            : type === 'qualified'
                              ? 'Except for specific matter(s), financial statements present fairly'
                              : type === 'adverse'
                                ? 'Financial statements do not present fairly'
                                : 'Unable to form an opinion due to scope limitation'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {opinionType !== 'unmodified' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Modification
                    </label>
                    <input
                      type="text"
                      value={modificationReason}
                      onChange={(e) => setModificationReason(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="e.g., Material misstatement in inventory valuation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Basis for Opinion Paragraph
                    </label>
                    <textarea
                      value={basisParagraph}
                      onChange={(e) => setBasisParagraph(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="Describe the basis for the modified opinion..."
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveStep('kams')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue to KAMs
                </button>
              </div>
            </div>
          )}

          {activeStep === 'kams' && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <strong>Key Audit Matters (KAMs)</strong> are matters that, in the auditor&apos;s
                professional judgment, were of most significance in the audit. KAMs are selected
                from matters communicated with those charged with governance.
              </div>

              {kams.length > 0 && (
                <div className="space-y-4">
                  {kams.map((kam, idx) => (
                    <div key={kam.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          KAM {idx + 1}: {kam.title}
                        </h4>
                        <button
                          onClick={() => setKams(kams.filter((k) => k.id !== kam.id))}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{kam.description}</p>
                      <p className="text-sm text-gray-600">
                        <strong>Audit Response:</strong> {kam.auditResponse}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {showAddKam ? (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <h4 className="font-medium text-gray-900">Add Key Audit Matter</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newKam.title}
                      onChange={(e) => setNewKam({ ...newKam, title: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="e.g., Revenue Recognition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description of the Matter
                    </label>
                    <textarea
                      value={newKam.description}
                      onChange={(e) => setNewKam({ ...newKam, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="Why this matter was significant..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      How the Matter Was Addressed
                    </label>
                    <textarea
                      value={newKam.auditResponse}
                      onChange={(e) =>
                        setNewKam({ ...newKam, auditResponse: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="Audit procedures performed..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addKam}
                      disabled={!newKam.title || !newKam.description}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add KAM
                    </button>
                    <button
                      onClick={() => setShowAddKam(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddKam(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  + Add Key Audit Matter
                </button>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setActiveStep('opinion')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('eom_omp')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue to EOM/OMP
                </button>
              </div>
            </div>
          )}

          {activeStep === 'eom_omp' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-800">
                <strong>Emphasis of Matter (EOM)</strong> paragraphs draw attention to matters
                appropriately presented or disclosed that are fundamental to users&apos;
                understanding. <strong>Other Matter (OMP)</strong> paragraphs communicate
                matters relevant to users&apos; understanding of the audit.
              </div>

              {eomItems.length > 0 && (
                <div className="space-y-4">
                  {eomItems.map((eom, idx) => (
                    <div key={eom.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {getEOMTypeLabel(eom.type || 'other_eom')}
                          </span>
                          <h4 className="font-medium text-gray-900">{eom.title}</h4>
                        </div>
                        <button
                          onClick={() => setEomItems(eomItems.filter((e) => e.id !== eom.id))}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{eom.paragraphText}</p>
                    </div>
                  ))}
                </div>
              )}

              {showAddEom ? (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <h4 className="font-medium text-gray-900">Add EOM/OMP Paragraph</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={newEom.type}
                      onChange={(e) =>
                        setNewEom({
                          ...newEom,
                          type: e.target.value as EmphasisOfMatter['type'],
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="going_concern">Going Concern (EOM)</option>
                      <option value="significant_uncertainty">
                        Significant Uncertainty (EOM)
                      </option>
                      <option value="other_eom">Other Emphasis of Matter</option>
                      <option value="other_information">Other Information (OMP)</option>
                      <option value="other_omp">Other Matter Paragraph</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newEom.title}
                      onChange={(e) => setNewEom({ ...newEom, title: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paragraph Text
                    </label>
                    <textarea
                      value={newEom.paragraphText}
                      onChange={(e) =>
                        setNewEom({ ...newEom, paragraphText: e.target.value })
                      }
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note Reference (if applicable)
                    </label>
                    <input
                      type="text"
                      value={newEom.noteReference}
                      onChange={(e) => setNewEom({ ...newEom, noteReference: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="e.g., Note 15"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addEom}
                      disabled={!newEom.title || !newEom.paragraphText}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Paragraph
                    </button>
                    <button
                      onClick={() => setShowAddEom(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddEom(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  + Add EOM/OMP Paragraph
                </button>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setActiveStep('kams')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('preview')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Preview Report
                </button>
              </div>
            </div>
          )}

          {activeStep === 'preview' && (
            <div className="space-y-6">
              <div className="border rounded-lg">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h4 className="font-medium text-gray-900">Report Preview</h4>
                </div>
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                    {reportPreview}
                  </pre>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setActiveStep('eom_omp')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('issuance')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue to Issuance
                </button>
              </div>
            </div>
          )}

          {activeStep === 'issuance' && (
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
                Complete the issuance checklist before releasing the audit report.
              </div>

              <div className="border rounded-lg divide-y">
                {[
                  'All audit procedures completed',
                  'All review notes cleared',
                  'Management representation letter received',
                  'Attorney letter responses received',
                  'Subsequent events review completed',
                  'Going concern assessment completed',
                  'EQCR completed (if applicable)',
                  'Engagement quality review completed',
                  'Financial statements agree to workpapers',
                  'Disclosures reviewed for adequacy',
                  'Report dated appropriately',
                  'Partner approval obtained',
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-900">{item}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partner Signature
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Partner name"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setActiveStep('preview')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={onComplete}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Issue Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditReportBuilder;
