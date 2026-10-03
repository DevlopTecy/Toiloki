import { EngineResult } from '../../core/types/engine';

export interface SubnetResult {
  cidr: string;
  ip: string;
  mask: string;
  wildcard: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalHosts: number;
  usableHosts: number;
  ipBinary: string;
  maskBinary: string;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  isPrivate: boolean;
}

export interface IpConversionResult {
  ipv4: string;
  integer: number;
  hex: string;
  binary: string;
  reverseDns: string;
  isPrivate: boolean;
}

export class NetworkEngine {
  /**
   * Build URL from parts and UTM parameters
   */
  static buildUrl(
    baseUrl: string,
    params: Record<string, string>,
    utm: { source?: string; medium?: string; campaign?: string; term?: string; content?: string } = {},
    hash?: string
  ): EngineResult<string> {
    const start = performance.now();
    try {
      if (!baseUrl) throw new Error('Base URL is required');
      let base = baseUrl.trim();
      if (!/^https?:\/\//i.test(base)) base = 'https://' + base;

      const url = new URL(base);

      // Append standard query params
      Object.entries(params).forEach(([k, v]) => {
        if (k && v !== undefined && v !== '') url.searchParams.set(k, v);
      });

      // Append UTM params
      if (utm.source) url.searchParams.set('utm_source', utm.source);
      if (utm.medium) url.searchParams.set('utm_medium', utm.medium);
      if (utm.campaign) url.searchParams.set('utm_campaign', utm.campaign);
      if (utm.term) url.searchParams.set('utm_term', utm.term);
      if (utm.content) url.searchParams.set('utm_content', utm.content);

      if (hash) url.hash = hash.startsWith('#') ? hash : `#${hash}`;

      return {
        success: true,
        data: url.toString(),
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Comprehensive offline MIME types database
   */
  private static readonly MIME_MAP: Record<string, string> = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odt: 'application/vnd.oasis.opendocument.text',
    rtf: 'application/rtf',
    txt: 'text/plain',
    csv: 'text/csv',
    tsv: 'text/tab-separated-values',
    md: 'text/markdown',
    // Web / Code
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    mjs: 'text/javascript',
    ts: 'application/typescript',
    json: 'application/json',
    xml: 'application/xml',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    wasm: 'application/wasm',
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    avif: 'image/avif',
    heic: 'image/heic',
    // Audio / Video
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    // Archives
    zip: 'application/zip',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    '7z': 'application/x-7z-compressed',
    rar: 'application/vnd.rar',
  };

  static lookupMime(query: string): EngineResult<{ query: string; mime: string; ext: string; category: string }> {
    const start = performance.now();
    try {
      const q = query.trim().toLowerCase().replace(/^\./, '');
      let ext = '';
      let mime = '';

      if (q.includes('/')) {
        // Query is a MIME type, find extension
        const found = Object.entries(this.MIME_MAP).find(([, m]) => m.toLowerCase() === q);
        if (found) {
          ext = found[0];
          mime = found[1];
        } else {
          ext = 'bin';
          mime = q;
        }
      } else {
        // Query is an extension
        ext = q;
        mime = this.MIME_MAP[ext] || 'application/octet-stream';
      }

      let category = 'Application / Binary';
      if (mime.startsWith('text/')) category = 'Text';
      else if (mime.startsWith('image/')) category = 'Image';
      else if (mime.startsWith('audio/')) category = 'Audio';
      else if (mime.startsWith('video/')) category = 'Video';

      return {
        success: true,
        data: { query, mime, ext, category },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Build cURL command string
   */
  static buildCurl(options: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    authType?: 'none' | 'bearer' | 'basic';
    authToken?: string;
    authUsername?: string;
    authPassword?: string;
    body?: string;
    followRedirects?: boolean;
    insecure?: boolean;
    compressed?: boolean;
    verbose?: boolean;
  }): EngineResult<string> {
    const start = performance.now();
    try {
      if (!options.url) throw new Error('Target URL is required');
      const parts = ['curl'];
      const method = (options.method || 'GET').toUpperCase();

      if (method !== 'GET') {
        parts.push(`-X ${method}`);
      }

      // Flags
      if (options.followRedirects) parts.push('-L');
      if (options.insecure) parts.push('-k');
      if (options.compressed) parts.push('--compressed');
      if (options.verbose) parts.push('-v');

      // Auth
      if (options.authType === 'bearer' && options.authToken) {
        parts.push(`-H "Authorization: Bearer ${options.authToken}"`);
      } else if (options.authType === 'basic' && options.authUsername) {
        parts.push(`-u "${options.authUsername}:${options.authPassword || ''}"`);
      }

      // Headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([k, v]) => {
          if (k && v) parts.push(`-H "${k}: ${v}"`);
        });
      }

      // Body
      if (options.body && method !== 'GET') {
        const escaped = options.body.replace(/"/g, '\\"');
        parts.push(`-d "${escaped}"`);
      }

      parts.push(`"${options.url}"`);

      return {
        success: true,
        data: parts.join(' \\\n  '),
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Calculate IPv4 Subnet / CIDR parameters
   */
  static calculateSubnet(ipWithCidr: string): EngineResult<SubnetResult> {
    const start = performance.now();
    try {
      const parts = ipWithCidr.trim().split('/');
      const ip = parts[0].trim();
      const prefix = parseInt(parts[1] || '24', 10);

      if (isNaN(prefix) || prefix < 0 || prefix > 32) {
        throw new Error('CIDR prefix must be between 0 and 32');
      }

      const ipOctets = ip.split('.').map(Number);
      if (ipOctets.length !== 4 || ipOctets.some((o) => isNaN(o) || o < 0 || o > 255)) {
        throw new Error('Invalid IPv4 address format');
      }

      // IP integer
      const ipInt = ((ipOctets[0] << 24) >>> 0) + (ipOctets[1] << 16) + (ipOctets[2] << 8) + ipOctets[3];

      // Mask integer
      const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      const maskOctets = [
        (maskInt >>> 24) & 255,
        (maskInt >>> 16) & 255,
        (maskInt >>> 8) & 255,
        maskInt & 255,
      ];
      const mask = maskOctets.join('.');

      // Wildcard
      const wildcard = maskOctets.map((m) => 255 - m).join('.');

      // Network & Broadcast
      const netInt = (ipInt & maskInt) >>> 0;
      const bcastInt = (netInt | ~maskInt) >>> 0;

      const intToIp = (n: number) =>
        `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;

      const networkAddress = intToIp(netInt);
      const broadcastAddress = intToIp(bcastInt);

      const totalHosts = prefix === 32 ? 1 : Math.pow(2, 32 - prefix);
      const usableHosts = prefix >= 31 ? 0 : totalHosts - 2;

      const firstUsableIp = prefix >= 31 ? 'N/A' : intToIp(netInt + 1);
      const lastUsableIp = prefix >= 31 ? 'N/A' : intToIp(bcastInt - 1);

      // Class
      let ipClass: SubnetResult['ipClass'] = 'A';
      if (ipOctets[0] >= 128 && ipOctets[0] <= 191) ipClass = 'B';
      else if (ipOctets[0] >= 192 && ipOctets[0] <= 223) ipClass = 'C';
      else if (ipOctets[0] >= 224 && ipOctets[0] <= 239) ipClass = 'D';
      else if (ipOctets[0] >= 240) ipClass = 'E';

      // Private RFC1918
      const isPrivate =
        ipOctets[0] === 10 ||
        (ipOctets[0] === 172 && ipOctets[1] >= 16 && ipOctets[1] <= 31) ||
        (ipOctets[0] === 192 && ipOctets[1] === 168);

      const ipBinary = ipOctets.map((o) => o.toString(2).padStart(8, '0')).join('.');
      const maskBinary = maskOctets.map((o) => o.toString(2).padStart(8, '0')).join('.');

      return {
        success: true,
        data: {
          cidr: `${ip}/${prefix}`,
          ip,
          mask,
          wildcard,
          networkAddress,
          broadcastAddress,
          firstUsableIp,
          lastUsableIp,
          totalHosts,
          usableHosts,
          ipBinary,
          maskBinary,
          ipClass,
          isPrivate,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Convert IP address to multiple numeric formats
   */
  static convertIp(ipStr: string): EngineResult<IpConversionResult> {
    const start = performance.now();
    try {
      const octets = ipStr.trim().split('.').map(Number);
      if (octets.length !== 4 || octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
        throw new Error('Invalid IPv4 address');
      }

      const integer = ((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
      const hex = '0x' + integer.toString(16).toUpperCase().padStart(8, '0');
      const binary = octets.map((o) => o.toString(2).padStart(8, '0')).join('.');
      const reverseDns = `${octets[3]}.${octets[2]}.${octets[1]}.${octets[0]}.in-addr.arpa`;

      const isPrivate =
        octets[0] === 10 ||
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
        (octets[0] === 192 && octets[1] === 168);

      return {
        success: true,
        data: { ipv4: ipStr.trim(), integer, hex, binary, reverseDns, isPrivate },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate robots.txt and XML Sitemap
   */
  static generateRobotsAndSitemap(options: {
    domain: string;
    rules: Array<{ userAgent: string; allow: string[]; disallow: string[] }>;
    crawlDelay?: number;
    urls?: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: number }>;
  }): EngineResult<{ robotsTxt: string; sitemapXml: string }> {
    const start = performance.now();
    try {
      let domain = options.domain.trim();
      if (!/^https?:\/\//i.test(domain)) domain = 'https://' + domain;
      domain = domain.replace(/\/+$/, '');

      // 1. robots.txt
      const lines: string[] = ['# robots.txt generated locally with Toiloki'];
      options.rules.forEach((r) => {
        lines.push(`User-agent: ${r.userAgent}`);
        if (options.crawlDelay) lines.push(`Crawl-delay: ${options.crawlDelay}`);
        r.disallow.forEach((d) => lines.push(`Disallow: ${d}`));
        r.allow.forEach((a) => lines.push(`Allow: ${a}`));
        lines.push('');
      });

      lines.push(`Sitemap: ${domain}/sitemap.xml`);
      const robotsTxt = lines.join('\n');

      // 2. sitemap.xml
      const urlEntries = options.urls || [
        { loc: `${domain}/`, priority: 1.0, changefreq: 'daily' },
        { loc: `${domain}/about`, priority: 0.8, changefreq: 'monthly' },
        { loc: `${domain}/contact`, priority: 0.5, changefreq: 'monthly' },
      ];

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : `<lastmod>${new Date().toISOString().split('T')[0]}</lastmod>`}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
    ${u.priority !== undefined ? `<priority>${u.priority.toFixed(1)}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

      return {
        success: true,
        data: { robotsTxt, sitemapXml },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate HTML <head> meta tags and Open Graph / Twitter card tags
   */
  static generateMetaOg(data: {
    title: string;
    description: string;
    canonicalUrl: string;
    imageUrl?: string;
    siteName?: string;
    twitterHandle?: string;
  }): EngineResult<{ htmlSnippet: string; jsonLd: string }> {
    const start = performance.now();
    try {
      const htmlSnippet = `<!-- Primary Meta Tags -->
<title>${data.title}</title>
<meta name="title" content="${data.title}">
<meta name="description" content="${data.description}">
<link rel="canonical" href="${data.canonicalUrl}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${data.canonicalUrl}">
<meta property="og:title" content="${data.title}">
<meta property="og:description" content="${data.description}">
${data.imageUrl ? `<meta property="og:image" content="${data.imageUrl}">` : ''}
${data.siteName ? `<meta property="og:site_name" content="${data.siteName}">` : ''}

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${data.canonicalUrl}">
<meta property="twitter:title" content="${data.title}">
<meta property="twitter:description" content="${data.description}">
${data.imageUrl ? `<meta property="twitter:image" content="${data.imageUrl}">` : ''}
${data.twitterHandle ? `<meta property="twitter:site" content="${data.twitterHandle}">` : ''}`;

      const jsonLd = JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: data.siteName || data.title,
          url: data.canonicalUrl,
          description: data.description,
        },
        null,
        2
      );

      return {
        success: true,
        data: { htmlSnippet, jsonLd },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }
}
