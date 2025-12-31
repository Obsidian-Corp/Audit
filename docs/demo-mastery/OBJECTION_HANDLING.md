# Obsidian Audit: Objection & Question Bank

## How to Use This Document
Don't memorize answers. Understand the underlying concern,
then respond authentically. These are frameworks, not scripts.

---

## Competitive Questions

### "How is this different from TeamMate?"

**Their real concern:** Why switch from something established?

**Response Framework:**

> "TeamMate is solid—it's been the standard for years. The difference is architectural.
>
> TeamMate was built as a document management system with audit features added. Obsidian was built around how audit reasoning actually works—the chain from evidence to conclusion.
>
> Let me show you specifically what I mean..."

Navigate to traceability demo.

> "Could you do this in TeamMate? You'd have to build it yourself with cross-references and hope everyone follows the convention. Here, it's the architecture."

**Key differentiators to mention:**
- Modern UI vs. Windows application
- Real-time collaboration vs. file locking
- Integrated time tracking
- Calculated status vs. manual updates

---

### "How is this different from CaseWare?"

**Their real concern:** We already invested in something.

**Response Framework:**

> "CaseWare is powerful—especially for larger firms with complex needs. What we hear from firms is that power comes with complexity. Training takes months. Customization requires consultants.
>
> Obsidian is opinionated. We made decisions about how audit workflows should work based on talking to practitioners. You trade some configurability for a system that works out of the box the way auditors actually think.
>
> For firms between 10 and 200 people, that tradeoff usually makes sense."

**Key differentiators:**
- Faster implementation (weeks, not months)
- Lower training overhead
- Modern cloud architecture
- Built-in best practices vs. build-your-own

---

### "How is this different from Workiva?"

**Their real concern:** Enterprise reputation matters.

**Response Framework:**

> "Workiva is excellent for large enterprise compliance—SOX documentation, SEC reporting. That's their strength.
>
> Obsidian is purpose-built for audit engagements. Every feature is designed around the audit workflow, not adapted from a compliance platform.
>
> For external audit firms, that focus makes a difference. For corporate audit departments focused on SOX, Workiva might be the better fit."

---

### "We built our own system in SharePoint/Excel"

**Their real concern:** We've invested time in our current approach.

**Response Framework:**

> "That shows initiative—you recognized the problem and solved it. The question is: what's the cost of maintaining that solution?
>
> When SharePoint updates, does your system break? When someone leaves, does the knowledge of how it works leave with them? When you want a new feature, who builds it?
>
> Obsidian gives you a system that's maintained, updated, and improved—without your team carrying that burden. The question is whether the productivity gain justifies moving from a custom solution to a purpose-built platform."

**Follow up:** Ask about their maintenance burden. Often reveals frustration.

---

## Implementation Questions

### "How long does implementation take?"

**Their real concern:** We can't disrupt busy season.

**Response Framework:**

> "For a typical 20-50 person firm, we see full adoption in 4-6 weeks. That's not elapsed time—that's active implementation time.
>
> Here's what that looks like:
> - Week 1: Firm setup, user configuration, data import
> - Week 2: Template customization, workflow configuration
> - Weeks 3-4: Training and first pilot engagement
> - Weeks 5-6: Full team rollout with support
>
> Most firms start with one engagement as a pilot. Staff learns on real work, not theoretical training. By the second engagement, they're faster than the old system."

**Key point:** Avoid busy season. Plan for late spring or early fall start.

---

### "Can we migrate our existing workpapers?"

**Their real concern:** We don't want to lose historical work.

**Response Framework:**

> "Yes, with some nuance. Documents—PDFs, Word files, Excel—import directly. They become evidence in the new system.
>
> What doesn't migrate automatically is the *structure*—the relationships between workpapers, the review history, the traceability links. Those didn't exist in your old system in a structured way.
>
> Most firms treat the transition as a clean start. Prior year files are accessible for reference, but the new engagement builds fresh in Obsidian with proper structure from day one.
>
> Some firms import prior year workpapers as starting templates. Others use them as reference only. We'll work with you on what makes sense for your situation."

---

### "What about our custom templates?"

**Their real concern:** We've invested in our methodology.

**Response Framework:**

> "Your templates can be imported and converted to Obsidian templates. The formatting carries over; we add the structure.
>
> What changes is that templates become *active*—they're not just documents, they're connected to procedures, evidence requirements, and review workflows.
>
> We'd work with you during implementation to convert your priority templates. Most firms start with 10-20 core templates and add more over time.
>
> Would it help to see what a converted template looks like?"

---

### "What training is required?"

**Their real concern:** We don't have time for training.

**Response Framework:**

> "The system is designed to be intuitive—most auditors can start working within an hour.
>
> For formal training, we use a train-the-trainer model:
> - We train your internal champions (typically seniors or managers)
> - They train their teams as part of the first engagement
> - Learning happens on real work, not theoretical exercises
>
> We also provide video tutorials, documentation, and live support during the first few engagements."

---

## Security & Compliance Questions

### "Where is our data stored?"

**Response:**

> "Your data is stored in Supabase, which runs on AWS infrastructure, in US data centers.
>
> All data is encrypted at rest using AES-256 and in transit using TLS 1.3. We use Row-Level Security to ensure data isolation between firms—this is enforced at the database level, not just the application level.
>
> For firms with specific requirements—geographic restrictions, on-premise needs—we can discuss options. What are your specific requirements?"

---

### "Are you SOC 2 compliant?"

**Response (adjust based on current status):**

> "We're currently in the process of SOC 2 certification. Our infrastructure provider (Supabase/AWS) is SOC 2 compliant.
>
> Here's our current security posture: [brief overview of key controls].
>
> I'd be happy to connect you with our security team to discuss specifics. What particular controls are you most concerned about?"

---

### "What happens to our data if you go out of business?"

**Their real concern:** Startup risk.

**Response:**

> "Fair question. Your data is yours—you can export everything at any time in standard formats. We don't hold your data hostage.
>
> We're [funded/profitable/growing]. But even setting that aside, your data export capability means you're never locked in. You could export to another system or even back to file-based approaches if needed.
>
> Would it help to see the export functionality?"

---

### "Who can access our data?"

**Response:**

> "Only your authorized users can access your data. Our support team can access your data only with your explicit permission for troubleshooting.
>
> Row-Level Security means even if someone somehow got database access, they couldn't see data from other firms—it's enforced at the database engine level.
>
> We maintain detailed audit logs of all access. Would you like to see how access logging works?"

---

## Skeptical / Resistant Questions

### "My team won't adopt new software"

**Their real concern:** Change management is hard.

**Response:**

> "That's the real challenge, isn't it? Software is easy. People are hard.
>
> Here's what we've seen work: Start with your most tech-forward team member on a single engagement. Let them become the internal champion. Success spreads through demonstration, not mandate.
>
> Also—and I'll show you this—Obsidian is designed to reduce friction, not add it. Staff don't log time in a separate system. They don't hunt for templates. They don't wonder what's assigned.
>
> When the new tool is obviously easier, adoption follows."

**Follow up:** Who would be your internal champion? Let's make sure they're excited.

---

### "We tried [competitor] and it didn't work"

**Their real concern:** We've been burned before.

**Response:**

> "What went wrong?"

**Listen carefully.** Common answers:
- "Too complex" → Emphasize our opinionated, simple approach
- "Implementation took forever" → Emphasize our 4-6 week timeline
- "People didn't use it" → Emphasize UX and staff perspective
- "Support was bad" → Emphasize our hands-on implementation

Then:

> "That's useful context. Here's how Obsidian is different from that experience: [specific differentiation based on their answer]
>
> But honestly, the best way to know is to try it. Let's do a pilot on one engagement. Low commitment, real evaluation. If it doesn't work for you, you'll know quickly."

---

### "This seems like a lot of structure/overhead"

**Their real concern:** We're flexible; this looks rigid.

**Response:**

> "I understand that concern. Let me ask: Is your current approach truly flexible, or is it inconsistent?
>
> If your current approach is working—if peer reviewers aren't finding documentation gaps, if you're not losing institutional knowledge to turnover, if status is always accurate—then maybe you don't need this structure.
>
> For most firms, though, 'flexibility' means 'inconsistency.' Everyone has their own approach, nothing connects, and quality depends entirely on individual discipline.
>
> The structure in Obsidian isn't bureaucracy—it's the structure that professional standards actually require. We just make it effortless to follow."

---

### "We're too small/big for this"

**If too small (< 10 people):**

> "Smaller firms actually benefit most from structure—you don't have the bodies to compensate for inefficient processes. What's your current approach?"

**If too big (> 200 people):**

> "We work with firms up to about 200 people currently. Above that, you typically need more customization than we offer. That said, let's talk about your specific needs—we might be a good fit for specific practice groups or offices."

---

## Buying Process Questions

### "What does it cost?"

**Response (adjust to your actual pricing):**

> "Our pricing is per-user, based on role. Partners and managers are $X/month. Staff are $Y/month. Volume discounts apply for larger teams.
>
> But let me reframe that: what's the cost of your current approach?
>
> If we save each auditor 2 hours per engagement through better organization, what's that worth at your billing rates? If we eliminate one peer review finding, what's the reputational cost you avoided?
>
> The ROI conversation is more interesting than the price conversation. Should we talk through that together?"

---

### "We need to see a proposal"

**Response:**

> "Absolutely. To put together something relevant, I need to understand:
> - How many engagement team members?
> - Typical number of concurrent engagements?
> - Any specific requirements (security, integration, etc.)?
>
> Let me get those details and I'll have a proposal to you by [date]."

---

### "We need to involve [other stakeholder]"

**Response:**

> "Of course. What would be most helpful for them?
> - Another demo tailored to their concerns?
> - A technical deep-dive on security?
> - A reference call with a similar firm?
>
> I'm happy to tailor a session for their specific concerns. What are they most likely to ask about?"

---

### "We need to think about it"

**Their real concern:** Something is holding them back.

**Response:**

> "Absolutely understandable. What's the main thing you need to think through?
>
> Is it:
> - Timing with busy season?
> - Getting buy-in from others?
> - Comparing to other options?
> - Something about the product itself?
>
> Whatever it is, I'd rather address it now than have it be a blocker later."

---

### "Can we do a free trial?"

**Response (adjust to your policy):**

> "We don't do traditional free trials—audit software needs real setup and configuration to evaluate properly.
>
> What we do is a paid pilot: you pick one engagement, we set you up, and you run a real audit through the system. If it doesn't work for you, we refund the pilot fee.
>
> This gives you a real evaluation, not a toy sandbox. Interested?"

---

## Questions YOU Should Ask THEM

### Discovery Questions
- "Walk me through how an engagement gets set up today."
- "When a peer reviewer has a question, how do they find the answer?"
- "How do you currently track engagement status?"
- "What's your biggest frustration with current tools?"
- "What happened in your last peer review that you wish had gone differently?"

### Qualification Questions
- "If this solves [problem they mentioned], what happens next?"
- "Who else would need to be involved in this decision?"
- "What's your timeline for making a change?"
- "Have you evaluated other solutions? What did you learn?"
- "What's your budget for audit technology?"

### Closing Questions
- "What would you need to see to feel confident moving forward?"
- "Should we set up a pilot engagement?"
- "What questions do you still have?"
- "What's the best next step from here?"

### Challenge Questions (when appropriate)
- "You mentioned [problem]. How much does that cost you annually?"
- "What happens if you don't change anything?"
- "Why hasn't this been solved before?"

---

## Red Flags to Watch For

| Signal | What It Means | How to Respond |
|--------|---------------|----------------|
| "We love it, we'll be in touch" | No commitment, may ghost | Ask for specific next step and date |
| Asking only about price | May be price shopping | Redirect to value conversation |
| "The partner will decide" | May not have buying authority | Ask to involve partner |
| Vague about timeline | Not urgent, may deprioritize | Understand what would make it urgent |
| "We need to see X competitor first" | You may be column fodder | Ask what they're hoping to find |
| Lots of IT questions, no business questions | IT may block, business not engaged | Ask about business stakeholder involvement |
