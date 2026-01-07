const getMonths = function () {
    //establecemos fechas
    const date = new Date()
    const startMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    startMonth.setUTCHours(0, 0, 0, 0)
    const endMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    endMonth.setUTCHours(0, 0, 0, 0)
    return {startMonth, endMonth}
}

module.exports = getMonths