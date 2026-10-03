import React, { useState } from 'react';
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

// ─────────────────────────────────────────────────────────────────────────────

function NetCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="net-card">
      <h3 className="net-card-title">{title}</h3>
      {children}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="net-copy-btn" onClick={copy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── 1. URL Builder ──────────────────────────────────────────────────────────
function UrlBuilderView() {
  const [base, setBase] = useState('https://toiloki.app/tools');
  const [source, setSource] = useState('newsletter');
  const [medium, setMedium] = useState('email');
  const [campaign, setCampaign] = useState('launch_v1');
  const [customKey, setCustomKey] = useState('ref');
  const [customVal, setCustomVal] = useState('desktop');

  const fullUrl = React.useMemo(() => {
    const params: Record<string, string> = {};
    if (customKey && customVal) params[customKey] = customVal;
    const res = NetworkEngine.buildUrl(base, params, { source, medium, campaign });
    return res.success && res.data ? res.data : base;
  }, [base, source, medium, campaign, customKey, customVal]);

  return (
    <NetCard title="URL & UTM Campaign Builder">
      <div className="control-group">
        <label className="control-label">Base URL:</label>
        <input className="control-input" value={base} onChange={(e) => setBase(e.target.value)} />
      </div>
      <div className="net-controls-row">
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">utm_source:</label>
          <input className="control-input" value={source} onChange={(e) => setSource(e.target.value)} />
        </div>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">utm_medium:</label>
          <input className="control-input" value={medium} onChange={(e) => setMedium(e.target.value)} />
        </div>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">utm_campaign:</label>
          <input className="control-input" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
        </div>
      </div>
      <div className="net-controls-row">
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Custom Param Key:</label>
          <input className="control-input" value={customKey} onChange={(e) => setCustomKey(e.target.value)} />
        </div>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Custom Param Value:</label>
          <input className="control-input" value={customVal} onChange={(e) => setCustomVal(e.target.value)} />
        </div>
      </div>
      <div className="net-result-box">
        <code className="net-code-text">{fullUrl}</code>
        <CopyBtn text={fullUrl} />
      </div>
    </NetCard>
  );
}

// ─── 2. MIME Lookup ──────────────────────────────────────────────────────────
function MimeLookupView() {
  const [query, setQuery] = useState('pdf');
  const res = React.useMemo(() => NetworkEngine.lookupMime(query).data, [query]);

  return (
    <NetCard title="MIME Type & File Extension Directory (Offline)">
      <div className="control-group">
        <label className="control-label">Search Extension or MIME Type:</label>
        <input
          className="control-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. pdf, png, application/json, audio/mp3"
          style={{ maxWidth: 360 }}
        />
      </div>
      {res && (
        <div className="net-grid-2" style={{ marginTop: 16 }}>
          <div className="net-stat-card">
            <span className="net-stat-label">MIME TYPE</span>
            <code className="net-stat-val">{res.mime}</code>
            <CopyBtn text={res.mime} />
          </div>
          <div className="net-stat-card">
            <span className="net-stat-label">EXTENSION</span>
            <code className="net-stat-val">.{res.ext}</code>
            <CopyBtn text={`.${res.ext}`} />
          </div>
          <div className="net-stat-card">
            <span className="net-stat-label">CATEGORY</span>
            <span className="net-stat-val" style={{ color: 'var(--text-primary)' }}>{res.category}</span>
          </div>
        </div>
      )}
    </NetCard>
  );
}

// ─── 3. cURL Builder ─────────────────────────────────────────────────────────
function CurlBuilderView() {
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('https://api.example.com/v1/resource');
  const [token, setToken] = useState('Bearer_xyz123');
  const [body, setBody] = useState('{\n  "name": "Toiloki",\n  "offline": true\n}');

  const curl = React.useMemo(() => {
    return NetworkEngine.buildCurl({
      url,
      method,
      authType: 'bearer',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body,
    }).data || '';
  }, [method, url, token, body]);

  return (
    <NetCard title="cURL Request Command Generator">
      <div className="net-controls-row">
        <div className="control-group">
          <label className="control-label">Method:</label>
          <select className="control-select" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>
        </div>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Endpoint URL:</label>
          <input className="control-input" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      </div>
      <div className="control-group">
        <label className="control-label">Bearer Token:</label>
        <input className="control-input" value={token} onChange={(e) => setToken(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
      </div>
      {method !== 'GET' && (
        <div className="control-group">
          <label className="control-label">JSON Payload Body:</label>
          <textarea className="code-editor" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
      )}
      <div className="net-result-box" style={{ marginTop: 12 }}>
        <pre><code className="net-code-text">{curl}</code></pre>
        <CopyBtn text={curl} />
      </div>
    </NetCard>
  );
}

// ─── 4. Subnet / CIDR Calculator ─────────────────────────────────────────────
function SubnetCidrView() {
  const [cidrInput, setCidrInput] = useState('192.168.1.0/24');
  const res: SubnetResult | null = React.useMemo(() => {
    const r = NetworkEngine.calculateSubnet(cidrInput);
    return r.success && r.data ? r.data : null;
  }, [cidrInput]);

  return (
    <NetCard title="IPv4 Subnet & CIDR Mask Calculator">
      <div className="control-group">
        <label className="control-label">IPv4 Address / CIDR Prefix:</label>
        <input className="control-input" value={cidrInput} onChange={(e) => setCidrInput(e.target.value)} placeholder="e.g. 10.0.0.0/16 or 192.168.1.1/24" style={{ maxWidth: 300, fontFamily: 'var(--font-mono)' }} />
      </div>
      {res && (
        <div className="net-grid-2" style={{ marginTop: 16 }}>
          {[
            ['Netmask', res.mask],
            ['Wildcard Mask', res.wildcard],
            ['Network Address', res.networkAddress],
            ['Broadcast Address', res.broadcastAddress],
            ['First Usable Host', res.firstUsableIp],
            ['Last Usable Host', res.lastUsableIp],
            ['Total Hosts', `${res.totalHosts.toLocaleString()} (${res.usableHosts.toLocaleString()} usable)`],
            ['Address Type', `${res.isPrivate ? 'Private (RFC 1918)' : 'Public Internet'} · Class ${res.ipClass}`],
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
  const res: IpConversionResult | null = React.useMemo(() => {
    const r = NetworkEngine.convertIp(ip);
    return r.success && r.data ? r.data : null;
  }, [ip]);

  return (
    <NetCard title="IP Address Representations (Integer, Hex, Binary)">
      <div className="control-group">
        <label className="control-label">IPv4 Address:</label>
        <input className="control-input" value={ip} onChange={(e) => setIp(e.target.value)} style={{ maxWidth: 260, fontFamily: 'var(--font-mono)' }} />
      </div>
      {res && (
        <div className="net-grid-2" style={{ marginTop: 16 }}>
          {[
            ['Decimal Integer', String(res.integer)],
            ['Hexadecimal', res.hex],
            ['Binary', res.binary],
            ['Reverse DNS PTR', res.reverseDns],
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

// ─── 6. robots.txt & Sitemap Generator ───────────────────────────────────────
function RobotsSitemapView() {
  const [domain, setDomain] = useState('https://mywebsite.com');
  const res = React.useMemo(() => {
    return NetworkEngine.generateRobotsAndSitemap({
      domain,
      rules: [
        { userAgent: '*', disallow: ['/admin/', '/private/'], allow: ['/'] },
        { userAgent: 'Googlebot', disallow: [], allow: ['/'] },
      ],
    }).data;
  }, [domain]);

  return (
    <NetCard title="robots.txt & XML Sitemap Generator">
      <div className="control-group">
        <label className="control-label">Site Domain:</label>
        <input className="control-input" value={domain} onChange={(e) => setDomain(e.target.value)} />
      </div>
      {res && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label className="control-label">robots.txt:</label>
              <CopyBtn text={res.robotsTxt} />
            </div>
            <textarea className="code-editor" rows={8} readOnly value={res.robotsTxt} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label className="control-label">sitemap.xml:</label>
              <CopyBtn text={res.sitemapXml} />
            </div>
            <textarea className="code-editor" rows={8} readOnly value={res.sitemapXml} />
          </div>
        </div>
      )}
    </NetCard>
  );
}

// ─── 7. Meta Tag & Open Graph Generator ──────────────────────────────────────
function MetaOgView() {
  const [title, setTitle] = useState('Toiloki – Local Suite');
  const [description, setDescription] = useState('A private, offline-first Windows desktop utility suite.');
  const [url, setUrl] = useState('https://toiloki.app');

  const res = React.useMemo(() => {
    return NetworkEngine.generateMetaOg({ title, description, canonicalUrl: url }).data;
  }, [title, description, url]);

  return (
    <NetCard title="Meta Tag & Open Graph Generator">
      <div className="control-group">
        <label className="control-label">Page Title:</label>
        <input className="control-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="control-group">
        <label className="control-label">Description:</label>
        <input className="control-input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="control-group">
        <label className="control-label">Canonical URL:</label>
        <input className="control-input" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      {res && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label className="control-label">HTML Head Tags:</label>
            <CopyBtn text={res.htmlSnippet} />
          </div>
          <textarea className="code-editor" rows={8} readOnly value={res.htmlSnippet} />
        </div>
      )}
    </NetCard>
  );
}

// ─── 8. Local Port Directory ─────────────────────────────────────────────────
function LocalPortView() {
  const ports = [
    { port: 3000, name: 'Node.js / React / Next.js', type: 'Frontend Dev' },
    { port: 5173, name: 'Vite Dev Server', type: 'Frontend Dev' },
    { port: 8080, name: 'HTTP Alternative / Tomcat', type: 'Web Server' },
    { port: 5432, name: 'PostgreSQL Database', type: 'Database' },
    { port: 3306, name: 'MySQL / MariaDB', type: 'Database' },
    { port: 6379, name: 'Redis Cache', type: 'Cache / Queue' },
    { port: 27017, name: 'MongoDB', type: 'NoSQL Database' },
  ];

  return (
    <NetCard title="Common Developer Local Ports Directory">
      <div className="net-grid-2">
        {ports.map((p) => (
          <div key={p.port} className="net-stat-card">
            <span className="net-stat-label">PORT {p.port}</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
            <span style={{ fontSize: 11, color: 'var(--accent)' }}>{p.type}</span>
          </div>
        ))}
      </div>
    </NetCard>
  );
}

// ─── 9. DNS Record Helper ────────────────────────────────────────────────────
function DnsRecordView() {
  const [domain, setDomain] = useState('example.com');
  const [ip, setIp] = useState('192.0.2.1');

  return (
    <NetCard title="DNS Zone Record Helper & Formatter">
      <div className="net-controls-row">
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Domain Name:</label>
          <input className="control-input" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </div>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Target IP / Destination:</label>
          <input className="control-input" value={ip} onChange={(e) => setIp(e.target.value)} />
        </div>
      </div>
      <div className="net-grid-2" style={{ marginTop: 16 }}>
        {[
          ['A Record', `@   3600    IN  A       ${ip}`],
          ['CNAME Record', `www 3600    IN  CNAME   ${domain}.`],
          ['TXT Record (SPF)', `@   3600    IN  TXT     "v=spf1 include:_spf.google.com ~all"`],
          ['MX Record', `@   3600    IN  MX  10  mail.${domain}.`],
        ].map(([name, entry]) => (
          <div key={name} className="net-stat-card">
            <span className="net-stat-label">{name}</span>
            <code className="net-stat-val" style={{ fontSize: 11 }}>{entry}</code>
            <CopyBtn text={entry} />
          </div>
        ))}
      </div>
    </NetCard>
  );
}

// ─── 10. MAC Vendor Lookup ───────────────────────────────────────────────────
function MacVendorView() {
  const [mac, setMac] = useState('00:1A:2B:3C:4D:5E');
  return (
    <NetCard title="MAC Address OUI & Vendor Inspector">
      <div className="control-group">
        <label className="control-label">MAC Address:</label>
        <input className="control-input" value={mac} onChange={(e) => setMac(e.target.value)} style={{ maxWidth: 280, fontFamily: 'var(--font-mono)' }} />
      </div>
      <div className="net-grid-2" style={{ marginTop: 16 }}>
        <div className="net-stat-card">
          <span className="net-stat-label">OUI PREFIX</span>
          <code className="net-stat-val">{mac.slice(0, 8)}</code>
        </div>
        <div className="net-stat-card">
          <span className="net-stat-label">TRANSMISSION TYPE</span>
          <span className="net-stat-val" style={{ color: 'var(--text-primary)' }}>Unicast (Standard)</span>
        </div>
      </div>
    </NetCard>
  );
}
