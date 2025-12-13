# SOC 2 Type II Audit Procedures

## Program Overview

**Program Type:** SOC 2 Type II Audit (Service Organization Control 2)
**Industries:** Technology, SaaS, Cloud Services, Data Centers, Managed Service Providers
**Objective:** To provide assurance over the design and operating effectiveness of controls relevant to security, availability, processing integrity, confidentiality, and privacy over a defined period (typically 12 months).

**Standards:** Conducted in accordance with AICPA's AT-C Section 105 and 205, using the Trust Services Criteria framework.

## Trust Services Criteria Overview

### Available Trust Services Criteria
1. **Security (CC)** - Required for all SOC 2 audits
2. **Availability (A)** - Optional
3. **Processing Integrity (PI)** - Optional
4. **Confidentiality (C)** - Optional
5. **Privacy (P)** - Optional

**Note:** Security (Common Criteria) is always required. Other criteria are selected based on service commitments and system requirements.

## Common Criteria (Security) - Required

### CC1: Control Environment

#### CC1.1 COSO Principles
**Objective:** Evaluate whether the organization demonstrates a commitment to integrity and ethical values

**Procedures:**
1. Review code of conduct and ethics policies
2. Interview management about tone at the top
3. Review board meeting minutes for governance oversight
4. Assess management's commitment to competence
5. Review organizational structure and reporting lines
6. Evaluate performance management and incentive systems
7. Review evidence of ethics training and acknowledgment

**Sample Size:** All policies, Board meetings during audit period
**Evidence Required:** Code of conduct, board minutes, org charts, training records
**Estimated Hours:** 6 hours

**Common Issues:**
- Lack of documented ethics policies
- No evidence of board oversight
- Ethics training not conducted
- Conflicts of interest not managed

#### CC1.2 Board Independence and Oversight
**Objective:** Verify the board exercises oversight of system and controls

**Procedures:**
1. Review board composition and independence
2. Review board charter and committee structures
3. Test board meeting frequency and attendance
4. Review topics discussed including risk and security
5. Assess board's technology and security expertise
6. Review management reporting to board

**Sample Size:** All board meetings during period
**Evidence Required:** Board charter, meeting minutes, attendance records
**Estimated Hours:** 4 hours

### CC2: Communication and Information

#### CC2.1 Quality of Information
**Objective:** Verify the organization obtains and uses quality information

**Procedures:**
1. Review information systems supporting operations and control
2. Test data quality controls and validation
3. Review information flow between departments
4. Assess timeliness and accuracy of reporting
5. Test management reporting processes

**Sample Size:** 15-20 management reports
**Evidence Required:** Reports, data validation procedures, system documentation
**Estimated Hours:** 5 hours

#### CC2.2 Internal Communication
**Objective:** Test internal communication of information supporting controls

**Procedures:**
1. Review internal communication channels
2. Test communication of security policies to employees
3. Review security awareness training program
4. Test incident communication procedures
5. Review change communication processes

**Sample Size:** Sample of communications, all employees for training
**Evidence Required:** Communication logs, training records, policies
**Estimated Hours:** 4 hours

#### CC2.3 External Communication
**Objective:** Test communication with external parties

**Procedures:**
1. Review customer communication about system changes
2. Test vendor communication processes
3. Review incident notification procedures for customers
4. Test communication of system requirements to vendors
5. Review customer feedback mechanisms

**Sample Size:** Sample of external communications
**Evidence Required:** Customer notifications, vendor communications
**Estimated Hours:** 3 hours

### CC3: Risk Assessment

#### CC3.1-CC3.4 Risk Assessment Process
**Objective:** Verify the organization identifies, analyzes, and manages risks

**Procedures:**
1. Review risk assessment methodology and framework
2. Verify risk assessments are performed at least annually
3. Test identification of risks including:
   - Infrastructure risks
   - Software risks
   - Security risks
   - Compliance risks
   - Third-party risks
4. Review risk rating methodology (likelihood and impact)
5. Test that risk responses are appropriate
6. Review risk register and monitoring
7. Assess consideration of fraud risks

**Sample Size:** Annual risk assessment, quarterly reviews
**Evidence Required:** Risk assessment documentation, risk register, treatment plans
**Estimated Hours:** 8 hours

**Common Issues:**
- Risk assessments not performed regularly
- Risks not properly rated
- No evidence of risk response/mitigation
- Fraud risks not considered

### CC4: Monitoring Activities

#### CC4.1 Ongoing and Periodic Evaluations
**Objective:** Test monitoring and evaluation of controls

**Procedures:**
1. Review control monitoring program
2. Test ongoing monitoring activities:
   - Log reviews
   - Vulnerability scans
   - Performance monitoring
   - Security dashboards
3. Test periodic evaluations:
   - Internal audits
   - Control self-assessments
   - Penetration testing
4. Review findings from monitoring and testing
5. Assess remediation of identified issues

**Sample Size:** Sample of monitoring activities throughout period
**Evidence Required:** Monitoring logs, scan results, test reports, remediation records
**Estimated Hours:** 6 hours

### CC5: Control Activities

#### CC5.1 Control Activity Design and Implementation
**Objective:** Verify controls are designed and implemented to mitigate risks

**Procedures:**
1. Understand control activities for each TSC
2. Review control design documentation
3. Test implementation of controls through:
   - Walkthroughs
   - Inquiry
   - Observation
   - Inspection
4. Assess whether controls adequately address risks

**Sample Size:** All key controls identified
**Evidence Required:** Control documentation, walkthrough notes
**Estimated Hours:** 10 hours

### CC6: Logical and Physical Access Controls

#### CC6.1 Logical Access - User Identification
**Objective:** Test unique user identification and authentication

**Procedures:**
1. Review access control policies and standards
2. Test that all users have unique identifiers
3. Review shared/generic account usage and justification
4. Test authentication requirements (password complexity)
5. Verify multi-factor authentication for sensitive access
6. Test account lockout after failed attempts

**Sample Size:** All critical systems, sample of 25-30 user accounts
**Evidence Required:** Access control policies, user listings, system configurations, authentication logs
**Estimated Hours:** 6 hours

**Common Issues:**
- Shared accounts without justification
- Weak password requirements
- MFA not implemented for remote access
- Service accounts with weak passwords

#### CC6.2 New User Access Provisioning
**Objective:** Test user access request and approval process

**Procedures:**
1. Review access request and approval procedures
2. Select sample of 25 new user accounts created during period
3. For each user:
   - Verify access request form completed
   - Verify appropriate management approval obtained
   - Verify access granted matches request
   - Verify timely provisioning
   - Verify segregation of duties in approval process
4. Test that default access is least privilege

**Sample Size:** 25 new user accounts across systems
**Evidence Required:** Access request forms, approval emails, system logs, before/after access reports
**Estimated Hours:** 5 hours

**Common Issues:**
- Missing approvals or inadequate approvers
- Access granted exceeds what was approved
- No formal request process
- Provisioning delays

#### CC6.3 User Access Modifications and Terminations
**Objective:** Test access modification and deprovisioning controls

**Procedures:**
1. **Access Modifications:**
   - Review modification request procedures
   - Test sample of 15-20 access modifications
   - Verify proper approval obtained
   - Verify access changed matches request
2. **Terminations:**
   - Obtain HR termination list for audit period
   - Test all terminations for timely access removal
   - Verify access removed same day or next business day
   - Test across all critical systems
   - Identify any delays or incomplete deprovisioning

**Sample Size:** 15-20 modifications, all terminations
**Evidence Required:** Modification requests, HR termination list, access reports, deprovisioning tickets
**Estimated Hours:** 6 hours

**Common Issues:**
- Terminated users retain access
- Access not removed from all systems
- Deprovisioning delays beyond policy
- No approval for access increases

#### CC6.4 Periodic Access Reviews
**Objective:** Test periodic review of user access rights

**Procedures:**
1. Review access review policy and frequency
2. Test access reviews were performed at required frequency (quarterly typical)
3. Select 3-4 quarterly access reviews for testing
4. For each review:
   - Verify completeness of user population
   - Verify review performed by appropriate management
   - Test that inappropriate access was identified
   - Verify remediation of access issues
   - Test timeliness of remediation
5. Test for evidence of re-performance or validation

**Sample Size:** 3-4 quarterly reviews, sample of users reviewed
**Evidence Required:** Access review certifications, user access reports, remediation documentation
**Estimated Hours:** 8 hours

**Common Issues:**
- Reviews not performed at required frequency
- Reviews not comprehensive
- Inappropriate access not identified
- Remediation not timely or incomplete

#### CC6.5 Physical Access Controls
**Objective:** Test physical security controls over facilities and equipment

**Procedures:**
1. Review physical security policies
2. Test facility access controls:
   - Badge access systems
   - Visitor management
   - Security guards/monitoring
   - CCTV systems
3. Review access rights to facilities
4. Test visitor logs and escort procedures
5. Review physical access provisioning/deprovisioning
6. Test alarm and monitoring systems
7. Assess environmental controls (if applicable)

**Sample Size:** Sample of access events, all facilities
**Evidence Required:** Physical access logs, visitor logs, badge lists, security policies
**Estimated Hours:** 5 hours

### CC7: System Operations

#### CC7.1 Detection of Security Events
**Objective:** Test detection and monitoring of security events

**Procedures:**
1. Review security monitoring tools and procedures:
   - SIEM/log aggregation
   - IDS/IPS systems
   - Antivirus/EDR
   - Application monitoring
2. Test that logs are collected from critical systems
3. Review log retention meets requirements
4. Test monitoring rules and alerts
5. Review security events identified during period
6. Assess coverage of monitoring

**Sample Size:** All critical systems, sample of alerts
**Evidence Required:** Monitoring tool configurations, logs, alert rules, event reports
**Estimated Hours:** 6 hours

**Common Issues:**
- Inadequate log coverage
- Alerts not properly configured
- Logs not retained per requirements
- No centralized monitoring

#### CC7.2 Response to Security Events
**Objective:** Test incident response procedures

**Procedures:**
1. Review incident response plan and procedures
2. Test incident response team and roles
3. Select sample of 15-20 security incidents
4. For each incident:
   - Verify timely detection
   - Verify proper categorization and prioritization
   - Review investigation and root cause analysis
   - Assess containment and eradication
   - Review communication to stakeholders
   - Verify documentation completeness
5. Test lessons learned process
6. Review tabletop exercises or incident response tests

**Sample Size:** 15-20 incidents, including different severities
**Evidence Required:** Incident response plan, incident tickets, investigation reports, communication records
**Estimated Hours:** 8 hours

**Common Issues:**
- Incident response plan not tested
- Inadequate incident investigation
- Poor documentation
- Customer notification delays
- Lessons learned not captured

#### CC7.3-CC7.5 Security Event Management
**Objective:** Test security event detection, analysis, and mitigation

**Procedures:**
1. Review security event management process
2. Test vulnerability management:
   - Vulnerability scanning frequency
   - Coverage of scans
   - Remediation timelines
   - Tracking and monitoring
3. Test threat intelligence integration
4. Review security event trends and analysis
5. Assess preventive controls based on events

**Sample Size:** One quarter of vulnerability scans, sample of remediation
**Evidence Required:** Scan reports, remediation tracking, threat intelligence sources
**Estimated Hours:** 7 hours

### CC8: Change Management

#### CC8.1 Change Management Process
**Objective:** Test change management procedures for infrastructure and systems

**Procedures:**
1. Review change management policy and procedures
2. Understand change categories (standard, normal, emergency)
3. Select sample of 30 changes across categories:
   - Infrastructure changes
   - Application changes
   - Database changes
   - Security configuration changes
4. For each change:
   - Verify change request documented
   - Verify business justification
   - Verify appropriate approval obtained
   - Verify testing performed
   - Verify back-out plan documented
   - Verify deployment successful
   - Verify post-implementation review
5. Test emergency change procedures and retrospective approval

**Sample Size:** 30 changes across types and systems
**Evidence Required:** Change tickets, approval records, test results, deployment documentation
**Estimated Hours:** 10 hours

**Common Issues:**
- Changes not properly documented
- Inadequate approvals
- Testing not evidenced
- No back-out plans
- Emergency changes not retrospectively reviewed

### CC9: Risk Mitigation

#### CC9.1-CC9.2 Business Continuity and Disaster Recovery
**Objective:** Test business continuity and disaster recovery capabilities

**Procedures:**
1. Review BCP/DR policies and plans
2. Verify plans are updated annually
3. Review business impact analysis
4. Test recovery time objectives (RTO) and recovery point objectives (RPO)
5. Review DR testing procedures
6. Test sample of DR tests during period:
   - Review test plan and scope
   - Review test results and success criteria
   - Verify critical systems tested
   - Review issues identified and remediation
7. Test backup procedures (see CC9.1)
8. Test failover capabilities
9. Review communication plans for disasters

**Sample Size:** Annual plan review, all DR tests during period
**Evidence Required:** BCP/DR plans, BIA, test results, backup reports
**Estimated Hours:** 10 hours

**Common Issues:**
- DR not tested at required frequency
- Test scope inadequate
- RTO/RPO not achievable
- Plans not updated
- Backup restoration not tested

## Availability Criteria (Optional)

### A1.1-A1.3 System Availability
**Objective:** Test controls over system availability commitments

**Procedures:**
1. Review availability commitments to customers (SLAs)
2. Review system architecture for availability:
   - Redundancy
   - Failover capabilities
   - Load balancing
3. Test performance and capacity monitoring
4. Review system availability metrics during period
5. Test incident response for availability issues
6. Review capacity planning procedures
7. Test environmental protections (power, cooling, etc.)

**Sample Size:** All availability reports during period
**Evidence Required:** SLAs, availability reports, monitoring data, architecture diagrams
**Estimated Hours:** 8 hours

## Processing Integrity Criteria (Optional)

### PI1.1-PI1.5 Processing Integrity
**Objective:** Test that system processing is complete, valid, accurate, timely, and authorized

**Procedures:**
1. Review processing integrity commitments
2. Test input validation controls
3. Test processing logic and calculations
4. Test completeness of processing
5. Review error handling and correction
6. Test output review and validation
7. Review processing monitoring and reconciliation

**Sample Size:** Sample of transactions and processes
**Evidence Required:** Process documentation, validation rules, error logs, reconciliations
**Estimated Hours:** 10 hours

## Confidentiality Criteria (Optional)

### C1.1-C1.2 Confidentiality
**Objective:** Test protection of confidential information

**Procedures:**
1. Review confidential information classification
2. Test encryption of confidential data:
   - At rest
   - In transit
3. Test access controls specific to confidential data
4. Review confidentiality agreements with employees/vendors
5. Test secure disposal of confidential information
6. Review data leakage prevention controls

**Sample Size:** All confidential data systems
**Evidence Required:** Encryption configurations, NDAs, disposal records, DLP configurations
**Estimated Hours:** 8 hours

## Privacy Criteria (Optional)

### P1.1-P8.1 Privacy
**Objective:** Test privacy controls over personal information

**Procedures:**
1. Review privacy notice and consent mechanisms
2. Test data collection is limited to specified purposes
3. Test data retention and disposal
4. Test data subject access request procedures
5. Review data breach notification procedures
6. Test third-party data sharing controls
7. Review compliance with privacy regulations (GDPR, CCPA, etc.)
8. Test data quality and accuracy

**Sample Size:** Sample of privacy processes
**Evidence Required:** Privacy notices, consent records, DSR logs, DPIAs, vendor agreements
**Estimated Hours:** 12 hours

## Control Testing Requirements

### Testing Approach
**Type I (Design):** Testing at a point in time
**Type II (Operating Effectiveness):** Testing over a period (minimum 6 months, typically 12 months)

### Type II Sample Sizes (Operating Effectiveness)

#### High-Frequency Controls (Daily/Weekly)
- Manual controls: 25 samples spread across period
- Automated controls: 1 sample + test of change management
- Exception reports: 10-15 samples

#### Medium-Frequency Controls (Monthly/Quarterly)
- Manual controls: All instances or 8-12 samples
- Automated controls: 1 sample + test of change management

#### Low-Frequency Controls (Annual)
- Manual controls: 1-2 instances
- Automated controls: 1 sample + test of change management

### Automated Controls Testing
For automated controls:
1. Test the control once to verify it operates as designed
2. Test IT general controls (ITGC) supporting the automated control:
   - Access controls
   - Change management
   - Computer operations
3. If ITGCs are effective, no additional testing of automated control needed

## Documentation Requirements

### Required Documentation
1. **System Description:**
   - Services provided
   - System components
   - Infrastructure
   - Software
   - People
   - Procedures
   - Data
   - System boundaries
2. **Control Matrix:**
   - Trust Services Criteria
   - Control objectives
   - Controls designed
   - Testing performed
   - Results
3. **Testing Work Papers:**
   - Test of design
   - Test of operating effectiveness
   - Samples selected
   - Evidence examined
   - Exceptions noted
4. **Management Representations:**
   - Assertion letter
   - Completeness representations
5. **Exceptions and Qualifications:**
   - Control deficiencies
   - Modified opinions

### Evidence Standards
- Contemporaneous evidence preferred
- Screenshots acceptable with metadata
- System-generated reports preferred over manual
- Evidence must cover entire audit period
- Exception analysis and management response required

## Deliverables

### Primary Deliverables
1. **SOC 2 Type II Report:**
   - Service auditor's report (opinion)
   - Management's assertion
   - System description
   - Trust Services Criteria
   - Control objectives
   - Controls and tests performed
   - Results of tests
   - Other information (if applicable)

### Report Sections
- Section I: Independent Service Auditor's Report
- Section II: Management's Assertion
- Section III: System Description
- Section IV: Trust Services Criteria, Controls, Tests, and Results

### Timeline Considerations
- Planning and scoping: 2-4 weeks
- System description review: 2-3 weeks
- Design testing (Type I): 3-4 weeks
- Operating effectiveness testing (Type II): Throughout audit period
- Reporting and review: 3-4 weeks
- Audit period: Typically 12 months
- Report delivery: 45-90 days after period end

## Common Findings and Issues

### High-Risk Findings
1. **Access Control Deficiencies:**
   - Terminated users retain access
   - Excessive privileged access
   - Inadequate access reviews
   - Weak authentication

2. **Change Management Issues:**
   - Changes without approval
   - Inadequate testing
   - No back-out plans
   - Poor documentation

3. **Monitoring Gaps:**
   - Insufficient log coverage
   - Alerts not configured
   - Incidents not investigated
   - Vulnerability remediation delays

4. **DR/BCP Weaknesses:**
   - DR not tested
   - Backups not validated
   - Inadequate plans
   - RTOs not achievable

### Other Common Issues
- Policies not updated annually
- Security awareness training gaps
- Vendor management inadequate
- Risk assessments incomplete
- Physical security deficiencies

## User Entity Considerations

### Complementary User Entity Controls (CUECs)
SOC 2 reports should identify controls that user entities must implement:

**Common CUECs:**
1. Users maintain strong passwords and protect credentials
2. Users promptly report security incidents
3. Users review access and activity logs
4. Users properly configure security settings
5. Users maintain their own backup and DR
6. Users implement network security controls
7. Users perform user access reviews

**Documenting CUECs:**
- Identify in system description
- Include in control objectives
- Test that service org communicates CUECs to users
- Document in SOC 2 report

## Required Team Competencies

### Engagement Team Roles
1. **Engagement Partner** - SOC 2 expertise and quality oversight
2. **Engagement Manager** - Day-to-day execution and review
3. **IT Audit Specialists** - Technical control testing
4. **Senior Auditors** - Control testing and documentation

### Required Skills and Certifications
- CPA license (required for partner)
- CISA (Certified Information Systems Auditor) - highly preferred
- CISSP (Certified Information Systems Security Professional) - preferred
- SOC 2 audit experience
- Understanding of Trust Services Criteria
- IT general controls expertise
- Cloud infrastructure knowledge
- Security and privacy frameworks knowledge
- Technical skills for evidence gathering (log analysis, configuration review)

## Scoping Considerations

### In-Scope Determination
1. **System Boundaries:**
   - Applications in scope
   - Infrastructure components
   - Third-party services (subservice organizations)
   - Geographic locations
   - Data centers

2. **Trust Services Categories:**
   - Security (always required)
   - Availability (if uptime commitment)
   - Processing Integrity (if processing accuracy commitment)
   - Confidentiality (if handling confidential data)
   - Privacy (if handling personal information)

3. **Carve-Out vs. Inclusive:**
   - **Carve-Out:** Subservice organization controls excluded
   - **Inclusive:** Subservice organization controls included in testing

### Subservice Organizations
If using subservice organizations (AWS, Azure, GCP, etc.):
1. Obtain subservice organization SOC 2 reports
2. Review controls relied upon
3. Test complementary controls at service organization
4. Properly disclose in system description
5. Address in service auditor's report

## Regulatory and Compliance Alignment

### Related Frameworks
- **ISO 27001** - Information security management
- **NIST CSF** - Cybersecurity framework
- **HIPAA** - Healthcare privacy and security
- **PCI DSS** - Payment card security
- **GDPR/CCPA** - Privacy regulations

### Mapping Controls
SOC 2 controls often satisfy requirements in other frameworks:
- Document control mapping
- Leverage testing across frameworks
- Consider integrated audits where applicable
