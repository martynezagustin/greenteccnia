const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const Active = require("../../models/finances/activeModel")
const Passive = require("../../models/finances/passiveModel")
const { getTrimesterConfig } = require('./getters/getTrimesterConfig')
const { current } = getTrimesterConfig()
const { previous } = getTrimesterConfig()

const netWorthController = {
    //obtener patrimonio neto
    getNetWorth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }

            const actives = await Active.find({ financeId: financeEnterprise._id })
            const liabilities = await Passive.find({ financeId: financeEnterprise._id })

            const totalValueActives = actives.reduce((acc, value) => acc + value.amount, 0)
            const totalValueLiabilities = liabilities.reduce((acc, value) => acc + value.amount, 0)

            const netWorth = totalValueActives - totalValueLiabilities
            return res.status(200).json(netWorth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener patrimonio neto por mes concurrente
    getNetWorthByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            //establecemos fechas
            const date = new Date()
            const startMonth = new Date(date.getFullYear(), date.getMonth(), 1)
            startMonth.setUTCHours(0, 0, 0, 0)
            const endMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
            endMonth.setUTCHours(23, 59, 59, 999)

            const startLastMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1)
            startLastMonth.setUTCHours(0, 0, 0, 0)
            console.log("Start last month", startLastMonth)
            const endLastMonth = new Date(date.getFullYear(), date.getMonth(), 0)
            console.log("End last month", endLastMonth)
            endLastMonth.setUTCHours(23, 59, 59, 999)

            //empezamos a traer los items
            const activesCurrentMonth = await Active.find({ financeId: financeEnterprise._id, date: { $gte: startMonth, $lte: endMonth } })
            const liabilitiesCurrentMonth = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: startMonth, $lte: endMonth } })
            const activesLastMonth = await Active.find({ financeId: financeEnterprise._id, date: { $gte: startLastMonth, $lte: endLastMonth } })
            const liabilitiesLastMonth = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: startLastMonth, $lte: endLastMonth } })


            //cto vale en total cada uno?
            const totalValueActivesCurrentMonth = activesCurrentMonth.reduce((acc, value) => acc + value.amount, 0)
            const totalValueLiabilitiesCurrentMonth = liabilitiesCurrentMonth.reduce((acc, value) => acc + value.amount, 0)
            const totalValueActivesLastMonth = activesLastMonth.reduce((acc, value) => acc + value.amount, 0)
            const totalValueLiabilitiesLastMonth = liabilitiesLastMonth.reduce((acc, value) => acc + value.amount, 0)

            const netWorthByCurrentMonth = totalValueActivesCurrentMonth - totalValueLiabilitiesCurrentMonth
            const netWorthByLastMonth = totalValueActivesLastMonth - totalValueLiabilitiesLastMonth
            console.log("Cual fue el current month net worht?", netWorthByCurrentMonth)
            console.log("Cual fue el last month net worht?", netWorthByLastMonth)
            
            let variation = ((netWorthByCurrentMonth - netWorthByLastMonth) / netWorthByLastMonth) * 100

            if (!isFinite(variation)) {
                variation = netWorthByCurrentMonth
            }

            return res.status(200).json({ netWorthByCurrentPeriod: netWorthByCurrentMonth, percentage: variation})
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener por trimestre
    getNetWorthByCurrentTrimester: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            //empezamos a traer los items
            const activesCurrentTrimester = await Active.find({ financeId: financeEnterprise._id, date: { $gte: current.start, $lte: current.end } })
            const liabilitiesCurrentTrimester = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: current.start, $lte: current.end } })
            const activesLastTrimester = await Active.find({ financeId: financeEnterprise._id, date: { $gte: previous.start, $lte: previous.end } })
            const liabilitiesLastTrimester = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: previous.start, $lte: previous.end } })


            //cto vale en total cada uno?
            const totalValueActivesCurrentTrimester = activesCurrentTrimester.reduce((acc, value) => acc + value.amount, 0)
            const totalValueLiabilitiesCurrentTrimester = liabilitiesCurrentTrimester.reduce((acc, value) => acc + value.amount, 0)
            const totalValueActivesLastTrimester = activesLastTrimester.reduce((acc, value) => acc + value.amount, 0)
            const totalValueLiabilitiesLastTrimester = liabilitiesLastTrimester.reduce((acc, value) => acc + value.amount, 0)

            const netWorthByCurrentTrimester = totalValueActivesCurrentTrimester - totalValueLiabilitiesCurrentTrimester
            const netWorthByLastTrimester = totalValueActivesLastTrimester - totalValueLiabilitiesLastTrimester
            let variation = ((netWorthByCurrentTrimester - netWorthByLastTrimester) / netWorthByLastTrimester) * 100
            console.log("Patrimonio del trimestre actual", netWorthByCurrentTrimester)
            console.log("Patrimonio del trimestre anterior", netWorthByLastTrimester)
            if (!isFinite(variation)) {
                variation = netWorthByCurrentTrimester
            }

            return res.status(200).json({ netWorthByCurrentPeriod: netWorthByCurrentTrimester, percentage: variation })
        } catch (error) {
            console.error(error);

            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener patrimonio neto por año concurrente
    getNetWorthByCurrentYear: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            //establecemos fechas
            const date = new Date()
            const startYear = new Date(date.getFullYear(), 0, 1)
            console.log(startYear)
            startYear.setUTCHours(0, 0, 0, 0)
            const endYear = new Date(date.getFullYear(), 11, 31)
            endYear.setUTCHours(23, 59, 59, 999)

            const startLastYear = new Date(startYear.getFullYear() - 1, 0, 1)
            console.log(startLastYear, "Inicio anio anterior")
            const endLastYear = new Date(endYear.getFullYear() - 1, 11, 31)

            //empezamos a traer los items
            const activesCurrentYear = await Active.find({ financeId: financeEnterprise._id, date: { $gte: startYear, $lte: endYear } })
            const liabilitiesCurrentYear = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: startYear, $lte: endYear } })
            const activesLastYear = await Active.find({ financeId: financeEnterprise._id, date: { $gte: startLastYear, $lte: endLastYear } })
            const liabilitiesLastYear = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: startLastYear, $lte: endLastYear } })


            //cto vale en total cada uno?
            const totalValueActivesCurrentYear = activesCurrentYear.reduce((acc, value) => acc + value.amount, 0)
            const totalValueLiabilitiesCurrentYear = liabilitiesCurrentYear.reduce((acc, value) => acc + value.amount, 0)
            const totalValueActivesLastYear = activesLastYear.reduce((acc, value) => acc + value.amount, 0)
            const totalValueLiabilitiesLastYear = liabilitiesLastYear.reduce((acc, value) => acc + value.amount, 0)

            const netWorthByCurrentYear = totalValueActivesCurrentYear - totalValueLiabilitiesCurrentYear
            const netWorthByLastYear = totalValueActivesLastYear - totalValueLiabilitiesLastYear
            console.log("Patrimonio del año?", netWorthByCurrentYear)
            let variation = ((netWorthByCurrentYear - netWorthByLastYear ? netWorthByLastYear : 0) / netWorthByLastYear) * 100
            console.log("Variacion del patrimonio anual?", variation)
            if (!isFinite(variation)) {
                variation = netWorthByCurrentYear
            }
            return res.status(200).json({ netWorthByCurrentPeriod: netWorthByCurrentYear, percentage: variation})
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = netWorthController