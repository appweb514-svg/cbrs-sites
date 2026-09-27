#!/usr/bin/env python3
"""Écrit dans le HTML ce que site3/ui-shell.js appliquait après le premier affichage.

Sans cela, la page s'affiche une première fois sans la mise en page du gabarit,
puis « saute » quand le script ajoute ses classes (CLS mesuré : 1,0).
Idempotent : peut être relancé après chaque modification des pages.
"""
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / 'site3'
PAGES = [
    'index.html', 'activite.html', 'activites.html', 'adhesion.html', 'contact.html',
    'mentions-legales.html', 'conditions-utilisation.html', 'formation.html', 'galerie.html',
    'liens-utiles.html', 'planning.html', 'sorties-voyages.html', 'sortie.html',
    'evenement.html', 'statuts.html',
]
ACTIVE = {'activite.html': 'activites.html', 'sortie.html': 'sorties-voyages.html', 'evenement.html': 'sorties-voyages.html'}
ICON_VERSION = 'transparent-icons-20260814-v3'
FONTS_HREF = ('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700'
              '&family=Manrope:wght@600;700;800&family=Playfair+Display:ital,wght@1,600&display=swap')


def add_class(tag: str, cls: str) -> str:
    match = re.search(r'class="([^"]*)"', tag)
    if not match:
        return tag.replace('>', f' class="{cls}">', 1) if not tag.endswith('/>') else tag[:-2] + f' class="{cls}"/>'
    classes = match.group(1).split()
    if cls in classes:
        return tag
    return tag[:match.start(1)] + ' '.join(classes + [cls]) + tag[match.end(1):]


def sub_tag(pattern: str, cls: str, html: str) -> str:
    return re.sub(pattern, lambda m: add_class(m.group(0), cls), html, count=1)


def bake(page: str, html: str) -> str:
    html = sub_tag(r'<body\b[^>]*>', 'cbrs-ui', html)

    hero = re.search(r'(<body\b[^>]*>.*?)(<section class="[^"]*\brelative\b[^"]*"[^>]*>)', html, re.S)
    if hero and 'md:hidden' not in hero.group(2):
        start, end = hero.span(2)
        html = html[:start] + add_class(hero.group(2), 'cbrs-hero') + html[end:]
        section_end = html.index('</section>', start)
        block = html[start:section_end]
        logo = re.search(r'<img src="logo-cbrs\.png" alt="CBRS" class="[^"]*"\s*/>', block)
        if logo and 'cbrs-logo-frame' not in block:
            framed = '<div class="cbrs-logo-frame"><img src="logo-cbrs.png" alt="CBRS" class="cbrs-logo-image"/></div>'
            block = block[:logo.start()] + framed + block[logo.end():]
            html = html[:start] + block + html[section_end:]

    html = sub_tag(r'<div class="flex flex-1 flex-row[^"]*"[^>]*>', 'cbrs-layout', html)
    html = sub_tag(r'<aside id="sidebar"[^>]*>', 'cbrs-sidebar', html)
    html = sub_tag(r'<main id="contenu"[^>]*>', 'cbrs-content', html)
    html = sub_tag(r'<header class="md:hidden[^"]*"[^>]*>', 'cbrs-mobile-header', html)

    active = ACTIVE.get(page, page)

    def mark(match: re.Match) -> str:
        tag = match.group(0)
        href = re.search(r'href="([^"]+)"', tag).group(1)
        if href != active or 'cbrs-nav-active' in tag:
            return tag
        tag = tag.replace(' text-white/80 ', ' ')
        for cls in ('cbrs-nav-active', 'bg-cbrs-green', 'text-white'):
            tag = add_class(tag, cls)
        return tag.replace('<a ', '<a aria-current="page" ', 1)

    for container in (r'<aside id="sidebar".*?</aside>', r'<nav id="mobile-menu".*?</nav>'):
        found = re.search(container, html, re.S)
        if found:
            nav = re.sub(r'<a [^>]*class="[^"]*"[^>]*href="[^"]+"[^>]*>', mark, found.group(0))
            html = html[:found.start()] + nav + html[found.end():]

    html = re.sub(r'(src="\d{2}_[^"?#]+\.png)(")', rf'\1?v={ICON_VERSION}\2', html)
    html = html.replace('Sorties - Voyages', 'Sorties &amp; Voyages')
    html = re.sub(r'\n[ \t]*<li><a class="hover:text-cbrs-blue" href="[^"]*">Vid[ée]os</a></li>', '', html)
    html = html.replace('href="adhesion.html">Inscriptions</a>', 'href="adhesion.html">Adhérer</a>')
    if 'href="conditions-utilisation.html"' not in html.split('<footer', 1)[-1]:
        html = re.sub(
            r'(\n([ \t]*)<li><a class="hover:text-cbrs-blue" href="statuts.html">[^<]*</a></li>)',
            r'\1\n\2<li><a class="hover:text-cbrs-blue" href="conditions-utilisation.html">Conditions d’utilisation</a></li>',
            html, count=1)

    if '@import url(\'https://fonts.googleapis.com' in html:
        html = re.sub(r"\s*@import url\('https://fonts\.googleapis\.com[^']*'\);", '', html)
        links = ('<link rel="preconnect" href="https://fonts.googleapis.com"/>\n'
                 '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>\n'
                 f'<link rel="stylesheet" href="{FONTS_HREF}"/>\n')
        anchor = '<link rel="stylesheet" href="tailwind.css"/>' if 'href="tailwind.css"' in html else '</head>'
        html = html.replace(anchor, links + anchor, 1)
    return html


def main() -> int:
    changed = 0
    for page in PAGES:
        path = SITE / page
        before = path.read_text(encoding='utf-8')
        after = bake(page, before)
        if after != before:
            path.write_text(after, encoding='utf-8')
            changed += 1
            print(f'modifié : {page}')
    print(f'{changed} page(s) modifiée(s)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
