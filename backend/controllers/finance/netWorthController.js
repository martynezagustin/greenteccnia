const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const {calculateNetValuesByCurrentMonth, calculateNetValuesByCurrentDate, calculateNetValuesByCurrentYear} = require("../handlers/handlersToFinance")

const netWorthController = {
    //obtener patrimonio neto
    getNetWorth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            res.json(financeEnterprise.netWorth.netWorth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener patrimonio neto por fecha
    getNetWorthByDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { startDate, endDate } = req.query
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: " No se ha encontrado la empresa." })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            const filteredActives = financeEnterprise.actives.filter((active) => {
                const activeDate = new Date(active.date)
                return activeDate >= start && activeDate <= end
            })
            const totalActives = filteredActives.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
            const filteredLiabilities = financeEnterprise.liabilities.filter((passive) => {
                const passiveDate = new Date(passive.date)
                return passiveDate >= start && passiveDate <= end
            })
            const totalLiabilities = filteredLiabilities.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
            const totalNetWorth = totalActives - totalLiabilities
            res.json(totalNetWorth)
        } catch (error) {
            return res.status(500).json({ message: "Ha ocurrido un error: " + error })
        }
    },
    //obtener patrimonio neto por mes concurrente
    getNetWorthByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const currentYear = actualDate.getFullYear()
            const netWorthByCurrentMonth = calculateNetValuesByCurrentMonth(financeEnterprise, currentMonth, currentYear, "actives", "liabilities")
            res.json(netWorthByCurrentMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener patrimonio neto por fecha concurrente
    getNetWorthByCurrentDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha enccontrado le rmpresa." })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const currentYear = actualDate.getFullYear()
            const currentDate = actualDate.getUTCDate()
            const netWorthByCurrentDate = calculateNetValuesByCurrentDate(financeEnterprise, currentDate, currentMonth, currentYear, "actives", "liabilities")
            res.json(netWorthByCurrentDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener patrimonio neto por año concurrente
    getNetWorthByCurrentYear: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const actualDate = new Date()
            const currentYear = actualDate.getFullYear()
            const netWorthByCurrentDate = calculateNetValuesByCurrentYear(financeEnterprise, currentYear, "actives", "liabilities")
            res.json(netWorthByCurrentDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}

module.exports = netWorthController