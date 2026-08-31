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
    const reportType = body.type || body.reportType;
    const normalizedType = reportType?.replace(/_SUMMARY|_DETAILED/, "");
    if (!reportType || (!REPORT_TYPE_LIST.includes(reportType) && !REPORT_TYPE_LIST.includes(normalizedType))) {
      errors.push({
        message: `Report type must be one of: ${REPORT_TYPE_LIST.join(", ")}`,
      });
    } else {
      body.type = REPORT_TYPE_LIST.includes(reportType) ? reportType : normalizedType;
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
