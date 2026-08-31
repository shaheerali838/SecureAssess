/**
 * Centralized Dynamic Terminology Dictionary for SecureAssess
 *
 * Dynamically maps domain entity names based on the tenant's specific industry:
 * - Academic (Higher Ed, Universities, Schools)
 * - Corporate (Enterprise, Employee Training, Performance)
 * - Aviation (Flight Training, Defense, High-Consequence Certification)
 * - Recruitment (Talent Acquisition, Candidate Screening, Hiring)
 */

export const TENANT_INDUSTRIES = Object.freeze({
  ACADEMIC: 'academic',
  CORPORATE: 'corporate',
  AVIATION: 'aviation',
  RECRUITMENT: 'recruitment',
});

export const TERMINOLOGY_MAP = Object.freeze({
  academic: {
    department: { singular: 'Department', plural: 'Departments' },
    program: { singular: 'Degree Program', plural: 'Degree Programs' },
    subject: { singular: 'Subject', plural: 'Subjects' },
    candidate: { singular: 'Student', plural: 'Students' },
    candidateGroup: { singular: 'Cohort', plural: 'Cohorts' },
    structure: { singular: 'Academic Structure', plural: 'Academic Structures' },
    assessor: { singular: 'Professor / Examiner', plural: 'Professors / Examiners' },
    evaluator: { singular: 'Faculty Grader', plural: 'Faculty Graders' },
    grading: { singular: 'Academic Grading', plural: 'Academic Grading' },
    roster: { singular: 'Student Roster', plural: 'Student Rosters' },
    level: { singular: 'Academic Degree Level', plural: 'Degree Levels' },
    credits: { singular: 'Credit Hours', plural: 'Credit Hours' },
  },
  corporate: {
    department: { singular: 'Division', plural: 'Divisions' },
    program: { singular: 'Training Track', plural: 'Training Tracks' },
    subject: { singular: 'Module', plural: 'Modules' },
    candidate: { singular: 'Employee', plural: 'Employees' },
    candidateGroup: { singular: 'Batch', plural: 'Batches' },
    structure: { singular: 'Organizational Structure', plural: 'Organizational Structures' },
    assessor: { singular: 'Manager / Reviewer', plural: 'Managers / Reviewers' },
    evaluator: { singular: 'Appraiser', plural: 'Appraisers' },
    grading: { singular: 'Performance Evaluation', plural: 'Performance Evaluations' },
    roster: { singular: 'Employee Directory', plural: 'Employee Directories' },
    level: { singular: 'Seniority Level', plural: 'Seniority Levels' },
    credits: { singular: 'Weight Units', plural: 'Weight Units' },
  },
  aviation: {
    department: { singular: 'Unit', plural: 'Units' },
    program: { singular: 'Certification Path', plural: 'Certification Paths' },
    subject: { singular: 'Flight Module', plural: 'Flight Modules' },
    candidate: { singular: 'Trainee', plural: 'Trainees' },
    candidateGroup: { singular: 'Squadron', plural: 'Squadrons' },
    structure: { singular: 'Operations Hierarchy', plural: 'Operations Hierarchies' },
    assessor: { singular: 'Flight Examiner', plural: 'Flight Examiners' },
    evaluator: { singular: 'Chief Instructor', plural: 'Chief Instructors' },
    grading: { singular: 'Checkride Assessment', plural: 'Checkride Assessments' },
    roster: { singular: 'Flight Roster', plural: 'Flight Rosters' },
    level: { singular: 'Rating Level', plural: 'Rating Levels' },
    credits: { singular: 'Flight Hours', plural: 'Flight Hours' },
  },
  recruitment: {
    department: { singular: 'Department', plural: 'Departments' },
    program: { singular: 'Hiring Pipeline', plural: 'Hiring Pipelines' },
    subject: { singular: 'Skill Assessment', plural: 'Skill Assessments' },
    candidate: { singular: 'Applicant', plural: 'Applicants' },
    candidateGroup: { singular: 'Applicant Pool', plural: 'Applicant Pools' },
    structure: { singular: 'Departmental Structure', plural: 'Departmental Structures' },
    assessor: { singular: 'Interviewer / Recruiter', plural: 'Interviewers / Recruiters' },
    evaluator: { singular: 'Hiring Lead', plural: 'Hiring Leads' },
    grading: { singular: 'Candidate Evaluation', plural: 'Candidate Evaluations' },
    roster: { singular: 'Applicant Roster', plural: 'Applicant Rosters' },
    level: { singular: 'Job Seniority', plural: 'Job Seniorities' },
    credits: { singular: 'Skill Weight', plural: 'Skill Weights' },
  },
});

/**
 * Returns the terminology dictionary for a specific industry.
 * Falls back to 'academic' if tenantIndustry is undefined or unrecognized.
 *
 * @param {string} [industry='academic']
 * @returns {object}
 */
export const getTerminology = (industry = 'academic') => {
  const normalized = (industry || 'academic').toLowerCase().trim();
  return TERMINOLOGY_MAP[normalized] || TERMINOLOGY_MAP.academic;
};

/**
 * Translates an entity key into its industry-tailored label.
 *
 * @param {string} [industry='academic'] - Tenant industry ('academic' | 'corporate' | 'aviation' | 'recruitment')
 * @param {string} entityKey - Target entity ('department' | 'program' | 'subject' | 'candidate' | 'candidateGroup' | 'structure')
 * @param {boolean} [isPlural=false] - Whether to return plural form
 * @returns {string}
 */
export const translateTerm = (industry = 'academic', entityKey, isPlural = false) => {
  const dictionary = getTerminology(industry);
  const termEntry = dictionary[entityKey] || TERMINOLOGY_MAP.academic[entityKey];

  if (!termEntry) {
    // If entityKey is not found in dictionary, return sanitized key as fallback
    return entityKey;
  }

  return isPlural ? termEntry.plural : termEntry.singular;
};

export default {
  TENANT_INDUSTRIES,
  TERMINOLOGY_MAP,
  getTerminology,
  translateTerm,
};
