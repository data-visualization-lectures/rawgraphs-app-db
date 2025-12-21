import React, { useCallback, useState } from 'react'
import { InputGroup, DropdownButton, Dropdown } from 'react-bootstrap'
import CloudSaveModal from './CloudSaveModal'
import { BsCloudUpload } from 'react-icons/bs'

function downloadBlob(url, filename) {
  // Create a new anchor element
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'download'
  a.click()
  return a
}

export default function Exporter({ rawViz, exportProject }) {
  const downloadSvg = useCallback(
    (filename) => {
      var svgString = new XMLSerializer().serializeToString(
        rawViz._node.firstChild
      )
      var DOMURL = window.URL || window.webkitURL || window
      var svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      var url = DOMURL.createObjectURL(svg)
      downloadBlob(url, filename)
      DOMURL.revokeObjectURL(svg)
    },
    [rawViz]
  )

  const downloadImage = useCallback(
    (format, filename) => {
      var svgString = new XMLSerializer().serializeToString(
        rawViz._node.firstChild
      )
      var DOMURL = window.URL || window.webkitURL || window
      var svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      var url = DOMURL.createObjectURL(svg)
      var canvas = document.createElement('canvas')
      canvas.height = rawViz._node.firstChild.clientHeight
      canvas.width = rawViz._node.firstChild.clientWidth
      var ctx = canvas.getContext('2d')
      var img = new Image()
      img.onload = function () {
        ctx.drawImage(img, 0, 0)
        var dataUrl = canvas.toDataURL(format)
        downloadBlob(dataUrl, filename)
        DOMURL.revokeObjectURL(svg)
      }
      img.src = url
    },
    [rawViz]
  )

  const downloadProject = useCallback(
    filename => {
      const project = exportProject()
      const str = JSON.stringify(project)
      const blob = new Blob([str], { type: 'application/json' })
      const DOMURL = window.URL || window.webkitURL || window
      const url = DOMURL.createObjectURL(blob)
      downloadBlob(url, filename)
      DOMURL.revokeObjectURL(url)
    },
    [exportProject]
  )

  const exportFormats = ['svg', 'png', 'jpg', 'rawgraphs'];

  const [currentFormat, setCurrentFormat] = useState('svg')
  const [currentFile, setCurrentFile] = useState('viz')

  /* Cloud Save Logic */
  const [showCloudModal, setShowCloudModal] = useState(false)

  // Function to generate a thumbnail Blob (PNG) from the current visualization
  const getThumbnailBlob = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const svgString = new XMLSerializer().serializeToString(rawViz._node.firstChild)
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const URL = window.URL || window.webkitURL || window
        const url = URL.createObjectURL(svgBlob)

        const canvas = document.createElement('canvas')
        // Use the native dimensions of the SVG
        canvas.width = rawViz._node.firstChild.clientWidth
        canvas.height = rawViz._node.firstChild.clientHeight
        const ctx = canvas.getContext('2d')

        const img = new Image()
        img.onload = function () {
          ctx.drawImage(img, 0, 0)
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url)
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Canvas toBlob failed'))
            }
          }, 'image/png')
        }
        img.onerror = (e) => {
          URL.revokeObjectURL(url)
          reject(e)
        }
        img.src = url
      } catch (err) {
        reject(err)
      }
    })
  }, [rawViz])


  const downloadViz = useCallback(() => {
    switch (currentFormat) {
      case 'svg':
        downloadSvg(`${currentFile}.svg`)
        break
      case 'png':
        downloadImage('image/png', `${currentFile}.png`)
        break
      case 'jpg':
        downloadImage('image/jpeg', `${currentFile}.jpg`)
        break
      case 'rawgraphs':
        downloadProject(`${currentFile}.rawgraphs`)
        break
      default:
        break
    }
  }, [currentFile, currentFormat, downloadImage, downloadProject, downloadSvg])

  return (
    <div className="row">
      <div className="col col-sm-3">
        <InputGroup className="mb-3 raw-input-group">
          <input
            type="text"
            className="form-control text-field"
            value={currentFile}
            onChange={(e) => setCurrentFile(e.target.value)}
          ></input>
          <DropdownButton
            as={InputGroup.Append}
            title={`.${currentFormat}`}
            id="input-group-dropdown-1"
            className="raw-dropdown"
          >
            {exportFormats.map(
              (d) => {
                return (
                  <Dropdown.Item key={d} onClick={() => setCurrentFormat(d)}>
                    .{d}
                  </Dropdown.Item>
                )
              }
            )}
          </DropdownButton>
        </InputGroup>
      </div>

      <div className="col col-sm-2">
        <button className="btn btn-primary btn-block raw-btn" onClick={downloadViz}>
          ダウンロード
        </button>
      </div>
      <div className="col col-sm-2">
        <button
          className="btn btn-outline-primary btn-block raw-btn d-flex align-items-center justify-content-center"
          onClick={() => setShowCloudModal(true)}
          title="サーバに保存"
        >
          <BsCloudUpload className="mr-2" /> サーバに保存
        </button>
      </div>

      <CloudSaveModal
        show={showCloudModal}
        onHide={() => setShowCloudModal(false)}
        getProjectData={exportProject}
        getThumbnailBlob={getThumbnailBlob}
      />
    </div>
  )
}
