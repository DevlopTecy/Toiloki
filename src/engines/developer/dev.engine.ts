import { EngineResult } from '../../core/types/engine';

export class DevEngine {
  /**
   * Decode JWT token into header and payload
   */
  static decodeJwt(token: string): EngineResult<{
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signature: string;
    isExpired?: boolean;
    expiresAt?: string;
  }> {
    const start = performance.now();
    try {
      const parts = token.trim().split('.');
      if (parts.length !== 3) {
        return {
          success: false,
          error: 'Invalid JWT format: A valid JWT consists of three dot-separated base64 parts.',
          elapsedMs: 0,
        };
      }

      const decodeBase64Url = (str: string) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        return decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      };

      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));
      const signature = parts[2];

      let isExpired: boolean | undefined;
      let expiresAt: string | undefined;

      if (typeof payload.exp === 'number') {
        const expDate = new Date(payload.exp * 1000);
        expiresAt = expDate.toISOString();
        isExpired = Date.now() > expDate.getTime();
      }

      return {
        success: true,
        data: { header, payload, signature, isExpired, expiresAt },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to decode JWT: ${err instanceof Error ? err.message : String(err)}`,
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Encode / Decode Base64 and URL
   */
  static encodeDecode(
    input: string,
    mode: 'base64-encode' | 'base64-decode' | 'url-encode' | 'url-decode'
  ): EngineResult<string> {
    const start = performance.now();
    try {
      let out = '';
      switch (mode) {
        case 'base64-encode':
          out = btoa(unescape(encodeURIComponent(input)));
          break;
        case 'base64-decode':
          out = decodeURIComponent(escape(atob(input)));
          break;
        case 'url-encode':
          out = encodeURIComponent(input);
          break;
        case 'url-decode':
          out = decodeURIComponent(input);
          break;
      }
      return {
        success: true,
        data: out,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: `Conversion error: ${err instanceof Error ? err.message : String(err)}`,
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Batch generate UUID v4
   */
  static generateUuids(count = 1): EngineResult<string[]> {
    const start = performance.now();
    const uuids: string[] = [];
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }
    return {
      success: true,
      data: uuids,
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  /**
   * Regex tester
   */
  static testRegex(
    pattern: string,
    flags: string,
    text: string
  ): EngineResult<{
    matchCount: number;
    matches: Array<{ match: string; index: number; groups?: Record<string, string> }>;
  }> {
    const start = performance.now();
    try {
      const reg = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const matches: Array<{ match: string; index: number; groups?: Record<string, string> }> = [];

      let m;
      let iterations = 0;
      while ((m = reg.exec(text)) !== null && iterations < 500) {
        iterations++;
        matches.push({
          match: m[0],
          index: m.index,
          groups: m.groups ? { ...m.groups } : undefined,
        });
        if (m.index === reg.lastIndex) reg.lastIndex++;
      }

      return {
        success: true,
        data: {
          matchCount: matches.length,
          matches,
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

  /**
   * Secure random string generation
   */
  static generateRandomString(
    length = 16,
    charset: 'alphanumeric' | 'alphabetic' | 'numeric' | 'hex' = 'alphanumeric'
  ): EngineResult<string> {
    const start = performance.now();
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    if (charset === 'alphabetic') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    else if (charset === 'numeric') chars = '0123456789';
    else if (charset === 'hex') chars = '0123456789abcdef';

    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }

    return {
      success: true,
      data: result,
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  /**
   * Random integer generator in range [min, max]
   */
  static generateRandomNumber(min = 1, max = 100, count = 1): EngineResult<number[]> {
    const start = performance.now();
    const range = max - min + 1;
    const nums: number[] = [];

    for (let i = 0; i < count; i++) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      nums.push(min + (arr[0] % range));
    }

    return {
      success: true,
      data: nums,
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  /**
   * Timestamp generation across formats
   */
  static generateTimestamp(date = new Date()): EngineResult<{
    unixSeconds: number;
    unixMs: number;
    isoUtc: string;
    localString: string;
  }> {
    const start = performance.now();
    return {
      success: true,
      data: {
        unixSeconds: Math.floor(date.getTime() / 1000),
        unixMs: date.getTime(),
        isoUtc: date.toISOString(),
        localString: date.toString(),
      },
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  /**
   * Code Formatter for JSON, HTML, CSS, JS, XML, SQL
   */
  static formatCode(
    code: string,
    language: 'json' | 'html' | 'css' | 'js' | 'xml' | 'sql'
  ): EngineResult<string> {
    const start = performance.now();
    try {
      let formatted = code;

      if (language === 'json') {
        const parsed = JSON.parse(code);
        formatted = JSON.stringify(parsed, null, 2);
      } else if (language === 'xml' || language === 'html') {
        // Tag indentation formatting
        let pad = 0;
        formatted = code
          .replace(/(>)(<)(\/*)/g, '$1\r\n$2$3')
          .split('\r\n')
          .map((node) => {
            let indent = 0;
            if (node.match(/.+<\/\w[^>]*>$/)) {
              indent = 0;
            } else if (node.match(/^<\/\w/)) {
              if (pad !== 0) pad -= 1;
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
              indent = 1;
            } else {
              indent = 0;
            }
            const padding = '  '.repeat(pad);
            pad += indent;
            return padding + node;
          })
          .join('\n');
      } else if (language === 'css') {
        formatted = code
          .replace(/\s*{\s*/g, ' {\n  ')
          .replace(/;\s*/g, ';\n  ')
          .replace(/\s*}\s*/g, '\n}\n\n')
          .trim();
      } else if (language === 'sql') {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT INTO', 'UPDATE', 'DELETE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'VALUES', 'SET'];
        formatted = code;
        for (const kw of keywords) {
          const reg = new RegExp(`\\b${kw}\\b`, 'gi');
          formatted = formatted.replace(reg, `\n${kw}`);
        }
        formatted = formatted.trim();
      } else if (language === 'js') {
        // Basic indentation on braces and semicolons
        formatted = code
          .replace(/{\s*/g, ' {\n  ')
          .replace(/;\s*/g, ';\n')
          .replace(/}\s*/g, '\n}\n');
      }

      return {
        success: true,
        data: formatted,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: `Format error: ${err instanceof Error ? err.message : String(err)}`,
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Parse full URL components and query string parameters
   */
  static parseUrl(urlStr: string): EngineResult<{
    protocol: string;
    host: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    searchParams: Record<string, string>;
  }> {
    const start = performance.now();
    try {
      const u = new URL(urlStr.trim());
      const searchParams: Record<string, string> = {};
      u.searchParams.forEach((val, key) => {
        searchParams[key] = val;
      });

      return {
        success: true,
        data: {
          protocol: u.protocol,
          host: u.host,
          port: u.port || (u.protocol === 'https:' ? '443' : '80'),
          pathname: u.pathname,
          search: u.search,
          hash: u.hash,
          searchParams,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: `Invalid URL: ${err instanceof Error ? err.message : String(err)}`,
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Parse raw HTTP headers string into key-value map
   */
  static parseHttpHeaders(rawHeaders: string): EngineResult<Record<string, string>> {
    const start = performance.now();
    try {
      const headers: Record<string, string> = {};
      const lines = rawHeaders.split(/\r?\n/);

      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.substring(0, colonIdx).trim();
          const val = line.substring(colonIdx + 1).trim();
          headers[key] = val;
        }
      }

      return {
        success: true,
        data: headers,
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
   * Generate mock test dataset
   */
  static generateTestData(
    type: 'users' | 'products' | 'transactions' = 'users',
    count = 5
  ): EngineResult<Array<Record<string, unknown>>> {
    const start = performance.now();
    const items: Array<Record<string, unknown>> = [];

    const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis'];
    const domains = ['example.com', 'toiloki.local', 'workspace.dev'];
    const products = ['Mechanical Keyboard', 'Ergonomic Mouse', '4K Monitor', 'USB-C Dock', 'Desk Mat', 'Headphones'];

    for (let i = 0; i < count; i++) {
      if (type === 'users') {
        const fn = firstNames[i % firstNames.length];
        const ln = lastNames[i % lastNames.length];
        items.push({
          id: i + 1,
          name: `${fn} ${ln}`,
          email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${domains[i % domains.length]}`,
          role: i === 0 ? 'Admin' : 'Member',
          status: i % 3 === 0 ? 'active' : 'idle',
        });
      } else if (type === 'products') {
        items.push({
          id: 100 + i,
          title: products[i % products.length],
          price: parseFloat((29.99 + i * 15.5).toFixed(2)),
          inStock: i % 2 === 0,
          sku: `SKU-${1000 + i}`,
        });
      } else {
        items.push({
          transactionId: `TXN-${Date.now().toString(36).toUpperCase()}-${i + 1}`,
          amount: parseFloat((45 + (i * 27.8) % 300).toFixed(2)),
          currency: 'USD',
          status: i % 4 === 0 ? 'pending' : 'completed',
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        });
      }
    }

    return {
      success: true,
      data: items,
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  /**
   * HTTP Status Code reference dictionary
   */
  static getHttpStatusInfo(statusCode: number): EngineResult<{
    code: number;
    text: string;
    description: string;
    category: string;
  }> {
    const start = performance.now();
    const codes: Record<number, { text: string; description: string; category: string }> = {
      200: { text: 'OK', description: 'Standard response for successful HTTP requests.', category: '2xx Success' },
      201: { text: 'Created', description: 'Request fulfilled, resulting in the creation of a new resource.', category: '2xx Success' },
      204: { text: 'No Content', description: 'Server successfully processed request but returns no content.', category: '2xx Success' },
      301: { text: 'Moved Permanently', description: 'Resource permanently assigned a new URI.', category: '3xx Redirection' },
      302: { text: 'Found (Temporary Redirect)', description: 'Resource resides temporarily under a different URI.', category: '3xx Redirection' },
      304: { text: 'Not Modified', description: 'Resource has not been modified since last requested version.', category: '3xx Redirection' },
      400: { text: 'Bad Request', description: 'Server cannot or will not process request due to apparent client error.', category: '4xx Client Error' },
      401: { text: 'Unauthorized', description: 'Authentication is required and has failed or has not yet been provided.', category: '4xx Client Error' },
      403: { text: 'Forbidden', description: 'Request contained valid data and was understood, but server refuses action.', category: '4xx Client Error' },
      404: { text: 'Not Found', description: 'Requested resource could not be found but may be available in the future.', category: '4xx Client Error' },
      429: { text: 'Too Many Requests', description: 'User has sent too many requests in a given amount of time.', category: '4xx Client Error' },
      500: { text: 'Internal Server Error', description: 'Generic error message when an unexpected condition was encountered.', category: '5xx Server Error' },
      502: { text: 'Bad Gateway', description: 'Server received an invalid response from upstream server.', category: '5xx Server Error' },
      503: { text: 'Service Unavailable', description: 'Server cannot handle request because it is overloaded or down for maintenance.', category: '5xx Server Error' },
    };

    const info = codes[statusCode] || {
      text: 'Custom / Unregistered Code',
      description: 'HTTP response status code.',
      category: `${Math.floor(statusCode / 100)}xx Category`,
    };

    return {
      success: true,
      data: { code: statusCode, ...info },
      elapsedMs: Math.round(performance.now() - start),
    };
  }
}
