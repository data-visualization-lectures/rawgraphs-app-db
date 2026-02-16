import { colorPresets } from '@rawgraphs/rawgraphs-core'
import {
  // Sequential (追加分)
  interpolateViridis, interpolateCividis,
  interpolateBuGn, interpolateBuPu, interpolateGnBu,
  interpolateOrRd, interpolatePuBu, interpolatePuBuGn,
  interpolatePuRd, interpolateRdPu,
  interpolateYlGn, interpolateYlGnBu, interpolateYlOrBr, interpolateYlOrRd,
  // Diverging (追加分)
  interpolatePRGn, interpolatePuOr,
  interpolateRdGy, interpolateRdYlBu, interpolateRdYlGn,
  // Categorical (追加分)
  schemeAccent, schemeDark2, schemePaired,
  schemePastel1, schemePastel2,
  schemeSet1, schemeSet2, schemeSet3,
  schemeTableau10,
} from 'd3-scale-chromatic'

// Sequential に追加
Object.assign(colorPresets.sequential, {
  interpolateViridis:  { value: interpolateViridis,  label: "Viridis" },
  interpolateCividis:  { value: interpolateCividis,  label: "Cividis" },
  interpolateBuGn:     { value: interpolateBuGn,     label: "BuGn" },
  interpolateBuPu:     { value: interpolateBuPu,     label: "BuPu" },
  interpolateGnBu:     { value: interpolateGnBu,     label: "GnBu" },
  interpolateOrRd:     { value: interpolateOrRd,     label: "OrRd" },
  interpolatePuBu:     { value: interpolatePuBu,     label: "PuBu" },
  interpolatePuBuGn:   { value: interpolatePuBuGn,   label: "PuBuGn" },
  interpolatePuRd:     { value: interpolatePuRd,     label: "PuRd" },
  interpolateRdPu:     { value: interpolateRdPu,     label: "RdPu" },
  interpolateYlGn:     { value: interpolateYlGn,     label: "YlGn" },
  interpolateYlGnBu:   { value: interpolateYlGnBu,   label: "YlGnBu" },
  interpolateYlOrBr:   { value: interpolateYlOrBr,   label: "YlOrBr" },
  interpolateYlOrRd:   { value: interpolateYlOrRd,   label: "YlOrRd" },
})

// Diverging に追加
Object.assign(colorPresets.diverging, {
  interpolatePRGn:   { value: interpolatePRGn,   label: "PRGn" },
  interpolatePuOr:   { value: interpolatePuOr,   label: "PuOr" },
  interpolateRdGy:   { value: interpolateRdGy,   label: "RdGy" },
  interpolateRdYlBu: { value: interpolateRdYlBu, label: "RdYlBu" },
  interpolateRdYlGn: { value: interpolateRdYlGn, label: "RdYlGn" },
})

// Ordinal に追加 (Categorical)
Object.assign(colorPresets.ordinal, {
  schemeAccent:    { value: schemeAccent,    label: "Accent" },
  schemeDark2:     { value: schemeDark2,     label: "Dark2" },
  schemePaired:    { value: schemePaired,    label: "Paired" },
  schemePastel1:   { value: schemePastel1,   label: "Pastel1" },
  schemePastel2:   { value: schemePastel2,   label: "Pastel2" },
  schemeSet1:      { value: schemeSet1,      label: "Set1" },
  schemeSet2:      { value: schemeSet2,      label: "Set2" },
  schemeSet3:      { value: schemeSet3,      label: "Set3" },
  schemeTableau10: { value: schemeTableau10, label: "Tableau10" },
})
