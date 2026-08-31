import api from './api';

export const certificateService = {
  // Get organization certificates
  getCertificates: async (organizationId, params = {}) => {
    const response = await api.get(`/organizations/${organizationId}/certificates`, { params });
    return response.data?.data || response.data;
  },

  // Get single certificate by ID
  getCertificateById: async (organizationId, certificateId) => {
    const response = await api.get(`/organizations/${organizationId}/certificates/${certificateId}`);
    return response.data?.data || response.data;
  },

  // Issue verifiable certificate for passed candidate result
  issueCertificate: async (organizationId, { resultId, candidateId, assessmentId }) => {
    const response = await api.post(`/organizations/${organizationId}/certificates`, {
      resultId,
      candidateId,
      assessmentId,
    });
    return response.data?.data || response.data;
  },

  // Revoke a certificate
  revokeCertificate: async (organizationId, certificateId, reason = '') => {
    const response = await api.post(`/organizations/${organizationId}/certificates/${certificateId}/revoke`, {
      reason,
    });
    return response.data?.data || response.data;
  },

  // Public verification endpoint (No auth required)
  verifyCertificatePublic: async (verificationCode) => {
    const response = await api.get(`/public/certificates/verify/${verificationCode}`);
    return response.data?.data || response.data;
  },
};

export default certificateService;
