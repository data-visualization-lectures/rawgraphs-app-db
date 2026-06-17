import React from 'react'
import Section from '../Section'
import DataLoader from '../DataLoader'
import ChartSelector from '../ChartSelector'
import DataMapping from '../DataMapping'
import ChartPreviewWithOptions from '../ChartPreviewWIthOptions'
import Exporter from '../Exporter'

export default function RawgraphsWorkflowSections({
  t,
  loading,
  dataLoader,
  importProject,
  data,
  charts,
  chartWorkflow,
}) {
  const {
    currentChart,
    handleChartChange,
    mappingLoading,
    dataMappingRef,
    mapping,
    setMapping,
    visualOptions,
    setVisualOptions,
    setRawViz,
    setMappingLoading,
    rawViz,
  } = chartWorkflow

  return (
    <>
      <Section title={t('app.section1')} loading={loading}>
        <DataLoader {...dataLoader} hydrateFromProject={importProject} />
      </Section>
      {data && (
        <Section title={t('app.section2')}>
          <ChartSelector
            availableCharts={charts}
            currentChart={currentChart}
            setCurrentChart={handleChartChange}
          />
        </Section>
      )}
      {data && currentChart && (
        <Section title={t('app.section3')} loading={mappingLoading}>
          <DataMapping
            ref={dataMappingRef}
            dimensions={currentChart.dimensions}
            dataTypes={data.dataTypes}
            mapping={mapping}
            setMapping={setMapping}
          />
        </Section>
      )}
      {data && currentChart && (
        <Section title={t('app.section4')}>
          <ChartPreviewWithOptions
            chart={currentChart}
            dataset={data.dataset}
            dataTypes={data.dataTypes}
            mapping={mapping}
            visualOptions={visualOptions}
            setVisualOptions={setVisualOptions}
            setRawViz={setRawViz}
            setMappingLoading={setMappingLoading}
          />
        </Section>
      )}
      {data && currentChart && rawViz && (
        <Section title={t('app.section5')}>
          <Exporter rawViz={rawViz} />
        </Section>
      )}
    </>
  )
}
