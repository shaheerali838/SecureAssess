/**
 * Utility functions for client-side document generation and CSV data exports.
 */

export function exportToCSV(filename, data = [], columns = []) {
  if (!data || !data.length) return;

  const headerRow = columns.map((col) => `"${col.label || col.key}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printPDFCertificate({
  candidateName = 'Candidate Name',
  assessmentTitle = 'University Admission Examination',
  score = 88,
  passingScore = 60,
  organizationName = 'SecureAssess Institutional Faculty',
  issuedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  verificationCode = 'SEC-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const isPassed = score >= passingScore;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certified Assessment Transcript — ${candidateName}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 20mm;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 40px;
            box-sizing: border-box;
          }
          .certificate {
            border: 8px double #1e3a8a;
            padding: 40px 50px;
            text-align: center;
            border-radius: 16px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            position: relative;
          }
          .header {
            font-size: 14px;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #2563eb;
            font-weight: 700;
            margin-bottom: 15px;
          }
          .title {
            font-size: 32px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 30px;
          }
          .recipient {
            font-size: 28px;
            font-weight: 800;
            color: #1e3a8a;
            border-bottom: 2px solid #cbd5e1;
            display: inline-block;
            padding-bottom: 8px;
            min-width: 320px;
            margin-bottom: 20px;
          }
          .statement {
            font-size: 15px;
            color: #334155;
            max-width: 600px;
            margin: 0 auto 30px;
            line-height: 1.6;
          }
          .score-badge {
            display: inline-flex;
            align-items: center;
            gap: 15px;
            background: #f1f5f9;
            padding: 12px 28px;
            border-radius: 12px;
            margin-bottom: 40px;
            border: 1px solid #e2e8f0;
          }
          .score-item {
            text-align: center;
          }
          .score-item strong {
            display: block;
            font-size: 20px;
            color: ${isPassed ? '#16a34a' : '#dc2626'};
          }
          .score-item span {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .signature-box {
            text-align: center;
            min-width: 180px;
          }
          .signature-line {
            border-bottom: 1px solid #94a3b8;
            margin-bottom: 8px;
            height: 30px;
          }
          .signature-box p {
            margin: 0;
            font-size: 12px;
            color: #64748b;
          }
          .code {
            font-family: monospace;
            font-size: 11px;
            color: #94a3b8;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">SecureAssess Certified Transcript</div>
          <div class="title">Certificate of Assessment Completion</div>
          <div class="subtitle">This verified credential is proud to confirm that</div>
          <div class="recipient">${candidateName}</div>
          <div class="statement">
            has successfully completed the proctored examination for <strong>${assessmentTitle}</strong> under strict identity telemetry and proctoring protocols.
          </div>
          <div class="score-badge">
            <div class="score-item">
              <strong>${score}%</strong>
              <span>Certified Score</span>
            </div>
            <div style="width: 1px; height: 30px; background: #cbd5e1;"></div>
            <div class="score-item">
              <strong>${isPassed ? 'PASSED' : 'NOT PASSED'}</strong>
              <span>Result Status</span>
            </div>
          </div>
          <div class="footer">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>${organizationName}</p>
            </div>
            <div class="code">
              Verification Code: ${verificationCode}<br/>
              Date Issued: ${issuedDate}
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>Academic Dean / Invigilator</p>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
