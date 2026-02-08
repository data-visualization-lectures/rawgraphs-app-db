export const dimensions = [
    {
        id: 'value',
        name: 'Value',
        validTypes: ['number'],
        required: true,
        operation: 'get',
    },
]

export const mapData = function (data, mapping, dataTypes, dimensions) {
    const valueDimension = dimensions.find((d) => d.id === 'value')
    return data.map((d) => ({
        value: d[mapping[valueDimension.id].value],
    }))
}
