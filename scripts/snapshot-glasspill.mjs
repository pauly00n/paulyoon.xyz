#!/usr/bin/env node
/**
 * Generates prebuilt glasspill backdrop snapshots for iPhone widths.
 *
 * Prereqs:
 *   1. Build the site: `npm run build`
 *   2. Start it: `npm start` (in another shell, on port 3000)
 *   3. Run this: `node scripts/snapshot-glasspill.mjs`
 *
 * Outputs:
 *   public/glasspill-snapshots/<width>.png  (one per width)
 *   public/glasspill-snapshots/manifest.json
 */

import puppeteer from 'puppeteer'
import fs from 'node:fs/promises'
import path from 'node:path'

// width → typical iphone full CSS viewport height (URL bar hidden, what 100vh resolves to)
const VIEWPORTS = [
  { width: 393, height: 852 }, // iphone 14 pro
  { width: 402, height: 874 }, // iphone 15 pro / 16 pro
  { width: 420, height: 910 }, // tweener
  { width: 430, height: 932 }, // iphone 15 pro max
  { width: 440, height: 956 }, // iphone 16 pro max
]
const BASE_URL = process.env.SNAPSHOT_URL || 'http://localhost:3000'
const OUT_DIR = path.resolve(process.cwd(), 'public/glasspill-snapshots')

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  console.log(`[snapshot] launching chromium...`)
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const manifest = { snapshots: [] }

  for (const { width, height } of VIEWPORTS) {
    console.log(`[snapshot] width=${width} height=${height}`)
    const page = await browser.newPage()
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    })
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    )

    await page.goto(`${BASE_URL}/?snapshot=1`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })

    // Wait for bootstrap to load capture module
    await page.waitForFunction(() => (window).__captureGlasspillReady === true, {
      timeout: 30000,
    })

    // Give layout a chance to settle
    await new Promise(res => setTimeout(res, 2000))

    const result = await page.evaluate(async () => {
      // @ts-expect-error -- snapshot bootstrap adds this browser-only hook
      const r = await window.__captureGlasspill()
      const hero = document.querySelector('.hero')
      // @ts-expect-error -- metadata is extended with the measured hero height
      r.meta.heroHeight = hero ? hero.offsetHeight : 0
      return r
    })

    const { pngDataUrl, meta } = result
    const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, '')
    const buf = Buffer.from(base64, 'base64')
    const file = `${width}.png`
    await fs.writeFile(path.join(OUT_DIR, file), buf)

    manifest.snapshots.push({
      docWidth: meta.docWidth,
      docHeight: meta.docHeight,
      width: meta.width,
      height: meta.height,
      padX: meta.padX,
      padY: meta.padY,
      scale: meta.scale,
      heroHeight: meta.heroHeight,
      file: `/glasspill-snapshots/${file}`,
    })

    console.log(
      `[snapshot]   wrote ${file} (${(buf.length / 1024).toFixed(1)}kb, doc=${meta.docWidth}x${meta.docHeight})`
    )
    await page.close()
  }

  await fs.writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
  console.log(`[snapshot] wrote manifest.json with ${manifest.snapshots.length} entries`)

  await browser.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
