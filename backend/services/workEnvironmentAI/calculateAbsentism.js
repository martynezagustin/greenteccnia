const Assist = require("../../models/rrhh/assistModel")

async function calculateAbsentism(enterpriseId, days = 30) {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const assists = await Assist.find({
        enterpriseId: enterpriseId,
        dateAssist: { $gte: fromDate }
    })
    if (!assists || assists.length === 0) return 0

    const absentDays = assists.filter(a => a.status === "absent").length
    return absentDays / assists.length
}

async function calculateAbsentismPerMonth(enterpriseId, year, month) {
    const fromDate = new Date(year, month - 1, 1)
    fromDate.setUTCHours(0, 0, 0, 0)
    const toDate = new Date(year, month, 0)
    toDate.setUTCHours(23, 59, 59, 999)
    const assists = await Assist.find({
        enterpriseId: enterpriseId,
        dateAssist: { $gte: fromDate, $lte: toDate }
    })

    if (!assists || assists.length === 0) return 0

    const absentDays = assists.filter(a => a.status === "absent").length
    const ratio = absentDays / assists.length

    return Number((ratio * 10).toFixed(2))
}

module.exports = { calculateAbsentism, calculateAbsentismPerMonth }