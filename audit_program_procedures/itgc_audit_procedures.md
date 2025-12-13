# IT General Controls (ITGC) Audit Procedures

## Program Overview

**Program Type:** IT General Controls Assessment
**Industries:** All industries with significant IT systems, especially Financial Services, Technology, Healthcare
**Objective:** To evaluate the design and operating effectiveness of IT general controls that support the reliability of information technology systems and the data they process.

**Standards:** Based on COBIT, COSO, ITIL frameworks and various regulatory requirements (SOX, FDICIA, etc.)

## Overview of ITGC Categories

IT General Controls are foundational controls that support the operating effectiveness of application controls and the reliability of financial reporting. The five main ITGC categories are:

1. **Access Controls** - Logical and physical security
2. **Change Management** - System and infrastructure changes
3. **Computer Operations** - Day-to-day IT operations
4. **Business Continuity/Disaster Recovery** - Resilience and recovery
5. **IT Governance and Organization** - IT management structure and oversight

## 1. Access Controls

### 1.1 User Access Provisioning (ITGC-100)

**Objective:** Ensure user access is properly requested, approved, and provisioned

**Procedures:**
1. Review access provisioning policies and procedures
2. Understand the access request and approval workflow
3. Select sample of 25 new user accounts created during period
4. For each user access request:
   - Obtain access request form or ticket
   - Verify business justification is documented
   - Verify appropriate management approval (user's manager minimum)
   - Verify access granted matches approved request
   - Verify role-based access is appropriately assigned
   - Verify default access follows least privilege principle
   - Verify provisioning occurred timely per policy
   - Verify segregation of duties (requester ≠ approver ≠ provisioner)
5. Test that access requests are retained per policy
6. Identify any access granted without proper approval

**Sample Size:** 25 new user accounts across critical systems
**Evidence Required:** Access request forms/tickets, approval emails, system logs, before/after access reports
**Estimated Hours:** 3-4 hours

**Common Issues:**
- Missing or inadequate approvals
- Access provisioned before approval
- Access exceeds what was requested/approved
- No formal request process for certain systems
- Segregation of duties violations
- Provisioning delays

---

### 1.2 User Access Deprovisioning (ITGC-101)

**Objective:** Ensure access is removed timely when users terminate or change roles

**Procedures:**
1. Review access termination policies and timelines
2. Obtain complete list of terminations from HR for audit period
3. For each termination:
   - Verify termination date from HR
   - Review access removal across ALL critical systems:
     - Active Directory
     - Email systems
     - Financial applications (ERP, GL)
     - HR systems
     - IT admin systems
     - VPN/remote access
     - Cloud applications
   - Verify access removed same day or next business day
   - Document any access removal delays
4. Test automated deprovisioning workflows if present
5. Review access removal tracking and monitoring
6. Test 15-20 role changes for appropriate access modifications

**Sample Size:** All terminations during period, 15-20 role changes
**Evidence Required:** HR termination list, system access reports (before/after), deprovisioning tickets, AD logs
**Estimated Hours:** 3-4 hours

**Common Issues:**
- Terminated users retain access beyond 1 business day
- Access not removed from all systems (orphaned accounts)
- No systematic tracking of access removal
- Delayed notification from HR to IT
- Role changes result in access accumulation

---

### 1.3 Periodic Access Reviews (ITGC-102)

**Objective:** Verify management performs regular reviews of user access rights

**Procedures:**
1. Review access review policy (frequency, scope, reviewers)
2. Identify all critical systems requiring access reviews
3. Verify reviews performed at required frequency (quarterly typical)
4. Select 3-4 access review cycles for testing
5. For each review cycle:
   - Obtain complete user access report used for review
   - Verify all users included in review scope
   - Verify review performed by appropriate management (system owners, data owners)
   - Verify review documented and signed off
   - Verify timeliness of review completion
   - Identify inappropriate access noted by reviewers
   - Verify remediation of inappropriate access
   - Test timeliness of remediation (within 30 days typical)
6. Test that new employees and role changes are captured in reviews
7. Assess completeness and quality of reviews

**Sample Size:** 3-4 quarterly review cycles, sample of 20-30 users per review
**Evidence Required:** Access review certifications, user access reports, remediation documentation, sign-off records
**Estimated Hours:** 4-5 hours

**Common Issues:**
- Reviews not performed at required frequency
- Reviews incomplete (not all users or systems covered)
- Reviewers not appropriate (not system/data owners)
- Inappropriate access not identified by reviewers
- Remediation not timely or incomplete
- No evidence of review sign-off
- Same person requests and approves own access

---

### 1.4 Privileged Access Management (ITGC-103)

**Objective:** Ensure elevated/administrative access is properly controlled and monitored

**Procedures:**
1. Review privileged access policies and procedures
2. Identify all privileged/administrative accounts:
   - Domain administrators
   - Database administrators
   - Application administrators
   - Security administrators
   - System administrators
   - Root/superuser accounts
3. For each privileged account or sample:
   - Verify business justification documented
   - Verify appropriate approval (senior management/security)
   - Verify periodic recertification of need
   - Review segregation of duties (admin vs. production access)
4. Test monitoring of privileged account usage:
   - Review privileged access logs
   - Verify alerting on suspicious activity
   - Test that privileged access is logged
5. Review privileged password management:
   - Password vaulting solution
   - Password rotation
   - Password complexity
6. Test emergency access procedures (break-glass accounts)

**Sample Size:** All privileged accounts or sample if population large
**Evidence Required:** Privileged user listing, approval documentation, activity logs, monitoring reports, password policy
**Estimated Hours:** 4-5 hours

**Common Issues:**
- Excessive privileged access granted
- No business justification for admin rights
- Privileged access not monitored
- Privileged passwords not managed securely
- Emergency access not controlled
- Developers with production admin access

---

### 1.5 Password Policy Controls (ITGC-104)

**Objective:** Verify password policies meet security requirements

**Procedures:**
1. Review password policy documentation
2. For each critical system, review password configuration:
   - Minimum length (12-14 characters recommended)
   - Complexity requirements (uppercase, lowercase, numbers, symbols)
   - Password expiration (90 days typical, or none if MFA)
   - Password history (prevent reuse of last 10-24 passwords)
   - Account lockout threshold (5-10 attempts)
   - Lockout duration
3. Test password policy settings in systems:
   - Active Directory
   - Linux/Unix systems
   - Database systems
   - Application systems
4. Verify default passwords are changed
5. Review exceptions to password policy
6. Test password reset procedures

**Sample Size:** All critical systems
**Evidence Required:** Password policy documentation, system configurations, screenshots of settings
**Estimated Hours:** 2-3 hours

**Common Issues:**
- Weak password requirements (length, complexity)
- No account lockout or high threshold
- Passwords never expire
- Password history not enforced
- Default passwords not changed
- Password policy not enforced on service accounts

---

### 1.6 Multi-Factor Authentication (ITGC-105)

**Objective:** Verify MFA is implemented for sensitive access

**Procedures:**
1. Review MFA policy and requirements
2. Verify MFA implementation for:
   - Remote access (VPN, remote desktop)
   - Privileged/administrative accounts
   - Cloud applications
   - Financial systems
   - Customer data access
   - Email access
3. Test MFA configuration:
   - Verify MFA cannot be bypassed
   - Review acceptable authentication factors
   - Test enrollment process
   - Review exception process and approvals
4. Select sample of 20-25 users and verify MFA enrolled
5. Test MFA functionality (if appropriate)
6. Review MFA logs and monitoring

**Sample Size:** Critical systems requiring MFA, sample of 20-25 users
**Evidence Required:** MFA configuration, user enrollment reports, policy documentation, exception approvals
**Estimated Hours:** 2-3 hours

**Common Issues:**
- MFA not required for remote access
- MFA not required for admin accounts
- MFA can be bypassed
- No MFA for cloud applications
- Exception process not controlled

---

### 1.7 Segregation of Duties (ITGC-106)

**Objective:** Verify incompatible access is prevented or detected

**Procedures:**
1. Review segregation of duties (SoD) matrix
2. Understand SoD conflicts defined by organization
3. Common SoD conflicts to test:
   - Ability to create and approve journal entries
   - Ability to create vendors and process payments
   - Ability to create users and approve access
   - Developer access to production
   - Ability to initiate and approve transactions
4. Obtain current user access reports for financial systems
5. Test user access against SoD matrix
6. Identify users with conflicting access
7. For identified conflicts:
   - Assess compensating controls (monitoring, management review)
   - Verify compensating controls are operating
   - Review business justification
8. Test preventive SoD controls if implemented in systems
9. Test detective controls (SoD violation monitoring/alerts)

**Sample Size:** All users with financial system access
**Evidence Required:** SoD matrix, user access reports, SoD conflict reports, compensating control evidence
**Estimated Hours:** 3-4 hours

**Common Issues:**
- No SoD matrix defined
- SoD conflicts not identified
- Inadequate compensating controls
- Compensating controls not operating
- Excessive super-user access

---

### 1.8 Service Account Management (ITGC-107)

**Objective:** Ensure service and system accounts are properly managed

**Procedures:**
1. Review service account management procedures
2. Obtain inventory of all service/system accounts
3. For each service account or sample:
   - Verify business purpose documented
   - Verify appropriate approval for creation
   - Verify password complexity requirements
   - Verify passwords excluded from expiration
   - Review password storage (encrypted/vaulted)
   - Assess if account truly needs service account or could use regular account
4. Test that service accounts cannot be used for interactive logon
5. Review monitoring of service account activity
6. Verify periodic review of service account inventory

**Sample Size:** All service accounts or sample if large population
**Evidence Required:** Service account inventory, approval documentation, password policy exceptions, activity monitoring
**Estimated Hours:** 3 hours

**Common Issues:**
- Service accounts not documented
- No approval process for service accounts
- Weak passwords on service accounts
- Service accounts used for interactive logon
- Excessive permissions granted
- No monitoring of service account usage

---

### 1.9 Physical Access Controls (ITGC-108)

**Objective:** Test physical security over facilities, data centers, and equipment

**Procedures:**
1. Review physical security policies
2. For each facility/data center:
   - Review access control systems (badge readers, biometrics)
   - Review security monitoring (guards, CCTV)
   - Review visitor management procedures
   - Review access provisioning/deprovisioning
3. Test badge access controls:
   - Obtain list of active badges
   - Reconcile to current employee/contractor list
   - Identify terminated individuals with active badges
4. Review physical access logs for sample period (1 month)
5. Test visitor access procedures:
   - Review visitor logs
   - Verify escort requirements
   - Verify visitor badge return
6. Review environmental controls:
   - HVAC systems
   - Fire suppression
   - Power (UPS, generators)
   - Water detection
7. Test alarm systems and incident response

**Sample Size:** All facilities, 1 month of access logs, sample of visitor entries
**Evidence Required:** Access logs, visitor logs, badge inventory, environmental monitoring reports
**Estimated Hours:** 5 hours (varies by number of facilities)

**Common Issues:**
- Terminated employees retain physical access
- Visitor access not properly controlled
- No escort requirements for visitors
- CCTV not monitored or retained
- Environmental controls not monitored

---

## 2. Change Management

### 2.1 Change Request and Approval Process (ITGC-200)

**Objective:** Verify all changes are properly requested, justified, and approved

**Procedures:**
1. Review change management policy and procedures
2. Understand change classification:
   - Emergency changes
   - Standard changes
   - Normal changes
3. Select sample of 25-30 changes spanning:
   - Different change types
   - Different systems/platforms
   - Throughout audit period
4. For each change:
   - Verify change ticket created in tracking system
   - Verify business justification documented
   - Verify risk assessment performed
   - Verify appropriate approval obtained:
     - Normal changes: Change Advisory Board (CAB) or manager
     - Emergency changes: Appropriate emergency approver
     - Standard changes: Pre-approved or automated
   - Verify approval obtained BEFORE implementation
   - Verify segregation of duties (requester ≠ approver ≠ implementer)
5. Test completeness of change population

**Sample Size:** 25-30 changes across types
**Evidence Required:** Change tickets, CAB meeting minutes, approval records, change management policy
**Estimated Hours:** 3-4 hours

**Common Issues:**
- Changes implemented without approval
- Inadequate business justification
- Approver not appropriate for change type
- No segregation of duties
- Emergency changes not properly justified
- Change documentation incomplete

---

### 2.2 Development and Testing Requirements (ITGC-201)

**Objective:** Verify changes are properly tested before production implementation

**Procedures:**
1. Review testing requirements and procedures
2. Select sample of 20 changes (subset from ITGC-200)
3. For each change:
   - Verify test plan documented
   - Verify testing performed in non-production environment
   - Verify test results documented
   - Verify test success criteria met
   - Verify defects/issues identified and resolved
   - Verify user acceptance testing (UAT) if applicable
   - Verify testing completed before production migration
4. Review test environment management
5. Verify test data management and masking

**Sample Size:** 20 changes
**Evidence Required:** Test plans, test results, defect logs, UAT sign-offs
**Estimated Hours:** 3 hours

**Common Issues:**
- No evidence of testing
- Testing in production
- Test results not documented
- Defects not resolved before implementation
- UAT not performed
- Production data used in testing without masking

---

### 2.3 Production Migration Controls (ITGC-202)

**Objective:** Ensure production deployments are controlled and authorized

**Procedures:**
1. Review production deployment procedures
2. Select sample of 20-25 production changes
3. For each deployment:
   - Verify deployment plan/checklist
   - Verify final approval for production implementation
   - Verify back-out/rollback plan documented
   - Verify segregation of duties (developer ≠ deployer)
   - Verify deployment window (maintenance window, change freeze)
   - Verify post-implementation verification
   - Review any deployment issues and resolution
4. Test version control usage
5. Review deployment automation and controls
6. Test that source code comes from controlled repository

**Sample Size:** 20-25 production deployments
**Evidence Required:** Deployment checklists, approval records, back-out plans, deployment logs
**Estimated Hours:** 4 hours

**Common Issues:**
- No back-out plan
- Developers deploying own code
- Code not from controlled source
- No post-implementation verification
- Deployments during change freeze periods

---

### 2.4 Emergency Change Procedures (ITGC-203)

**Objective:** Verify emergency changes are justified and reviewed

**Procedures:**
1. Review emergency change procedures
2. Identify all emergency changes during period
3. For each emergency change:
   - Verify genuine emergency justification
   - Verify appropriate emergency approval obtained
   - Verify approval timing (before or documented after)
   - Verify post-implementation review (PIR) performed
   - Verify PIR includes:
     - Root cause analysis
     - Justification for emergency process
     - Testing that was performed
     - Lessons learned
   - Verify proper testing performed (even if abbreviated)
4. Assess whether emergencies indicate process issues
5. Review trends in emergency changes

**Sample Size:** All emergency changes
**Evidence Required:** Emergency change tickets, approval records, PIR documentation
**Estimated Hours:** 2-3 hours

**Common Issues:**
- Excessive emergency changes
- Emergency changes not truly emergencies
- No post-implementation review
- No approval (even after the fact)
- Root cause not addressed

---

### 2.5 Change Environment Segregation (ITGC-204)

**Objective:** Verify proper segregation between development, test, and production environments

**Procedures:**
1. Review environment segregation policies
2. Verify separate environments exist:
   - Development
   - Testing/QA
   - Production
   - (DR environment if applicable)
3. Review network segregation between environments
4. Test access controls:
   - Verify developers do not have access to production systems
   - Verify production changes come from controlled migration
   - Review exceptions and justification
5. Test controls preventing unauthorized code migration
6. Review data flow between environments
7. Verify production data is masked in lower environments

**Sample Size:** All critical applications/systems
**Evidence Required:** Environment documentation, network diagrams, access reports, migration logs
**Estimated Hours:** 3 hours

**Common Issues:**
- Developers with production access
- Weak segregation between environments
- Direct changes to production (not through migration)
- Production data in lower environments

---

### 2.6 Version Control and Source Code Management (ITGC-205)

**Objective:** Verify code is maintained in version control systems

**Procedures:**
1. Review version control policies and procedures
2. Verify version control system(s) in use (Git, SVN, etc.)
3. Test that code is maintained in version control:
   - Review repositories for key applications
   - Verify active development uses version control
4. Review branching and merging procedures
5. Test code review requirements:
   - Select sample of 15-20 code commits
   - Verify code reviews performed before merge
   - Verify reviewer is different from developer
   - Review code review documentation
6. Test that production releases come from version control tags/releases
7. Review access controls to version control system

**Sample Size:** Sample of 15-20 code commits/merges
**Evidence Required:** Version control policies, commit logs, code review records, release documentation
**Estimated Hours:** 2-3 hours

**Common Issues:**
- Not all code in version control
- No code review process
- Code reviews not documented
- Production code not from version control
- Inadequate access controls to repositories

---

## 3. Computer Operations

### 3.1 Data Backup Procedures (ITGC-300)

**Objective:** Verify data backups are performed, monitored, and stored securely

**Procedures:**
1. Review backup policies and procedures
2. Understand backup schedule and retention:
   - Daily, weekly, monthly backups
   - Full vs. incremental/differential
   - Retention periods
3. Review backup coverage - verify all critical systems backed up
4. Select one month of backup operations for testing
5. For sample of 20-25 backup jobs:
   - Verify backup completed successfully
   - Verify backup within scheduled window
   - Review backup failure alerts and resolution
6. Test backup encryption
7. Review backup storage locations:
   - On-site storage
   - Off-site storage
   - Cloud storage
8. Verify geographic separation of backups
9. Test backup monitoring and alerting

**Sample Size:** One month of backup operations, 20-25 backup jobs
**Evidence Required:** Backup policies, backup logs, monitoring reports, storage documentation
**Estimated Hours:** 3 hours

**Common Issues:**
- Critical systems not backed up
- Backup failures not monitored or resolved
- Backups not encrypted
- No off-site backups
- Backup retention not per policy

---

### 3.2 Backup Restoration Testing (ITGC-301)

**Objective:** Verify backups can be successfully restored

**Procedures:**
1. Review backup restoration testing procedures
2. Verify restoration testing frequency (quarterly/semi-annual typical)
3. Identify all restoration tests during audit period
4. For each restoration test:
   - Review test plan and scope
   - Verify critical systems tested
   - Review test results and success metrics
   - Verify data integrity validated
   - Verify restoration within RTO
   - Review issues identified and remediation
5. Assess coverage of restoration testing
6. Review restoration procedures documentation

**Sample Size:** All restoration tests during period
**Evidence Required:** Restoration test plans, test results, success metrics, issue remediation
**Estimated Hours:** 3 hours

**Common Issues:**
- Restoration testing not performed
- Limited scope of testing
- Restoration failures not addressed
- RTOs not achieved
- Data integrity not validated

---

### 3.3 Job Scheduling and Monitoring (ITGC-302)

**Objective:** Verify batch jobs are properly scheduled and monitored

**Procedures:**
1. Review job scheduling procedures
2. Identify critical batch jobs
3. Review job scheduling system and dependencies
4. Select one month of batch job operations
5. For sample of critical jobs:
   - Verify job completed successfully
   - Verify job ran on schedule
   - Review job failure alerts and resolution
   - Verify job dependencies properly configured
6. Test monitoring of job failures
7. Review escalation procedures for job failures
8. Verify job logs retained per policy

**Sample Size:** One month of batch operations, sample of critical jobs
**Evidence Required:** Job schedules, job logs, monitoring alerts, incident tickets
**Estimated Hours:** 2 hours

**Common Issues:**
- Critical job failures not monitored
- No alerting on job failures
- Job dependencies not properly configured
- Failures not timely resolved

---

### 3.4 Incident Management (ITGC-303)

**Objective:** Test incident detection, response, and resolution

**Procedures:**
1. Review incident management policy and procedures
2. Review incident categorization and prioritization criteria
3. Select sample of 20-25 incidents throughout period, including:
   - Critical/high priority incidents
   - Different incident types
   - Security incidents
4. For each incident:
   - Verify timely detection/reporting
   - Verify proper categorization and prioritization
   - Verify appropriate assignment
   - Review investigation and troubleshooting
   - Verify resolution documented
   - Verify resolution time within SLA
   - For critical incidents, verify root cause analysis performed
   - Verify communication to stakeholders
5. Review incident trends and analysis
6. Test escalation procedures
7. Review problem management for recurring incidents

**Sample Size:** 20-25 incidents including critical incidents
**Evidence Required:** Incident management procedures, incident tickets, resolution documentation, RCA reports
**Estimated Hours:** 3-4 hours

**Common Issues:**
- Incidents not properly categorized
- SLA breaches not addressed
- Poor documentation
- Root cause analysis not performed
- Recurring incidents not addressed through problem management

---

### 3.5 Capacity Management (ITGC-304)

**Objective:** Verify system capacity is monitored and planned

**Procedures:**
1. Review capacity management procedures
2. Identify capacity metrics monitored:
   - CPU utilization
   - Memory usage
   - Disk space
   - Network bandwidth
   - Database growth
3. Review capacity monitoring tools and dashboards
4. Test that capacity thresholds/alerts are configured
5. Review capacity reports for recent period
6. Review capacity planning procedures:
   - Forecasting methodology
   - Planning horizon
   - Growth projections
7. Review capacity issues identified and remediation
8. Verify proactive capacity additions

**Sample Size:** Recent capacity reviews and planning activities
**Evidence Required:** Capacity monitoring reports, alert configurations, capacity plans, growth projections
**Estimated Hours:** 2 hours

**Common Issues:**
- Capacity not systematically monitored
- No alerting on capacity issues
- Reactive (not proactive) capacity management
- No capacity planning performed

---

### 3.6 Vulnerability Management (ITGC-305)

**Objective:** Test vulnerability scanning and remediation procedures

**Procedures:**
1. Review vulnerability management policy and procedures
2. Review vulnerability scanning:
   - Scanning frequency (monthly typical)
   - Scan coverage (all systems)
   - Scanning tools used
   - Authenticated vs. unauthenticated scans
3. Select one quarter of vulnerability scans for testing
4. For sample of vulnerability scans:
   - Verify scans performed on schedule
   - Verify scan coverage is complete
   - Review critical and high vulnerabilities identified
   - Test remediation timelines:
     - Critical: 7-15 days typical
     - High: 30 days typical
     - Medium: 60-90 days typical
   - Verify remediation tracking
   - Identify overdue vulnerabilities
5. Review exception/risk acceptance process
6. Test patch management procedures
7. Review vulnerability trends

**Sample Size:** One quarter of vulnerability scans, sample of remediation
**Evidence Required:** Vulnerability scan reports, remediation tracking, patch logs, exception approvals
**Estimated Hours:** 4 hours

**Common Issues:**
- Scans not performed at required frequency
- Incomplete scan coverage
- Critical vulnerabilities not remediated timely
- No tracking of remediation
- Excessive risk acceptances

---

## 4. Business Continuity and Disaster Recovery

### 4.1 Disaster Recovery Plan (ITGC-400)

**Objective:** Verify comprehensive and current disaster recovery plans exist

**Procedures:**
1. Review business continuity and disaster recovery policies
2. Obtain DR plans for all critical systems/applications
3. Review DR plan completeness:
   - Scope and objectives
   - Roles and responsibilities
   - Communication plans
   - Recovery procedures
   - System dependencies
   - Recovery time objectives (RTO)
   - Recovery point objectives (RPO)
4. Verify DR plans updated annually or when significant changes occur
5. Review most recent DR plan update
6. Verify DR plans approved by management
7. Verify DR plans distributed to key personnel
8. Review DR plan storage (on-site and off-site copies)

**Sample Size:** All critical systems
**Evidence Required:** DR plans, plan update documentation, approval records, distribution records
**Estimated Hours:** 3 hours

**Common Issues:**
- DR plans not updated regularly
- Plans missing key information
- RTOs/RPOs not defined or not realistic
- Plans not tested against documented procedures
- Plans not accessible in a disaster

---

### 4.2 DR Testing (ITGC-401)

**Objective:** Verify disaster recovery capabilities are tested regularly

**Procedures:**
1. Review DR testing procedures and schedule
2. Verify DR testing frequency (annual minimum, semi-annual preferred)
3. Identify all DR tests during audit period
4. For each DR test:
   - Review DR test plan and scope
   - Verify critical systems included in test
   - Review test objectives and success criteria
   - Verify test results documented
   - Assess whether RTOs and RPOs achieved
   - Review issues/failures identified
   - Verify remediation of test failures
   - Review lessons learned
5. Assess realism of test (failover vs. paper test)
6. Review communication during DR test
7. Verify DR plan updated based on test results

**Sample Size:** All DR tests during audit period
**Evidence Required:** DR test plans, test results, issue log, remediation documentation, lessons learned
**Estimated Hours:** 4 hours

**Common Issues:**
- DR not tested at required frequency
- Test scope too limited
- RTOs/RPOs not achieved
- Test findings not remediated
- Tabletop only (no actual failover testing)
- DR plan not updated after testing

---

### 4.3 Data Center Physical and Environmental Controls (ITGC-402)

**Objective:** Verify physical security and environmental controls for data centers

**Procedures:**
1. Review data center security and environmental procedures
2. For each data center/server room:
   - Review physical access controls (already tested in ITGC-108)
   - Review environmental monitoring:
     - Temperature and humidity
     - Water detection
     - Fire detection and suppression
   - Review power systems:
     - UPS (uninterruptible power supply)
     - Backup generators
     - Power monitoring
   - Review HVAC systems and redundancy
3. Review environmental monitoring logs for sample period
4. Test alerting on environmental issues
5. Review environmental incidents and response
6. Test UPS and generator functionality (review test results)
7. For cloud/co-location facilities, review SOC 2 reports

**Sample Size:** All data center facilities, sample of monitoring logs
**Evidence Required:** Environmental monitoring logs, power test results, incident records, SOC 2 reports
**Estimated Hours:** 3 hours

**Common Issues:**
- Environmental controls not monitored
- No alerting on environmental issues
- UPS/generators not tested regularly
- Single points of failure
- Inadequate HVAC redundancy

---

### 4.4 Business Impact Analysis (ITGC-403)

**Objective:** Verify business impact analysis is current and complete

**Procedures:**
1. Obtain business impact analysis (BIA) documentation
2. Review BIA methodology and criteria
3. Verify BIA completeness:
   - All critical systems/applications identified
   - Business processes supported
   - Dependencies identified
   - RTOs and RPOs defined
   - Impact of outages quantified
   - Criticality ratings assigned
4. Verify BIA updated annually
5. Assess reasonableness of RTOs and RPOs
6. Verify alignment between BIA and DR plans
7. Review management approval of BIA

**Sample Size:** Complete BIA review
**Evidence Required:** BIA documentation, criticality ratings, RTO/RPO definitions, approval records
**Estimated Hours:** 2 hours

**Common Issues:**
- BIA not performed or outdated
- RTOs/RPOs not realistic
- Critical systems not identified
- Dependencies not documented
- No management approval

---

### 4.5 Backup Site/Failover Readiness (ITGC-404)

**Objective:** Verify backup site or cloud failover capabilities

**Procedures:**
1. Review backup site or failover architecture
2. For dedicated backup sites:
   - Review site specifications and capacity
   - Verify data replication to backup site
   - Review network connectivity
   - Verify equipment and supplies at backup site
   - Review workspace availability
3. For cloud failover:
   - Review multi-region architecture
   - Verify data replication configuration
   - Review automated failover capabilities
   - Test failover automation (if applicable)
4. Review backup site or failover testing results
5. Verify backup site capacity matches production needs
6. Review backup site access and security

**Sample Size:** All backup sites or failover configurations
**Evidence Required:** Architecture documentation, replication logs, capacity analysis, test results
**Estimated Hours:** 2-3 hours

**Common Issues:**
- Backup site capacity inadequate
- Data replication not tested
- Failover procedures not documented
- Network connectivity insufficient
- Backup site not included in DR testing

---

## Documentation Requirements

### Required Work Papers
1. ITGC scoping and planning documentation
2. Understanding of IT environment and systems
3. Control documentation and walkthroughs
4. Testing work papers for each ITGC area
5. Sample selections and testing results
6. Exception documentation and management responses
7. Conclusions and summary of findings

### Evidence Standards
- System-generated reports preferred over manual
- Screenshots should include dates and system identifiers
- Evidence should be contemporaneous when possible
- Audit trail should be maintained for all testing
- Cross-references between work papers required

## Common Findings and Deficiencies

### Critical/High-Risk Findings
1. **Access Control Failures:**
   - Terminated users with active access
   - Excessive administrative access
   - No periodic access reviews
   - Weak password policies

2. **Change Management Failures:**
   - Changes without approval
   - No segregation of duties in change process
   - Emergency changes not reviewed
   - Production changes by developers

3. **Backup/DR Failures:**
   - Backups not tested
   - DR not tested annually
   - Critical systems not backed up
   - RTOs not achievable

4. **Vulnerability Management Failures:**
   - Critical vulnerabilities not remediated
   - No vulnerability scanning
   - Patch management inadequate

### Medium-Risk Findings
- Access provisioning delays
- Limited scope DR testing
- Incident SLA breaches
- Password policy exceptions
- Service account proliferation

## Sample Size Guidance

### Risk-Based Sampling
- **High-risk controls:** 25-30 samples
- **Medium-risk controls:** 15-20 samples
- **Low-risk controls:** 10-15 samples

### Population-Based Sampling
- **Large populations (>100):** 25-30 samples
- **Medium populations (50-100):** 15-25 samples
- **Small populations (<50):** All or majority

### Specific ITGC Sampling
- **User access provisioning:** 25 samples
- **User access terminations:** All terminations
- **Access reviews:** 3-4 quarterly cycles
- **Privileged access:** All or significant sample
- **Changes:** 25-30 samples across types
- **Incidents:** 20-25 including all critical
- **Vulnerability scans:** One quarter of operations

## Required Team Competencies

### Team Roles
1. **ITGC Lead** - Overall ITGC assessment leadership
2. **IT Auditors** - ITGC testing and documentation
3. **Technical Specialists** - Deep dive for complex systems

### Required Skills
- Understanding of IT control frameworks (COBIT, ITIL)
- IT audit experience
- Technical knowledge of systems and infrastructure
- Knowledge of security best practices
- Evidence gathering and documentation skills
- Certifications preferred:
  - CISA (Certified Information Systems Auditor)
  - CISSP (Certified Information Systems Security Professional)
  - CRISC (Certified in Risk and Information Systems Control)

## Testing Timeline

### Typical ITGC Assessment Timeline
- **Planning:** 1-2 weeks
- **Documentation and walkthroughs:** 2-3 weeks
- **Testing:** 4-6 weeks
- **Review and remediation:** 2-3 weeks
- **Reporting:** 1-2 weeks
- **Total:** 10-16 weeks

### Testing Frequency
- **SOX/Financial audits:** Annual testing
- **SOC 2:** Testing over 6-12 month period
- **Internal audits:** Annual or as needed
- **Risk assessments:** Every 2-3 years or when significant changes

## Integration with Other Audits

### SOX ITGC Testing
- Required for IT-dependent controls
- Feeds into financial statement audit
- Material weakness vs. significant deficiency determination
- Management remediation required

### SOC 2 ITGC Testing
- ITGCs support automated controls
- Common Criteria directly map to ITGC
- Operating effectiveness testing over period
- Disclosed in SOC 2 report

### ISO 27001 Alignment
- ITGCs align with ISO 27001 Annex A controls
- Can leverage testing across frameworks
- Integrated audit approach possible
