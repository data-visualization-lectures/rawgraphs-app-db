import charts, { localizeCharts } from './charts'

// The chart libraries ship d3 7 as ES modules, which Jest cannot load here.
// They are replaced by stubs carrying the metadata of the real charts: note
// that the library's Gantt chart has no id.
jest.mock('@rawgraphs/rawgraphs-charts', () => {
  const stub = (name, id) => ({
    metadata: id ? { name, id } : { name },
    dimensions: [],
  })
  return {
    alluvialdiagram: stub('Alluvial Diagram', 'rawgraphs.alluvialdiagram'),
    arcdiagram: stub('Arc Diagram', 'rawgraphs.arcdiagram'),
    barchart: stub('Bar chart', 'rawgraphs.barchart'),
    barchartmultiset: stub('Multi-set bar chart', 'rawgraphs.barchartmultiset'),
    barchartstacked: stub('Stacked bar chart', 'rawgraphs.barchartstacked'),
    beeswarm: stub('Beeswarm plot', 'rawgraphs.beeswarm'),
    boxplot: stub('Box plot', 'rawgraphs.boxplot'),
    bubblechart: stub('Bubble chart', 'rawgraphs.bubblechart'),
    bumpchart: stub('Bumpchart', 'rawgraphs.bumpchart'),
    circlepacking: stub('Circle Packing', 'rawgraphs.circlepacking'),
    circularDendrogram: stub('Circular dendrogram', 'rawgraphs.circulardendrogram'),
    contourPlot: stub('Contour plot', 'rawgraphs.contourplot'),
    convexHull: stub('Convex hull', 'rawgraphs.convexhull'),
    dendrogram: stub('Linear dendrogram', 'rawgraphs.lineardendrogram'),
    ganttChart: stub('Gantt chart'),
    hexagonalBinning: stub('Hexagonal binning', 'rawgraphs.hexagonalbinning'),
    horizongraph: stub('Horizon graph', 'rawgraphs.horizongraph'),
    linechart: stub('Line chart', 'rawgraphs.linechart'),
    matrixplot: stub('Matrix Plot', 'rawgraphs.matrixplot'),
    parallelcoordinates: stub('Parallel coordinates', 'rawgraphs.parallelcoordinates'),
    radarchart: stub('Radar Chart', 'rawgraphs.radarchart'),
    sankeydiagram: stub('Sankey Diagram', 'rawgraphs.sankeydiagram'),
    slopechart: stub('Slope chart', 'rawgraphs.slopechart'),
    streamgraph: stub('Streamgraph (area chart)', 'rawgraphs.streamgraph'),
    sunburst: stub('Sunburst diagram', 'rawgraphs.sunburst'),
    treemap: stub('Treemap', 'rawgraphs.treemap'),
    violinplot: stub('Violin plot', 'rawgraphs.violinplot'),
    voronoidiagram: stub('Voronoi Diagram', 'rawgraphs.voronoidiagram'),
    chorddiagram: stub('Chord Diagram', 'rawgraphs.chorddiagram'),
    piechart: stub('Pie chart', 'rawgraphs.piechart'),
    voronoitreemap: stub('Treemap (Voronoi)', 'rawgraphs.voronoitreemap'),
  }
})
jest.mock('@rawgraphs/rawgraphs-calendar-heatmap', () => ({
  calendarHeatmap: {
    metadata: { name: 'Calendar heatmap', id: 'rawgraphs.calendarheatmap' },
    dimensions: [],
  },
}))


describe('chart registry', () => {
  test('every chart has an id', () => {
    const missing = charts.filter((chart) => !chart.metadata.id)
    expect(missing.map((chart) => chart.metadata.name)).toEqual([])
  })

  test('ids and names are unique', () => {
    const ids = charts.map((chart) => chart.metadata.id)
    const names = charts.map((chart) => chart.metadata.name)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
  })

  test('the Gantt chart is localized in Japanese', () => {
    const gantt = localizeCharts(charts, 'ja').find(
      (chart) => chart.metadata.name === 'Gantt chart'
    )
    expect(gantt.metadata.id).toBe('rawgraphs.ganttChart')
    expect(gantt.metadata.displayName).toBe('ガント・チャート')
    expect(gantt.metadata.description).toMatch(/スケジュール/)
  })

  test('every chart has a Japanese name', () => {
    const untranslated = localizeCharts(charts, 'ja').filter(
      (chart) => !chart.metadata.displayName
    )
    expect(untranslated.map((chart) => chart.metadata.name)).toEqual([])
  })
})
