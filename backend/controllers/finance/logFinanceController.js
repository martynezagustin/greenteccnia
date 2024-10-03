const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")

const logFinanceController = {
    addLog: async function (req,res, enterprise, event, details) {
        enterprise.logsData.push({event: event, details: details})
    }
}

module.exports = logFinanceController