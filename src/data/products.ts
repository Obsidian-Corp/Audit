/**
 * ==================================================================
 * OBSIDIAN PRODUCT SUITE - PALANTIR-STYLE CONTENT
 * ==================================================================
 * Purpose-built systems for specific problems.
 * We don't build horizontal platforms and adapt them to vertical needs.
 * ==================================================================
 */

export interface ProductCapability {
  title: string;
  description: string;
}

export interface ProductAudience {
  segment: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  positioning: string;
  shortNarrative: string;
  fullNarrative?: string;
  href: string;
  icon: string;
  capabilities: ProductCapability[];
  audiences: ProductAudience[];
  platformIntegration?: string;
  problemStatement?: string;
  approachStatement?: string;
  hardTruth?: string;
}

export const products: Product[] = [
  {
    id: 'ontology',
    name: 'Obsidian Ontology',
    tagline: 'The Connective Tissue of Enterprise Data',
    positioning: 'Semantic Infrastructure',
    shortNarrative: 'A unified semantic model of what your organization knows—entities, relationships, and connections that persist across applications and survive personnel changes.',
    fullNarrative: `Every organization has data. Few have understanding. Information lives in silos—databases that don't talk to each other, applications that duplicate entities under different names, relationships that exist in the minds of long-tenured employees but nowhere in the systems.

Obsidian Ontology is infrastructure for semantic coherence. It creates a unified model of what your organization knows—entities, relationships, hierarchies, and the connections between them—that persists across applications and survives personnel changes. Not another database. A knowledge architecture that makes your existing data finally make sense together.`,
    href: '/platform/ontology',
    icon: 'GitBranch',
    capabilities: [
      { title: 'Entity Resolution', description: 'Match and merge entities across systems with different naming conventions, identifiers, and schemas.' },
      { title: 'Relationship Mapping', description: 'Surface and persist connections between entities that exist in tribal knowledge but not in systems.' },
      { title: 'Semantic Layer', description: 'Unified query interface across disparate data sources. One question, one answer, regardless of where data lives.' },
      { title: 'Lineage Tracking', description: 'Trace any data point from consumption back through transformations to original source.' },
      { title: 'Collaborative Modeling', description: 'Domain experts and data teams build ontologies together. Version control for knowledge models.' },
      { title: 'API-First Architecture', description: 'Every capability accessible programmatically. Build applications on top of the ontology.' }
    ],
    audiences: [
      { segment: 'Post-M&A Integration', description: 'Merging information assets from acquired companies. Making sense of overlapping systems and conflicting data.' },
      { segment: 'Data-Intensive Operations', description: 'Organizations where decisions depend on correlating information across dozens of systems and hundreds of data sources.' },
      { segment: 'Institutional Knowledge Risk', description: 'Companies facing retirement waves, where critical understanding exists only in experienced employees\' heads.' },
      { segment: 'Analytics Maturity', description: 'Organizations ready to move from "we have data" to "we have understanding"—where the semantic layer unlocks the next level.' }
    ],
    platformIntegration: 'Ontology is the foundation—Audit, Codex, and Forge all build upon it. When you deploy Ontology, you\'re not just solving today\'s data integration problem. You\'re building infrastructure for everything that comes next.',
    problemStatement: `Your organization has invested millions in databases, applications, and analytics platforms. Yet fundamental questions remain surprisingly hard to answer:

• "Which customers are connected to this supplier?"
• "What data feeds into this report, and can we trust it?"
• "We acquired a company—how do we merge their data with ours?"
• "The person who knew where this data lived just retired."

The problem isn't technology. It's semantics. Different systems use different names for the same entities. The same name refers to different things in different contexts. Relationships exist in the minds of experienced employees but nowhere in the systems.

You don't have a data problem. You have an understanding problem.`,
    approachStatement: `Obsidian Ontology doesn't replace your existing systems. It creates a semantic layer above them—a shared model of entities, relationships, and meaning that makes your existing data finally make sense together.

Entity Resolution: The same customer appears in your CRM, ERP, and support system under three different names. Ontology resolves them into a single, unified entity while preserving the source-specific identifiers.

Relationship Mapping: Connections between entities that exist only in tribal knowledge become explicit, queryable, and persistent. When someone asks "what's connected to this," the answer is computable.

Semantic Consistency: Terms mean the same thing across the organization. "Active customer" has one definition, not twelve. Metrics calculated from different sources yield the same answers.`
  },
  {
    id: 'audit',
    name: 'Obsidian Audit',
    tagline: 'The Institutional Memory of Audit',
    positioning: 'Audit Infrastructure',
    shortNarrative: 'Reconstructs the epistemic integrity of audit. Every procedure traces to its evidence. Every conclusion traces to its procedures. Every review traces to its reasoning.',
    fullNarrative: `Audit is fundamentally an epistemological exercise—assembling evidence into justified conclusions that others can rely upon. Yet the tools auditors use fragment this process across disconnected systems, breaking the chain of reasoning that gives audit work its authority.

Obsidian Audit reconstructs the epistemic integrity of audit. Every procedure traces to its evidence. Every conclusion traces to its procedures. Every review traces to its reasoning. The entire engagement exists as a coherent, navigable structure of justified belief.`,
    href: '/platform/audit',
    icon: 'Shield',
    capabilities: [
      { title: 'Evidence Traceability', description: 'Complete chain from conclusion to source evidence. The chain is navigable, not just documented.' },
      { title: 'Review Workflows', description: 'Review notes aren\'t comments—they\'re part of the epistemic record. Preserve institutional reasoning.' },
      { title: 'Risk-Responsive Planning', description: 'The audit plan responds to assessed risks. Changes in risk assessment propagate through to affected procedures.' },
      { title: 'Engagement Economics', description: 'Time and budget integrated with work execution. Real-time visibility into engagement profitability.' },
      { title: 'Peer Review Ready', description: 'Documentation that satisfies the most demanding peer review. Built for inspection.' }
    ],
    audiences: [
      { segment: 'CPA Firms', description: 'From regional practices to national networks. Audit engagements from planning through opinion.' },
      { segment: 'Internal Audit', description: 'Risk-based audit planning, workpaper management, and findings tracking for corporate internal audit departments.' },
      { segment: 'Regulatory Examination', description: 'Bank examiners, insurance regulators, and government auditors who need defensible documentation.' },
      { segment: 'Quality-Focused Practices', description: 'Firms where audit quality isn\'t a compliance checkbox but a genuine competitive differentiator.' }
    ],
    platformIntegration: 'Built on Ontology for navigable engagement structures. Audit leverages the Obsidian Ontology to maintain relationships between clients, engagements, evidence, findings, and conclusions—creating an audit file that is truly navigable, not just organized.',
    problemStatement: `Professional audit standards demand rigorous documentation, clear reasoning chains, and evidence that supports every conclusion. Yet the tools auditors use actively undermine these requirements:

• Workpapers scattered across file systems, email, and shared drives
• Review notes lost in comment threads that expire
• Evidence that can't be traced to the conclusions it supports
• Institutional knowledge that disappears when staff turns over
• Hours wasted recreating work that was done last year

The irony is profound: the profession most concerned with documentation quality has accepted documentation tools that a peer reviewer would flag.`,
    approachStatement: `Obsidian Audit isn't project management software adapted for audit. It's built from first principles around how audit work actually creates justified belief.

Evidence → Procedures → Conclusions: Every conclusion traces back through the procedures that generated it to the evidence that supports it. The chain is navigable, not just documented.

Review as Reasoning: Review notes aren't comments—they're part of the epistemic record. The dialogue between preparer and reviewer is preserved as institutional knowledge.

Engagement Continuity: This year's audit builds on last year's. Prior findings, permanent file knowledge, and historical context are present where they're needed.`
  },
  {
    id: 'codex',
    name: 'Obsidian Codex',
    tagline: 'Intelligent Document Liberation',
    positioning: 'Institutional Memory Recovery',
    shortNarrative: 'Transforms paper archives into queryable institutional assets. Recognition systems trained on the hardest cases—degraded paper, inconsistent handwriting, mixed scripts.',
    fullNarrative: `Across the world, decades of critical institutional knowledge exist only on paper—handwritten ledgers, typed forms, annotated documents accumulating in archives that grow less accessible each year. This isn't a digitization problem. It's an institutional memory crisis.

Obsidian Codex is infrastructure for liberating trapped knowledge. We've engineered systems that can decipher degraded documents, inconsistent handwriting, and multi-lingual archives at scales that make comprehensive digitization finally viable. Not just OCR. Structured extraction that transforms paper artifacts into queryable institutional assets.`,
    href: '/platform/codex',
    icon: 'BookOpen',
    capabilities: [
      { title: 'Hardest-Case Recognition', description: 'Recognition systems trained on degraded paper, faded ink, inconsistent handwriting, mixed languages, non-Latin scripts.' },
      { title: 'Structured Extraction', description: 'Output structured data—fields, entities, relationships—that can be queried, analyzed, and integrated.' },
      { title: 'Human-in-the-Loop', description: 'For high-stakes accuracy, algorithmic confidence scores route uncertain extractions to human review.' },
      { title: 'National-Scale Architecture', description: 'Built for programs that measure archives in linear kilometers of shelving. Not desktop software.' },
      { title: 'Chain of Custody', description: 'Cryptographic proof of provenance from physical artifact through digital transformation. Legal defensibility.' }
    ],
    audiences: [
      { segment: 'Government Transformation', description: 'Ministries converting paper-based processes to digital services. Civil registration, land records, legal archives.' },
      { segment: 'National Archives', description: 'Preservation institutions responsible for cultural patrimony. Making historical records accessible.' },
      { segment: 'Healthcare Modernization', description: 'Hospital systems and national health services digitizing decades of patient records as part of EHR implementation.' },
      { segment: 'Legal Institutions', description: 'Courts, law firms, and regulatory bodies with historical case files requiring searchability and preservation.' }
    ],
    platformIntegration: 'Extracted entities flow directly into Obsidian Ontology, transforming paper archives into navigable knowledge graphs.',
    hardTruth: 'Most digitization projects fail not because scanning is hard, but because the resulting images are nearly as inaccessible as the original paper. Codex solves the actual problem: making the content accessible, not just the container.',
    problemStatement: `Around the world, critical institutional knowledge is locked in paper:

• Government ministries with decades of handwritten records essential for land rights, civil status, and legal proceedings
• Healthcare systems where patient histories exist only in deteriorating folders
• Legal institutions with case files spanning generations
• National archives preserving cultural patrimony in formats that grow less accessible each year

This isn't a scanning problem. Organizations have been scanning documents for decades. The problem is that images are nearly as inaccessible as the paper they replaced.

Finding a specific record still requires knowing which box it's in. Extracting data still requires human reading. Connecting information across documents remains impossible at scale.`,
    approachStatement: `Obsidian Codex solves the actual problem: making content accessible, not just capturing images.

Hardest-Case Recognition: Our systems are trained on the documents others give up on—degraded paper, faded ink, inconsistent handwriting, mixed languages, non-Latin scripts.

Structured Extraction: We don't output images with metadata. We output structured data—fields, entities, relationships—that can be queried and integrated.

National-Scale Architecture: This isn't desktop software for scanning a filing cabinet. Codex is built for programs that measure archives in linear kilometers of shelving.`
  },
  {
    id: 'forge',
    name: 'Obsidian Forge',
    tagline: 'Custom Intelligence Applications, Rapidly Deployed',
    positioning: 'Application Platform',
    shortNarrative: 'Build bespoke operational applications on the Obsidian platform—leveraging the ontology, integrations, and component library to deliver in weeks, not years.',
    fullNarrative: `Every organization has unique operational challenges that off-the-shelf software doesn't address. The choice has been: live with the gap, or embark on a multi-year custom development effort that may never deliver.

Obsidian Forge changes the calculus. It's a development environment for building bespoke intelligence applications on top of the Obsidian platform—leveraging the ontology, the data integrations, and the UI component library to deliver custom solutions in weeks, not years.`,
    href: '/platform/forge',
    icon: 'Hammer',
    capabilities: [
      { title: 'Platform Foundation', description: 'Authentication, authorization, audit logging, data persistence, API infrastructure—all provided. Focus on logic that matters.' },
      { title: 'Ontology-Native', description: 'Forge applications inherit the Obsidian Ontology. Enterprise data connections are immediately available.' },
      { title: 'Component Library', description: 'Pre-built UI components for common enterprise patterns—data grids, forms, workflows, dashboards.' },
      { title: 'Code When Needed', description: 'Start with low-code configuration. Drop to full code when complexity demands. The platform doesn\'t constrain ambition.' },
      { title: 'First-Class Citizenship', description: 'Forge applications share data, users, and context with Audit, Codex, and every other Obsidian product.' }
    ],
    audiences: [
      { segment: 'Enterprise IT', description: 'Deliver internal solutions faster without sacrificing quality. Build on proven infrastructure.' },
      { segment: 'Operational Excellence', description: 'Encode unique processes into software that enforces best practice and captures institutional knowledge.' },
      { segment: 'Systems Integrators', description: 'Build client solutions on a platform designed for rapid deployment and long-term maintainability.' },
      { segment: 'Unique Workflows', description: 'If you\'ve said "no software does exactly what we need," Forge is how you build what doesn\'t exist—fast.' }
    ],
    platformIntegration: 'Forge applications are first-class citizens of the Obsidian ecosystem—sharing data, ontology, and user context with Audit, Codex, and any other Obsidian products deployed.',
    problemStatement: `For unique operational requirements, organizations face an impossible choice:

BUY: Accept software that sort-of fits. Live with workarounds, manual processes, and the features you need but will never get.

BUILD: Embark on a custom development project. Staff it. Scope it. Watch timelines extend and budgets expand. Hope it still makes sense when it finally delivers—if it delivers.

Most organizations oscillate between both, accumulating technical debt in either direction.

The problem isn't build vs. buy. It's that building from scratch is unnecessarily hard, and buying assumes your needs are standard.`,
    approachStatement: `Obsidian Forge changes the economics of bespoke software by providing the infrastructure that every enterprise application needs—so your team only builds the parts that are actually unique.

Platform Foundation: Authentication, authorization, audit logging, data persistence, API infrastructure—all provided. You focus on the logic that matters.

Ontology-Native: Forge applications inherit the Obsidian Ontology. Entities, relationships, and data connections from across your enterprise are immediately available.

First-Class Citizenship: Forge applications aren't second-class. They share data, users, and context with Audit, Codex, and every other Obsidian product.`
  }
];

/**
 * Helper function to get a product by ID
 */
export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

/**
 * Helper function to get all products except the specified one
 */
export function getOtherProducts(excludeId: string): Product[] {
  return products.filter(p => p.id !== excludeId);
}
