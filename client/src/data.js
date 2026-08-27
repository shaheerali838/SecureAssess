












export const organizations = [
  { id: 'org-vu', name: 'Virtual University', industry: 'Education', plan: 'Enterprise', status: 'Active', users: 8420, assessments: 1240, sessions: 4810, usage: 78, createdAt: '2025-03-15', country: 'Pakistan', website: 'virtualuniversity.edu', contactName: 'Dr. Imran Saleem', contactEmail: 'imran.saleem@vu.edu', brandColor: '#1d4ed8', logoText: 'VU' },
  { id: 'org-sw', name: 'SkyWings Aviation', industry: 'Aviation', plan: 'Professional', status: 'Active', users: 340, assessments: 42, sessions: 1180, usage: 62, createdAt: '2025-05-02', country: 'UAE', website: 'skywings.aero', contactName: 'Captain Lara Hassan', contactEmail: 'lara.h@skywings.aero', brandColor: '#0d9488', logoText: 'SW' },
  { id: 'org-tc', name: 'TechCorp Pakistan', industry: 'Technology', plan: 'Professional', status: 'Active', users: 184, assessments: 68, sessions: 2240, usage: 54, createdAt: '2025-01-20', country: 'Pakistan', website: 'techcorp.pk', contactName: 'Hassan Raza', contactEmail: 'hassan@techcorp.pk', brandColor: '#7c3aed', logoText: 'TC' },
  { id: 'org-nhi', name: 'National Healthcare Institute', industry: 'Healthcare', plan: 'Enterprise', status: 'Active', users: 2100, assessments: 180, sessions: 2640, usage: 71, createdAt: '2024-11-10', country: 'Pakistan', website: 'nhi.org.pk', contactName: 'Dr. Farah Siddiqui', contactEmail: 'farah.s@nhi.org.pk', brandColor: '#0f766e', logoText: 'NH' },
  { id: 'org-fcb', name: 'Financial Certification Board', industry: 'Finance', plan: 'Enterprise', status: 'Active', users: 560, assessments: 95, sessions: 1611, usage: 68, createdAt: '2025-02-08', country: 'Pakistan', website: 'fcb.gov.pk', contactName: 'Omar Sheikh', contactEmail: 'omar.s@fcb.gov.pk', brandColor: '#1e3a8a', logoText: 'FB' },
  { id: 'org-gli', name: 'Global Learning Institute', industry: 'Education', plan: 'Starter', status: 'Trial', users: 45, assessments: 8, sessions: 120, usage: 22, createdAt: '2026-08-01', country: 'Pakistan', website: 'gli.edu', contactName: 'Nadia Baig', contactEmail: 'nadia@gli.edu', brandColor: '#2563eb', logoText: 'GL' },
  { id: 'org-mc', name: 'Medina Clinics', industry: 'Healthcare', plan: 'Professional', status: 'Active', users: 220, assessments: 34, sessions: 680, usage: 41, createdAt: '2025-06-14', country: 'UAE', website: 'medinaclinics.ae', contactName: 'Dr. Yusuf Ali', contactEmail: 'yusuf@medinaclinics.ae', brandColor: '#0d9488', logoText: 'MC' },
  { id: 'org-apex', name: 'Apex Recruitment', industry: 'Corporate', plan: 'Professional', status: 'Active', users: 92, assessments: 56, sessions: 980, usage: 48, createdAt: '2025-04-22', country: 'Pakistan', website: 'apexrecruit.pk', contactName: 'Sara Khan', contactEmail: 'sara@apexrecruit.pk', brandColor: '#b45309', logoText: 'AR' },
];

export const assessments = [
  { id: 'a1', title: 'University Admission Test', industry: 'Education', category: 'Admissions', type: 'MCQ Test', questions: 60, duration: 90, attempts: 1240, avgScore: 72, securityLevel: 'Secure', status: 'Published', description: 'Comprehensive admission test covering mathematics, English, and analytical reasoning.', passingScore: 60 },
  { id: 'a2', title: 'Online Midterm Examination', industry: 'Education', category: 'Midterm', type: 'Examination', questions: 45, duration: 120, attempts: 820, avgScore: 68, securityLevel: 'Secure', status: 'Published', description: 'Midterm examination for Computer Science 101 covering data structures and algorithms.', passingScore: 50 },
  { id: 'a3', title: 'Commercial Pilot Knowledge Assessment', industry: 'Aviation', category: 'Pilot Certification', type: 'Knowledge Assessment', questions: 80, duration: 150, attempts: 340, avgScore: 81, securityLevel: 'Secure', status: 'Published', description: 'FAA-style knowledge test covering aerodynamics, navigation, meteorology, and regulations.', passingScore: 70 },
  { id: 'a4', title: 'Aviation Safety Assessment', industry: 'Aviation', category: 'Safety', type: 'Scenario Assessment', questions: 30, duration: 60, attempts: 210, avgScore: 76, securityLevel: 'Monitored', status: 'Published', description: 'Scenario-based safety assessment evaluating decision-making in emergency situations.', passingScore: 75 },
  { id: 'a5', title: 'MERN Engineering Assessment', industry: 'Technology', category: 'Technical', type: 'Skills Assessment', questions: 35, duration: 90, attempts: 680, avgScore: 64, securityLevel: 'Monitored', status: 'Published', description: 'Full-stack JavaScript assessment covering MongoDB, Express, React, and Node.js.', passingScore: 65 },
  { id: 'a6', title: 'Clinical Nursing Assessment', industry: 'Healthcare', category: 'Clinical', type: 'Knowledge Assessment', questions: 50, duration: 75, attempts: 420, avgScore: 78, securityLevel: 'Secure', status: 'Published', description: 'Clinical nursing competency assessment covering patient care, pharmacology, and procedures.', passingScore: 70 },
  { id: 'a7', title: 'Financial Analysis Assessment', industry: 'Finance', category: 'Certification', type: 'Skills Assessment', questions: 40, duration: 100, attempts: 310, avgScore: 71, securityLevel: 'Secure', status: 'Published', description: 'Financial analysis certification covering valuation, risk assessment, and portfolio management.', passingScore: 65 },
  { id: 'a8', title: 'Sales Aptitude Assessment', industry: 'Corporate', category: 'Aptitude', type: 'Aptitude Test', questions: 25, duration: 45, attempts: 540, avgScore: 74, securityLevel: 'Standard', status: 'Published', description: 'Sales aptitude test evaluating communication, persuasion, and customer relationship skills.', passingScore: 60 },
  { id: 'a9', title: 'Data Structures Final Exam', industry: 'Education', category: 'Final', type: 'Examination', questions: 50, duration: 120, attempts: 380, avgScore: 66, securityLevel: 'Secure', status: 'Scheduled', description: 'Final examination for Data Structures and Algorithms course.', passingScore: 50 },
  { id: 'a10', title: 'React Developer Screening', industry: 'Technology', category: 'Technical', type: 'Skills Assessment', questions: 30, duration: 60, attempts: 890, avgScore: 69, securityLevel: 'Monitored', status: 'Published', description: 'React developer screening assessment covering hooks, state management, and performance.', passingScore: 60 },
];

export const questions = [
  { id: 1, type: 'Multiple Choice', content: 'What is the time complexity of binary search on a sorted array of n elements?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswer: 1, explanation: 'Binary search halves the search space at each step, resulting in O(log n) time complexity.', points: 2, difficulty: 'Easy', category: 'Algorithms', tags: ['binary-search', 'complexity'] },
  { id: 2, type: 'Multiple Choice', content: 'Which React hook is used to manage side effects in function components?', options: ['useState', 'useMemo', 'useEffect', 'useRef'], correctAnswer: 2, explanation: 'useEffect is used for side effects such as data fetching, subscriptions, and DOM manipulation.', points: 2, difficulty: 'Easy', category: 'React', tags: ['hooks', 'effects'] },
  { id: 3, type: 'True / False', content: 'A balanced binary search tree guarantees O(log n) search time in the worst case.', options: ['True', 'False'], correctAnswer: 0, explanation: 'A balanced BST maintains its height at O(log n), ensuring worst-case O(log n) search.', points: 1, difficulty: 'Medium', category: 'Data Structures', tags: ['trees', 'bst'] },
  { id: 4, type: 'Short Answer', content: 'What does ACID stand for in the context of database transactions?', options: [], correctAnswer: -1, explanation: 'Atomicity, Consistency, Isolation, Durability — the four properties of reliable transactions.', points: 3, difficulty: 'Medium', category: 'Databases', tags: ['transactions', 'acid'] },
  { id: 5, type: 'Multiple Select', content: 'Which of the following are valid HTTP status codes for successful responses?', options: ['200 OK', '201 Created', '301 Moved Permanently', '404 Not Found'], correctAnswer: [0, 1], explanation: '200 and 2xx are success codes. 301 is a redirect (3xx), 404 is a client error (4xx).', points: 2, difficulty: 'Easy', category: 'Web', tags: ['http', 'status-codes'] },
  { id: 6, type: 'Coding', content: 'Implement a function that reverses a linked list in place.', options: [], correctAnswer: -1, explanation: 'Iterate through the list, reversing the next pointers. Time O(n), space O(1).', points: 5, difficulty: 'Hard', category: 'Data Structures', tags: ['linked-list', 'pointers'] },
  { id: 7, type: 'Numerical', content: 'Calculate the compound interest on $10,000 at 5% annual rate compounded quarterly for 3 years.', options: [], correctAnswer: -1, explanation: 'A = P(1 + r/n)^(nt). A = 10000(1.0125)^12 ≈ $11,607.55. Interest ≈ $1,607.55.', points: 3, difficulty: 'Medium', category: 'Finance', tags: ['compound-interest', 'math'] },
  { id: 8, type: 'Scenario', content: 'A patient presents with chest pain and shortness of breath. What is your initial assessment priority?', options: ['Order an X-ray immediately', 'Assess ABCs and vital signs', 'Administer pain medication', 'Call the cardiologist'], correctAnswer: 1, explanation: 'ABC (Airway, Breathing, Circulation) assessment with vital signs is the first priority in any emergency.', points: 4, difficulty: 'Hard', category: 'Clinical', tags: ['emergency', 'assessment'] },
  { id: 9, type: 'Multiple Choice', content: 'During an instrument approach, what is the minimum descent altitude (MDA) based on?', options: ['Field elevation', 'Sea level', 'Transition altitude', 'Approach chart'], correctAnswer: 3, explanation: 'The MDA is published on the specific instrument approach chart for each procedure.', points: 3, difficulty: 'Medium', category: 'Aviation', tags: ['approach', 'ifr'] },
  { id: 10, type: 'Long Answer', content: 'Describe the differences between supervised and unsupervised machine learning, with examples of each.', options: [], correctAnswer: -1, explanation: 'Supervised uses labeled data (classification/regression). Unsupervised finds patterns in unlabeled data (clustering/PCA).', points: 5, difficulty: 'Medium', category: 'Machine Learning', tags: ['supervised', 'unsupervised'] },
];

export const participants = [
  { id: 'p1', name: 'Ahmed Khan', email: 'ahmed.khan@student.edu', context: 'Computer Science 101', assessment: 'Online Midterm Examination', status: 'Completed', score: 78, interviewScore: null, overallScore: 78, integrityRisk: 'Low', integrityScore: 18, stage: 'Results Available', lastActivity: '2026-08-25 14:32', avatarColor: '#2563eb' },
  { id: 'p2', name: 'Sarah Williams', email: 'sarah.w@applicant.aero', context: 'Pilot Training Program', assessment: 'Commercial Pilot Knowledge Assessment', status: 'Completed', score: 85, interviewScore: 82, overallScore: 84, integrityRisk: 'Low', integrityScore: 12, stage: 'Evaluation Complete', lastActivity: '2026-08-25 11:15', avatarColor: '#0d9488' },
  { id: 'p3', name: 'Maria Johnson', email: 'maria.j@techcorp.pk', context: 'Senior Frontend Developer', assessment: 'MERN Engineering Assessment', status: 'Completed', score: 72, interviewScore: 68, overallScore: 70, integrityRisk: 'Medium', integrityScore: 42, stage: 'Review Required', lastActivity: '2026-08-24 16:48', avatarColor: '#7c3aed' },
  { id: 'p4', name: 'Daniel Smith', email: 'daniel.s@nhi.org.pk', context: 'Nursing Certification', assessment: 'Clinical Nursing Assessment', status: 'Completed', score: 81, interviewScore: null, overallScore: 81, integrityRisk: 'Low', integrityScore: 15, stage: 'Results Available', lastActivity: '2026-08-24 09:20', avatarColor: '#0f766e' },
  { id: 'p5', name: 'Ayesha Malik', email: 'ayesha.m@fcb.gov.pk', context: 'Financial Analyst Certification', assessment: 'Financial Analysis Assessment', status: 'In Progress', score: null, interviewScore: null, overallScore: null, integrityRisk: null, integrityScore: null, stage: 'Assessment Active', lastActivity: '2026-08-26 10:05', avatarColor: '#1e3a8a' },
  { id: 'p6', name: 'Bilal Ahmed', email: 'bilal.a@student.edu', context: 'Data Structures Course', assessment: 'Data Structures Final Exam', status: 'Invited', score: null, interviewScore: null, overallScore: null, integrityRisk: null, integrityScore: null, stage: 'Awaiting Start', lastActivity: '2026-08-25 18:00', avatarColor: '#b45309' },
  { id: 'p7', name: 'Fatima Zahra', email: 'fatima.z@applicant.aero', context: 'Pilot Training Program', assessment: 'Aviation Safety Assessment', status: 'Completed', score: 76, interviewScore: 74, overallScore: 75, integrityRisk: 'High', integrityScore: 68, stage: 'Flagged for Review', lastActivity: '2026-08-23 13:42', avatarColor: '#dc2626' },
  { id: 'p8', name: 'James OConnor', email: 'james.o@techcorp.pk', context: 'Backend Developer', assessment: 'React Developer Screening', status: 'Completed', score: 64, interviewScore: null, overallScore: 64, integrityRisk: 'Medium', integrityScore: 38, stage: 'Review Required', lastActivity: '2026-08-22 15:30', avatarColor: '#475569' },
  { id: 'p9', name: 'Zainab Tariq', email: 'zainab.t@student.edu', context: 'University Admissions', assessment: 'University Admission Test', status: 'Completed', score: 88, interviewScore: null, overallScore: 88, integrityRisk: 'Low', integrityScore: 8, stage: 'Results Available', lastActivity: '2026-08-26 08:15', avatarColor: '#16a34a' },
  { id: 'p10', name: 'Robert Chen', email: 'robert.c@apexrecruit.pk', context: 'Sales Executive Role', assessment: 'Sales Aptitude Assessment', status: 'No Show', score: null, interviewScore: null, overallScore: null, integrityRisk: null, integrityScore: null, stage: 'Session Expired', lastActivity: '2026-08-21 10:00', avatarColor: '#92400e' },
];

export const sessions = [
  {
    id: 's1', participant: 'Ahmed Khan', assessment: 'Online Midterm Examination', status: 'Completed', assessmentScore: 78, interviewScore: null, overallScore: 78, integrityRisk: 'Low', integrityScore: 18, duration: '1h 52m', date: '2026-08-25 14:32',
    signals: { focusChanges: 2, tabChanges: 1, fullscreenExits: 0, gazeAnomalies: 1, connectionInterruptions: 0 },
    timeline: [
      { time: '00:00', label: 'Session started', type: 'success' },
      { time: '00:15', label: 'Question 5 answered', type: 'info' },
      { time: '12:31', label: 'Focus change detected', type: 'warning' },
      { time: '19:04', label: 'Tab change detected', type: 'warning' },
      { time: '26:18', label: 'Gaze anomaly recorded', type: 'warning' },
      { time: '45:32', label: 'Assessment submitted', type: 'success' },
    ],
  },
  {
    id: 's2', participant: 'Sarah Williams', assessment: 'Commercial Pilot Knowledge Assessment', status: 'Completed', assessmentScore: 85, interviewScore: 82, overallScore: 84, integrityRisk: 'Low', integrityScore: 12, duration: '2h 18m', date: '2026-08-25 11:15',
    signals: { focusChanges: 0, tabChanges: 0, fullscreenExits: 0, gazeAnomalies: 0, connectionInterruptions: 0 },
    timeline: [
      { time: '00:00', label: 'Session started', type: 'success' },
      { time: '02:30:00', label: 'Interview started', type: 'info' },
      { time: '02:18:00', label: 'Assessment submitted', type: 'success' },
      { time: '02:45:00', label: 'Interview completed', type: 'success' },
    ],
  },
  {
    id: 's3', participant: 'Fatima Zahra', assessment: 'Aviation Safety Assessment', status: 'Flagged', assessmentScore: 76, interviewScore: 74, overallScore: 75, integrityRisk: 'High', integrityScore: 68, duration: '58m', date: '2026-08-23 13:42',
    signals: { focusChanges: 12, tabChanges: 8, fullscreenExits: 3, gazeAnomalies: 5, connectionInterruptions: 2 },
    timeline: [
      { time: '00:00', label: 'Session started', type: 'success' },
      { time: '05:12', label: 'Multiple focus changes detected', type: 'danger' },
      { time: '08:30', label: 'Tab change detected', type: 'warning' },
      { time: '12:15', label: 'Fullscreen exit detected', type: 'danger' },
      { time: '18:42', label: 'Multiple gaze anomalies', type: 'danger' },
      { time: '24:08', label: 'Connection interruption', type: 'warning' },
      { time: '35:20', label: 'Additional tab changes detected', type: 'danger' },
      { time: '58:00', label: 'Assessment submitted', type: 'success' },
    ],
  },
  {
    id: 's4', participant: 'Maria Johnson', assessment: 'MERN Engineering Assessment', status: 'Review Required', assessmentScore: 72, interviewScore: 68, overallScore: 70, integrityRisk: 'Medium', integrityScore: 42, duration: '1h 28m', date: '2026-08-24 16:48',
    signals: { focusChanges: 6, tabChanges: 3, fullscreenExits: 1, gazeAnomalies: 2, connectionInterruptions: 1 },
    timeline: [
      { time: '00:00', label: 'Session started', type: 'success' },
      { time: '15:20', label: 'Focus change detected', type: 'warning' },
      { time: '22:10', label: 'Tab change detected', type: 'warning' },
      { time: '38:45', label: 'Gaze anomaly recorded', type: 'warning' },
      { time: '1:28:00', label: 'Assessment submitted', type: 'success' },
    ],
  },
  {
    id: 's5', participant: 'Daniel Smith', assessment: 'Clinical Nursing Assessment', status: 'Completed', assessmentScore: 81, interviewScore: null, overallScore: 81, integrityRisk: 'Low', integrityScore: 15, duration: '1h 12m', date: '2026-08-24 09:20',
    signals: { focusChanges: 1, tabChanges: 0, fullscreenExits: 0, gazeAnomalies: 0, connectionInterruptions: 0 },
    timeline: [
      { time: '00:00', label: 'Session started', type: 'success' },
      { time: '34:15', label: 'Focus change detected', type: 'warning' },
      { time: '1:12:00', label: 'Assessment submitted', type: 'success' },
    ],
  },
];

export const integrityFlags = [
  { id: 'f1', title: 'Potential Unauthorized Activity', timestamp: '00:26:18', source: 'Session Monitoring', confidence: 'High', context: 'Multiple focus changes and tab switches detected during assessment session, suggesting possible reference to external materials.', riskLevel: 'High', participant: 'Fatima Zahra', session: 'Aviation Safety Assessment' },
  { id: 'f2', title: 'Focus Pattern Anomaly', timestamp: '00:22:10', source: 'Session Monitoring', confidence: 'Medium', context: 'Irregular focus change pattern detected. Participant switched tabs 3 times within a 2-minute window.', riskLevel: 'Medium', participant: 'Maria Johnson', session: 'MERN Engineering Assessment' },
  { id: 'f3', title: 'Fullscreen Exit Detected', timestamp: '00:12:15', source: 'Browser Monitoring', confidence: 'High', context: 'Participant exited fullscreen mode during active assessment. Session was paused automatically.', riskLevel: 'High', participant: 'Fatima Zahra', session: 'Aviation Safety Assessment' },
  { id: 'f4', title: 'Gaze Anomaly', timestamp: '00:38:45', source: 'Camera Analysis', confidence: 'Medium', context: 'Participant gaze direction shifted away from screen for extended period during question response.', riskLevel: 'Medium', participant: 'Maria Johnson', session: 'MERN Engineering Assessment' },
  { id: 'f5', title: 'Connection Instability', timestamp: '00:24:08', source: 'Network Monitoring', confidence: 'Low', context: 'Brief connection interruption detected. Session resumed automatically. Progress was preserved.', riskLevel: 'Low', participant: 'Fatima Zahra', session: 'Aviation Safety Assessment' },
];

export const platformUsers = [
  { id: 'u1', name: 'Dr. Imran Saleem', email: 'imran.saleem@vu.edu', role: 'Organization Admin', status: 'Active', lastActive: '2026-08-26 09:15', avatarColor: '#1d4ed8' },
  { id: 'u2', name: 'Prof. Aisha Khan', email: 'aisha.khan@vu.edu', role: 'Examiner', status: 'Active', lastActive: '2026-08-26 08:42', avatarColor: '#0d9488' },
  { id: 'u3', name: 'Captain Lara Hassan', email: 'lara.h@skywings.aero', role: 'Organization Admin', status: 'Active', lastActive: '2026-08-25 16:30', avatarColor: '#7c3aed' },
  { id: 'u4', name: 'Hassan Raza', email: 'hassan@techcorp.pk', role: 'Recruiter', status: 'Active', lastActive: '2026-08-26 10:05', avatarColor: '#b45309' },
  { id: 'u5', name: 'Dr. Farah Siddiqui', email: 'farah.s@nhi.org.pk', role: 'Organization Admin', status: 'Active', lastActive: '2026-08-25 14:20', avatarColor: '#0f766e' },
  { id: 'u6', name: 'Omar Sheikh', email: 'omar.s@fcb.gov.pk', role: 'Organization Admin', status: 'Invited', lastActive: '—', avatarColor: '#1e3a8a' },
  { id: 'u7', name: 'Nadia Baig', email: 'nadia@gli.edu', role: 'Organization Admin', status: 'Invited', lastActive: '—', avatarColor: '#2563eb' },
];

export const plans = [
  {
    name: 'Starter',
    price: '$299/mo',
    description: 'For small organizations getting started with secure assessments.',
    features: ['Up to 50 active users', '500 assessment sessions/month', 'Standard security level', 'Basic integrity monitoring', 'Email support', '7-day data retention'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    price: '$899/mo',
    description: 'For growing organizations that need advanced assessment capabilities.',
    features: ['Up to 250 active users', '5,000 assessment sessions/month', 'Monitored security level', 'Advanced integrity monitoring', 'Live interview sessions', 'Priority support', '90-day data retention', 'Custom branding'],
    highlighted: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: 'Custom Pricing',
    description: 'For large institutions with enterprise-grade assessment requirements.',
    features: ['Unlimited active users', 'Unlimited assessment sessions', 'Secure environment with full monitoring', 'AI-assisted integrity review', 'Unlimited interview minutes', 'Dedicated account manager', 'Custom data retention', 'White-label ready', 'SSO & advanced security', 'API access'],
    cta: 'Contact Sales',
  },
];

export const interviewQuestions = [
  { id: 1, question: 'Tell us about yourself and your background.', notes: 'Look for clear communication and relevant experience.' },
  { id: 2, question: 'Describe a difficult situation you faced and how you resolved it.', notes: 'Assess problem-solving approach and resilience.' },
  { id: 3, question: 'Walk us through a recent project you are proud of.', notes: 'Evaluate technical depth and ownership.' },
  { id: 4, question: 'How do you handle working under pressure during critical situations?', notes: 'Industry-specific: assess composure and decision-making.' },
  { id: 5, question: 'Where do you see yourself in the next 3 years?', notes: 'Evaluate ambition and alignment with organizational goals.' },
];

export const evaluationCriteria = [
  { id: 'c1', label: 'Communication', score: 4 },
  { id: 'c2', label: 'Knowledge', score: 0 },
  { id: 'c3', label: 'Problem Solving', score: 0 },
  { id: 'c4', label: 'Decision Making', score: 0 },
  { id: 'c5', label: 'Professionalism', score: 0 },
];

export const industries = [
  { name: 'Education', icon: 'GraduationCap', description: 'Universities, schools, and training institutes', useCases: ['Online examinations', 'Admission tests', 'Student quizzes', 'Course assessments'], color: '#1d4ed8' },
  { name: 'Corporate Hiring', icon: 'Briefcase', description: 'Companies and recruitment agencies', useCases: ['Hiring assessments', 'Technical interviews', 'Candidate evaluation', 'Aptitude tests'], color: '#7c3aed' },
  { name: 'Aviation', icon: 'Plane', description: 'Airlines and flight academies', useCases: ['Pilot assessments', 'Aviation safety tests', 'Situational judgment', 'Technical evaluations'], color: '#0d9488' },
  { name: 'Healthcare', icon: 'Stethoscope', description: 'Hospitals and medical institutions', useCases: ['Clinical assessments', 'Professional testing', 'Scenario evaluation', 'Nursing competency'], color: '#0f766e' },
  { name: 'Finance', icon: 'Landmark', description: 'Banks and certification bodies', useCases: ['Financial analysis tests', 'Accounting assessments', 'Risk management', 'Professional certification'], color: '#1e3a8a' },
  { name: 'Professional Certification', icon: 'Award', description: 'Certification authorities and professional bodies', useCases: ['Certification exams', 'Qualification assessments', 'Compliance testing', 'Internal assessments'], color: '#b45309' },
  { name: 'Government & Institutions', icon: 'Building2', description: 'Government organizations and institutions', useCases: ['Recruitment exams', 'Qualification assessments', 'Internal evaluations', 'Compliance testing'], color: '#475569' },
];

export const workflowSteps = [
  { step: 'Create', title: 'Organization creates assessment', description: 'Build assessments with questions, rules, and policies.', icon: 'FilePlus2' },
  { step: 'Configure', title: 'Questions + rules + duration + policies', description: 'Set security levels, time limits, and integrity policies.', icon: 'Settings2' },
  { step: 'Invite', title: 'Participants receive invitation', description: 'Send invitations via email with secure access links.', icon: 'Send' },
  { step: 'Verify', title: 'System check and consent', description: 'Participants verify their setup and provide consent.', icon: 'ShieldCheck' },
  { step: 'Assess', title: 'Participant completes assessment', description: 'Secure, distraction-free assessment environment.', icon: 'ClipboardCheck' },
  { step: 'Interview', title: 'Optional live interview', description: 'Conduct live video interviews with recording.', icon: 'Video' },
  { step: 'Review', title: 'Review performance and session', description: 'Review scores, integrity signals, and session recordings.', icon: 'Search' },
  { step: 'Evaluate', title: 'Reviewers score the participant', description: 'Multi-criteria evaluation with recommendations.', icon: 'ClipboardList' },
  { step: 'Decide', title: 'Organization makes final decision', description: 'Generate reports and make informed decisions.', icon: 'CheckCircle2' },
];

export const landingNav = [
  { label: 'Industries', href: '#industries' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
  { label: 'Pricing', href: '#pricing' },
];

export const platformNav = [
  { label: 'Dashboard', key: 'platform-dashboard', icon: 'LayoutDashboard' },
  { label: 'Organizations', key: 'platform-organizations', icon: 'Building2' },
  { label: 'Subscriptions', key: 'platform-dashboard', icon: 'CreditCard' },
  { label: 'Plans', key: 'platform-dashboard', icon: 'Package' },
  { label: 'Usage', key: 'platform-dashboard', icon: 'BarChart3' },
  { label: 'Analytics', key: 'platform-dashboard', icon: 'TrendingUp' },
  { label: 'Support', key: 'platform-dashboard', icon: 'LifeBuoy' },
  { label: 'Security', key: 'platform-dashboard', icon: 'Shield' },
  { label: 'Settings', key: 'platform-dashboard', icon: 'Settings' },
];

export const orgNav = [
  { label: 'Dashboard', key: 'org-dashboard', icon: 'LayoutDashboard' },
  { label: 'Assessments', key: 'org-assessments', icon: 'FileText' },
  { label: 'Question Bank', key: 'org-question-bank', icon: 'Library' },
  { label: 'Participants', key: 'org-participants', icon: 'Users' },
  { label: 'Interviews', key: 'org-interviews', icon: 'Video' },
  { label: 'Evaluations', key: 'org-evaluations', icon: 'ClipboardList' },
  { label: 'Sessions', key: 'org-sessions', icon: 'MonitorPlay' },
  { label: 'Integrity', key: 'org-integrity', icon: 'ShieldCheck' },
  { label: 'Reports', key: 'org-reports', icon: 'BarChart3' },
  { label: 'Users', key: 'org-users', icon: 'UsersRound' },
  { label: 'Billing', key: 'org-billing', icon: 'CreditCard' },
  { label: 'Settings', key: 'org-settings', icon: 'Settings' },
];
