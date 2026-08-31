import api from './api';

export const certificateService = {
  /**
   * List certificates for organization
   */
  async getCertificates(params = {}) {
    const response = await api.get('/certificates', { params });
    return response.data || response;
  },

  /**
   * Get single certificate details
   */
  async getCertificateById(certificateId) {
    const response = await api.get(`/certificates/${certificateId}`);
    return response.data || response;
  },

  /**
   * Issue certificate for a result
   */
  async issueCertificate(resultId) {
    const response = await api.post('/certificates', { resultId });
    return response.data || response;
  },

  /**
   * Download certificate PDF / file link
   */
  async downloadCertificate(certificateId) {
    const response = await api.get(`/certificates/${certificateId}/download`);
    return response.data || response;
  },

  /**
   * Candidate self-service certificates
   */
  async getMyCertificates() {
    const response = await api.get('/certificates/my');
    return response.data || response;
  },

  /**
   * Public certificate verification
   */
  async verifyCertificate(verificationCode) {
    const response = await api.get(`/certificates/verify/${verificationCode}`);
    return response.data || response;
  },
};

export default certificateService;
