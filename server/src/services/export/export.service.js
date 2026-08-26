import { logger } from "../../config/logger.js";

export class ExportService {
  static async exportToCsv(data, fields) {
    logger.info(`[ExportService] Exporting ${data.length} records to CSV`);
    // Basic CSV converter
    if (!data || !data.length) return "";
    const headers = fields || Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  static async exportToJson(data) {
    return JSON.stringify(data, null, 2);
  }
}
