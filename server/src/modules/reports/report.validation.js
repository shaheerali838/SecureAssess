import { REPORT_TYPE_LIST, REPORT_FORMAT_LIST } from "./report.constants.js";

export const exportReportSchema = {
  validate: (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
      return {
        error: { details: [{ message: "Request body is required" }] },
        value: body,
      };
    }
    if (!body.type || !REPORT_TYPE_LIST.includes(body.type)) {
      errors.push({
        message: `Report type must be one of: ${REPORT_TYPE_LIST.join(", ")}`,
      });
    }
    if (body.format && !REPORT_FORMAT_LIST.includes(body.format)) {
      errors.push({
        message: `Format must be one of: ${REPORT_FORMAT_LIST.join(", ")}`,
      });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body,
    };
  },
};
