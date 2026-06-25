import ReactDOMServer from 'react-dom/server'
import { getChartPreviewValidationError } from './ChartPreviewValidation'

const t = (key, params) =>
  params ? `${key}:${params.name}:${params.type}` : key

function renderMessage(message) {
  return typeof message === 'string'
    ? message
    : ReactDOMServer.renderToStaticMarkup(message)
}

describe('getChartPreviewValidationError', () => {
  it('returns null when required dimensions are mapped and valid', () => {
    const chart = {
      dimensions: [{ id: 'x', name: 'X', required: true }],
    }
    const mapping = {
      x: { ids: ['country'], isValid: true },
    }

    expect(getChartPreviewValidationError({ chart, mapping, t })).toBeNull()
  })

  it('returns a secondary error for unmapped required dimensions', () => {
    const chart = {
      dimensions: [{ id: 'x', name: 'X', required: true }],
    }
    const mapping = {}

    const error = getChartPreviewValidationError({ chart, mapping, t })

    expect(error.variant).toBe('secondary')
    expect(renderMessage(error.message)).toContain('chartPreview.requiredVars')
    expect(renderMessage(error.message)).toContain('X')
    expect(renderMessage(error.message)).toContain('chartPreview.pleaseMap')
  })

  it('returns a secondary error for required multi-value dimensions below the minimum', () => {
    const chart = {
      dimensions: [
        {
          id: 'series',
          name: 'Series',
          required: true,
          multiple: true,
          minValues: 2,
        },
      ],
    }
    const mapping = {
      series: { ids: ['value'], isValid: true },
    }

    const error = getChartPreviewValidationError({ chart, mapping, t })
    const message = renderMessage(error.message)

    expect(error.variant).toBe('secondary')
    expect(message).toContain('Series')
    expect(message).toContain('2')
    expect(message).toContain('chartPreview.pleaseMapMulti')
  })

  it('returns a danger error for mapped dimensions with invalid types', () => {
    const chart = {
      dimensions: [{ id: 'color', name: 'Color', required: false }],
    }
    const mapping = {
      color: { ids: ['date'], isValid: false, mappedType: 'date' },
    }

    expect(getChartPreviewValidationError({ chart, mapping, t })).toEqual({
      variant: 'danger',
      message: 'chartPreview.typeMismatch:Color:date',
    })
  })
})
