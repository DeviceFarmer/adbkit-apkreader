import { expect } from 'chai'

import ApkReader from '../index.js'
import BinaryXmlParser from '../lib/apkreader/parser/binaryxml.js'
import ManifestParser from '../lib/apkreader/parser/manifest.js'

// A Res_value: size, a zero byte, the data type and the data.
const typedValue = (dataType: number, data: number) => {
  const buffer = Buffer.alloc(8)
  buffer.writeUInt16LE(8, 0)
  buffer.writeUInt8(dataType, 3)
  buffer.writeUInt32LE(data >>> 0, 4)
  return buffer
}

const element = (
  nodeName: string,
  childNodes: ApkReader.XmlNode[] = []
): ApkReader.XmlElement => ({
  namespaceURI: null,
  nodeType: 1,
  nodeName,
  attributes: [],
  childNodes
})

const parseManifest = (document: ApkReader.XmlElement) => {
  const parser = new ManifestParser(Buffer.alloc(0))
  parser.xmlParser.parse = () => document
  return parser.parse()
}

describe('BinaryXmlParser', () => {
  it('reads the unit of a dimension', () => {
    // 48dp: a mantissa of 48 with the default radix and COMPLEX_UNIT_DIP.
    const parser = new BinaryXmlParser(typedValue(0x05, (48 << 8) | 0x01))
    expect(parser.readTypedValue()).to.deep.equal({
      value: { value: 48, unit: 'dp', rawUnit: 1 },
      type: 'dimension',
      rawType: 0x05
    })
  })

  it('reads a string typed value from the first string of the pool', () => {
    const parser = new BinaryXmlParser(typedValue(0x03, 0))
    parser.strings = ['first']
    expect(parser.readTypedValue().value).to.equal('first')
  })

  it('reads an attribute whose raw value is the first string of the pool', () => {
    const refs = Buffer.alloc(12)
    refs.writeInt32LE(-1, 0) // no namespace
    refs.writeInt32LE(1, 4) // name
    refs.writeInt32LE(0, 8) // raw value
    const parser = new BinaryXmlParser(
      Buffer.concat([refs, typedValue(0x03, 0)])
    )
    parser.strings = ['first', 'label']
    const attr = parser.readXmlAttribute()
    expect(attr.namespaceURI).to.be.null
    expect(attr.name).to.equal('label')
    expect(attr.value).to.equal('first')
    expect(attr.typedValue.value).to.equal('first')
  })
})

describe('ManifestParser', () => {
  it('skips CDATA inside <compatible-screens>', () => {
    const cdata: ApkReader.XmlCData = {
      namespaceURI: null,
      nodeType: 4,
      nodeName: '#cdata',
      data: '\n',
      typedValue: { value: '\n', type: 'string', rawType: 0x03 }
    }
    const manifest = parseManifest(
      element('manifest', [
        element('compatible-screens', [cdata, element('screen'), cdata])
      ])
    )
    expect(manifest.compatibleScreens).to.have.length(1)
  })

  it('leaves the application empty without an <application> element', () => {
    const manifest = parseManifest(element('manifest'))
    expect(Object.keys(manifest.application)).to.be.empty
    // @ts-expect-error The lists are missing without an <application>.
    expect(() => manifest.application.launcherActivities.length).to.throw(
      TypeError
    )
  })
})
