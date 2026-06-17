import React from 'react'
import { render } from '@testing-library/react'
import App from './App'

jest.mock('./charts', () => {
  const charts = [
    {
      metadata: {
        id: 'rawgraphs.test',
        name: 'Test chart',
        displayName: 'Test chart',
        categories: ['test'],
        category: 'test',
        description: 'Test chart',
        icon: '',
        thumbnail: '',
      },
      dimensions: [],
      visualOptions: {},
    },
  ]

  return {
    __esModule: true,
    default: charts,
    localizeCharts: (chartsArray) => chartsArray,
  }
})

test('renders learn react link', () => {
  const { container } = render(<App />)
  expect(container.querySelector('.App')).toBeInTheDocument()
})
