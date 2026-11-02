// Prüft die Stats-Auswertung mit festen Daten und dass alle Grafiken gültiges XML ergeben.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as icons from 'simple-icons';
import { THEMES, summarize, stats, header, focus, stack, button } from './profile.mjs';

const user = {
  followers: { totalCount: 12 },
  contributionsCollection: { contributionCalendar: { totalContributions: 1234 } },
  repositories: { totalCount: 2, nodes: [
    { stargazerCount: 3, languages: { edges: [{ size: 300, node: { name: 'PHP', color: '#4F5D95' } }, { size: 100, node: { name: 'CSS', color: null } }] } },
    { stargazerCount: 2, languages: { edges: [{ size: 600, node: { name: 'PHP', color: '#4F5D95' } }] } },
  ] },
};
const s = summarize(user);
assert.equal(s.stars, 5);
assert.equal(s.repos, 2);
assert.deepEqual(s.languages.map((l) => [l.name, l.share]), [['PHP', 0.9], ['CSS', 0.1]]);
assert.equal(summarize({ ...user, repositories: { totalCount: 0, nodes: [] } }).languages.length, 0);

const dir = mkdtempSync(join(tmpdir(), 'svg-'));
for (const t of Object.values(THEMES)) {
  for (const [name, out] of Object.entries({ stats: stats(t, s), header: header(t), focus: focus(t), stack: stack(t, icons), btn: button(t, 'A & B', true) })) {
    const f = join(dir, name + '.svg');
    writeFileSync(f, out);
    execFileSync('xmllint', ['--noout', f]);
  }
}
assert.match(stats(THEMES.dark, s), /1\.234/);
console.log('ok');
