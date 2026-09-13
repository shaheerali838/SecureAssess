import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Calendar,
  Building2,
  User,
  Hash,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import certificateService from '@/services/certificate.service';

export const CertificateVerify = () => {
  const { verificationCode: paramCode } = useParams();
  const [code, setCode] = useState(paramCode || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (paramCode) {
      handleVerify(paramCode);
    }
  }, [paramCode]);

  const handleVerify = async (codeToVerify) => {
    const cleanCode = (codeToVerify || code).trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);

    try {
      const data = await certificateService.verifyCertificatePublic(cleanCode);
      setResult(data);
    } catch (err) {
      console.error('Certificate verification failed:', err);
      setError(
        err.response?.data?.message ||
          'Certificate could not be verified. Please ensure the code is correct.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleVerify(code);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-emerald-600/10 blur-[130px] rounded-full" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                SecureAssess
              </span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                Credential Verification
              </span>
            </div>
          </Link>

          <Link
            to="/login"
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            Portal Login
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center">
        {/* Title & Search Form */}
        <div className="text-center max-w-xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cryptographically Verifiable Credential Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Verify Assessment Credential
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Enter the unique verification code printed on the certificate to confirm its authenticity, recipient identity, and issuing organization.
          </p>

          {/* Search Box */}
          <form onSubmit={onSubmit} className="mt-8 flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SA-2026-XXXX or ABCD-1234-EFGH"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Verify</span>
            </button>
          </form>
        </div>

        {/* Verification Results */}
        {loading && (
          <div className="w-full max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center backdrop-blur-xl">
            <div className="w-12 h-12 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-medium text-sm">Querying SecureAssess Credential Ledger...</p>
          </div>
        )}

        {!loading && error && (
          <div className="w-full max-w-2xl bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-rose-200 mb-1">Verification Unsuccessful</h3>
                <p className="text-rose-300/80 text-sm leading-relaxed mb-4">{error}</p>
                <div className="text-xs text-rose-400/60">
                  Please check if the code was entered correctly, or contact the issuing organization if you believe this is an error.
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && result && (
          <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Status Banner */}
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-emerald-400 font-bold text-sm tracking-wide uppercase">
                    Authentic & Valid Credential
                  </div>
                  <div className="text-emerald-300/60 text-xs">
                    Verified on SecureAssess Authoritative Ledger
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono font-semibold px-3 py-1 rounded-md bg-slate-900 border border-emerald-500/30 text-emerald-400">
                {result.certificateNumber || result.verificationCode}
              </div>
            </div>

            {/* Credential Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Recipient Candidate
                </div>
                <div className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  <span>{result.recipientName || 'Verified Candidate'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Assessment Title
                  </div>
                  <div className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>{result.assessmentTitle || 'Certification Assessment'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Issuing Organization
                  </div>
                  <div className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span>{result.organizationName || 'SecureAssess Enterprise'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Issue Date
                  </div>
                  <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>
                      {result.issuedAt
                        ? new Date(result.issuedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Official Record'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Score / Status
                  </div>
                  <div className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {result.score ? `Score: ${result.score}% (Passed)` : 'Passed & Certified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate File / Download Link if available */}
              {result.fileUrl && (
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <a
                    href={result.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-600/20"
                  >
                    <span>View Official Certificate Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SecureAssess Platform. All credentials cryptographically signed and immutable.</p>
      </footer>
    </div>
  );
};

export default CertificateVerify;
