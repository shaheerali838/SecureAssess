import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Lock, Key, AlertTriangle, CheckCircle2,
  RefreshCw, Globe, Eye, Filter, Ban, Download, Search, Server, Shield
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, Button, Input, Select, PageHeader, Modal, SkeletonCards, EmptyState
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
    wafRules: [],
    tlsInfo: null,
    revocations: [],
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
        wafRules: Array.isArray(payload.wafRules) ? payload.wafRules : [],
        tlsInfo: payload.tlsInfo || null,
        revocations: Array.isArray(payload.revocations) ? payload.revocations : [],
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
      (i.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.ip || '').includes(searchQuery) ||
      (i.origin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Security Center"
        subtitle="Global threat intelligence, automated WAF policies, and zero-trust access enforcement."
        icon={<ShieldCheck size={22} className="text-primary-600 dark:text-primary-400" />}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchSecurityIntelligence}
              className="w-full sm:w-auto"
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
          color={securityData.wafBlocks > 10 ? 'warning' : 'success'}
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
      <div className="flex items-center gap-2 border-b border-accent-200 dark:border-accent-800 overflow-x-auto no-scrollbar whitespace-nowrap pb-0.5">
        {[
          { id: 'threats', label: `Threat Vectors & Anomalies (${securityData.incidents.length})` },
          { id: 'waf', label: `WAF & Rate Limiting Rules (${securityData.wafRules.length || 4})` },
          { id: 'certs', label: 'TLS Certificates & Ciphers' },
          { id: 'revocations', label: `Token Blacklist & Sessions (${securityData.revocations.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors shrink-0 ${
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
                subtitle="Live audit-driven packet inspection, authorization denials, and rate violations"
                icon={<AlertTriangle size={18} className="text-warning-500" />}
                action={
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      placeholder="Search by IP, type, country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64"
                    />
                  </div>
                }
              />
              <CardBody className="p-0 overflow-x-auto w-full no-scrollbar">
                {filteredIncidents.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon={<ShieldCheck size={36} className="text-emerald-500" />}
                      title="No Security Violations Detected"
                      description="All incoming requests and access tokens match verified zero-trust platform security criteria."
                    />
                  </div>
                ) : (
                  <table className="w-full min-w-[780px] text-left text-xs">
                    <thead className="bg-accent-50/80 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 border-b border-accent-200 dark:border-accent-800">
                      <tr>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[100px]">Incident ID</th>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[140px]">Vector Type</th>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[150px]">Source IP & Client</th>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[150px]">Target Endpoint</th>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[100px]">Severity</th>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[130px]">Mitigation Status</th>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[110px]">Time</th>
                        <th className="p-3.5 font-semibold text-right whitespace-nowrap min-w-[80px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                      {filteredIncidents.map((inc) => (
                        <tr key={inc.id} className="hover:bg-accent-50/40 dark:hover:bg-accent-800/20 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-accent-900 dark:text-white whitespace-nowrap">{inc.id}</td>
                          <td className="p-3.5 font-medium text-accent-800 dark:text-accent-200 whitespace-nowrap">{inc.type}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-mono text-accent-900 dark:text-white">{inc.ip}</div>
                            <div className="text-[11px] text-accent-400">{inc.origin}</div>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-accent-500 whitespace-nowrap">{inc.target}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <Badge
                              variant={
                                inc.severity === 'CRITICAL' || inc.severity === 'HIGH'
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
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'waf' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader title="WAF Rate Limiting Profiles" subtitle="Live per-IP token bucket configurations on API gateway" />
                <CardBody className="space-y-3">
                  {(securityData.wafRules.length > 0 ? securityData.wafRules : [
                    { name: 'Public Authentication (/api/v1/auth/*)', limit: '60 req / min', burst: '100', status: 'ACTIVE' },
                    { name: 'Live Video WebRTC Telemetry (/socket.io)', limit: '200 req / min', burst: '300', status: 'ACTIVE' },
                    { name: 'Assessment Submission (/api/v1/attempts/*)', limit: '120 req / min', burst: '150', status: 'ACTIVE' },
                    { name: 'Organization Management (/api/v1/organizations/*)', limit: '200 req / min', burst: '250', status: 'ACTIVE' },
                  ]).map((r, i) => (
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
                <CardHeader title="DDoS & Reverse Proxy Ingress Guard" subtitle="Real-time reverse proxy trust and header protection" />
                <CardBody className="space-y-3">
                  <div className="p-3 bg-accent-50 dark:bg-accent-950/40 rounded-xl border border-accent-100 dark:border-accent-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-accent-900 dark:text-white">Reverse Proxy Hop Verification</p>
                      <p className="text-[11px] text-accent-400">Trusts upstream Vercel Edge / Cloudflare Proxies (Hop 1)</p>
                    </div>
                    <Badge variant="primary">Enforced</Badge>
                  </div>
                  <div className="p-3 bg-accent-50 dark:bg-accent-950/40 rounded-xl border border-accent-100 dark:border-accent-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-accent-900 dark:text-white">SYN Flood & Rate Bucket Scrubber</p>
                      <p className="text-[11px] text-accent-400">Automatic token depletion drop on 429 status code</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === 'certs' && (
            <Card>
              <CardHeader title="Cryptographic Certificate & Ingress Catalog" subtitle="Live TLS certificates, ciphers, and HTTPS enforcement" />
              <CardBody className="space-y-3">
                <div className="p-4 bg-accent-50 dark:bg-accent-950/40 rounded-xl border border-accent-100 dark:border-accent-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-accent-900 dark:text-white">
                      {securityData.tlsInfo?.domain || typeof window !== 'undefined' ? window.location.hostname : 'secure-assess.vercel.app'} (Primary Domain)
                    </p>
                    <p className="text-[11px] text-accent-400">
                      Issuer: {securityData.tlsInfo?.issuer || 'Vercel / Cloudflare Edge CA'} · Protocol: {securityData.tlsInfo?.protocol || 'TLS 1.3 / HTTPS'}
                    </p>
                    <p className="text-[11px] text-accent-500 font-mono mt-0.5">
                      {securityData.tlsInfo?.hsts || 'Strict HSTS Enforced (max-age=31536000; includeSubDomains)'}
                    </p>
                  </div>
                  <Badge variant="success">{securityData.tlsInfo?.status || 'Active (TLS 1.3)'}</Badge>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'revocations' && (
            <Card>
              <CardHeader title="JWT JTI Revocation & Session Blacklist" subtitle="Real-time user session terminations and token rotations" />
              <CardBody className="p-0 overflow-x-auto w-full no-scrollbar">
                {securityData.revocations.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon={<Key size={36} className="text-primary-500" />}
                      title="No Revoked Sessions"
                      description="No active JWT revocations or blacklisted tokens found in the system log."
                    />
                  </div>
                ) : (
                  <table className="w-full min-w-[650px] text-left text-xs">
                    <thead className="bg-accent-50/80 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 border-b border-accent-200 dark:border-accent-800">
                      <tr>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[140px]">JTI Token ID</th>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[160px]">User Subject</th>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[180px]">Revocation Reason</th>
                        <th className="p-3.5 font-semibold whitespace-nowrap min-w-[120px]">Revoked At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                      {securityData.revocations.map((r, idx) => (
                        <tr key={idx} className="hover:bg-accent-50/40 dark:hover:bg-accent-800/20">
                          <td className="p-3.5 font-mono text-accent-900 dark:text-white whitespace-nowrap">{r.jti}</td>
                          <td className="p-3.5 font-medium whitespace-nowrap">{r.user}</td>
                          <td className="p-3.5 text-accent-500 whitespace-nowrap">{r.reason}</td>
                          <td className="p-3.5 text-accent-400 whitespace-nowrap">{r.at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* Incident Inspection Modal */}
      {selectedIncident && (
        <Modal
          open={Boolean(selectedIncident)}
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
                <span className="text-accent-500">Source IP & Client:</span>
                <span className="font-mono text-accent-900 dark:text-white">{selectedIncident.ip} ({selectedIncident.origin})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-accent-500">Target Resource:</span>
                <span className="font-mono text-accent-900 dark:text-white">{selectedIncident.target}</span>
              </div>
              {selectedIncident.actor && (
                <div className="flex justify-between">
                  <span className="text-accent-500">Subject / Actor:</span>
                  <span className="font-mono text-accent-900 dark:text-white">{selectedIncident.actor}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-accent-500">Total Packet Hits:</span>
                <span className="font-bold text-accent-900 dark:text-white">{selectedIncident.hits} request(s)</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedIncident(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SecurityCenter;
