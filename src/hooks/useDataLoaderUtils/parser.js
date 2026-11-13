import { dsvFormat } from 'd3'
import { DefaultSeparator, separatorsList } from '../../constants'

function JsonParser(dataString) {
  //Removing white lines (useful when pasting from sheets, ecc)
  const trimmedDataString = dataString
    .trim()
    .replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, '')

  return [JSON.parse(trimmedDataString), {}]
}

// Prepares a delimited text for parsing.
// White lines are removed (useful when pasting from sheets, ecc).
// Tabs at the beginning of a line are kept: in tab separated data they are
// empty cells, and removing them shifts the row one column to the left.
export function cleanDsvString(dataString) {
  let lines = dataString
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/^[^\S\t]+/, '').replace(/\s+$/, ''))
    .filter((line) => line !== '')

  // a tab shared by every line is indentation, not an empty first column
  while (lines.length > 0 && lines.every((line) => line.startsWith('\t'))) {
    lines = lines.map((line) => line.slice(1))
  }

  return lines.join('\n')
}

// A column with an empty header gets a name, like the columns of JSON arrays
function nameEmptyColumns(rows) {
  if (!rows.columns || !rows.columns.includes('')) {
    return rows
  }
  const emptyIndex = rows.columns.indexOf('')
  let name = `Column ${emptyIndex + 1}`
  while (rows.columns.includes(name)) {
    name = `${name}_`
  }
  const named = rows.map((row) => {
    const out = {}
    for (const key of rows.columns) {
      out[key === '' ? name : key] = row[key]
    }
    return out
  })
  named.columns = rows.columns.map((key) => (key === '' ? name : key))
  return named
}

function parseDsv(separator, dataString) {
  return nameEmptyColumns(dsvFormat(separator).parse(dataString))
}

function CsvParser(dataString, opts) {
  const trimmedDataString = cleanDsvString(dataString)

  // Use the separator the user gives me, if any
  if (opts.separator) {
    return [
      parseDsv(opts.separator, trimmedDataString),
      {
        separator: opts.separator,
      },
    ]
  }
  // Otherwise, try to infer it
  const candidates = []
  for (const _separator of separatorsList) {
    const separator = _separator
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
    try {
      const parsed = parseDsv(separator, trimmedDataString)
      if (
        (parsed.length > 0 && Object.keys(parsed[0]).length > 1) ||
        separator === DefaultSeparator
      ) {
        candidates.push({
          separator,
          score: Object.keys(parsed[0]).length,
          parsed,
        })
      }
    } catch (e) {}
  }
  candidates.sort((a, b) => b.score - a.score)
  return [candidates[0].parsed, { separator: candidates[0].separator }]
}

export const SparqlMarker = Symbol('RawgraphsSparqlMarker')

function SparqlParser(data, opts) {
  if (data[SparqlMarker] === true) {
    return [data, {}]
  }
  throw new Error('Not a sparql result')
}

const PARSERS = [
  { dataType: 'sparql', parse: SparqlParser },
  { dataType: 'json', parse: JsonParser },
  { dataType: 'csv', parse: CsvParser },
]

export function parseData(data, opts) {
  for (const parser of PARSERS) {
    try {
      const [parsed, extra] = parser.parse(data, opts)
      return [parser.dataType, parsed, extra]
    } catch (e) {
      // console.error('Parsing error', e)
    }
  }
  return [null, null]
}

export function parseAndCheckData(dataString, opts) {
  const [dataType, data, extra] = parseData(dataString, opts)
  if (dataType === null) {
    // This should never happen
    return [
      dataType,
      data,
      'Cannot parse dataset! (This should never happen)',
      {},
    ]
  } else {
    if (dataType === 'json') {
      return ['json', data, null, extra]
    } else if (data.length > 0) {
      return [dataType, data, null, extra]
    } else {
      return [null, null, "We can't parse your data.", {}]
    }
  }
}

function isScalarType(item) {
  return ['string', 'number', 'boolean'].includes(typeof item)
}

export function normalizeJsonArray(jsonArray) {
  return jsonArray
    .map((element) => {
      let iterateElement = element
      if (Array.isArray(iterateElement)) {
        const tmp = {}
        iterateElement.forEach((item, i) => {
          tmp[`Column ${i + 1}`] = item
        })
        iterateElement = tmp
      }
      if (isScalarType(iterateElement) || iterateElement === null) {
        iterateElement = { value: iterateElement }
      }
      const outElement = {}
      for (const property in iterateElement) {
        const value = iterateElement[property]
        const valueType = typeof value
        if (Array.isArray(value)) {
          outElement[property] = value.filter(isScalarType).join(' ')
        } else if (value !== null && valueType === 'object') {
          for (const nestedProperty in value) {
            const nestedValue = value[nestedProperty]
            if (isScalarType(nestedValue)) {
              outElement[`${property}.${nestedProperty}`] = nestedValue
            }
          }
        } else if (isScalarType(value)) {
          outElement[property] = value
        }
      }
      return outElement
    })
    .filter((item) => item !== null)
}
