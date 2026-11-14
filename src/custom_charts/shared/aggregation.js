// Helpers shared by the custom charts to read the value of an aggregated
// dimension.

// a cell left empty in the dataset
export const isEmpty = (v) => v === null || v === undefined || v === ''

// Some aggregations return text instead of a number: "CSV" joins the values,
// so a single value 94 comes back as "94". Text that is a plain number is
// read as that number, like the charts of the RAWGraphs library do.
// Anything else is returned unchanged, for the chart to report.
export function toNumberIfNumeric(value) {
  if (typeof value !== 'string') {
    return value
  }
  const text = value.trim()
  if (text === '') {
    return value
  }
  const number = Number(text)
  return Number.isFinite(number) ? number : value
}

// Aggregates the cells that have a value. Empty cells are left out, so that
// they do not count as 0 in a mean; null is returned when all are empty.
export function aggregatePresent(aggregator, values) {
  const present = values.filter((v) => !isEmpty(v))
  return present.length > 0 ? toNumberIfNumeric(aggregator(present)) : null
}

// The message shown when the value of an item is not a number.
// The usual cause is an aggregation that returns text, such as "CSV" on an
// item with more than one row ("128,94").
export function notANumberMessage(dimensionName, value, itemLabel) {
  const item = itemLabel === undefined ? '' : ` for ${itemLabel}`
  return `The "${dimensionName}" dimension needs one number for each item, but it got "${value}"${item}. Choose an aggregation that returns a number, such as Sum, in the mapping panel.`
}
