import React from 'react'

function joinReactNodes(nodes, separator) {
  return nodes.reduce((prev, curr) => [prev, separator, curr])
}

function getCurrentlyMappedDimensions(mapping) {
  const currentlyMapped = []
  for (let variable in mapping) {
    if (mapping[variable].ids && mapping[variable].ids.length > 0) {
      currentlyMapped.push(variable)
    }
  }
  return currentlyMapped
}

function getRequiredVariablesError(chart, mapping, t) {
  const currentlyMapped = getCurrentlyMappedDimensions(mapping)
  const requiredVariables = chart.dimensions.filter(
    (d) => d.required && currentlyMapped.indexOf(d.id) === -1
  )

  if (requiredVariables.length === 0) return null

  const message = (
    <span>
      {t('chartPreview.requiredVars')}{' '}
      {joinReactNodes(
        requiredVariables.map((d, i) => (
          <span key={i} className="font-weight-bold">
            {d.name}
          </span>
        )),
        ' and '
      )}
      {t('chartPreview.pleaseMap')}
    </span>
  )

  return { variant: 'secondary', message }
}

function getRequiredMultivalueVariablesError(chart, mapping, t) {
  const multivaluesVariables = chart.dimensions.filter(
    (d) =>
      d.multiple &&
      d.required &&
      d.minValues &&
      (mapping[d.id]?.ids?.length ?? 0) < d.minValues
  )

  if (multivaluesVariables.length === 0) return null

  const message = (
    <span>
      <span className="font-weight-bold">
        {joinReactNodes(
          multivaluesVariables.map((d) => (
            <React.Fragment key={d.id}>
              <span className="font-weight-bold">{d.name}</span>
              {t('chartPreview.minValues')}
              <span className="font-weight-bold">{d.minValues}</span>
              {t('chartPreview.minValuesUnit')}
            </React.Fragment>
          )),
          ' & '
        )}
      </span>
      {t('chartPreview.pleaseMapMulti')}
    </span>
  )

  return { variant: 'secondary', message }
}

function getTypeMismatchError(chart, mapping, t) {
  for (let variable in mapping) {
    if (
      mapping[variable].ids &&
      mapping[variable].ids.length > 0 &&
      !mapping[variable].isValid
    ) {
      const variableObj = chart.dimensions.find((d) => d.id === variable)
      return {
        variant: 'danger',
        message: t('chartPreview.typeMismatch', {
          name: variableObj?.name || variable,
          type: mapping[variable].mappedType,
        }),
      }
    }
  }

  return null
}

export function getChartPreviewValidationError({ chart, mapping, t }) {
  return (
    getRequiredVariablesError(chart, mapping, t) ||
    getRequiredMultivalueVariablesError(chart, mapping, t) ||
    getTypeMismatchError(chart, mapping, t)
  )
}
