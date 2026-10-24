import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'chai'

import ApkReader from '../index.js'

const fixture = join(import.meta.dirname, 'fixt', 'app-debug-unaligned.apk')

// The snapshots were taken from the 3.2.4 JavaScript implementation, so the
// parsed output can be checked to stay identical across refactors.
const manifestSnapshot = join(
  import.meta.dirname,
  'fixt',
  'app-debug-unaligned.manifest.json'
)
const xmlSnapshot = join(
  import.meta.dirname,
  'fixt',
  'app-debug-unaligned.xml.json'
)

describe('ApkReader', () => {
  it('reads the manifest of the fixture APK', async () => {
    const reader = await ApkReader.open(fixture)
    const manifest = await reader.readManifest()
    expect(manifest.package).to.equal('com.example.hello.helloapp.app')
    expect(manifest.versionCode).to.equal(1)
    expect(manifest.versionName).to.equal('1.0')
    expect(manifest.application, 'manifest has an application element').to.be.ok
  })

  it('rejects reading the manifest of a file that is not an APK', async () => {
    const reader = await ApkReader.open(fileURLToPath(import.meta.url))
    let error: unknown
    try {
      await reader.readManifest()
    } catch (err) {
      error = err
    }
    expect(error).to.be.an.instanceof(Error)
  })

  it('parses the full manifest of the fixture APK exactly as before', async () => {
    const expected = readFileSync(manifestSnapshot, 'utf8')
    const reader = await ApkReader.open(fixture)
    const manifest = await reader.readManifest()
    expect(manifest).to.deep.equal(JSON.parse(expected))
    // Also covers the key order, which deep equality ignores.
    expect(JSON.stringify(manifest, null, 2) + '\n').to.equal(expected)
    // Collapsed attributes are objects without a prototype.
    const activity = manifest.application.activities[0]
    for (const object of [
      manifest,
      manifest.usesSdk,
      manifest.application,
      activity,
      activity.intentFilters[0],
      activity.intentFilters[0].actions[0]
    ]) {
      expect(Object.getPrototypeOf(object)).to.equal(null)
    }
  })

  it('parses the binary XML of the fixture manifest exactly as before', async () => {
    const expected = readFileSync(xmlSnapshot, 'utf8')
    const reader = await ApkReader.open(fixture)
    const document = await reader.readXml(ApkReader.MANIFEST)
    expect(document).to.deep.equal(JSON.parse(expected))
    expect(JSON.stringify(document, null, 2) + '\n').to.equal(expected)
  })

  it('reads an APK given as a Buffer', async () => {
    const reader = await ApkReader.open(readFileSync(fixture))
    const manifest = await reader.readManifest()
    expect(manifest.package).to.equal('com.example.hello.helloapp.app')
  })

  it('reads the raw content of a file', async () => {
    const reader = await ApkReader.open(fixture)
    const content = await reader.readContent('META-INF/MANIFEST.MF')
    expect(Buffer.isBuffer(content)).to.be.true
    expect(content.toString('utf8')).to.match(/^Manifest-Version: 1\.0\r?\n/)
  })

  it('resolves usingFileStream() with what the action resolves with', async () => {
    const reader = await ApkReader.open(fixture)
    const length = await reader.usingFileStream(
      'META-INF/MANIFEST.MF',
      stream =>
        new Promise<number>((resolve, reject) => {
          let total = 0
          stream.on('data', (chunk: Buffer) => (total += chunk.length))
          stream.on('end', () => resolve(total))
          stream.on('error', reject)
        })
    )
    expect(length).to.equal(28211)
  })

  it('rejects with a native Error for a missing entry', async () => {
    const reader = await ApkReader.open(fixture)
    const result = reader.readContent('does/not/exist')
    expect(result).to.be.an.instanceof(Promise)
    let error: unknown
    try {
      await result
    } catch (err) {
      error = err
    }
    expect(error).to.be.an.instanceof(Error)
    expect((error as Error).message).to.equal(
      "APK does not contain 'does/not/exist'"
    )
  })

  it('rejects with the original error for a missing APK', async () => {
    const reader = await ApkReader.open(join(import.meta.dirname, 'nope.apk'))
    let error: unknown
    try {
      await reader.readManifest()
    } catch (err) {
      error = err
    }
    expect(error).to.be.an.instanceof(Error)
    expect(Object.getPrototypeOf(error)).to.equal(Error.prototype)
    expect((error as NodeJS.ErrnoException).code).to.equal('ENOENT')
  })
})
