/**
 * Short Answer Question Grader (Case-insensitive trimmed comparison)
 */
export const gradeShortAnswer = (questionSnapshot, candidateAnswer, assessmentSettings = {}) => {
  const maxPoints = questionSnapshot.points || 1;
  const text = candidateAnswer?.answer?.text ? String(candidateAnswer.answer.text).trim().toLowerCase() : "";

  const correctAnswers = Array.isArray(questionSnapshot.correctAnswer)
    ? questionSnapshot.correctAnswer.map((a) => String(a).trim().toLowerCase())
    : [String(questionSnapshot.correctAnswer).trim().toLowerCase()];

  if (!text) {
    return {
      earnedPoints: 0,
      scorePercentage: 0,
      isCorrect: false,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "Unanswered",
    };
  }

  const isCorrect = correctAnswers.includes(text);

  return {
    earnedPoints: isCorrect ? maxPoints : 0,
    scorePercentage: isCorrect ? 100 : 0,
    isCorrect,
    status: "EVALUATED",
    evaluationType: "AUTOMATIC",
    feedback: isCorrect ? "Exact text match" : "Incorrect response",
  };
};
