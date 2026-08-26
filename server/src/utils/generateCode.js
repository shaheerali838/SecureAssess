export const generateAssessmentCode = (length = 6) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateOtp = (digits = 6) => {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, digits);
};
