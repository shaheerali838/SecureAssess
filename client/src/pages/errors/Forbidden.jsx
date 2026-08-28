import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ORGANIZATION_ROLES } from '../../constants/roles';

export const Forbidden = () => {
  const navigate = useNavigate();
  const { isPlatformStaff } = useAuth();
  const { userRole } = useOrganization();

  const handleReturn = () => {
    if (isPlatformStaff) {
      navigate('/platform/dashboard', { replace: true });
    } else if (userRole === ORGANIZATION_ROLES.CANDIDATE) {
      navigate('/candidate/system-check', { replace: true });
    } else {
      navigate('/organization/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-accent-950 flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="w-16 h-16 rounded-2xl bg-danger-950/80 border border-danger-800/60 flex items-center justify-center text-danger-400 mb-6 shadow-glow-danger">
        <ShieldX className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold font-display">403 — Access Forbidden</h1>
      <p className="text-sm text-accent-400 max-w-md mt-2 mb-8">
        You do not hold the required platform or organization permissions to view this resource.
      </p>
      <button
        onClick={handleReturn}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-800 hover:bg-accent-700 text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Your Workspace</span>
      </button>
    </div>
  );
};

export default Forbidden;
