export const requestIdMiddleware = (req, res, next) => {
  const existingId = req.headers["x-request-id"];
  const generatedId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  req.requestId = existingId || generatedId;
  res.setHeader("X-Request-Id", req.requestId);

  next();
};

export default requestIdMiddleware;
