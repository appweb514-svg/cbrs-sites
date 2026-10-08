(function () {
  'use strict';
  var DATA_URL = '/status/data.json';
  var data = null;
  var range = '24h';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var pct = function (v, d) {
    return v == null ? '—' : v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  var dtf = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  var df = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  var hf = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

  function dayClass(d) {
    if (d.uptime == null) return 'day';
    if (d.uptime >= 99.9) return 'day ok';
    if (d.uptime >= 95) return 'day warn';
    return 'day ko';
  }

  function renderOverall() {
    var box = document.getElementById('overall');
    var all = data.services;
    var known = all.filter(function (s) { return s.up != null; });
    var down = known.filter(function (s) { return !s.up; });
    var title = document.getElementById('overall-title');
    box.className = 'overall';
    if (!known.length) {
      title.textContent = 'Pas encore de mesure';
    } else if (!down.length) {
      box.classList.add('ok');
      title.textContent = 'Tous les services fonctionnent';
    } else {
      box.classList.add('ko');
      title.textContent = down.map(function (s) { return s.label; }).join(' et ') + ' : indisponible';
    }
    document.getElementById('overall-sub').textContent =
      'Dernière mesure : ' + dtf.format(new Date(data.generatedAt)) + ' · une mesure toutes les ' + data.intervalMin + ' minutes';
  }

  function renderServices() {
    var root = document.getElementById('services');
    root.textContent = '';
    data.services.forEach(function (s) {
      var card = el('article', 'card');
      var head = el('div', 'card-head');
      head.appendChild(el('h3', null, s.label));
      var badge = el('span', 'badge ' + (s.up == null ? 'na' : s.up ? 'ok' : 'ko'),
        s.up == null ? 'Aucune mesure' : s.up ? 'En ligne' : 'Hors ligne');
      head.appendChild(badge);
      card.appendChild(head);

      var big = el('p', 'big', pct(s.uptime, 2));
      big.appendChild(el('small', null, s.uptime == null ? '' : ' %'));
      card.appendChild(big);
      card.appendChild(el('p', 'sub',
        'disponibilité sur ' + data.periodDays + ' jours · ' + s.failures + ' échec' + (s.failures > 1 ? 's' : '') +
        ' sur ' + s.checks + ' mesures' + (s.medianMs != null ? ' · réponse médiane ' + s.medianMs + ' ms' : '')));

      var days = el('div', 'days');
      days.setAttribute('role', 'img');
      days.setAttribute('aria-label', 'Disponibilité jour par jour sur ' + data.periodDays + ' jours');
      s.days.forEach(function (d) {
        var c = el('div', dayClass(d));
        c.title = df.format(new Date(d.date + 'T12:00:00')) + ' : ' +
          (d.uptime == null ? 'pas de mesure' : pct(d.uptime, 2) + ' % (' + d.checks + ' mesures)');
        days.appendChild(c);
      });
      card.appendChild(days);
      var legend = el('div', 'days-legend');
      legend.appendChild(el('span', null, 'il y a ' + data.periodDays + ' jours'));
      legend.appendChild(el('span', null, 'aujourd’hui'));
      card.appendChild(legend);
      root.appendChild(card);
    });
  }

  var NS = 'http://www.w3.org/2000/svg';
  function chart(points, col, cls, tFrom, tTo) {
    var W = 600, H = 170, L = 42, R = 6, T = 8, B = 20;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('class', 'chart ' + cls);
    svg.setAttribute('role', 'img');
    function mk(name, attrs) {
      var n = document.createElementNS(NS, name);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      svg.appendChild(n);
      return n;
    }
    var max = 100;
    points.forEach(function (p) { if (p[col] > max) max = Math.ceil(p[col] / 50) * 50; });
    var y = function (v) { return T + (1 - v / max) * (H - T - B); };
    var x = function (t) { return L + ((t - tFrom) / (tTo - tFrom)) * (W - L - R); };
    [0, 50, 100].forEach(function (g) {
      if (g > max) return;
      mk('line', { x1: L, x2: W - R, y1: y(g), y2: y(g), class: 'grid' });
      var tx = mk('text', { x: L - 6, y: y(g) + 4, 'text-anchor': 'end', class: 'axis' });
      tx.textContent = g + ' %';
    });
    if (points.length > 1) {
      var d = points.map(function (p, i) { return (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[col]).toFixed(1); }).join('');
      var last = points[points.length - 1], first = points[0];
      mk('path', { d: d + 'L' + x(last[0]).toFixed(1) + ' ' + y(0) + 'L' + x(first[0]).toFixed(1) + ' ' + y(0) + 'Z', class: 'area' });
      mk('path', { d: d, class: 'line', 'vector-effect': 'non-scaling-stroke' });
    }
    var fmt = range === '24h' ? hf : df;
    var a = mk('text', { x: L, y: H - 4, class: 'axis' });
    a.textContent = fmt.format(new Date(tFrom));
    var b = mk('text', { x: W - R, y: H - 4, 'text-anchor': 'end', class: 'axis' });
    b.textContent = range === '24h' ? 'maintenant' : 'aujourd’hui';
    return svg;
  }

  function renderServer() {
    var root = document.getElementById('server');
    root.textContent = '';
    var sv = data.server;
    var now = data.generatedAt;
    var pts = range === '24h' ? sv.recent : sv.hourly;
    var from = range === '24h' ? now - 86400000 : now - data.periodDays * 86400000;
    var items = [
      { col: 1, cls: 'cpu', title: 'Processeur (CPU)', cur: sv.current && sv.current.cpu, avg: sv.avg30d.cpu, peak: sv.peak30d.cpu,
        extra: sv.current ? 'charge ' + pct(sv.current.load1, 2) + ' sur ' + sv.current.cpus + ' cœurs' : '' },
      { col: 2, cls: 'ram', title: 'Mémoire (RAM)', cur: sv.current && sv.current.ram, avg: sv.avg30d.ram, peak: sv.peak30d.ram,
        extra: sv.current ? sv.current.ramTotalMb + ' Mo au total' : '' }
    ];
    items.forEach(function (it) {
      var card = el('article', 'card');
      var head = el('div', 'card-head');
      head.appendChild(el('h3', null, it.title));
      card.appendChild(head);
      var big = el('p', 'big', pct(it.cur, 0));
      big.appendChild(el('small', null, it.cur == null ? '' : ' %'));
      card.appendChild(big);
      card.appendChild(el('p', 'sub', 'actuellement' + (it.extra ? ' · ' + it.extra : '')));
      var svg = chart(pts, it.col, it.cls, from, now);
      svg.setAttribute('aria-label', it.title + ' sur ' + (range === '24h' ? '24 heures' : '30 jours'));
      card.appendChild(svg);
      var stats = el('div', 'stats');
      [['Moyenne ' + data.periodDays + ' j', it.avg], ['Pic ' + data.periodDays + ' j', it.peak]].forEach(function (r) {
        var s = el('span', null, r[0] + ' : ');
        s.appendChild(el('b', null, pct(r[1], 0) + (r[1] == null ? '' : ' %')));
        stats.appendChild(s);
      });
      card.appendChild(stats);
      root.appendChild(card);
    });
  }

  function dur(ms) {
    var m = Math.max(1, Math.round(ms / 60000));
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + ' h ' + (m % 60 ? (m % 60) + ' min' : '');
  }

  function renderIncidents() {
    var root = document.getElementById('incidents');
    root.textContent = '';
    var list = [];
    data.services.forEach(function (s) {
      s.incidents.forEach(function (i) { list.push({ label: s.label, i: i }); });
    });
    list.sort(function (a, b) { return b.i.from - a.i.from; });
    if (!list.length) {
      root.appendChild(el('p', 'inc-empty', 'Aucun incident sur les ' + data.periodDays + ' derniers jours.'));
      return;
    }
    list.slice(0, 10).forEach(function (r) {
      var row = el('div', 'inc');
      row.appendChild(el('strong', null, r.label + (r.i.ongoing ? ' · en cours' : '')));
      var span = r.i.to - r.i.from + data.intervalMin * 60000;
      row.appendChild(el('span', null, dtf.format(new Date(r.i.from)) + ' · environ ' + dur(span) +
        ' (' + r.i.checks + ' mesure' + (r.i.checks > 1 ? 's' : '') + ' en échec)'));
      root.appendChild(row);
    });
  }

  function render() {
    renderOverall();
    renderServices();
    renderServer();
    renderIncidents();
    document.getElementById('foot').textContent =
      'Mesures effectuées depuis le serveur d’hébergement lui-même : une panne complète du serveur apparaît comme un trou dans les mesures, pas comme un échec.';
  }

  document.querySelectorAll('.seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      range = b.getAttribute('data-range');
      document.querySelectorAll('.seg button').forEach(function (o) {
        o.setAttribute('aria-pressed', String(o === b));
      });
      if (data) renderServer();
    });
  });

  function load() {
    fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { data = d; render(); })
      .catch(function () {
        document.getElementById('overall-title').textContent = 'Données indisponibles pour le moment';
        document.getElementById('overall-sub').textContent = 'Réessayez dans quelques minutes.';
      });
  }
  load();
  setInterval(load, 60000);
})();
