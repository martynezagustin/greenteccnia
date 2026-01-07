function getTrimesterConfig() {
    const date = new Date()
    const month = date.getMonth()
    const year = date.getFullYear()
    const startTrimester = new Date(year, month - (month % 3), 1)
    console.log("Fecha de inicio del trimestre", startTrimester)
    startTrimester.setUTCHours(0, 0, 0, 0)
    const endTrimester = new Date(year, month - (month % 3) + 3, 0)
    endTrimester.setUTCHours(23, 59, 59, 999)
    const startLastTrimester = new Date(startTrimester.getFullYear(), month - (month % 3) - 3, 1)
    startLastTrimester.setUTCHours(0, 0, 0, 0)
    const endLastTrimester = new Date(endTrimester.getFullYear(), month - (month % 3), 0)
    endLastTrimester.setUTCHours(23, 59, 59, 999)
    console.log("Fecha inicio anterior trimestre", startLastTrimester, "Fecha fin anterior trimestre", endLastTrimester)
    return {
        current: {
            start: startTrimester,
            end: endTrimester
        },
        previous: {
            start: startLastTrimester,
            end: endLastTrimester
        }
    }

}
module.exports = { getTrimesterConfig }