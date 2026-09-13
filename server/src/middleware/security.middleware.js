/**
 * Enterprise Security Headers & HTTP Parameter Pollution Protection
 */

export const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Clickjacking protection (allow framing only within same origin if needed)
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Cross-site scripting filter
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Enforce HTTPS
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Strict Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy for WebRTC Camera / Microphone isolation
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(self), display-capture=(self), geolocation=()"
  );

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' blob:; connect-src 'self' https: wss: ws:; frame-ancestors 'self';"
  );

  // Disable caching on authenticated API routes
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};

/**
 * HTTP Parameter Pollution (HPP) Prevention Middleware
 * Normalizes query parameters by picking the last value if multiple instances are supplied
 */
export const hppProtection = (req, res, next) => {
  if (req.query && typeof req.query === "object") {
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        // Keep the last valid parameter string to avoid pollution attacks
        req.query[key] = value[value.length - 1];
      }
    }
  }
  next();
};
