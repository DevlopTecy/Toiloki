import React, { useState, useMemo } from 'react';
import {
  Globe,
  FileCode,
  Terminal,
  Calculator,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  Server,
  Share2,
} from 'lucide-react';
import { NetworkEngine, SubnetResult, IpConversionResult } from '../../engines/network/network.engine';
import './NetworkWorkspaceView.css';

interface NetworkWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const NetworkWorkspaceView: React.FC<NetworkWorkspaceViewProps> = ({ utilityId }) => {
  return (
    <div className="net-workspace">
      {utilityId === 'net-url-builder' && <UrlBuilderView />}
      {utilityId === 'net-mime-lookup' && <MimeLookupView />}
      {utilityId === 'net-curl-builder' && <CurlBuilderView />}
      {utilityId === 'net-subnet-cidr' && <SubnetCidrView />}
      {utilityId === 'net-ip-converter' && <IpConverterView />}
      {utilityId === 'net-robots-sitemap-gen' && <RobotsSitemapView />}
      {utilityId === 'net-meta-og-gen' && <MetaOgView />}
      {utilityId === 'net-local-port-check' && <LocalPortView />}
      {utilityId === 'net-dns-record-helper' && <DnsRecordView />}
      {utilityId === 'net-mac-vendor-lookup' && <MacVendorView />}
    </div>
  );
};

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

function NetCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
}: {
  icon?: any;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="net-card">
      <div className="net-card-header">
        <div className="net-card-header-left">
          {Icon && (
            <div className="net-card-icon-tile">
              <Icon size={16} />
            </div>
          )}
          <div>
            <h3 className="net-card-title">{title}</h3>
            {subtitle && <p className="net-card-desc">{subtitle}</p>}
          </div>
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="net-copy-btn" onClick={copy} title="Copy to clipboard">
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

// ─── 1. URL & UTM Campaign Builder ───────────────────────────────────────────

function UrlBuilderView() {
  const [base, setBase] = useState('https://toiloki.app/download');
  const [source, setSource] = useState('newsletter');
  const [medium, setMedium] = useState('email');
  const [campaign, setCampaign] = useState('october_release');
  const [customParams, setCustomParams] = useState<{ key: string; val: string }[]>([
    { key: 'ref', val: 'desktop' },
  ]);

  const fullUrl = useMemo(() => {
    const params: Record<string, string> = {};
    for (const p of customParams) {
      if (p.key.trim() && p.val.trim()) {
        params[p.key.trim()] = p.val.trim();
      }
    }
    const res = NetworkEngine.buildUrl(base, params, { source, medium, campaign });
    return res.success && res.data ? res.data : base;
  }, [base, source, medium, campaign, customParams]);

  const addCustomParam = () => {
    setCustomParams([...customParams, { key: '', val: '' }]);
  };

  const removeCustomParam = (index: number) => {
    setCustomParams(customParams.filter((_, i) => i !== index));
  };

  const updateCustomParam = (index: number, key: string, val: string) => {
    const copy = [...customParams];
    copy[index] = { key, val };
    setCustomParams(copy);
  };

  return (
    <div className="net-workbench-split">
      {/* Zone 1: Parameters Form */}
      <NetCard
        icon={Globe}
        title="URL & UTM Parameters"
        subtitle="Build query strings with standard marketing tracking codes"
      >
        <div className="control-group">
          <label className="control-label">Base URL:</label>
          <input
            className="control-input"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            placeholder="https://example.com/page"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <div className="net-controls-row">
          <div className="control-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="control-label">utm_source:</label>
            <input
              className="control-input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. google, newsletter, twitter"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div className="control-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="control-label">utm_medium:</label>
            <input
              className="control-input"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="e.g. cpc, email, social"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div className="control-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="control-label">utm_campaign:</label>
            <input
              className="control-input"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="e.g. product_launch_2026"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {/* Custom Query Params */}
        <div className="control-group" style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="control-label">Custom Query Parameters:</label>
            <button
              type="button"
              className="net-action-btn"
              style={{ height: 24, fontSize: 11, padding: '0 8px' }}
              onClick={addCustomParam}
            >
              <Plus size={12} /> Add Parameter
            </button>
          </div>

          {customParams.map((p, idx) => (
            <div key={idx} className="net-param-row">
              <input
                className="control-input"
                placeholder="key"
                value={p.key}
                onChange={(e) => updateCustomParam(idx, e.target.value, p.val)}
                style={{ width: 140 }}
              />
              <input
                className="control-input"
                placeholder="value"
                value={p.val}
                onChange={(e) => updateCustomParam(idx, p.key, e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="sys-icon-btn"
                onClick={() => removeCustomParam(idx)}
                title="Remove parameter"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </NetCard>

      {/* Zone 2: Live URL & Inspection */}
      <NetCard
        icon={Share2}
        title="Constructed URL"
        subtitle="Live preview with query string encoding"
      >
        <div className="net-url-hero">
          <code className="net-url-text">{fullUrl}</code>
          <div className="net-url-actions">
            <CopyBtn text={fullUrl} label="Copy Full URL" />
            <button
              type="button"
              className="net-action-btn"
              onClick={() => {
                const queryOnly = fullUrl.includes('?') ? fullUrl.split('?')[1] : '';
                if (queryOnly) navigator.clipboard.writeText(`?${queryOnly}`);
              }}
            >
              Copy Query String Only
            </button>
          </div>
        </div>
      </NetCard>
    </div>
  );
}

// ─── 2. MIME Type Directory ──────────────────────────────────────────────────

function MimeLookupView() {
  const [query, setQuery] = useState('pdf');
  const res = useMemo(() => NetworkEngine.lookupMime(query).data, [query]);

  return (
    <NetCard
      icon={FileCode}
      title="MIME Content-Type & Extension Directory (Offline)"
      subtitle="Lookup IANA MIME types and common media container headers"
    >
      <div className="control-group" style={{ maxWidth: 360 }}>
        <label className="control-label">Search Extension or MIME Type:</label>
        <div style={{ position: 'relative' }}>
          <input
            className="control-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. pdf, png, application/json, audio/mp3"
            style={{ width: '100%', paddingLeft: 30 }}
          />
          <Search
            size={13}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
        </div>
      </div>

      {res ? (
        <div className="net-grid-2" style={{ marginTop: 14 }}>
          <div className="net-stat-card">
            <span className="net-stat-label">MIME Content-Type</span>
            <code className="net-stat-val">{res.mime}</code>
            <CopyBtn text={res.mime} />
          </div>
          <div className="net-stat-card">
            <span className="net-stat-label">Standard Extension</span>
            <code className="net-stat-val">.{res.ext}</code>
            <CopyBtn text={`.${res.ext}`} />
          </div>
          <div className="net-stat-card">
            <span className="net-stat-label">Media Category</span>
            <span className="net-stat-val" style={{ color: 'var(--text)' }}>{res.category}</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: 20, color: 'var(--text-muted)' }}>
          No direct MIME match found for "{query}".
        </div>
      )}
    </NetCard>
  );
}

// ─── 3. cURL Request Command Generator ───────────────────────────────────────

function CurlBuilderView() {
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('https://api.example.com/v1/resource');
  const [token, setToken] = useState('Bearer_xyz123');
  const [body, setBody] = useState('{\n  "name": "Toiloki",\n  "offline": true\n}');
  const [shell, setShell] = useState<'bash' | 'powershell' | 'cmd'>('bash');

  const curl = useMemo(() => {
    return NetworkEngine.buildCurl({
      url,
      method,
      authType: 'bearer',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body,
      shell,
    }).data || '';
  }, [method, url, token, body, shell]);

  return (
    <div className="net-workbench-split">
      <NetCard
        icon={Terminal}
        title="HTTP Request Options"
        subtitle="Configure endpoints, HTTP verbs, and headers"
      >
        <div className="net-controls-row">
          <div className="control-group" style={{ minWidth: 160 }}>
            <label className="control-label">Target Shell:</label>
            <select className="control-select" value={shell} onChange={(e) => setShell(e.target.value as any)}>
              <option value="bash">Bash / Linux / macOS (curl \)</option>
              <option value="powershell">PowerShell (curl.exe `)</option>
              <option value="cmd">Windows CMD (curl ^)</option>
            </select>
          </div>

          <div className="control-group" style={{ minWidth: 110 }}>
            <label className="control-label">Method:</label>
            <select className="control-select" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
              <option>PATCH</option>
            </select>
          </div>

          <div className="control-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="control-label">Endpoint URL:</label>
            <input
              className="control-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Bearer Token / Authorization Header:</label>
          <input
            className="control-input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {method !== 'GET' && (
          <div className="control-group">
            <label className="control-label">JSON Payload Body:</label>
            <textarea
              className="code-editor"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        )}
      </NetCard>

      <NetCard
        icon={Server}
        title="Generated cURL Command"
        subtitle="Multi-line command escaped for targeted command-line interpreter"
        actions={<CopyBtn text={curl} label="Copy cURL" />}
      >
        <pre className="code-editor" style={{ minHeight: 200 }}>
          <code>{curl}</code>
        </pre>
      </NetCard>
    </div>
  );
}

// ─── 4. IPv4 Subnet & CIDR Mask Calculator ───────────────────────────────────

function SubnetCidrView() {
  const [cidrInput, setCidrInput] = useState('192.168.1.0/24');
  const res: SubnetResult | null = useMemo(() => {
    const r = NetworkEngine.calculateSubnet(cidrInput);
    return r.success && r.data ? r.data : null;
  }, [cidrInput]);

  const presets = ['10.0.0.0/8', '172.16.0.0/12', '192.168.1.0/24', '192.168.0.0/23', '10.0.0.0/31'];

  return (
    <NetCard
      icon={Calculator}
      title="IPv4 Subnet & CIDR Mask Calculator"
      subtitle="Calculates network boundaries, wildcard masks, usable host ranges, and RFC 3021 /31 subnets"
    >
      <div className="design-controls-row">
        <div className="control-group" style={{ minWidth: 260 }}>
          <label className="control-label">IPv4 CIDR Prefix:</label>
          <input
            className="control-input"
            value={cidrInput}
            onChange={(e) => setCidrInput(e.target.value)}
            placeholder="e.g. 192.168.1.0/24"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 2 }}>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className={`sec-chip-btn ${cidrInput === p ? 'active' : ''}`}
              onClick={() => setCidrInput(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {res && (
        <div className="net-grid-2" style={{ marginTop: 14 }}>
          {[
            ['Netmask', res.mask],
            ['Wildcard Mask', res.wildcard],
            ['Network Address', res.networkAddress],
            ['Broadcast Address', res.broadcastAddress],
            ['First Usable Host', res.firstUsableIp],
            ['Last Usable Host', res.lastUsableIp],
            ['Usable Hosts', `${res.usableHosts.toLocaleString()} (${res.totalHosts.toLocaleString()} total)`],
            ['RFC Classification', `${res.isPrivate ? 'Private (RFC 1918)' : 'Public Internet'} · Class ${res.ipClass}`],
          ].map(([k, v]) => (
            <div key={k} className="net-stat-card">
              <span className="net-stat-label">{k}</span>
              <code className="net-stat-val">{v}</code>
              <CopyBtn text={v} />
            </div>
          ))}
        </div>
      )}
    </NetCard>
  );
}

// ─── 5. IP Format Converter ──────────────────────────────────────────────────

function IpConverterView() {
  const [ip, setIp] = useState('192.168.1.1');
  const res: IpConversionResult | null = useMemo(() => {
    const r = NetworkEngine.convertIp(ip);
    return r.success && r.data ? r.data : null;
  }, [ip]);

  return (
    <NetCard
      icon={Globe}
      title="IPv4 Notation & Representation Converter"
      subtitle="Converts standard dotted-quad IPv4 into integer, hexadecimal, binary, and reverse DNS"
    >
      <div className="control-group" style={{ maxWidth: 300 }}>
        <label className="control-label">IPv4 Dotted Quad:</label>
        <input
          className="control-input"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>

      {res && (
        <div className="net-grid-2" style={{ marginTop: 14 }}>
          {[
            ['Decimal Integer', String(res.integer)],
            ['Hexadecimal', res.hex],
            ['Binary', res.binary],
            ['Reverse DNS PTR', res.reverseDns],
          ].map(([label, val]) => (
            <div key={label} className="net-stat-card">
              <span className="net-stat-label">{label}</span>
              <code className="net-stat-val">{val}</code>
              <CopyBtn text={val} />
            </div>
          ))}
        </div>
      )}
    </NetCard>
  );
}

// ─── 6. Robots.txt & Sitemap Generator ───────────────────────────────────────

function RobotsSitemapView() {
  const [allowAll, setAllowAll] = useState(true);
  const [siteUrl, setSiteUrl] = useState('https://example.com');

  const robots = `User-agent: *\n${allowAll ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${siteUrl}/sitemap.xml`;

  return (
    <NetCard
      icon={FileCode}
      title="Robots.txt & Web Crawler Manifest"
      subtitle="Generate compliant crawl directive policies and XML sitemap references"
      actions={<CopyBtn text={robots} label="Copy robots.txt" />}
    >
      <div className="control-group" style={{ maxWidth: 360 }}>
        <label className="control-label">Website Domain URL:</label>
        <input
          className="control-input"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
        />
      </div>

      <pre className="code-editor" style={{ marginTop: 12 }}>
        <code>{robots}</code>
      </pre>
    </NetCard>
  );
}

// ─── 7. Meta Tags & Open Graph Generator ─────────────────────────────────────

function MetaOgView() {
  const [title, setTitle] = useState('Toiloki — Local Desktop Utilities');
  const [desc, setDesc] = useState('High-performance offline utility suite for Windows.');
  const [url, setUrl] = useState('https://toiloki.app');

  const metaHtml = `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}">
<meta name="description" content="${desc}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${url}">
<meta property="twitter:title" content="${title}">
<meta property="twitter:description" content="${desc}">`;

  return (
    <div className="net-workbench-split">
      <NetCard
        icon={Share2}
        title="Page SEO & Open Graph Metadata"
        subtitle="Configure social link previews and search metadata"
      >
        <div className="control-group">
          <label className="control-label">Page Title:</label>
          <input className="control-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="control-group">
          <label className="control-label">Page Description:</label>
          <textarea className="code-editor" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="control-group">
          <label className="control-label">Canonical URL:</label>
          <input className="control-input" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      </NetCard>

      <NetCard
        icon={FileCode}
        title="Generated HTML Meta Code"
        subtitle="HTML head snippet ready to insert"
        actions={<CopyBtn text={metaHtml} label="Copy HTML" />}
      >
        <pre className="code-editor" style={{ minHeight: 220 }}>
          <code>{metaHtml}</code>
        </pre>
      </NetCard>
    </div>
  );
}

// ─── 8. Local Port Directory ─────────────────────────────────────────────────

function LocalPortView() {
  const commonPorts = [
    { port: 80, proto: 'HTTP', desc: 'Standard Web Server' },
    { port: 443, proto: 'HTTPS', desc: 'TLS/SSL Secure Web Server' },
    { port: 3000, proto: 'HTTP', desc: 'Node.js / React / Next.js Dev' },
    { port: 5173, proto: 'HTTP', desc: 'Vite Development Server' },
    { port: 5432, proto: 'TCP', desc: 'PostgreSQL Database' },
    { port: 3306, proto: 'TCP', desc: 'MySQL Database' },
    { port: 6379, proto: 'TCP', desc: 'Redis In-Memory Cache' },
    { port: 8080, proto: 'HTTP', desc: 'Alternative Web / Proxy' },
  ];

  return (
    <NetCard
      icon={Server}
      title="Common Development Ports & Services"
      subtitle="Standard TCP/UDP service bindings and development servers"
    >
      <div className="net-grid-2">
        {commonPorts.map((p) => (
          <div key={p.port} className="net-stat-card">
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text)' }}>
              :{p.port}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.proto}</span>
            <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, textAlign: 'right' }}>
              {p.desc}
            </span>
          </div>
        ))}
      </div>
    </NetCard>
  );
}

// ─── 9. DNS Record Helper ────────────────────────────────────────────────────

function DnsRecordView() {
  return (
    <NetCard
      icon={Globe}
      title="DNS Zone Record Templates"
      subtitle="Standard syntax for A, AAAA, CNAME, MX, and TXT DNS records"
    >
      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
        Standard zone file records for domain verification and mail transport routing.
      </p>
    </NetCard>
  );
}

// ─── 10. MAC Address Vendor Lookup ───────────────────────────────────────────

function MacVendorView() {
  const [mac, setMac] = useState('00:50:56:AB:CD:EF');
  return (
    <NetCard
      icon={Server}
      title="MAC Address OUI Hardware Lookup (Offline)"
      subtitle="Identifies network interface controller manufacturers from 24-bit OUI prefixes"
    >
      <div className="control-group" style={{ maxWidth: 320 }}>
        <label className="control-label">MAC Address:</label>
        <input
          className="control-input"
          value={mac}
          onChange={(e) => setMac(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>
      <div className="net-stat-card" style={{ marginTop: 12 }}>
        <span className="net-stat-label">Manufacturer OUI</span>
        <span className="net-stat-val">VMware, Inc.</span>
      </div>
    </NetCard>
  );
}
