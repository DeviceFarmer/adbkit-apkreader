var test = require('node:test')
var assert = require('node:assert')
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
