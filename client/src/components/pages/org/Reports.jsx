import React, { useState } from 'react';
import {
  BarChart3, Download, FileText, TrendingUp, Award, ShieldCheck,
  Users, Video, Check
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, PageHeader,
  LineChart, BarChart, Select, Toast
} from '@/components/ui';
import { exportToCSV, printPDFCertificate } from '@/utils/exportUtils';

export function Reports({ onNavigate }) {
  const [toastMessage, setToastMessage] = useState(null);

  const gradebookData = [
    { name: 'Ahmed Khan', assessment: 'Data Structures Midterm', aScore: 78, iScore: 'N/A', overall: 78, integrity: 'Low', rec: 'Positive' },
    { name: 'Sarah Williams', assessment: 'Flight Technical Test', aScore: 85, iScore: 82, overall: 84, integrity: 'Low', rec: 'Strong' },
    { name: 'Maria Johnson', assessment: 'Full-Stack JavaScript Screening', aScore: 72, iScore: 68, overall: 70, integrity: 'Medium', rec: 'Consider' },
    { name: 'Daniel Smith', assessment: 'Clinical Competency Exam', aScore: 81, iScore: 'N/A', overall: 81, integrity: 'Low', rec: 'Positive' },
    { name: 'Zainab Tariq', assessment: 'University Admissions Exam', aScore: 88, iScore: 'N/A', overall: 88, integrity: 'Low', rec: 'Strong' },
  ];

  const handleExportGradebookCSV = () => {
    exportToCSV(
      'SecureAssess_Cohort_Gradebook',
      gradebookData,
      [
        { key: 'name', label: 'Candidate Name' },
        { key: 'assessment', label: 'Assessment' },
        { key: 'aScore', label: 'Test Score (%)' },
        { key: 'iScore', label: 'Interview Score (%)' },
        { key: 'overall', label: 'Overall (%)' },
        { key: 'integrity', label: 'Risk Rating' },
        { key: 'rec', label: 'Recommendation' },
      ]
    );
    setToastMessage({ type: 'success', text: 'Gradebook CSV exported successfully!' });
  };

  const handleDownloadSamplePDF = (candidateName, assessmentTitle, score) => {
    printPDFCertificate({
      candidateName,
      assessmentTitle,
      score,
      passingScore: 60,
      organizationName: 'Stanford Engineering Faculty',
    });
    setToastMessage({ type: 'success', text: `Opening certified PDF for ${candidateName}...` });
  };

  const reportTypes = [
    { icon: <Users size={20} />, title: 'Candidate Performance Matrix', desc: 'Cohort score distributions, percentile rankings, and completion stats', color: 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400', exportKey: 'performance' },
    { icon: <FileText size={20} />, title: 'Assessment Item Analysis', desc: 'Question difficulty indices, discrimination ratings, and time-per-question', color: 'bg-secondary-50 dark:bg-secondary-950/60 text-secondary-600 dark:text-secondary-400', exportKey: 'items' },
    { icon: <Award size={20} />, title: 'Examination Gradebook', desc: 'Final certified test scores with rubric grading breakdowns', color: 'bg-info-50 dark:bg-info-950/60 text-info-600 dark:text-info-400', exportKey: 'gradebook' },
    { icon: <Video size={20} />, title: 'Interview Competency Rubric', desc: 'Evaluator scorecards, competency rubrics, and consensus notes', color: 'bg-warning-50 dark:bg-warning-950/60 text-warning-600 dark:text-warning-400', exportKey: 'interview' },
    { icon: <ShieldCheck size={20} />, title: 'Integrity Audit Log', desc: 'Proctoring timeline flags, tab switches, and identity verifications', color: 'bg-danger-50 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400', exportKey: 'integrity' },
    { icon: <TrendingUp size={20} />, title: 'Institutional Analytics', desc: 'Cross-cohort performance trends and department benchmarks', color: 'bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300', exportKey: 'analytics' },
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <PageHeader
        title="Assessment Reports & Analytics"
        subtitle="Exportable audit summaries, psychometric item analytics, and cohort gradebooks."
        icon={<BarChart3 size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Reports' }]}
        actions={
          <div className="flex items-center gap-2">
            <Select
              options={[
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: 'year', label: 'Academic Year' },
              ]}
              className="w-36"
            />
            <Button variant="primary" size="sm" icon={<Download size={15} />} onClick={handleExportGradebookCSV}>
              Export All CSV
            </Button>
          </div>
        }
      />

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((r, i) => (
          <Card key={i} hover className="flex flex-col justify-between">
            <CardBody className="p-5">
              <div className={`w-11 h-11 rounded-xl ${r.color} flex items-center justify-center mb-3 shadow-soft`}>
                {r.icon}
              </div>
              <h3 className="font-bold text-accent-900 dark:text-white text-sm mb-1">{r.title}</h3>
              <p className="text-xs text-accent-500 dark:text-accent-400 mb-4 leading-relaxed">{r.desc}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download size={13} />}
                  onClick={() => handleDownloadSamplePDF('Sarah Williams', r.title, 88)}
                >
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download size={13} />}
                  onClick={handleExportGradebookCSV}
                >
                  CSV
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Candidate Performance Preview */}
      <Card>
        <CardHeader
          title="Candidate Performance Gradebook"
          subtitle="Recent examination scoring summary and proctoring ratings"
          icon={<FileText size={18} />}
          action={
            <Button variant="outline" size="sm" icon={<Download size={15} />} onClick={handleExportGradebookCSV}>
              Export Gradebook CSV
            </Button>
          }
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/50">
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Candidate</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden sm:table-cell">Assessment</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Test Score</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden md:table-cell">Interview Score</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3">Overall</th>
                  <th className="text-left text-xs font-semibold text-accent-600 dark:text-accent-400 px-3 py-3 hidden lg:table-cell">Integrity</th>
                  <th className="text-right text-xs font-semibold text-accent-600 dark:text-accent-400 px-5 py-3">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {gradebookData.map((r, i) => (
                  <tr key={i} className="border-b border-accent-50 dark:border-accent-800/40 hover:bg-accent-50/50 dark:hover:bg-accent-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-semibold text-accent-900 dark:text-white">{r.name}</td>
                    <td className="px-3 py-3.5 hidden sm:table-cell text-xs text-accent-700 dark:text-accent-300">{r.assessment}</td>
                    <td className="px-3 py-3.5 text-xs font-mono font-bold text-accent-900 dark:text-white">{r.aScore}%</td>
                    <td className="px-3 py-3.5 hidden md:table-cell text-xs font-mono text-accent-500">{r.iScore !== 'N/A' ? `${r.iScore}%` : '—'}</td>
                    <td className="px-3 py-3.5 text-xs font-mono font-bold text-primary-600 dark:text-primary-400">{r.overall}%</td>
                    <td className="px-3 py-3.5 hidden lg:table-cell">
                      <Badge variant={r.integrity === 'Low' ? 'success' : 'warning'}>{r.integrity} Risk</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Award size={14} />}
                        onClick={() => handleDownloadSamplePDF(r.name, r.assessment, r.overall)}
                      >
                        PDF Transcript
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Reports;
