import api from './api';

export const questionBankService = {
  /**
   * Fetch all questions from the question bank
   */
  async getQuestions(params = {}) {
    const response = await api.get('/questions', { params });
    return response.data || response;
  },

  /**
   * Fetch a single question by ID
   */
  async getQuestionById(id) {
    const response = await api.get(`/questions/${id}`);
    return response.data || response;
  },

  /**
   * Create a new question in the question bank
   */
  async createQuestion(data) {
    const response = await api.post('/questions', data);
    return response.data || response;
  },

  /**
   * Update an existing question
   */
  async updateQuestion(id, data) {
    const response = await api.patch(`/questions/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete a question from the question bank
   */
  async deleteQuestion(id) {
    const response = await api.delete(`/questions/${id}`);
    return response.data || response;
  },
};

export default questionBankService;
