#!/usr/bin/env node
// Sonde de disponibilité + charge serveur, lancée toutes les 5 minutes
// (tâche planifiée alwaysdata). Sans dépendance, Node >= 18.
//
//   - mesure le site et le CMS, ajoute une ligne à samples.jsonl (30 jours conservés)
//   - lit la charge CPU et la RAM du serveur dans /proc
//   - régénère data.json, lu par la page /status
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = (process.env.STATUS_BASE_URL || 'https://cbrs-test.alwaysdata.net').replace(/\/$/, '');
const STATE_DIR = process.env.STATUS_STATE_DIR || path.join(os.homedir(), 'status-data');
const WEB_DIR = process.env.STATUS_WEB_DIR || path.join(os.homedir(), 'status');
const TZ = process.env.STATUS_TZ || 'Europe/Paris';
const TIMEOUT_MS = 15000;
const DAYS = 30;
const DAY_MS = 86400000;

const SAMPLES = path.join(STATE_DIR, 'samples.jsonl');
const OUT = path.join(WEB_DIR, 'data.json');

const SERVICES = [
  { id: 'site', label: 'Site CBRS', url: `${BASE}/`, check: (res) => res.status === 200 },
  {
    id: 'cms',
    label: 'CMS',
    url: `${BASE}/api/users/me`,
    // /api/users/me interroge Payload : une réponse JSON 200 prouve que Next et la base répondent.
    check: (res, body) => res.status === 200 && body.trim().startsWith('{'),
  },
];

async function probe(service) {
  const t0 = Date.now();
  try {
    const res = await fetch(service.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'cbrs-status/1.0' },
    });
    const body = await res.text();
    return { ok: service.check(res, body), code: res.status, ms: Date.now() - t0 };
  } catch (err) {
    return { ok: false, code: 0, ms: Date.now() - t0, err: err.name === 'TimeoutError' ? 'timeout' : 'réseau' };
  }
}

function readSystem() {
  // STATUS_SKIP_SYS : mesure manuelle depuis SSH, dont /proc n'est pas celui de la tâche planifiée
  if (process.env.STATUS_SKIP_SYS) return null;
  const cpus = os.cpus().length || 1;
  let load1 = os.loadavg()[0];
  let memTotal = os.totalmem() / 1024;
  let memAvail = os.freemem() / 1024;
  try {
    load1 = parseFloat(fs.readFileSync('/proc/loadavg', 'utf8').split(' ')[0]);
    const mem = fs.readFileSync('/proc/meminfo', 'utf8');
    memTotal = Number(/MemTotal:\s+(\d+)/.exec(mem)[1]);
    memAvail = Number(/MemAvailable:\s+(\d+)/.exec(mem)[1]);
  } catch {
    // hors Linux (test local) : valeurs de os.*
  }
  return {
    cpu: Math.min(100, round((load1 / cpus) * 100)),
    ram: round(((memTotal - memAvail) / memTotal) * 100),
    load1: round(load1, 2),
    cpus,
    ramTotalMb: Math.round(memTotal / 1024),
  };
}

function round(n, digits = 1) {
  const k = 10 ** digits;
  return Math.round(n * k) / k;
}

function readSamples(since) {
  let raw = '';
  try {
    raw = fs.readFileSync(SAMPLES, 'utf8');
  } catch {
    return [];
  }
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line) continue;
    try {
      const s = JSON.parse(line);
      if (s.t >= since) out.push(s);
    } catch {
      // ligne tronquée : ignorée
    }
  }
  return out;
}

function writeAtomic(file, content) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

const dayFmt = new Intl.DateTimeFormat('fr-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayKey = (t) => dayFmt.format(new Date(t));

function summarize(samples, now) {
  const services = SERVICES.map((svc) => {
    const rows = samples.filter((s) => s[svc.id]);
    const okCount = rows.filter((s) => s[svc.id].ok).length;
    const last = rows[rows.length - 1];

    // un jour par case, du plus ancien au plus récent
    const perDay = new Map();
    for (const s of rows) {
      const k = dayKey(s.t);
      const d = perDay.get(k) || { checks: 0, ok: 0 };
      d.checks += 1;
      if (s[svc.id].ok) d.ok += 1;
      perDay.set(k, d);
    }
    const days = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const k = dayKey(now - i * DAY_MS);
      const d = perDay.get(k);
      days.push({ date: k, checks: d ? d.checks : 0, uptime: d ? round((d.ok / d.checks) * 100, 2) : null });
    }

    // incidents : séries consécutives de sondes en échec
    const incidents = [];
    let cur = null;
    for (const s of rows) {
      if (!s[svc.id].ok) {
        if (!cur) cur = { from: s.t, to: s.t, checks: 0, code: s[svc.id].code };
        cur.to = s.t;
        cur.checks += 1;
      } else if (cur) {
        incidents.push(cur);
        cur = null;
      }
    }
    if (cur) incidents.push({ ...cur, ongoing: true });

    const okMs = rows.filter((s) => s[svc.id].ok).map((s) => s[svc.id].ms).sort((a, b) => a - b);
    return {
      id: svc.id,
      label: svc.label,
      up: last ? last[svc.id].ok : null,
      uptime: rows.length ? round((okCount / rows.length) * 100, 3) : null,
      checks: rows.length,
      failures: rows.length - okCount,
      medianMs: okMs.length ? okMs[Math.floor(okMs.length / 2)] : null,
      days,
      incidents: incidents.slice(-10).reverse(),
    };
  });

  // charge serveur : 5 min sur 24 h, moyenne horaire sur 30 jours
  const withSys = samples.filter((s) => s.sys);
  const recent = withSys.filter((s) => s.t >= now - DAY_MS).map((s) => [s.t, s.sys.cpu, s.sys.ram]);
  const buckets = new Map();
  for (const s of withSys) {
    const h = Math.floor(s.t / 3600000);
    const b = buckets.get(h) || { n: 0, cpu: 0, ram: 0 };
    b.n += 1;
    b.cpu += s.sys.cpu;
    b.ram += s.sys.ram;
    buckets.set(h, b);
  }
  const hourly = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([h, b]) => [h * 3600000, round(b.cpu / b.n), round(b.ram / b.n)]);
  const lastSys = withSys[withSys.length - 1];
  const avg = (i) => (hourly.length ? round(hourly.reduce((a, r) => a + r[i], 0) / hourly.length) : null);

  return {
    generatedAt: now,
    periodDays: DAYS,
    intervalMin: 5,
    services,
    server: {
      current: lastSys ? lastSys.sys : null,
      avg30d: { cpu: avg(1), ram: avg(2) },
      peak30d: {
        cpu: withSys.length ? Math.max(...withSys.map((s) => s.sys.cpu)) : null,
        ram: withSys.length ? Math.max(...withSys.map((s) => s.sys.ram)) : null,
      },
      recent,
      hourly,
    },
  };
}

async function main() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(WEB_DIR, { recursive: true });

  const now = Date.now();
  const results = await Promise.all(SERVICES.map(probe));
  const sys = readSystem();
  const sample = sys ? { t: now, sys } : { t: now };
  SERVICES.forEach((svc, i) => {
    sample[svc.id] = results[i];
  });
  fs.appendFileSync(SAMPLES, `${JSON.stringify(sample)}\n`);

  const since = now - DAYS * DAY_MS;
  const samples = readSamples(since);
  // purge : on réécrit le fichier dès qu'il contient des lignes de plus de 30 jours
  try {
    const first = JSON.parse(fs.readFileSync(SAMPLES, 'utf8').split('\n', 1)[0]);
    if (first.t < since) writeAtomic(SAMPLES, samples.map((s) => JSON.stringify(s)).join('\n') + '\n');
  } catch {
    // fichier illisible : le prochain passage repartira de ce qui est valide
  }

  writeAtomic(OUT, JSON.stringify(summarize(samples, now)));
  const line = SERVICES.map((svc, i) => `${svc.id}=${results[i].ok ? 'ok' : 'KO'}(${results[i].ms}ms)`).join(' ');
  console.log(`${new Date(now).toISOString()} ${line} ${sys ? ` cpu=${sys.cpu}% ram=${sys.ram}%` : ''}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
