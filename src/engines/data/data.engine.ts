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

  /**
   * Convert between NDJSON, TSV, CSV, and JSON
   */
  static ndjsonTsvConvert(
    input: string,
    from: 'ndjson' | 'tsv' | 'json' | 'csv',
    to: 'ndjson' | 'tsv' | 'json' | 'csv'
  ): EngineResult<string> {
    const start = performance.now();
    try {
      let records: any[] = [];
      if (from === 'ndjson') {
        records = input
          .trim()
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => JSON.parse(line));
      } else if (from === 'tsv') {
        const parsed = Papa.parse(input, { header: true, delimiter: '\t', dynamicTyping: true, skipEmptyLines: true });
        records = parsed.data as any[];
      } else if (from === 'csv') {
        const parsed = Papa.parse(input, { header: true, dynamicTyping: true, skipEmptyLines: true });
        records = parsed.data as any[];
      } else {
        const parsed = JSON.parse(input);
        records = Array.isArray(parsed) ? parsed : [parsed];
      }

      let output = '';
      if (to === 'ndjson') {
        output = records.map((r) => JSON.stringify(r)).join('\n');
      } else if (to === 'tsv') {
        output = Papa.unparse(records, { delimiter: '\t' });
      } else if (to === 'csv') {
        output = Papa.unparse(records);
      } else {
        output = JSON.stringify(records, null, 2);
      }

      return {
        success: true,
        data: output,
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
   * Query JSON with JSONPath-like query expression
   */
  static jsonPathQuery(jsonStr: string, queryPath: string): EngineResult<unknown> {
    const start = performance.now();
    try {
      const data = JSON.parse(jsonStr);
      const cleanPath = queryPath.trim().replace(/^\$\.?/, '');
      if (!cleanPath) {
        return { success: true, data, elapsedMs: Math.round(performance.now() - start) };
      }

      const segments = cleanPath.split('.').filter(Boolean);
      let current: any[] = [data];

      for (const seg of segments) {
        const next: any[] = [];
        const arrayMatch = seg.match(/^([^\[]+)\[(\d+|\*)\]$/);

        for (const item of current) {
          if (item == null) continue;

          if (seg === '*') {
            if (Array.isArray(item)) next.push(...item);
            else if (typeof item === 'object') next.push(...Object.values(item));
          } else if (arrayMatch) {
            const prop = arrayMatch[1];
            const idxStr = arrayMatch[2];
            const target = item[prop];
            if (Array.isArray(target)) {
              if (idxStr === '*') next.push(...target);
              else {
                const idx = parseInt(idxStr, 10);
                if (target[idx] !== undefined) next.push(target[idx]);
              }
            }
          } else if (typeof item === 'object' && seg in item) {
            next.push(item[seg]);
          }
        }
        current = next;
      }

      const result = current.length === 1 ? current[0] : current;
      return {
        success: true,
        data: result,
        metadata: { matchesCount: current.length },
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
   * Join two CSV datasets on key column
   */
  static joinCsv(
    csvA: string,
    csvB: string,
    keyA: string,
    keyB: string,
    joinType: 'inner' | 'left' | 'outer' = 'inner'
  ): EngineResult<string> {
    const start = performance.now();
    try {
      const parsedA = Papa.parse(csvA, { header: true, skipEmptyLines: true });
      const parsedB = Papa.parse(csvB, { header: true, skipEmptyLines: true });

      const rowsA = (parsedA.data as Record<string, string>[]) || [];
      const rowsB = (parsedB.data as Record<string, string>[]) || [];

      const mapB = new Map<string, Record<string, string>[]>();
      for (const row of rowsB) {
        const k = String(row[keyB] ?? '').trim();
        if (!mapB.has(k)) mapB.set(k, []);
        mapB.get(k)!.push(row);
      }

      const joinedRows: Record<string, string>[] = [];
      const matchedBKeys = new Set<string>();

      for (const rowA of rowsA) {
        const k = String(rowA[keyA] ?? '').trim();
        const matchesB = mapB.get(k);

        if (matchesB && matchesB.length > 0) {
          matchedBKeys.add(k);
          for (const b of matchesB) {
            joinedRows.push({ ...rowA, ...b });
          }
        } else if (joinType === 'left' || joinType === 'outer') {
          joinedRows.push({ ...rowA });
        }
      }

      if (joinType === 'outer') {
        for (const rowB of rowsB) {
          const k = String(rowB[keyB] ?? '').trim();
          if (!matchedBKeys.has(k)) {
            joinedRows.push({ ...rowB });
          }
        }
      }

      const resultCsv = Papa.unparse(joinedRows);
      return {
        success: true,
        data: resultCsv,
        metadata: { rowCount: joinedRows.length },
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
   * Group by and aggregate CSV data
   */
  static pivotGroupBy(
    csvText: string,
    groupCol: string,
    aggCol?: string,
    aggFunc: 'count' | 'sum' | 'avg' | 'min' | 'max' = 'count'
  ): EngineResult<string> {
    const start = performance.now();
    try {
      const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
      const rows = (parsed.data as Record<string, any>[]) || [];

      const groups = new Map<string, number[]>();
      for (const r of rows) {
        const key = String(r[groupCol] ?? '<blank>');
        const val = aggCol ? Number(r[aggCol]) || 0 : 1;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(val);
      }

      const resultRows: Array<Record<string, any>> = [];
      for (const [key, values] of groups.entries()) {
        let aggValue = 0;
        if (aggFunc === 'count') {
          aggValue = values.length;
        } else if (aggFunc === 'sum') {
          aggValue = values.reduce((a, b) => a + b, 0);
        } else if (aggFunc === 'avg') {
          aggValue = values.reduce((a, b) => a + b, 0) / (values.length || 1);
        } else if (aggFunc === 'min') {
          aggValue = Math.min(...values);
        } else if (aggFunc === 'max') {
          aggValue = Math.max(...values);
        }

        const outKeyName = groupCol;
        const outAggName = aggCol ? `${aggFunc}_${aggCol}` : `count`;
        resultRows.push({
          [outKeyName]: key,
          [outAggName]: parseFloat(aggValue.toFixed(2)),
        });
      }

      const outCsv = Papa.unparse(resultRows);
      return {
        success: true,
        data: outCsv,
        metadata: { groupCount: resultRows.length },
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
   * Split CSV by row chunk count or distinct column values
   */
  static splitCsv(
    csvText: string,
    options: { mode: 'rows' | 'column'; chunkSize?: number; column?: string }
  ): EngineResult<Array<{ name: string; csv: string; rowCount: number }>> {
    const start = performance.now();
    try {
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const rows = (parsed.data as Record<string, string>[]) || [];
      const chunks: Array<{ name: string; csv: string; rowCount: number }> = [];

      if (options.mode === 'column' && options.column) {
        const col = options.column;
        const groups = new Map<string, Record<string, string>[]>();
        for (const row of rows) {
          const val = String(row[col] ?? 'unassigned').trim();
          if (!groups.has(val)) groups.set(val, []);
          groups.get(val)!.push(row);
        }

        for (const [val, groupRows] of groups.entries()) {
          const cleanName = val.replace(/[^a-z0-9_-]+/gi, '_').toLowerCase();
          chunks.push({
            name: `part_${cleanName}.csv`,
            csv: Papa.unparse(groupRows),
            rowCount: groupRows.length,
          });
        }
      } else {
        const size = Math.max(1, options.chunkSize || 500);
        let partNum = 1;
        for (let i = 0; i < rows.length; i += size) {
          const slice = rows.slice(i, i + size);
          chunks.push({
            name: `part_${partNum.toString().padStart(3, '0')}.csv`,
            csv: Papa.unparse(slice),
            rowCount: slice.length,
          });
          partNum++;
        }
      }

      return {
        success: true,
        data: chunks,
        metadata: { totalParts: chunks.length },
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
   * Fix Mojibake encoding artifacts
   */
  static fixEncoding(text: string): EngineResult<{ fixed: string; fixesCount: number }> {
    const start = performance.now();
    try {
      const replacements: [RegExp, string][] = [
        [/â€™/g, '’'],
        [/â€˜/g, '‘'],
        [/â€œ/g, '“'],
        [/â€\u009d/g, '”'],
        [/â€"/g, '—'],
        [/â€“/g, '–'],
        [/â€¦/g, '…'],
        [/Ã©/g, 'é'],
        [/Ã¨/g, 'è'],
        [/Ã /g, 'à'],
        [/Ã¢/g, 'â'],
        [/Ã§/g, 'ç'],
        [/Ã®/g, 'î'],
        [/Ã´/g, 'ô'],
        [/Ã¹/g, 'ù'],
        [/Ã»/g, 'û'],
        [/Ã¼/g, 'ü'],
        [/Ã¶/g, 'ö'],
        [/Ã¤/g, 'ä'],
        [/Ã±/g, 'ñ'],
        [/Â©/g, '©'],
        [/Â®/g, '®'],
        [/â€¢/g, '•'],
      ];

      let fixed = text;
      let fixesCount = 0;

      for (const [pattern, rep] of replacements) {
        const matches = (fixed.match(pattern) || []).length;
        if (matches > 0) {
          fixesCount += matches;
          fixed = fixed.replace(pattern, rep);
        }
      }

      return {
        success: true,
        data: { fixed, fixesCount },
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
   * Derive TypeScript interfaces from JSON
   */
  static jsonToTypeScript(jsonStr: string, rootName = 'RootObject'): EngineResult<string> {
    const start = performance.now();
    try {
      const parsed = JSON.parse(jsonStr);
      const interfaces: string[] = [];

      const inferType = (val: any, propName: string): string => {
        if (val === null) return 'null';
        if (val === undefined) return 'undefined';
        if (typeof val === 'string') return 'string';
        if (typeof val === 'number') return 'number';
        if (typeof val === 'boolean') return 'boolean';

        if (Array.isArray(val)) {
          if (val.length === 0) return 'unknown[]';
          const elemType = inferType(val[0], propName);
          return `${elemType}[]`;
        }

        if (typeof val === 'object') {
          const subName = propName.charAt(0).toUpperCase() + propName.slice(1);
          generateInterface(val, subName);
          return subName;
        }

        return 'unknown';
      };

      const generateInterface = (obj: any, name: string) => {
        const lines: string[] = [`export interface ${name} {`];
        for (const [key, val] of Object.entries(obj)) {
          const typeStr = inferType(val, key);
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
          lines.push(`  ${safeKey}: ${typeStr};`);
        }
        lines.push('}');
        interfaces.push(lines.join('\n'));
      };

      const target = Array.isArray(parsed) ? parsed[0] || {} : parsed;
      generateInterface(target, rootName);

      return {
        success: true,
        data: interfaces.reverse().join('\n\n'),
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
   * Validate JSON data against a JSON Schema
   */
  static validateJsonSchema(
    dataJson: string,
    schemaJson: string
  ): EngineResult<{ valid: boolean; errors: string[] }> {
    const start = performance.now();
    try {
      const data = JSON.parse(dataJson);
      const schema = JSON.parse(schemaJson);
      const errors: string[] = [];

      // Check required
      if (Array.isArray(schema.required) && typeof data === 'object' && data !== null) {
        for (const req of schema.required) {
          if (!(req in data)) {
            errors.push(`Missing required property: '${req}'`);
          }
        }
      }

      // Check property types
      if (schema.properties && typeof data === 'object' && data !== null) {
        for (const [prop, spec] of Object.entries<any>(schema.properties)) {
          if (prop in data) {
            const val = data[prop];
            if (spec.type === 'string' && typeof val !== 'string') {
              errors.push(`Property '${prop}' must be of type string, got ${typeof val}`);
            } else if (spec.type === 'number' && typeof val !== 'number') {
              errors.push(`Property '${prop}' must be of type number, got ${typeof val}`);
            } else if (spec.type === 'boolean' && typeof val !== 'boolean') {
              errors.push(`Property '${prop}' must be of type boolean, got ${typeof val}`);
            } else if (spec.type === 'array' && !Array.isArray(val)) {
              errors.push(`Property '${prop}' must be an array`);
            }
          }
        }
      }

      return {
        success: true,
        data: { valid: errors.length === 0, errors },
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
   * Execute basic SQL query on CSV data
   */
  static sqlOnCsv(csvText: string, sqlQuery: string): EngineResult<string> {
    const start = performance.now();
    try {
      const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
      let rows = (parsed.data as Record<string, any>[]) || [];

      // Match SELECT ... FROM ... [WHERE ...] [ORDER BY ...] [LIMIT ...]
      const q = sqlQuery.trim();
      const whereMatch = q.match(/WHERE\s+(.*?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
      const orderMatch = q.match(/ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?/i);
      const limitMatch = q.match(/LIMIT\s+(\d+)/i);

      if (whereMatch) {
        const cond = whereMatch[1].trim();
        const condParts = cond.match(/([a-zA-Z0-9_]+)\s*(=|!=|>|<|>=|<=|LIKE)\s*(.+)/i);
        if (condParts) {
          const col = condParts[1];
          const op = condParts[2].toUpperCase();
          const targetRaw = condParts[3].trim().replace(/^['"]|['"]$/g, '');
          const targetNum = Number(targetRaw);

          rows = rows.filter((r) => {
            const val = r[col];
            if (op === '=') return String(val).toLowerCase() === targetRaw.toLowerCase();
            if (op === '!=') return String(val).toLowerCase() !== targetRaw.toLowerCase();
            if (op === 'LIKE') return String(val).toLowerCase().includes(targetRaw.toLowerCase().replace(/%/g, ''));
            if (!isNaN(targetNum)) {
              const numVal = Number(val);
              if (op === '>') return numVal > targetNum;
              if (op === '<') return numVal < targetNum;
              if (op === '>=') return numVal >= targetNum;
              if (op === '<=') return numVal <= targetNum;
            }
            return true;
          });
        }
      }

      if (orderMatch) {
        const col = orderMatch[1];
        const dir = (orderMatch[2] || 'ASC').toUpperCase();
        rows.sort((a, b) => {
          const va = a[col];
          const vb = b[col];
          if (va < vb) return dir === 'ASC' ? -1 : 1;
          if (va > vb) return dir === 'ASC' ? 1 : -1;
          return 0;
        });
      }

      if (limitMatch) {
        const lim = parseInt(limitMatch[1], 10);
        rows = rows.slice(0, lim);
      }

      const outCsv = Papa.unparse(rows);
      return {
        success: true,
        data: outCsv,
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
   * Structural JSON Diff
   */
  static jsonDiff(
    jsonA: string,
    jsonB: string
  ): EngineResult<{
    added: Array<{ path: string; value: any }>;
    removed: Array<{ path: string; value: any }>;
    modified: Array<{ path: string; oldValue: any; newValue: any }>;
    isIdentical: boolean;
  }> {
    const start = performance.now();
    try {
      const a = JSON.parse(jsonA);
      const b = JSON.parse(jsonB);

      const added: Array<{ path: string; value: any }> = [];
      const removed: Array<{ path: string; value: any }> = [];
      const modified: Array<{ path: string; oldValue: any; newValue: any }> = [];

      const compare = (objA: any, objB: any, path = '') => {
        if (typeof objA !== typeof objB || Array.isArray(objA) !== Array.isArray(objB)) {
          modified.push({ path: path || 'root', oldValue: objA, newValue: objB });
          return;
        }

        if (typeof objA !== 'object' || objA === null || objB === null) {
          if (objA !== objB) {
            modified.push({ path: path || 'root', oldValue: objA, newValue: objB });
          }
          return;
        }

        const keysA = Object.keys(objA);
        const keysB = Object.keys(objB);

        for (const k of keysA) {
          const currentPath = path ? `${path}.${k}` : k;
          if (!(k in objB)) {
            removed.push({ path: currentPath, value: objA[k] });
          } else {
            compare(objA[k], objB[k], currentPath);
          }
        }

        for (const k of keysB) {
          const currentPath = path ? `${path}.${k}` : k;
          if (!(k in objA)) {
            added.push({ path: currentPath, value: objB[k] });
          }
        }
      };

      compare(a, b);

      return {
        success: true,
        data: {
          added,
          removed,
          modified,
          isIdentical: added.length === 0 && removed.length === 0 && modified.length === 0,
        },
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
}
