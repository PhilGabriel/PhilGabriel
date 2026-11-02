// Erzeugt die Profil-Grafiken als SVG, jeweils in einer dunklen und einer hellen Variante.
//   node scripts/profile.mjs assets          statische Grafiken nach assets/ (braucht `npm install`)
//   node scripts/profile.mjs stats <dir>     GitHub-Stats nach <dir> (braucht GITHUB_TOKEN, läuft im Workflow)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LOGIN = 'PhilGabriel';

export const THEMES = {
  dark: { bg: '#0d1117', surface: '#161b22', border: '#30363d', text: '#e6edf3', muted: '#8b949e', accent: '#e3863b' },
  light: { bg: '#ffffff', surface: '#f6f8fa', border: '#d0d7de', text: '#1f2328', muted: '#59636e', accent: '#b4561b' },
};
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// shortcut: Textbreite wird über die mittlere Zeichenbreite geschätzt, bei sehr breiten Glyphen ggf. Abstände erhöhen.
const textWidth = (s, size, mono = false) => s.length * size * (mono ? 0.6 : 0.56);

function wrap(text, maxChars) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + ' ' + word).length > maxChars) lines.push(word);
    else lines[lines.length - 1] = cur ? cur + ' ' + word : word;
  }
  return lines;
}

function svg(w, h, t, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
text{font-family:${SANS};fill:${t.text}}
.mono{font-family:${MONO}}
.muted{fill:${t.muted}}
.accent{fill:${t.accent}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
${body}
</svg>
`;
}

// Deterministisches Rauschen, damit das Header-Raster bei jedem Build gleich aussieht.
function noise(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function header(t) {
  const W = 1200, H = 300;
  const cols = 14, rows = 7, step = 18, cell = 13;
  const gx = W - 64 - cols * step, gy = 86;
  const ramp = [t.surface, `${t.accent}40`, `${t.accent}80`, `${t.accent}c0`, t.accent];
  let cells = '';
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // Dichte nimmt nach rechts zu, damit das Raster in den Text hinein ausläuft.
      const level = Math.min(4, Math.floor(noise(c * rows + r + 1) * 5 * (0.35 + (c / cols) * 0.8)));
      const delay = (c * 0.06 + r * 0.03).toFixed(2);
      cells += `<rect x="${gx + c * step}" y="${gy + r * step}" width="${cell}" height="${cell}" rx="3" fill="${ramp[level]}" style="animation-delay:${delay}s"/>`;
    }
  }
  const body = `<style>
.cells rect{opacity:0;animation:in .5s ease forwards}
@keyframes in{to{opacity:1}}
.cursor{animation:blink 1.1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
</style>
<rect width="${W}" height="${H}" rx="12" fill="${t.bg}" stroke="${t.border}"/>
<rect x="64" y="70" width="4" height="96" rx="2" fill="${t.accent}"/>
<text x="92" y="122" font-size="60" font-weight="700" letter-spacing="-1.5">Philipp Gabriel</text>
<text x="94" y="162" font-size="28" class="muted">Senior Communication Analyst</text>
<text x="64" y="218" font-size="20" class="mono muted">Corporate Strategy · Technical SEO · Datengetriebene Kommunikation</text>
<text x="64" y="256" font-size="20" class="mono"><tspan class="accent">~</tspan> philipp-gabriel.com</text>
<rect class="cursor" x="${64 + textWidth('~ philipp-gabriel.com', 20, true) + 6}" y="240" width="11" height="21" fill="${t.accent}"/>
<g class="cells">${cells}</g>`;
  return svg(W, H, t, body, 'Philipp Gabriel, Senior Communication Analyst');
}

export const FOCUS = [
  ['Analytics & Technical SEO', 'Datengetriebene Kommunikation und die technische Seite der Sichtbarkeit, von Crawling bis Core Web Vitals.'],
  ['Digitale Souveränität', 'Wer kontrolliert die Infrastruktur des Webs? Cloudflare, EU-Cloud und die unbequemen Fragen dahinter.'],
  ['KI & Web-Infrastruktur', 'Wie KI das Web verändert, vom Vibe Coding bis zur Frage, wem die Antwortmaschinen gehören.'],
  ['Self-Hosting & Homelab', 'Docker, Nginx, Pi-hole und Home Assistant: eigene Infrastruktur statt Abhängigkeit.'],
];

export function focus(t) {
  const W = 1200, gap = 24, cw = (W - gap) / 2, ch = 220;
  const H = ch * 2 + gap;
  const cards = FOCUS.map(([title, desc], i) => {
    const x = (i % 2) * (cw + gap), y = Math.floor(i / 2) * (ch + gap);
    const lines = wrap(desc, 46).map((l, j) => `<tspan x="${x + 32}" dy="${j ? 30 : 0}">${esc(l)}</tspan>`).join('');
    return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${ch - 1}" rx="10" fill="${t.surface}" stroke="${t.border}"/>
<text x="${x + 32}" y="${y + 48}" font-size="18" class="mono accent">0${i + 1}</text>
<text x="${x + 32}" y="${y + 90}" font-size="28" font-weight="600">${esc(title)}</text>
<text x="${x + 32}" y="${y + 132}" font-size="21" class="muted">${lines}</text>`;
  }).join('\n');
  return svg(W, H, t, cards, 'Schwerpunkte: ' + FOCUS.map(([a, b]) => `${a}: ${b}`).join(' '));
}

export const STACK = [
  ['Sprachen & Web', ['siPython', 'siPhp', 'siHtml5', 'siJavascript', 'siNodedotjs', 'siNpm', 'siBootstrap']],
  ['Server & Infra', ['siCloudflare', 'siNginx', 'siApache', 'siDocker', 'siMysql', 'siMariadb']],
  ['Homelab', ['siHomeassistant', 'siPihole']],
  ['Tools', ['siGit', 'siGithub', 'siJira', 'siBitwarden', 'siTorproject']],
  // Adobe-Logos fehlen in simple-icons, deshalb Buchstaben-Kacheln.
  ['Design', [['Ai', 'Illustrator'], ['Ps', 'Photoshop'], ['Pr', 'Premiere Pro'], ['Ae', 'After Effects'], 'siFigma']],
];

export function stack(t, icons) {
  const W = 1200, rowH = 124, tile = 64, stepX = 128, left = 250;
  const H = STACK.length * rowH - 16;
  let names = [];
  const rows = STACK.map(([label, items], r) => {
    const y = r * rowH;
    const tiles = items.map((it, i) => {
      const x = left + i * stepX;
      let glyph, name;
      if (Array.isArray(it)) {
        [glyph, name] = [`<text x="${x + tile / 2}" y="${y + 41}" font-size="22" font-weight="700" text-anchor="middle" class="mono">${it[0]}</text>`, it[1]];
      } else {
        const ic = icons[it];
        if (!ic) throw new Error(`Icon fehlt in simple-icons: ${it}`);
        name = ic.title;
        glyph = `<path transform="translate(${x + 16} ${y + 16}) scale(${32 / 24})" fill="${t.text}" d="${ic.path}"/>`;
      }
      names.push(name);
      return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${tile - 1}" height="${tile - 1}" rx="10" fill="${t.surface}" stroke="${t.border}"/>${glyph}
<text x="${x + tile / 2}" y="${y + tile + 24}" font-size="15" text-anchor="middle" class="muted">${esc(name)}</text>`;
    }).join('\n');
    return `<text x="0" y="${y + 39}" font-size="19" class="mono">${esc(label)}</text>\n${tiles}`;
  }).join('\n');
  return svg(W, H, t, rows, 'Stack: ' + names.join(', '));
}

export function button(t, label, primary) {
  const h = 40, w = Math.round(label.length * 15 * 0.62 + 64);
  const fg = primary ? t.bg : t.text;
  const body = `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="8" fill="${primary ? t.accent : t.surface}" stroke="${primary ? t.accent : t.border}"/>
<text x="20" y="25.5" font-size="15" font-weight="600" style="fill:${fg}">${esc(label)}</text>
<path d="M${w - 30} ${h / 2 + 5} l10 -10 m-7 0 h7 v7" stroke="${primary ? fg : t.accent}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(w, h, t, body, label);
}

export const BUTTONS = [
  ['website', 'philipp-gabriel.com', true],
  ['linkedin', 'LinkedIn'],
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['coffee', 'Buy Me a Coffee'],
  ['paypal', 'PayPal'],
];

const fmt = (n) => n.toLocaleString('de-DE');

export function stats(t, s) {
  const W = 1200, H = 260, pad = 44;
  const metrics = [
    [s.contributions, 'Beiträge, letzte 12 Monate'],
    [s.repos, 'öffentliche Repositories'],
    [s.stars, 'Sterne erhalten'],
    [s.followers, 'Follower'],
  ];
  const colW = (W - pad * 2) / metrics.length;
  const m = metrics.map(([v, l], i) => `<text x="${pad + i * colW}" y="${pad + 46}" font-size="48" font-weight="700" letter-spacing="-1">${fmt(v)}</text>
<text x="${pad + i * colW}" y="${pad + 76}" font-size="18" class="muted">${esc(l)}</text>`).join('\n');
  const barW = W - pad * 2, barY = 168;
  let x = pad, bar = '', legend = '', lx = pad;
  for (const [i, lang] of s.languages.entries()) {
    const w = lang.share * barW;
    bar += `<rect x="${x.toFixed(1)}" y="${barY}" width="${Math.max(w - 2, 1).toFixed(1)}" height="10" fill="${lang.color || t.muted}"/>`;
    x += w;
    const label = `${lang.name} ${(lang.share * 100).toFixed(1).replace('.', ',')} %`;
    legend += `<circle cx="${lx + 5}" cy="${barY + 42}" r="6" fill="${lang.color || t.muted}"/><text x="${lx + 16}" y="${barY + 46}" font-size="17" class="muted">${esc(label)}</text>`;
    lx += textWidth(label, 17) + 40;
    if (i === 5) break;
  }
  const body = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.surface}" stroke="${t.border}"/>
${m}
<clipPath id="bar"><rect x="${pad}" y="${barY}" width="${barW}" height="10" rx="5"/></clipPath>
<rect x="${pad}" y="${barY}" width="${barW}" height="10" rx="5" fill="${t.border}"/>
<g clip-path="url(#bar)">${bar}</g>
${legend}`;
  return svg(W, H, t, body, `GitHub-Statistik: ${metrics.map(([v, l]) => `${fmt(v)} ${l}`).join(', ')}. Sprachen: ${s.languages.slice(0, 6).map((l) => l.name).join(', ')}`);
}

export function summarize(user) {
  const sizes = new Map();
  let stars = 0;
  for (const repo of user.repositories.nodes) {
    stars += repo.stargazerCount;
    for (const { size, node } of repo.languages.edges) {
      const cur = sizes.get(node.name) || { name: node.name, color: node.color, size: 0 };
      cur.size += size;
      sizes.set(node.name, cur);
    }
  }
  const total = [...sizes.values()].reduce((a, l) => a + l.size, 0) || 1;
  return {
    contributions: user.contributionsCollection.contributionCalendar.totalContributions,
    repos: user.repositories.totalCount,
    stars,
    followers: user.followers.totalCount,
    languages: [...sizes.values()].sort((a, b) => b.size - a.size).map((l) => ({ ...l, share: l.size / total })),
  };
}

const QUERY = `query($login:String!){user(login:$login){
  followers{totalCount}
  contributionsCollection{contributionCalendar{totalContributions}}
  repositories(first:100,ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC,orderBy:{field:STARGAZERS,direction:DESC}){
    totalCount nodes{stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name color}}}}
  }}}`;

async function fetchUser() {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub API: ${res.status} ${JSON.stringify(json.errors || json)}`);
  return json.data.user;
}

function writeThemed(dir, name, render) {
  mkdirSync(dir, { recursive: true });
  for (const [mode, t] of Object.entries(THEMES)) writeFileSync(join(dir, `${name}-${mode}.svg`), render(t));
}

const [, , cmd, out] = process.argv;
if (cmd === 'assets') {
  const icons = await import('simple-icons');
  writeThemed('assets', 'header', header);
  writeThemed('assets', 'focus', focus);
  writeThemed('assets', 'stack', (t) => stack(t, icons));
  for (const [file, label, primary] of BUTTONS) writeThemed('assets', `btn-${file}`, (t) => button(t, label, primary));
} else if (cmd === 'stats') {
  const s = summarize(await fetchUser());
  writeThemed(out || 'dist', 'stats', (t) => stats(t, s));
}
