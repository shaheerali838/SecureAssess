import {
  BarChart3, Download, FileText, TrendingUp, Award, ShieldCheck,
  Users, Video,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, PageHeader,
  LineChart, BarChart, Select,
} from '@/components/ui';






export function Reports({ onNavigate }) {
  const reportTypes = [
    { icon: <Users size={20} />, title: 'Participant Performance', desc: 'Individual scores across all assessments', color: 'bg-primary-50 text-primary-600' },
    { icon: <FileText size={20} />, title: 'Assessment Performance', desc: 'Aggregate results by assessment', color: 'bg-secondary-50 text-secondary-600' },
    { icon: <Award size={20} />, title: 'Examination Results', desc: 'Final examination results and grades', color: 'bg-info-50 text-info-600' },
    { icon: <Video size={20} />, title: 'Interview Performance', desc: 'Interview scores and evaluations', color: 'bg-warning-50 text-warning-600' },
    { icon: <ShieldCheck size={20} />, title: 'Integrity Trends', desc: 'Integrity risk trends over time', color: 'bg-danger-50 text-danger-600' },
    { icon: <TrendingUp size={20} />, title: 'Organization Analytics', desc: 'Organization-wide assessment analytics', color: 'bg-accent-100 text-accent-700' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and export assessment reports"
        icon={<BarChart3 size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Reports' }]}
        actions={
          <>
            <Select options={[
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: 'year', label: 'This year' },
            ]} className="w-36" />
            <Button variant="primary" size="sm" icon={<Download size={16} />}>Export All</Button>
          </>
        }
      />

      {/* Report types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((r, i) => (
          <Card key={i} hover>
            <CardBody>
              <div className={`w-12 h-12 rounded-xl ${r.color} flex items-center justify-center mb-3`}>{r.icon}</div>
              <h3 className="font-semibold text-accent-900 mb-1">{r.title}</h3>
              <p className="text-sm text-accent-500 mb-4">{r.desc}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={<Download size={14} />}>PDF</Button>
                <Button variant="outline" size="sm" icon={<Download size={14} />}>CSV</Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Sample report */}
      <Card>
        <CardHeader
          title="Participant Performance Report"
          subtitle="Summary of recent participant results"
          icon={<FileText size={18} />}
          action={<Button variant="outline" size="sm" icon={<Download size={16} />}>Export</Button>}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent-100 bg-accent-50/50">
                  <th className="text-left text-xs font-semibold text-accent-600 px-5 py-3">Participant</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden sm:table-cell">Assessment</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3">Assessment Score</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden md:table-cell">Interview Score</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3">Overall</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden lg:table-cell">Integrity</th>
                  <th className="text-left text-xs font-semibold text-accent-600 px-3 py-3 hidden lg:table-cell">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Ahmed Khan', assessment: 'Online Midterm', aScore: 78, iScore: null, overall: 78, integrity: 'Low', rec: 'Positive' },
                  { name: 'Sarah Williams', assessment: 'Pilot Knowledge', aScore: 85, iScore: 82, overall: 84, integrity: 'Low', rec: 'Strong' },
                  { name: 'Maria Johnson', assessment: 'MERN Assessment', aScore: 72, iScore: 68, overall: 70, integrity: 'Medium', rec: 'Consider' },
                  { name: 'Daniel Smith', assessment: 'Clinical Nursing', aScore: 81, iScore: null, overall: 81, integrity: 'Low', rec: 'Positive' },
                  { name: 'Zainab Tariq', assessment: 'Admission Test', aScore: 88, iScore: null, overall: 88, integrity: 'Low', rec: 'Strong' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-accent-50 hover:bg-accent-50/50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-accent-800">{r.name}</td>
                    <td className="px-3 py-3 hidden sm:table-cell text-sm text-accent-600">{r.assessment}</td>
                    <td className="px-3 py-3"><span className="text-sm font-bold text-accent-900">{r.aScore}%</span></td>
                    <td className="px-3 py-3 hidden md:table-cell">{r.iScore ? <span className="text-sm font-bold text-accent-900">{r.iScore}%</span> : <span className="text-xs text-accent-400">—</span>}</td>
                    <td className="px-3 py-3"><span className="text-sm font-bold text-accent-900">{r.overall}%</span></td>
                    <td className="px-3 py-3 hidden lg:table-cell"><Badge variant={r.integrity === 'Low' ? 'success' : r.integrity === 'Medium' ? 'warning' : 'danger'} dot>{r.integrity}</Badge></td>
                    <td className="px-3 py-3 hidden lg:table-cell"><Badge variant={r.rec === 'Strong' ? 'success' : r.rec === 'Positive' ? 'primary' : r.rec === 'Consider' ? 'warning' : 'danger'}>{r.rec}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Score Trends" subtitle="Average scores over time" icon={<TrendingUp size={18} />} />
          <CardBody>
            <LineChart
              data={[
                { label: 'Jan', value: 68 }, { label: 'Feb', value: 72 }, { label: 'Mar', value: 70 },
                { label: 'Apr', value: 75 }, { label: 'May', value: 73 }, { label: 'Jun', value: 78 },
                { label: 'Jul', value: 76 }, { label: 'Aug', value: 80 },
              ]}
              color="#2563eb"
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Integrity Trends" subtitle="Risk distribution over time" icon={<ShieldCheck size={18} />} />
          <CardBody>
            <BarChart
              data={[
                { label: 'Jan', value: 5 }, { label: 'Feb', value: 8 }, { label: 'Mar', value: 4 },
                { label: 'Apr', value: 12 }, { label: 'May', value: 7 }, { label: 'Jun', value: 10 },
                { label: 'Jul', value: 6 }, { label: 'Aug', value: 7 },
              ]}
              color="#ef4444"
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
