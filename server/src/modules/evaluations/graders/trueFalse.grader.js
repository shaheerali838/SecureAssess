/**
 * True / False Question Grader
 */
export const gradeTrueFalse = (questionSnapshot, candidateAnswer, assessmentSettings = {}) => {
  const maxPoints = questionSnapshot.marks || questionSnapshot.points || 1;
  const negativeMarks = questionSnapshot.negativeMarks || assessmentSettings.negativeMarkingPenalty || 0;
  const enableNegativeMarking = Boolean(questionSnapshot.negativeMarks > 0 || assessmentSettings.negativeMarking);

  const rawAns = candidateAnswer?.answer !== undefined ? candidateAnswer.answer : candidateAnswer;
  let candidateVal = null;

  if (typeof rawAns === "boolean") {
    candidateVal = rawAns;
  } else if (typeof rawAns === "string") {
    if (rawAns.toLowerCase() === "true") candidateVal = true;
    else if (rawAns.toLowerCase() === "false") candidateVal = false;
  } else if (rawAns && typeof rawAns === "object") {
    if (rawAns.value !== undefined) candidateVal = Boolean(rawAns.value);
    else if (rawAns.selectedOptionId === "true") candidateVal = true;
    else if (rawAns.selectedOptionId === "false") candidateVal = false;
  }

  const rawCorrect = questionSnapshot.correctAnswer || questionSnapshot.snapshot?.correctAnswer;
  let correctVal = null;
  if (typeof rawCorrect === "boolean") {
    correctVal = rawCorrect;
  } else if (rawCorrect && typeof rawCorrect === "object") {
    if (rawCorrect.value !== undefined) correctVal = Boolean(rawCorrect.value);
    else if (rawCorrect.optionIds?.[0] === "true") correctVal = true;
    else if (rawCorrect.optionIds?.[0] === "false") correctVal = false;
  } else if (typeof rawCorrect === "string") {
    correctVal = rawCorrect.toLowerCase() === "true";
  }

  if (candidateVal === null || candidateVal === undefined) {
    return {
      earnedPoints: 0,
      scorePercentage: 0,
      isCorrect: false,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "Unanswered",
    };
  }

  const isCorrect = candidateVal === correctVal;

  if (isCorrect) {
    return {
      earnedPoints: maxPoints,
      scorePercentage: 100,
      isCorrect: true,
      status: "EVALUATED",
      evaluationType: "AUTOMATIC",
      feedback: "Correct answer",
    };
  }

  const earnedPoints = enableNegativeMarking ? -Math.abs(negativeMarks) : 0;

  return {
    earnedPoints,
    scorePercentage: 0,
    isCorrect: false,
    status: "EVALUATED",
    evaluationType: "AUTOMATIC",
    feedback: "Incorrect answer",
  };
};
