import { Readable } from 'stream'
import Zip from 'yauzl'

import ManifestParser from './apkreader/parser/manifest'
import BinaryXmlParser from './apkreader/parser/binaryxml'
import type * as Types from './apkreader/types'

class ApkReader {
  static MANIFEST = 'AndroidManifest.xml'

  apk: string | Buffer

  static open(apk: string | Buffer): Promise<ApkReader> {
    return Promise.resolve(new ApkReader(apk))
  }

  constructor(apk: string | Buffer) {
    this.apk = apk
  }

  private _open(): Promise<Zip.ZipFile> {
    return new Promise((resolve, reject) => {
      const callback = (err: Error | null, zipfile: Zip.ZipFile) => {
        if (err) {
          reject(err)
        } else {
          resolve(zipfile)
        }
      }
      if (this.apk instanceof Buffer) {
        return Zip.fromBuffer(this.apk, { lazyEntries: true }, callback)
      }
      // instanceof leaves Buffer<ArrayBufferLike> in the union, so TypeScript
      // cannot narrow this to a string by itself.
      return Zip.open(this.apk as string, { lazyEntries: true }, callback)
    })
  }

  usingFile<T>(
    file: string,
    action: (content: Buffer) => T | PromiseLike<T>
  ): Promise<T> {
    return this.usingFileStream(file, function (stream) {
      let errorListener: (err: Error) => void
      let readableListener: () => void
      let endListener: () => void

      const read = () =>
        new Promise<Buffer>(function (resolve, reject) {
          const chunks: Buffer[] = []

          let totalLength = 0

          const tryRead = function () {
            let chunk: Buffer | null
            while ((chunk = stream.read())) {
              chunks.push(chunk)
              totalLength += chunk.length
            }
          }

          readableListener = () => tryRead()
          errorListener = err => {
            stream.destroy()
            reject(err)
          }
          endListener = () => resolve(Buffer.concat(chunks, totalLength))

          stream.on('readable', readableListener)
          stream.on('error', errorListener)
          stream.on('end', endListener)

          tryRead()
        })

      return read()
        .then(action)
        .finally(function () {
          stream.removeListener('readable', readableListener)
          stream.removeListener('error', errorListener)
          stream.removeListener('end', endListener)
        })
    })
  }

  usingFileStream<T>(
    file: string,
    action: (stream: Readable) => T | PromiseLike<T>
  ): Promise<T> {
    return this._open().then(function (zipfile) {
      let entryListener: (entry: Zip.Entry) => void
      let errorListener: (err: Error) => void
      let endListener: () => void

      const find = () =>
        new Promise<Readable>(function (resolve, reject) {
          entryListener = entry => {
            if (entry.fileName === file) {
              return resolve(
                new Promise<Readable>((resolve, reject) => {
                  zipfile.openReadStream(entry, (err, stream) => {
                    if (err) {
                      reject(err)
                    } else {
                      resolve(stream)
                    }
                  })
                })
              )
            }

            zipfile.readEntry()
          }

          endListener = () => {
            reject(new Error(`APK does not contain '${file}'`))
          }

          errorListener = err => reject(err)

          zipfile.on('entry', entryListener)
          zipfile.on('end', endListener)
          zipfile.on('error', errorListener)

          zipfile.readEntry()
        })

      return find()
        .then(action)
        .finally(function () {
          zipfile.removeListener('entry', entryListener)
          zipfile.removeListener('error', errorListener)
          zipfile.removeListener('end', endListener)
          zipfile.close()
        })
    })
  }

  readContent(path: string): Promise<Buffer> {
    return this.usingFile(path, content => content)
  }

  readManifest(options: Types.ParserOptions = {}): Promise<Types.Manifest> {
    return this.usingFile(ApkReader.MANIFEST, content => {
      return new ManifestParser(content, options).parse()
    })
  }

  /** Resolves with the root element, or null if the document has none. */
  readXml(
    path: string,
    options: Types.ParserOptions = {}
  ): Promise<Types.XmlElement | null> {
    return this.usingFile(path, content => {
      return new BinaryXmlParser(content, options).parse()
    })
  }
}

// Merges the result types into the export, e.g. `ApkReader.Manifest`.
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace ApkReader {
  export type ParserOptions = Types.ParserOptions
  export type Manifest = Types.Manifest
  export type Application = Types.Application
  export type EmptyApplication = Types.EmptyApplication
  export type Component = Types.Component
  export type Provider = Types.Provider
  export type IntentFilter = Types.IntentFilter
  export type Attributes = Types.Attributes
  export type XmlElement = Types.XmlElement
  export type XmlAttribute = Types.XmlAttribute
  export type XmlCData = Types.XmlCData
  export type XmlNode = Types.XmlNode
  export type NodeType = Types.NodeType
  export type TypedValue = Types.TypedValue
  export type TypedValueValue = Types.TypedValueValue
  export type Dimension = Types.Dimension
  export type Fraction = Types.Fraction
}

export = ApkReader
