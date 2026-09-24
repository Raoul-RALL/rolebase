#!/usr/bin/env node
// Generates the local help mirror in /aide/ from the built website
// (website/dist), so the webapp's Help/Documentation menu can point to a
// local, searchable copy of the docs+guides content instead of the live
// rolebase.io site.
//
// Usage: cd website && npm run build && node ../scripts/generate-aide.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(root, 'website/dist')
const aideDir = join(root, 'aide')

if (!existsSync(distDir)) {
  console.error('website/dist not found. Run `cd website && npm run build` first.')
  process.exit(1)
}

const langs = ['en', 'fr']
const sections = ['docs', 'guides']

// Pages to mirror: {lang}/docs.html (index), {lang}/docs/*.html, {lang}/guides/*.html
function listPages() {
  const pages = []
  for (const lang of langs) {
    pages.push({ lang, section: 'docs', slug: null, src: join(distDir, lang, 'docs.html') })
    for (const section of sections) {
      const dir = join(distDir, lang, section)
      if (!existsSync(dir)) continue
      for (const file of readDirHtml(dir)) {
        pages.push({
          lang,
          section,
          slug: file.replace(/\.html$/, ''),
          src: join(dir, file),
        })
      }
    }
  }
  return pages
}

function readDirHtml(dir) {
  return readdirSync(dir).filter((f) => f.endsWith('.html'))
}

// Destination path inside /aide for a page
function destPath(page) {
  if (page.slug === null) return join(aideDir, page.lang, 'docs.html')
  return join(aideDir, page.lang, page.section, `${page.slug}.html`)
}

// Local URL (root-relative, served under /aide/) for a page
function localUrl(page) {
  if (page.slug === null) return `/aide/${page.lang}/docs`
  return `/aide/${page.lang}/${page.section}/${page.slug}`
}

const MIRRORED_PATH_RE = /^\/(en|fr)\/(docs|guides)(\/[A-Za-z0-9_-]+)?\/?$/

function rewriteHtml(html, page, pages) {
  // Drop third-party tracking/chat widgets: not wanted in an internal
  // offline help mirror, and they'd call out to external domains.
  html = html.replace(/<script defer src="https:\/\/umami\.internal[^>]*><\/script>/, '')
  html = html.replace(
    /<script>\s*window\.\$crisp[\s\S]*?<\/script>/,
    ''
  )
  // The Crisp chat launcher link has no chat script to open now; point it
  // at the live site's support chat instead of a dead click handler.
  html = html.replace(
    /href="#" class="no-underline hover:underline" onclick="if\(window\.\$crisp\)\{\$crisp\.push\(\['do','chat:open'\]\)\}return false"/,
    'href="https://rolebase.io" target="_blank" rel="noopener noreferrer" class="no-underline hover:underline"'
  )

  // Local assets: /_astro/... and /favicon.svg -> /aide/_astro/... and /aide/favicon.svg
  html = html.replaceAll('/_astro/', '/aide/_astro/')
  html = html.replaceAll('href="/favicon.svg"', 'href="/aide/favicon.svg"')

  // Internal docs/guides links -> local mirror; everything else -> live site
  html = html.replace(/(href|src)="(\/[a-zA-Z0-9/_-]*)"/g, (m, attr, path) => {
    if (path.startsWith('/aide/')) return m // already rewritten above
    if (path === '/') return `${attr}="https://rolebase.io/"`
    const match = path.match(MIRRORED_PATH_RE)
    if (match) {
      const [, lang, section, slugPart] = match
      const slug = slugPart ? slugPart.slice(1) : null
      const exists = pages.some(
        (p) => p.lang === lang && p.section === section && p.slug === slug
      )
      if (exists) {
        return `${attr}="${slug ? `/aide/${lang}/${section}/${slug}` : `/aide/${lang}/${section}`}"`
      }
    }
    return `${attr}="https://rolebase.io${path}"`
  })

  // Lang switcher <option value="/en/docs/x.html"> also needs rewriting
  html = html.replace(/data-lang-select>([\s\S]*?)<\/select>/, (m, inner) => {
    const fixed = inner.replace(/value="\/(en|fr)\/(docs|guides)(\/[a-zA-Z0-9_-]+)?\.html"/g, (m2, lang, section, slugPart) => {
      const slug = slugPart ? slugPart.slice(1) : null
      return `value="${slug ? `/aide/${lang}/${section}/${slug}` : `/aide/${lang}/${section}`}"`
    })
    return `data-lang-select>${fixed}</select>`
  })

  return html
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
}

function extractSearchDoc(html, page) {
  const title = decodeEntities(
    (html.match(/<title>([^<]*)<\/title>/) || [])[1]?.replace(/ \| Rolebase$/, '') || page.slug
  )
  const description = decodeEntities((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '')
  const article = (html.match(/<article>([\s\S]*?)<\/article>/) || [])[1] || ''
  const text = decodeEntities(
    article
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
  return { title, description, url: localUrl(page), lang: page.lang, section: page.section, text }
}

const SEARCH_UI = `
<div id="aide-search" style="position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid #e5e7eb;padding:10px 16px">
  <input id="aide-search-input" type="search" placeholder="Rechercher / Search..." style="width:100%;max-width:480px;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px" aria-label="Rechercher dans l'aide">
  <div id="aide-search-results" style="position:absolute;background:#fff;border:1px solid #d1d5db;border-radius:6px;margin-top:4px;max-width:480px;width:calc(100% - 32px);max-height:60vh;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,.1);display:none"></div>
</div>
<script>
(function () {
  var input = document.getElementById('aide-search-input')
  var results = document.getElementById('aide-search-results')
  var index = null
  var currentLang = document.documentElement.lang || 'en'
  function load() {
    if (index) return Promise.resolve(index)
    return fetch('/aide/search-index.json').then(function (r) { return r.json() }).then(function (data) {
      index = data
      return index
    })
  }
  function render(matches) {
    if (!matches.length) { results.style.display = 'none'; results.innerHTML = ''; return }
    results.innerHTML = matches.slice(0, 15).map(function (m) {
      return '<a href="' + m.url + '" style="display:block;padding:8px 12px;text-decoration:none;color:inherit;border-bottom:1px solid #f3f4f6">' +
        '<div style="font-weight:600;font-size:14px">' + m.title + '</div>' +
        '<div style="font-size:12px;color:#6b7280">' + m.description + '</div></a>'
    }).join('')
    results.style.display = 'block'
  }
  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase()
    if (!q) { results.style.display = 'none'; return }
    load().then(function (data) {
      var matches = data
        .filter(function (d) {
          return d.lang === currentLang && (d.title.toLowerCase().includes(q) || d.text.toLowerCase().includes(q))
        })
        .sort(function (a, b) {
          var aTitle = a.title.toLowerCase().includes(q) ? 0 : 1
          var bTitle = b.title.toLowerCase().includes(q) ? 0 : 1
          return aTitle - bTitle
        })
      render(matches)
    })
  })
  document.addEventListener('click', function (e) {
    if (!document.getElementById('aide-search').contains(e.target)) results.style.display = 'none'
  })
})()
</script>
`

function main() {
  if (existsSync(aideDir)) rmSync(aideDir, { recursive: true, force: true })
  mkdirSync(aideDir, { recursive: true })

  const pages = listPages()
  const searchDocs = []

  for (const page of pages) {
    if (!existsSync(page.src)) continue
    let html = readFileSync(page.src, 'utf8')
    searchDocs.push(extractSearchDoc(html, page))
    html = rewriteHtml(html, page, pages)
    html = html.replace('<body class="min-h-dvh flex flex-col">', (m) => m + SEARCH_UI)
    const dest = destPath(page)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, html)
  }

  writeFileSync(join(aideDir, 'search-index.json'), JSON.stringify(searchDocs))

  // Referenced assets
  const assetRe = /\/_astro\/[A-Za-z0-9_.-]+\.(js|css|woff2?|eot|ttf|svg|png|jpe?g|webp|avif)/g
  const assets = new Set()
  for (const page of pages) {
    if (!existsSync(page.src)) continue
    const html = readFileSync(page.src, 'utf8')
    for (const m of html.matchAll(assetRe)) assets.add(m[0])
  }
  mkdirSync(join(aideDir, '_astro'), { recursive: true })
  for (const asset of assets) {
    const src = join(distDir, asset)
    if (existsSync(src)) cpSync(src, join(aideDir, asset))
  }
  cpSync(join(distDir, 'favicon.svg'), join(aideDir, 'favicon.svg'))

  console.log(`Generated ${pages.length} pages and ${assets.size} assets into aide/`)
}

main()
