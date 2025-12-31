/**
 * SEED REMAINING EMPTY TABLES
 * ============================
 * Creates data for: review_notes, audit_samples
 */

const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic";
const BASE_URL = "https://qtsvdeauuawfewdzbflr.supabase.co/rest/v1";
const FIRM_ID = "00000000-0000-0000-0000-000000000001";

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function supabasePost(table, data) {
  const response = await fetch(`${BASE_URL}/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert into ${table}: ${error}`);
  }
  return response.json();
}

async function supabaseGet(table, params = '') {
  const response = await fetch(`${BASE_URL}/${table}${params}`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  return response.json();
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createAuditSamples(audits, profiles) {
  console.log('Creating audit samples...');

  const auditAreas = ['Cash', 'Accounts Receivable', 'Inventory', 'Fixed Assets', 'Accounts Payable', 'Payroll', 'Revenue', 'Expenses'];
  const samplingMethods = ['MUS', 'classical_variables', 'attribute'];
  const riskAssessments = ['low', 'moderate', 'high'];

  const samples = [];

  for (const audit of audits.slice(0, 15)) {
    // Create 2-4 samples per engagement
    const numSamples = Math.floor(Math.random() * 3) + 2;
    const usedAreas = new Set();

    for (let i = 0; i < numSamples; i++) {
      let area = randomFrom(auditAreas);
      // Ensure unique areas per audit
      while (usedAreas.has(area)) {
        area = randomFrom(auditAreas);
      }
      usedAreas.add(area);

      const samplingMethod = randomFrom(samplingMethods);
      const populationSize = Math.floor(Math.random() * 5000) + 100;
      const populationValue = populationSize * (Math.floor(Math.random() * 500) + 50);
      const sampleSize = Math.floor(populationSize * (0.05 + Math.random() * 0.15)); // 5-20% of population
      const materialityAmount = Math.floor(populationValue * 0.03); // 3% of population value

      samples.push({
        id: uuid(),
        engagement_id: audit.id,
        created_by: randomFrom(profiles).id,
        audit_area: area,
        sampling_method: samplingMethod,
        population_size: populationSize,
        population_value: populationValue,
        sample_size: Math.max(sampleSize, 10), // Minimum 10 items
        materiality_amount: materialityAmount,
        risk_assessment: randomFrom(riskAssessments),
        expected_misstatement_rate: Math.floor(Math.random() * 5), // 0-5%
        tolerable_misstatement: Math.floor(materialityAmount * 0.5),
        sampling_interval: samplingMethod === 'MUS' ? Math.floor(populationValue / sampleSize) : null,
        random_seed: Math.floor(Math.random() * 1000000),
        selected_items: JSON.stringify([]),
        actual_misstatements: Math.floor(Math.random() * 1000)
      });
    }
  }

  try {
    const result = await supabasePost('audit_samples', samples);
    console.log(`✓ Created ${result.length} audit samples`);
    return result;
  } catch (err) {
    console.log(`✗ Error creating audit samples: ${err.message}`);
    return [];
  }
}

async function createReviewNotes(workpapers, profiles) {
  console.log('Creating review notes...');

  // Get auth users - review_notes requires auth.users FK, not profiles
  const authUsers = await supabaseGet('profiles', '?select=id');

  if (!authUsers || authUsers.length === 0) {
    console.log('✗ No profiles found for review notes');
    return [];
  }

  const noteTypes = ['comment', 'question', 'issue', 'suggestion'];
  const statuses = ['open', 'addressed', 'resolved'];
  const priorities = ['low', 'medium', 'high'];

  const noteTemplates = {
    comment: [
      'This looks good, but please double-check the calculation methodology.',
      'Consider adding additional documentation for the sampling rationale.',
      'The analysis is comprehensive. Good work on the tie-outs.',
      'Please ensure all supporting documents are attached.',
      'The testing approach aligns with our audit methodology.',
      'Good documentation of control testing procedures.'
    ],
    question: [
      'Can you clarify the source of this balance?',
      'What was the basis for the sample selection?',
      'Have we considered the impact on other accounts?',
      'What is the materiality threshold applied here?',
      'Did you perform rollforward procedures?',
      'What is the cutoff date used for this testing?'
    ],
    issue: [
      'Variance explanation is missing for this balance.',
      'The supporting documentation appears incomplete.',
      'Control testing results do not match the conclusion.',
      'Discrepancy noted between system report and workpaper.',
      'Sample size calculation needs to be revised.',
      'Missing management representation for this estimate.'
    ],
    suggestion: [
      'Consider using data analytics for this testing.',
      'Recommend expanding sample to cover additional locations.',
      'May want to include sensitivity analysis for key assumptions.',
      'Suggest adding trend analysis to support reasonableness.',
      'Consider updating the testing approach for next year.',
      'Recommend adding additional review checkpoints.'
    ]
  };

  const notes = [];

  // Create notes for each workpaper
  for (const workpaper of workpapers) {
    // 1-3 notes per workpaper
    const numNotes = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numNotes; i++) {
      const noteType = randomFrom(noteTypes);
      const status = randomFrom(statuses);
      const authorId = randomFrom(authUsers).id;

      // All notes have same structure - nulls for optional fields
      const note = {
        id: uuid(),
        workpaper_id: workpaper.id,
        author_id: authorId,
        note_type: noteType,
        content: randomFrom(noteTemplates[noteType]),
        priority: randomFrom(priorities),
        status: status,
        resolved_by: null,
        resolved_at: null,
        resolution_notes: null
      };

      // Add resolution info for resolved notes
      if (status === 'resolved') {
        note.resolved_by = randomFrom(authUsers).id;
        note.resolved_at = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
        note.resolution_notes = 'Issue has been addressed and verified.';
      } else if (status === 'addressed') {
        note.resolution_notes = 'Working on this - will update shortly.';
      }

      notes.push(note);
    }
  }

  try {
    const result = await supabasePost('review_notes', notes);
    console.log(`✓ Created ${result.length} review notes`);
    return result;
  } catch (err) {
    console.log(`✗ Error creating review notes: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log('=== Seeding Remaining Empty Tables ===\n');

  // Get existing data
  const audits = await supabaseGet('audits', `?select=id,audit_title&firm_id=eq.${FIRM_ID}`);
  const profiles = await supabaseGet('profiles', '?select=id,first_name,last_name');
  const workpapers = await supabaseGet('audit_workpapers', '?select=id,title&limit=50');

  console.log(`Found ${audits?.length || 0} audits, ${profiles?.length || 0} profiles, ${workpapers?.length || 0} workpapers\n`);

  // Create audit samples
  if (audits && profiles && audits.length > 0) {
    await createAuditSamples(audits, profiles);
  } else {
    console.log('✗ Cannot create audit samples - missing audits or profiles');
  }

  // Create review notes
  if (workpapers && profiles && workpapers.length > 0) {
    await createReviewNotes(workpapers, profiles);
  } else {
    console.log('✗ Cannot create review notes - missing workpapers or profiles');
  }

  console.log('\n=== Verifying Results ===');

  // Verify counts
  const sampleCount = await supabaseGet('audit_samples', '?select=count');
  const notesCount = await supabaseGet('review_notes', '?select=count');

  console.log(`audit_samples: ${sampleCount[0]?.count || 0}`);
  console.log(`review_notes: ${notesCount[0]?.count || 0}`);

  console.log('\n=== Done ===');
}

main().catch(console.error);
