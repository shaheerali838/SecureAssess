import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Lock, Key, AlertTriangle, CheckCircle2,
  RefreshCw, Globe, Eye, Filter, Ban, Download, Search, Server
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, Button, Input, Select, PageHeader, Modal, SkeletonCards
} from '@/components/ui';
import platformService from '@/services/platform.service';

export function SecurityCenter({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('threats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [securityData, setSecurityData] = useState({
    posture: 'Optimal',
    wafBlocks: 0,
    tlsStrict: '100%',
    revokedTokens: 0,
    incidents: [],
  });

  const fetchSecurityIntelligence = async () => {
    setLoading(true);
    try {
      const res = await platformService.getSecurityIntelligence();
      const payload = res?.data || res || {};
      setSecurityData({
        posture: payload.posture || 'Optimal',
        wafBlocks: payload.wafBlocks || 0,
        tlsStrict: payload.tlsStrict || '100%',
        revokedTokens: payload.revokedTokens || 0,
        incidents: Array.isArray(payload.incidents) ? payload.incidents : [],
      });
    } catch (err) {
      console.warn('Security intelligence fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityIntelligence();
  }, []);

  const filteredIncidents = (securityData.incidents || []).filter(
    (i) =>
      i.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.ip.includes(searchQuery) ||
      i.origin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Security Center"
        subtitle="Global threat intelligence, automated WAF policies, and zero-trust access enforcement."
        icon={<ShieldCheck size={22} className="text-primary-600 dark:text-primary-400" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Download size={15} />}>
              Security Audit Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchSecurityIntelligence}
            >
              Scan Threat Vectors
            </Button>
          </div>
        }
      />

      {/* Security Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Global Threat Posture"
          value={securityData.posture}
          icon={<ShieldCheck size={20} />}
          trend={{ value: 'Zero-Day Shield Active', up: true }}
          color="success"
        />
        <MetricCard
          label="Automated WAF Blocks"
          value={String(securityData.wafBlocks)}
          icon={<Ban size={20} />}
          trend={{ value: 'Threat Scrubbing', up: false }}
          color="danger"
        />
        <MetricCard
          label="Active TLS 1.3 Sessions"
          value={securityData.tlsStrict}
          icon={<Lock size={20} />}
          trend={{ value: 'Strict HSTS Enforced', up: true }}
          color="primary"
        />
        <MetricCard
          label="Active Revoked Tokens"
          value={String(securityData.revokedTokens)}
          icon={<Key size={20} />}
          trend={{ value: 'JTI Blacklist Synced', up: true }}
          color="info"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-accent-200 dark:border-accent-800">
        {[
          { id: 'threats', label: 'Threat Vectors & Anomalies' },
          { id: 'waf', label: 'WAF & Rate Limiting Rules' },
          { id: 'certs', label: 'TLS Certificates & Ciphers' },
          { id: 'revocations', label: 'Token Blacklist & Sessions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-accent-500 hover:text-accent-800 dark:hover:text-accent-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCards count={3} />
      ) : (
        <>
          {activeTab === 'threats' && (
            <Card>
              <CardHeader
                title="Real-Time Incident & Anomaly Stream"
                subtitle="Automated packet inspection and rate violation detection"
                icon={<AlertTriangle size={18} className="text-warning-500" />}
                action={
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search by IP, type, country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                }
              />
              <CardBody className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-accent-50/80 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 border-b border-accent-200 dark:border-accent-800">
                    <tr>
                      <th className="p-3.5 font-semibold">Incident ID</th>
                      <th className="p-3.5 font-semibold">Vector Type</th>
                      <th className="p-3.5 font-semibold">Source IP & Geo</th>
                      <th className="p-3.5 font-semibold">Target Endpoint</th>
                      <th className="p-3.5 font-semibold">Severity</th>
                      <th className="p-3.5 font-semibold">Mitigation Status</th>
                      <th className="p-3.5 font-semibold">Time</th>
                      <th className="p-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                    {filteredIncidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-accent-50/40 dark:hover:bg-accent-800/20 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-accent-900 dark:text-white">{inc.id}</td>
                        <td className="p-3.5 font-medium text-accent-800 dark:text-accent-200">{inc.type}</td>
                        <td className="p-3.5">
                          <div className="font-mono text-accent-900 dark:text-white">{inc.ip}</div>
                          <div className="text-[11px] text-accent-400">{inc.origin}</div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-accent-500">{inc.target}</td>
                        <td className="p-3.5">
                          <Badge
                            variant={
                              inc.severity === 'CRITICAL'
                                ? 'danger'
                                : inc.severity === 'HIGH'
                                ? 'danger'
                                : inc.severity === 'MEDIUM'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {inc.severity}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-600 dark:text-success-400">
                            <CheckCircle2 size={13} />
                            {inc.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-accent-400">{inc.timestamp}</td>
                        <td className="p-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Eye size={13} />}
                            onClick={() => setSelectedIncident(inc)}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

          {activeTab === 'waf' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader title="WAF Rate Limiting Profiles" subtitle="Global per-IP token bucket configurations" />
                <CardBody className="space-y-4">
                  {[
                    { name: 'Public Authentication (/auth/login)', limit: '10 req / min', burst: '15', status: 'ACTIVE' },
                    { name: 'Live Video Signaling (/telemetry/ws)', limit: '120 req / min', burst: '200', status: 'ACTIVE' },
                    { name: 'Exam Submission (/attempts/submit)', limit: '20 req / min', burst: '30', status: 'ACTIVE' },
                    { name: 'Report Generation (/reports/export)', limit: '5 req / min', burst: '10', status: 'ACTIVE' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-accent-50 dark:bg-accent-950/40 rounded-xl border border-accent-100 dark:border-accent-800">
                      <div>
                        <p className="text-xs font-bold text-accent-900 dark:text-white">{r.name}</p>
                        <p className="text-[11px] text-accent-400">Limit: {r.limit} · Burst: {r.burst}</p>
                      </div>
                      <Badge variant="success">{r.status}</Badge>
                    </div>
                  ))}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="DDoS & Geo-Fencing Constraints" subtitle="Global IP reputation filtering" />
                <CardBody className="space-y-3">
                  <div className="p-3 bg-accent-50 dark:bg-accent-950/40 rounded-xl border border-accent-100 dark:border-accent-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-accent-900 dark:text-white">Cloudflare Threat Score Threshold</p>
                      <p className="text-[11px] text-accent-400">Block IPs with threat score &gt; 40</p>
                    </div>
                    <Badge variant="primary">Threshold 40</Badge>
                  </div>
                  <div className="p-3 bg-accent-50 dark:bg-accent-950/40 rounded-xl border border-accent-100 dark:border-accent-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-accent-900 dark:text-white">SYN Flood & UDP Amplification Protection</p>
                      <p className="text-[11px] text-accent-400">Layer 4/7 automatic scrubber relay</p>
                    </div>
                    <Badge variant="success">Enabled</Badge>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === 'certs' && (
            <Card>
              <CardHeader title="Cryptographic Certificate Catalog" subtitle="Active SSL/TLS certificates and cipher suites" />
              <CardBody className="space-y-3">
                <div className="p-4 bg-accent-50 dark:bg-accent-950/40 rounded-xl border border-accent-100 dark:border-accent-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-accent-900 dark:text-white">*.secureassess.io (Global Wildcard)</p>
                    <p className="text-[11px] text-accent-400">Issuer: Let's Encrypt Authority X3 · Valid until Dec 18, 2026</p>
                  </div>
                  <Badge variant="success">Active (TLS 1.3)</Badge>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'revocations' && (
            <Card>
              <CardHeader title="JWT JTI Revocation Registry" subtitle="Revoked tokens stored in high-performance memory cache" />
              <CardBody className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-accent-50/80 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 border-b border-accent-200 dark:border-accent-800">
                    <tr>
                      <th className="p-3.5 font-semibold">JTI Token ID</th>
                      <th className="p-3.5 font-semibold">User Subject</th>
                      <th className="p-3.5 font-semibold">Revocation Reason</th>
                      <th className="p-3.5 font-semibold">Revoked At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                    {[
                      { jti: 'jti_9948a280f92b', user: 'ahmed.khan@student.edu', reason: 'Explicit User Logout', at: '10 mins ago' },
                      { jti: 'jti_1120fbb839c1', user: 'proctor@stanford.edu', reason: 'Session Expiry Rotation', at: '45 mins ago' },
                      { jti: 'jti_8841ba0093ef', user: 'dean@stanford.edu', reason: 'Administrative Revocation', at: '2 hours ago' },
                    ].map((r, idx) => (
                      <tr key={idx} className="hover:bg-accent-50/40 dark:hover:bg-accent-800/20">
                        <td className="p-3.5 font-mono text-accent-900 dark:text-white">{r.jti}</td>
                        <td className="p-3.5 font-medium">{r.user}</td>
                        <td className="p-3.5 text-accent-500">{r.reason}</td>
                        <td className="p-3.5 text-accent-400">{r.at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* Incident Inspection Modal */}
      {selectedIncident && (
        <Modal
          isOpen={Boolean(selectedIncident)}
          onClose={() => setSelectedIncident(null)}
          title={`Incident Inspection: ${selectedIncident.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-accent-50 dark:bg-accent-950/60 rounded-xl border border-accent-200 dark:border-accent-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-accent-500">Vector Type:</span>
                <span className="font-bold text-accent-900 dark:text-white">{selectedIncident.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-accent-500">Source IP & Geo:</span>
                <span className="font-mono text-accent-900 dark:text-white">{selectedIncident.ip} ({selectedIncident.origin})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-accent-500">Target Resource:</span>
                <span className="font-mono text-accent-900 dark:text-white">{selectedIncident.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-accent-500">Total Packet Hits:</span>
                <span className="font-bold text-accent-900 dark:text-white">{selectedIncident.hits} requests</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedIncident(null)}>
                Close
              </Button>
              <Button variant="danger" size="sm" icon={<Ban size={14} />}>
                Permanently Blacklist IP
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SecurityCenter;
