/**
 * Report Export Service
 * Converts report data to PDF and Excel formats
 */

// Install these packages with: npm install jspdf exceljs
// For now, we'll provide download utilities

export interface ReportExportOptions {
  filename?: string;
  format: "json" | "csv" | "html";
}

class ReportExportService {
  /**
   * Export report as CSV
   */
  exportAsCSV(data: any[], filename: string = "report.csv") {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    this.downloadFile(csvContent, filename, "text/csv");
  }

  /**
   * Export report as JSON
   */
  exportAsJSON(data: any, filename: string = "report.json") {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, "application/json");
  }

  /**
   * Export report as HTML table
   */
  exportAsHTML(data: any[], filename: string = "report.html") {
    const headers = Object.keys(data[0] || {});
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Report</h1>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                ${headers.map((h) => `<td>${row[h]}</td>`).join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    this.downloadFile(htmlContent, filename, "text/html");
  }

  /**
   * Print report (browser print dialog)
   */
  printReport(data: any[], title: string = "Report") {
    const headers = Object.keys(data[0] || {});
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #e0e0e0; font-weight: bold; }
          @media print {
            body { margin: 10px; }
            table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                ${headers.map((h) => `<td>${row[h]}</td>`).join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  /**
   * Download file utility
   */
  private downloadFile(content: string, filename: string, mimeType: string) {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`
    );
    element.setAttribute("download", filename);
    element.style.display = "none";

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Format data for Excel-compatible format
   * Note: For true Excel (.xlsx), use exceljs package
   */
  formatForExcel(data: any[], title: string = "Report"): string {
    const headers = Object.keys(data[0] || {});
    const rows = data.map((row) =>
      headers.map((h) => {
        const value = row[h];
        // Escape quotes
        return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value;
      })
    );

    return [
      [title],
      ["Generated:", new Date().toLocaleString()],
      [],
      [headers.map((h) => `"${h}"`).join("\t")],
      ...rows.map((r) => r.join("\t")),
    ]
      .map((r) => (Array.isArray(r) ? r.join("\t") : r))
      .join("\n");
  }
}

export const reportExportService = new ReportExportService();
