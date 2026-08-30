/**
 * Manual / Subjective Question Grader (Essays, Video Responses, etc.)
 */
export const gradeManual = (questionSnapshot, candidateAnswer, assessmentSettings = {}) => {
  return {
    earnedPoints: 0,
    scorePercentage: 0,
    isCorrect: false,
    status: "NEEDS_MANUAL_REVIEW",
    evaluationType: "MANUAL",
    feedback: "Awaiting examiner review and manual evaluation",
  };
};
