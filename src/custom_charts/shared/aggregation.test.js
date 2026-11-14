import {
  isEmpty,
  toNumberIfNumeric,
  aggregatePresent,
  notANumberMessage,
} from './aggregation'

const sum = (values) => values.reduce((a, b) => a + b, 0)
const csv = (values) => values.join(',')

describe('toNumberIfNumeric', () => {
  test('reads text that is a plain number as that number', () => {
    expect(toNumberIfNumeric('94')).toBe(94)
    expect(toNumberIfNumeric(' -3.5 ')).toBe(-3.5)
    expect(toNumberIfNumeric('1e3')).toBe(1000)
  })

  test('leaves other values unchanged', () => {
    expect(toNumberIfNumeric('128,94')).toBe('128,94')
    expect(toNumberIfNumeric('abc')).toBe('abc')
    expect(toNumberIfNumeric('')).toBe('')
    expect(toNumberIfNumeric('  ')).toBe('  ')
    expect(toNumberIfNumeric(94)).toBe(94)
    expect(toNumberIfNumeric(null)).toBe(null)
    expect(toNumberIfNumeric(undefined)).toBe(undefined)
  })
})

describe('aggregatePresent', () => {
  test('aggregates the cells that have a value', () => {
    expect(aggregatePresent(sum, [1, null, 2, '', undefined])).toBe(3)
  })

  test('returns null when all the cells are empty', () => {
    expect(aggregatePresent(sum, [null, '', undefined])).toBe(null)
    expect(aggregatePresent(sum, [])).toBe(null)
  })

  test('reads a single value joined by a text aggregation as a number', () => {
    expect(aggregatePresent(csv, [94])).toBe(94)
  })

  test('keeps the text when several values are joined', () => {
    expect(aggregatePresent(csv, [128, 94])).toBe('128,94')
  })
})

test('isEmpty', () => {
  expect([null, undefined, ''].map(isEmpty)).toEqual([true, true, true])
  expect([0, '0', false, 'a'].map(isEmpty)).toEqual([false, false, false, false])
})

test('notANumberMessage names the value, the item and what to do', () => {
  const message = notANumberMessage('Value', '128,94', 'Scratch')
  expect(message).toMatch(/"Value" dimension/)
  expect(message).toMatch(/"128,94" for Scratch/)
  expect(message).toMatch(/aggregation/)
  expect(notANumberMessage('Size', 'x')).toMatch(/got "x"\. Choose/)
})
