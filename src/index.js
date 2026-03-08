import React from 'react'
import ReactDOM from 'react-dom'
import { overrideBaseOptions } from '@rawgraphs/rawgraphs-core'
import './i18n'
import './styles/index.scss'
import App from './App'
import * as serviceWorker from './serviceWorker'

overrideBaseOptions({
  width: {
    type: 'number',
    label: 'Width (px)',
    default: 800,
    container: 'width',
    group: 'artboard',
  },
})

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
