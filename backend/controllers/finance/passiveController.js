const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const Passive = require("../../models/finances/passiveModel")
const { getOptionsForMonth } = require("../handlers/handlersToFinance")
const { getTrimesterConfig } = require('./getters/getTrimesterConfig')
const { current } = getTrimesterConfig()
const { previous } = getTrimesterConfig()

const passiveController = {
    //add pasivos
    addPassive: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { category, typeAccount, date, amount, details } = req.body
            if (!category || !typeAccount || !date || !amount) return res.status(400).json({ message: "Faltan completar campos obligatorios." })
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const existsPassive = await Passive.findOne({ financeId: financeEnterprise._id, typeAccount })
            const monthPassive = new Date(date)
            const getPassiveMonth = monthPassive.getMonth()
            if (getPassiveMonth == existsPassive?.date?.getMonth()) { return res.status(404).json({ message: "Ya existe un pasivo mensual con el tipo de cuenta ingresado. Edita el existente." }) }
            const newPassive = new Passive({
                financeId: financeEnterprise._id,
                category,
                typeAccount,
                date,
                amount,
                details,
                type: 'passive'
            })
            await newPassive.save()
            financeEnterprise.liabilities.push(newPassive._id)
            await financeEnterprise.save()
            return res.status(200).json({ message: "Pasivo creado con éxito." })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener pasivos
    getLiabilities: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const allLiabilities = await Passive.find({ financeId: financeEnterprise._id })
            if (allLiabilities.length === 0) return res.status(404).json({ message: "No se han encontrado pasivos." })
            return res.status(200).json(allLiabilities)
        } catch (error) {
            res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getTotalLiabilitiesForNumber: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa" })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const allLiabilities = await Passive.find({ financeId: financeEnterprise._id })
            if (allLiabilities.length === 0) return res.status(404).json({ message: "No se han encontrado pasivos." })
            const numberTotalLiabilities = allLiabilities.reduce((acc, value) => acc + value.amount, 0)
            return res.status(200).json(numberTotalLiabilities)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLiabilitiesByCompositionCategory: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const filter = await Passive.find({ financeId: financeEnterprise._id })

            const totals = {}

            filter.forEach((passive) => {
                const category = passive.category
                totals[category] = (totals[category] || 0) + parseFloat(passive.amount)
            })
            const totalValues = Object.values(totals).reduce((acc, value) => acc + value, 0)
            const composition = Object.entries(totals).map(([category, amount]) => ({
                category,
                amount,
                percentage: parseFloat((amount / totalValues) * 100).toFixed(2)
            }))
            return res.status(200).json(composition)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLiabilitiesByCompositionCategoryPerTrimester: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            end.setUTCHours(23, 59, 59, 999)

            const filter = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            console.log(filter)
            const totals = {}
            filter.forEach((passive) => {
                const category = passive.category
                totals[category] = (totals[category] || 0) + parseFloat(passive.amount)
            })
            const totalValues = Object.values(totals).reduce((acc, value) => acc + value, 0)
            const composition = Object.entries(totals).map(([category, amount]) => ({
                category,
                amount,
                percentage: parseFloat((amount / totalValues) * 100).toFixed(2)
            }))
            return res.status(200).json(composition)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLiabilitiesByCompositionCategoryPerMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            end.setUTCHours(23, 59, 59, 999)

            const filter = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            console.log(filter)
            const totals = {}
            filter.forEach((passive) => {
                const category = passive.category
                totals[category] = (totals[category] || 0) + parseFloat(passive.amount)
            })
            const totalValues = Object.values(totals).reduce((acc, value) => acc + value, 0)
            const composition = Object.entries(totals).map(([category, amount]) => ({
                category,
                amount,
                percentage: parseFloat((amount / totalValues) * 100).toFixed(2)
            }))
            return res.status(200).json(composition)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLiabilitiesByCompositionCategoryPerYear: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const start = new Date(now.getFullYear(), 0, 1)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), 11, 31)
            end.setUTCHours(23, 59, 59, 999)


            const filter = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            const totals = {}
            filter.forEach((passive) => {
                const category = passive.category
                totals[category] = (totals[category] || 0) + parseFloat(passive.amount)
            })
            const totalValues = Object.values(totals).reduce((acc, value) => acc + value, 0)
            const composition = Object.entries(totals).map(([category, amount]) => ({
                category,
                amount,
                percentage: parseFloat((amount / totalValues) * 100).toFixed(2)
            }))
            return res.status(200).json(composition)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    projectedLiabilitiesInCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const now = new Date()
            const start = new Date(now)
            start.setUTCDate(start.getDate() - 90)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now)
            end.setUTCHours(23, 59, 59, 999)
            const totalLiabilities = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (totalLiabilities.length === 0) return res.status(404).json({ message: "No se han encontrado pasivos en el periodo seleccionado." })
            const valueTotalLiabilities = totalLiabilities.reduce((acc, active) => acc + active.amount, 0)
            const averageDay = valueTotalLiabilities / 90
            console.log("Valor total de pasivos: ", valueTotalLiabilities)
            //projected current month
            const projected = averageDay * 31
            console.log("Projected current month: ", projected)
            return res.status(200).json(projected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    projectedLiabilitiesInCurrentTrimester: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const liabilitiesLastTrimester = await Passive.find({
                financeId: financeEnterprise._id,
                date: {
                    $gte: previous.start,
                    $lte: now
                }
            })

            const totalLastTrimester = liabilitiesLastTrimester.reduce((acc, passive) => acc + passive.amount, 0)
            const daysInTrimester = (previous.end - previous.start) / (1000 * 60 * 60 * 24) + 1
            const averageDay = totalLastTrimester / daysInTrimester
            console.log("Valor total de pasivos del trimestre anterior: ", totalLastTrimester)
            //projected current trimester
            const projected = averageDay * 90
            return res.status(200).json(projected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    projectedLiabilitiesInCurrentYear: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const now = new Date()
            const start = new Date(now.getFullYear(), 1, 1)
            start.setUTCHours(0, 0, 0, 0)
            const transcurredDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1

            const liabilities = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: now } })

            const totalForNow = liabilities.reduce((acc, passive) => acc + passive.amount, 0)
            const dayAverage = totalForNow / transcurredDays
            const anualProjected = dayAverage * 365
            return res.status(200).json(anualProjected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener pasivos por mes
    getLiabilitiesByMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { month } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha podido localizar la empresa" })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const selectedOption = getOptionsForMonth(month)
            const currentYear = new Date(Date.now()).getFullYear()

            const startOfMonth = new Date(currentYear, selectedOption, 1)
            const endOfMonth = new Date(currentYear, selectedOption + 1, 0)
            const filteredLiabilities = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: startOfMonth, $lte: endOfMonth } })
            if (filteredLiabilities.length === 0) return res.status(404).json({ message: "No se han encontrado pasivos en las fechas proporcionadas." })
            res.json(filteredLiabilities)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getValueLiabilitiesByCurrentTrimester: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const filteredLiabilitiesCurrentTrimester = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: current.start, $lte: current.end } })
            if (filteredLiabilitiesCurrentTrimester.length === 0) return res.status(404).json({ message: "No se han encontrado pasivos en la fecha proporcionada." })
            const valueCurrentMonth = filteredLiabilitiesCurrentTrimester.reduce((acc, value) => acc + value.amount, 0)
            console.log("Valor pasivos actual mes", valueCurrentMonth)

            const filteredLiabilitiesLastTrimester = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: previous.start, $lte: previous.end } })
            console.log("Fecha previa de la fn que creamos", previous.start, previous.end)

            const valueLastMonth = filteredLiabilitiesLastTrimester.reduce((acc, value) => acc + value.amount, 0) || 0

            let variation = ((valueCurrentMonth - valueLastMonth) / valueLastMonth * 100)
            if (!isFinite(variation)) {
                variation = valueCurrentMonth
            }
            console.log("Variación de pasivos", variation)
            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentMonth, percentage: variation })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener passivos del mes concurrente
    getValueLiabilitiesByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            end.setUTCHours(23, 59, 59, 999)
            //ajustar a mes pasado
            const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            startLast.setUTCHours(0, 0, 0, 0)
            const endLast = new Date(now.getFullYear(), now.getMonth(), 0)
            endLast.setUTCHours(23, 59, 59, 999)

            const filteredLiabilitiesCurrentMonth = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (filteredLiabilitiesCurrentMonth.length === 0) console.log("No se han encontrado pasivos en la fecha proporcionada.")
            const valueCurrentMonth = filteredLiabilitiesCurrentMonth.reduce((acc, value) => acc + value.amount, 0)
            console.log("Valor pasivos actual mes", valueCurrentMonth)

            const filteredLiabilitiesLastMonth = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: startLast, $lte: endLast } })

            const valueLastMonth = filteredLiabilitiesLastMonth.reduce((acc, value) => acc + value.amount, 0) || 0

            let variation = ((valueCurrentMonth - valueLastMonth) / valueLastMonth * 100)
            if (!isFinite(variation)) {
                variation = valueCurrentMonth
            }
            console.log("Variación de pasivos", variation)
            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentMonth, percentage: variation })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener passivos del año concurrente
    getValueLiabilitiesByCurrentYear: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const start = new Date(now.getFullYear(), 0, 1)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), 11, 31)
            end.setUTCHours(23, 59, 59, 999)
            //last
            const startLast = new Date(now.getFullYear() - 1, 0, 1)
            start.setUTCHours(0, 0, 0, 0)
            const endLast = new Date(now.getFullYear() - 1, 11, 31)
            end.setUTCHours(23, 59, 59, 999)

            const filteredLiabilitiesCurrentYear = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (filteredLiabilitiesCurrentYear.length === 0) return res.status(404).json({ message: "No se han encontrado pasivos en la fecha proporcionada." })
            const valueCurrentYear = filteredLiabilitiesCurrentYear.reduce((acc, value) => acc + value.amount, 0)

            const filteredLiabilitiesLastYear = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: startLast, $lte: endLast } })
            const valueLastYear = filteredLiabilitiesLastYear.reduce((acc, value) => acc + value.amount, 0) || 0

            let variation = ((valueCurrentYear - valueLastYear) / valueLastYear * 100)
            if (!isFinite(variation)) {
                variation = valueCurrentYear
            }

            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentYear, percentage: variation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    getLiabilitiesByCurrentTrimester: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const filteredLiabilities = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: current.start, $lte: current.end } })
            return res.status(200).json(filteredLiabilities)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener pasivos por mes concurrente
    getLiabilitiesByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            end.setUTCHours(23, 59, 59, 999)
            const filteredLiabilities = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            return res.status(200).json(filteredLiabilities)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener pasivos del año concurrente
    getLiabilitiesByCurrentYear: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const start = new Date(now.getFullYear(), 0, 1)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), 11, 31)
            end.setUTCHours(23, 59, 59, 999)
            const filteredLiabilities = await Passive.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            return res.status(200).json(filteredLiabilities)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //actualizar pasivo
    updatePassive: async function (req, res) {
        try {
            const { enterpriseId, passiveId } = req.params
            const { category, typeAccount, date, amount, details } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const updatePassive = await Passive.findOne({ financeId: financeEnterprise._id }, { category, typeAccount, date, amount, details }, { new: true })
            if (!updatePassive) return res.status(404).json({ message: "No se ha encontrado el pasivo." })
            return res.status(200).json({ message: "Pasivo actualizado con éxito", updatePassive })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //eliminar pasivo
    deletePassive: async function (req, res) {
        try {
            const { enterpriseId, passiveId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const deletePassive = await Passive.findOneAndDelete({ financeId: financeEnterprise._id, _id: passiveId })
            if (!deletePassive) return res.status(404).json({ message: "No se ha encontrado el pasivo." })
            return res.status(200).json({ message: "Pasivo eliminado con éxito.", deletePassive })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllLiabilities: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const deleteAllLiabilities = await Passive.deleteMany({ financeId: financeEnterprise._id })
            if (deleteAllLiabilities.length === 0) return res.status(404).json({ message: "Todos los pasivos se eliminaron con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = passiveController