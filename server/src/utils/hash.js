import crypto from "crypto";

export const generateHash = (data, algorithm = "sha256") => {
  return crypto.createHash(algorithm).update(data).digest("hex");
};

export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};
