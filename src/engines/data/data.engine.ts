import Papa from 'papaparse';
import * as yaml from 'yaml';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import ExcelJS from 'exceljs';
import { EngineResult } from '../../core/types/engine';

export class DataEngine {
  /**
   * Convert CSV string to JSON formatted string or object array
   */
  static csvToJson(csvText: string): EngineResult<string> {
    const start = performance.now();
    try {
      const parsed = Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
        return {
          success: false,
          error: parsed.errors[0].message,
          elapsedMs: Math.round(performance.now() - start),
        };
      }

      const jsonStr = JSON.stringify(parsed.data, null, 2);
      return {
        success: true,
        data: jsonStr,
        metadata: { rowCount: parsed.data.length, fields: parsed.meta.fields },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert JSON string or array to CSV string
   */
  static jsonToCsv(jsonInput: string | unknown[]): EngineResult<string> {
    const start = performance.now();
    try {
      const parsed = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
      if (!Array.isArray(parsed)) {
        return {
          success: false,
          error: 'JSON must be an array of objects to convert to CSV.',
          elapsedMs: 0,
        };
      }

      const csv = Papa.unparse(parsed);
      return {
        success: true,
        data: csv,
        metadata: { rowCount: parsed.length },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert JSON string to YAML
   */
  static jsonToYaml(jsonStr: string): EngineResult<string> {
    const start = performance.now();
    try {
      const obj = JSON.parse(jsonStr);
      const yamlStr = yaml.stringify(obj, { indent: 2 });
      return {
        success: true,
        data: yamlStr,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert YAML string to JSON
   */
  static yamlToJson(yamlStr: string, pretty = true): EngineResult<string> {
    const start = performance.now();
    try {
      const obj = yaml.parse(yamlStr);
      const jsonStr = pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
      return {
        success: true,
        data: jsonStr,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Format or minify JSON
   */
  static formatJson(jsonStr: string, minify = false): EngineResult<string> {
    const start = performance.now();
    try {
      const parsed = JSON.parse(jsonStr);
      const out = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      return {
        success: true,
        data: out,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Validate and format XML string
   */
  static formatXml(xmlStr: string): EngineResult<string> {
    const start = performance.now();
    try {
      const validation = XMLValidator.validate(xmlStr);
      if (validation !== true) {
        return {
          success: false,
          error: `XML syntax error: ${validation.err.msg} at line ${validation.err.line}`,
          elapsedMs: Math.round(performance.now() - start),
        };
      }

      const parser = new XMLParser({ ignoreAttributes: false });
      const jsonObj = parser.parse(xmlStr);
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        format: true,
        indentBy: '  ',
      });
      const formattedXml = builder.build(jsonObj);

      return {
        success: true,
        data: formattedXml,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert CSV string to an Excel (.xlsx) file buffer
   */
  static async csvToXlsx(csvText: string, sheetName = 'Data'): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const parsed = Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (!parsed.data || parsed.data.length === 0) {
        return {
          success: false,
          error: 'No tabular data rows found to export to Excel.',
          elapsedMs: 0,
        };
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Toiloki Offline Suite';
      const sheet = workbook.addWorksheet(sheetName);

      const fields = parsed.meta.fields || Object.keys(parsed.data[0] as object);
      sheet.columns = fields.map((f) => ({
        header: f,
        key: f,
        width: Math.max(14, f.length + 4),
      }));

      // Add rows
      for (const row of parsed.data) {
        sheet.addRow(row as any);
      }

      // Stylize header row
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFEFEF' },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const uint8 = new Uint8Array(buffer);

      return {
        success: true,
        data: uint8,
        outputBuffer: uint8,
        metadata: { rowCount: parsed.data.length, columns: fields.length },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert Excel (.xlsx) buffer to CSV string
   */
  static async xlsxToCsv(xlsxBuffer: Uint8Array): Promise<EngineResult<string>> {
    const start = performance.now();
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(xlsxBuffer);
      const sheet = workbook.getWorksheet(1);

      if (!sheet) {
        return {
          success: false,
          error: 'No worksheets found in this Excel workbook.',
          elapsedMs: 0,
        };
      }

      const rows: string[][] = [];
      sheet.eachRow({ includeEmpty: false }, (row) => {
        const values: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          values.push(cell.value != null ? String(cell.value) : '');
        });
        rows.push(values);
      });

      const csv = Papa.unparse(rows);
      return {
        success: true,
        data: csv,
        metadata: { rowCount: rows.length },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert Excel (.xlsx) buffer to JSON string
   */
  static async xlsxToJson(xlsxBuffer: Uint8Array): Promise<EngineResult<string>> {
    const start = performance.now();
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(xlsxBuffer);
      const sheet = workbook.getWorksheet(1);

      if (!sheet) {
        return {
          success: false,
          error: 'No worksheets found in this Excel workbook.',
          elapsedMs: 0,
        };
      }

      const rows: any[][] = [];
      sheet.eachRow({ includeEmpty: false }, (row) => {
        const rowVals: any[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          rowVals.push(cell.value);
        });
        rows.push(rowVals);
      });

      if (rows.length === 0) {
        return {
          success: true,
          data: '[]',
          elapsedMs: Math.round(performance.now() - start),
        };
      }

      const headers = rows[0].map((h: any) => String(h || 'Column'));
      const records = rows.slice(1).map((r) => {
        const obj: Record<string, any> = {};
        headers.forEach((h: string, idx: number) => {
          obj[h] = r[idx] !== undefined ? r[idx] : null;
        });
        return obj;
      });

      const jsonStr = JSON.stringify(records, null, 2);
      return {
        success: true,
        data: jsonStr,
        metadata: { rowCount: records.length },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert XML string to formatted JSON
   */
  static xmlToJson(xmlStr: string): EngineResult<string> {
    const start = performance.now();
    try {
      const validation = XMLValidator.validate(xmlStr);
      if (validation !== true) {
        return {
          success: false,
          error: `XML syntax error: ${validation.err.msg}`,
          elapsedMs: 0,
        };
      }
      const parser = new XMLParser({ ignoreAttributes: false });
      const obj = parser.parse(xmlStr);
      const jsonStr = JSON.stringify(obj, null, 2);
      return {
        success: true,
        data: jsonStr,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert JSON string to XML
   */
  static jsonToXml(jsonStr: string, rootTag = 'root'): EngineResult<string> {
    const start = performance.now();
    try {
      const obj = JSON.parse(jsonStr);
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        format: true,
        indentBy: '  ',
      });
      const wrapped = { [rootTag]: obj };
      const xmlStr = builder.build(wrapped);
      return {
        success: true,
        data: xmlStr,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Parse tabular preview headers and rows for UI display
   */
  static parseTabularPreview(
    dataStr: string,
    format: 'csv' | 'json'
  ): EngineResult<{ headers: string[]; rows: string[][] }> {
    const start = performance.now();
    try {
      if (format === 'csv') {
        const parsed = Papa.parse(dataStr, { header: false, skipEmptyLines: true });
        const allRows = (parsed.data as string[][]) || [];
        if (allRows.length === 0) {
          return { success: true, data: { headers: [], rows: [] }, elapsedMs: 0 };
        }
        const headers = allRows[0];
        const rows = allRows.slice(1, 101); // Preview top 100 rows
        return {
          success: true,
          data: { headers, rows },
          elapsedMs: Math.round(performance.now() - start),
        };
      } else {
        const obj = JSON.parse(dataStr);
        if (!Array.isArray(obj) || obj.length === 0) {
          return { success: true, data: { headers: ['Value'], rows: [[String(obj)]] }, elapsedMs: 0 };
        }
        const headers = Object.keys(obj[0]);
        const rows = obj.slice(0, 100).map((row) => headers.map((h) => String(row[h] != null ? row[h] : '')));
        return {
          success: true,
          data: { headers, rows },
          elapsedMs: Math.round(performance.now() - start),
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }
}
