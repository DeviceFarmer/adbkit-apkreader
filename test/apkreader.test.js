var test = require('node:test')
var assert = require('node:assert')
var fs = require('fs')
var path = require('path')

var ApkReader = require('..')

var fixture = path.join(__dirname, 'fixt', 'app-debug-unaligned.apk')

test('reads the manifest of the fixture APK', function() {
  return ApkReader.open(fixture)
    .then(function(reader) {
      return reader.readManifest()
    })
    .then(function(manifest) {
      assert.strictEqual(manifest.package, 'com.example.hello.helloapp.app')
      assert.strictEqual(manifest.versionCode, 1)
      assert.strictEqual(manifest.versionName, '1.0')
      assert.ok(manifest.application, 'manifest has an application element')
    })
})

test('rejects reading the manifest of a file that is not an APK', function() {
  return assert.rejects(ApkReader.open(__filename).then(function(reader) {
    return reader.readManifest()
  }))
})

// The snapshots were taken from the 3.2.4 JavaScript implementation, so the
// parsed output can be checked to stay identical across refactors.
var manifestSnapshot = path.join(__dirname, 'fixt', 'app-debug-unaligned.manifest.json')
var xmlSnapshot = path.join(__dirname, 'fixt', 'app-debug-unaligned.xml.json')

test('parses the full manifest of the fixture APK exactly as before', function() {
  var expected = fs.readFileSync(manifestSnapshot, 'utf8')
  return ApkReader.open(fixture)
    .then(function(reader) {
      return reader.readManifest()
    })
    .then(function(manifest) {
      assert.deepEqual(manifest, JSON.parse(expected))
      // Also covers the key order, which deepEqual ignores.
      assert.strictEqual(JSON.stringify(manifest, null, 2) + '\n', expected)
      // Collapsed attributes are objects without a prototype.
      var activity = manifest.application.activities[0]
      ;[
        manifest,
        manifest.usesSdk,
        manifest.application,
        activity,
        activity.intentFilters[0],
        activity.intentFilters[0].actions[0]
      ].forEach(function(object) {
        assert.strictEqual(Object.getPrototypeOf(object), null)
      })
    })
})

test('parses the binary XML of the fixture manifest exactly as before', function() {
  var expected = fs.readFileSync(xmlSnapshot, 'utf8')
  return ApkReader.open(fixture)
    .then(function(reader) {
      return reader.readXml(ApkReader.MANIFEST)
    })
    .then(function(document) {
      assert.deepStrictEqual(document, JSON.parse(expected))
      assert.strictEqual(JSON.stringify(document, null, 2) + '\n', expected)
    })
})
