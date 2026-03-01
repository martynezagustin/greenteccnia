//este es para usar el filtro en fechas especificadas
function validatePeriod(currentPeriod) {
    const now = new Date()
    let startDate
    let endDate
    switch (currentPeriod) {
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            startDate.setUTCHours(0, 0, 0, 0)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            endDate.setUTCHours(23, 59, 59, 999)
            break;
        case 'week':
            startDate = new Date(now)
            startDate.setDate(now.getDate() - now.getDay())
            endDate = new Date(now)
            break;
        default:
            startDate = new Date(now.getFullYear(), 0, 1)
            startDate.setUTCHours(0, 0, 0, 0)
            endDate = new Date(now.getFullYear(), 11, 31)
            endDate.setUTCHours(23, 59, 59, 999)
    }

    return { startDate, endDate }
}

function addDaysToRevision(date,days){
    const now = new Date(date)
    const result = now.setDate(now.getDate() + days)
    return result
}

module.exports = { validatePeriod, addDaysToRevision }