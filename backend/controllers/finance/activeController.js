const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const Active = require("../../models/finances/activeModel")
const mongoose = require("mongoose")
const { getTrimesterConfig } = require('./getters/getTrimesterConfig')
const { current } = getTrimesterConfig()
const { previous } = getTrimesterConfig()

const { getOptionsForMonth } = require("../handlers/handlersToFinance")
const assignAction = require("../handlers/members/assignAction")

const activeController = {
    //add activos
    addActive: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { category, typeAccount, date, amount, details } = req.body
            if (!category || !typeAccount || !date || !amount || !details) return res.status(400).json({ message: "Faltan completar campos obligatorios." })
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const validCategoriesActives = ["Activo corriente",
                "Activo no corriente",
                "Activo intangible",]
            if (!validCategoriesActives.includes(category)) {
                return res.status(404).json({ message: "El campo ingresado como tipo de activo no es válido." })
            }
            const existsActive = await Active.findOne({ financeId: financeEnterprise._id, typeAccount })
            const monthActive = new Date(date)
            const getActiveMonth = monthActive.getMonth()
            if(getActiveMonth == existsActive?.date?.getMonth()){ return res.status(404).json({ message: "Ya existe un activo mensual con el tipo de cuenta ingresado. Edita el existente." }) }
            if (existsActive) return res.status(404).json({ message: "Ya existe un activo mensual con el tipo de cuenta ingresado. Edita el existente." })
            const createdBy = await assignAction(req, res, enterprise)
            const newActive = new Active({
                financeId: financeEnterprise._id,
                category,
                typeAccount,
                date,
                amount,
                details,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                },
                type: 'active'
            })
            console.log(newActive)
            await newActive.save()
            financeEnterprise.actives.push(newActive._id)
            financeEnterprise.logsData.push({ event: "Añadido de activo", details: "El activo se añadió correctamente." })
            await financeEnterprise.save()
            return res.status(200).json({ message: "Activo creado con éxito." })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener activos
    getActives: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const allActives = await Active.find({ financeId: financeEnterprise._id })
            if (allActives.length === 0) return res.status(404).json({ message: "No se han encontrado activos." })
            return res.status(200).json(allActives)
        } catch (error) {
            res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getTotalActivesForNumber: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const actives = await Active.find({ financeId: financeEnterprise._id })
            if (actives.length === 0) return res.status(404).json({ message: "No se han encontrado datos de activos" })
            const valueTotalActives = actives.reduce((acc, value) => acc + value.amount, 0)
            return res.status(200).json(valueTotalActives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getActivesByCompositionCategory: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { category } = req.query
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const filter = await Active.find({ financeId: financeEnterprise._id })
            const totals = {}
            filter.forEach((active) => {
                const category = active.category
                totals[category] = (totals[category] || 0) + parseFloat(active.amount)
            })
            const totalValues = Object.values(totals).reduce((acc, value) => acc + value, 0)
            const composition = Object.entries(totals).map(([category, amount]) => ({
                category,
                amount,
                percentage: parseFloat((amount / totalValues) * 100).toFixed(2)
            }))
            return res.status(200).json(composition)
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getActivesByCompositionCategoryPerMonth: async function (req, res) {
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

            const filter = await Active.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            const totals = {}
            filter.forEach((active) => {
                const category = active.category
                totals[category] = (totals[category] || 0) + parseFloat(active.amount)
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
    getActivesByCompositionCategoryPerTrimester: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const filter = await Active.find({ financeId: financeEnterprise._id, date: { $gte: current.start, $lte: current.end } })
            const totals = {}
            filter.forEach((active) => {
                const category = active.category
                totals[category] = (totals[category] || 0) + parseFloat(active.amount)
            })
            const totalValues = Object.values(totals).reduce((acc, value) => acc + value, 0)
            const composition = Object.entries(totals).map(([category, amount]) => ({
                category,
                amount,
                percentage: parseFloat((amount / totalValues) * 100).toFixed(2)
            }))
            console.log("Composition trimestral", composition)
            return res.status(200).json(composition)
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getActivesByCompositionCategoryPerYear: async function (req, res) {
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


            const filter = await Active.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            const totals = {}
            filter.forEach((active) => {
                const category = active.category
                totals[category] = (totals[category] || 0) + parseFloat(active.amount)
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
    projectedActivesInCurrentMonth: async function (req, res) {
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
            const totalActives = await Active.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (totalActives.length === 0) return res.status(404).json({ message: "No se han encontrado activos en el periodo seleccionado." })
            const valueTotalActives = totalActives.reduce((acc, active) => acc + active.amount, 0)
            const averageDay = valueTotalActives / 90
            console.log("Valor total de activos: ", valueTotalActives)
            //projected current month
            const projected = averageDay * 31
            console.log("Projected current month: ", projected)
            return res.status(200).json(projected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    projectedActivesInCurrentTrimester: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const activesLastTrimester = await Active.find({
                financeId: financeEnterprise._id,
                date: {
                    $gte: previous.start,
                    $lte: now
                }
            })

            const totalLastTrimester = activesLastTrimester.reduce((acc, active) => acc + active.amount, 0)
            const daysInTrimester = (previous.end - previous.start) / (1000 * 60 * 60 * 24) + 1
            const averageDay = totalLastTrimester / daysInTrimester
            console.log("Valor total de activos del trimestre anterior: ", totalLastTrimester)
            //projected current trimester
            const projected = averageDay * 90
            return res.status(200).json(projected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    projectedActivesInCurrentYear: async function (req, res) {
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

            const actives = await Active.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: now } })

            const totalForNow = actives.reduce((acc, active) => acc + active.amount, 0)
            const dayAverage = totalForNow / transcurredDays
            const anualProjected = dayAverage * 365
            return res.status(200).json(anualProjected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener activos por mes
    getActivesByMonth: async function (req, res) {
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


            const filteredActives = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startOfMonth, $lte: endOfMonth } })
            if (filteredActives.length === 0) return res.status(404).json({ message: "No se han encontrado activos en las fechas proporcionadas." })
            res.json(filteredActives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener activos del mes concurrente
    getValueActivesByCurrentMonth: async function (req, res) {
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
            const endLast = new Date(now.getFullYear(), now.getMonth(), 0)

            console.log("Valores", start, end)

            const filteredActivesCurrentMonth = await Active.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (filteredActivesCurrentMonth.length === 0) console.log("No se han encontrado activos en la fecha proporcionada.")
            const valueCurrentMonth = filteredActivesCurrentMonth.reduce((acc, value) => acc + value.amount, 0)

            const filteredActivesLastMonth = await Active.find({ financeId: financeEnterprise._id, date: { $gte: startLast, $lte: endLast } })
            const valueLastMonth = filteredActivesLastMonth.reduce((acc, value) => acc + value.amount, 0) || 0


            let variation = ((valueCurrentMonth - valueLastMonth) / valueLastMonth * 100)
            if (!isFinite(variation)) {
                variation = valueCurrentMonth
            }
            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentMonth, percentage: variation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    getValueActivesByCurrentTrimester: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const filteredActivesCurrentTrimester = await Active.find({ financeId: financeEnterprise._id, date: { $gte: current.start, $lte: current.end } })
            if (filteredActivesCurrentTrimester.length === 0) return res.status(404).json({ message: "No se han encontrado activos en la fecha proporcionada." })
            const valueCurrentTrimester = filteredActivesCurrentTrimester.reduce((acc, active) => acc + active.amount, 0)

            const filteredActivesLastTrimester = await Active.find({ financeId: financeEnterprise._id, date: { $gte: previous.start, $lte: previous.end } })
            const valueLastMonth = filteredActivesLastTrimester.reduce((acc, value) => acc + value.amount, 0) || 0

            let variation = ((valueCurrentTrimester - valueLastMonth) / valueLastMonth * 100)
            if (!isFinite(variation)) {
                variation = valueCurrentTrimester
            }
            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentTrimester, percentage: variation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener activos del year concurrente
    getValueActivesByCurrentYear: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            //fecha actual
            const startCurrent = new Date(now.getFullYear(), 0, 1)
            startCurrent.setUTCHours(0, 0, 0, 0)
            const endCurrent = new Date(now.getFullYear(), 11, 31)
            endCurrent.setUTCHours(23, 59, 59, 999)
            //fecha anterior
            const startLast = new Date(now.getFullYear() - 1, 0, 1)
            startLast.setUTCHours(0, 0, 0, 0)
            console.log(startLast)
            const endLast = new Date(now.getFullYear() - 1, 11, 31)
            endLast.setUTCHours(23, 59, 59, 999)


            const filteredActivesByCurrentYear = await Active.find({ financeId: financeEnterprise._id, date: { $gte: startCurrent, $lte: endCurrent } })
            if (filteredActivesByCurrentYear.length === 0) return res.status(404).json({ message: "No se han encontrado activos en la fecha proporcionada." })
            const valueCurrentYear = filteredActivesByCurrentYear.reduce((acc, value) => acc + value.amount, 0)

            const filteredActivesByLastYear = await Active.find({ financeId: financeEnterprise._id, date: { $gte: startLast, $lte: endLast } })
            const valueLastYear = filteredActivesByLastYear.reduce((acc, value) => acc + value.amount, 0) || 0

            let variation = ((valueCurrentYear - valueLastYear) / valueLastYear * 100)
            if (!isFinite(variation)) {
                variation = valueCurrentYear
            }
            console.log("Valor del active current year?", valueCurrentYear)
            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentYear, percentage: variation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    getActivesByCurrentTrimester: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const filteredActives = await Active.find({ financeId: financeEnterprise._id, date: { $gte: current.start, $lte: current.end } })
            return res.status(200).json(filteredActives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener activos del mes concurrente
    getActivesByCurrentMonth: async function (req, res) {
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
            const filteredActives = await Active.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            return res.status(200).json(filteredActives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener activos del año concurrente
    getActivesByCurrentYear: async function (req, res) {
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
            const filteredActives = await Active.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (filteredActives.length === 0) return res.status(404).json({ message: "No se han encontrado activos en la fecha proporcionada." })
            return res.status(200).json(filteredActives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //actualizar activo
    updateActive: async function (req, res) {
        try {
            const { enterpriseId, activeId } = req.params
            const { category, typeAccount, date, amount, details } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const updateActive = await Active.findOneAndUpdate({ _id: activeId, financeId: financeEnterprise._id }, { category, typeAccount, date, amount, details }, { new: true })
            if (!updateActive) return res.status(404).json({ message: "No se ha encontrado el activo." })
            return res.status(200).json({ message: "Activo actualizado con éxito.", updateActive })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //eliminar activo
    deleteActive: async function (req, res) {
        try {
            const { enterpriseId, activeId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const deleteActive = await Active.findOneAndDelete({ _id: activeId, financeId: financeEnterprise._id })
            if (!deleteActive) return res.status(404).json({ message: "No se ha encontrado el activo." })
            return res.status(200).json({ message: "Activo eliminado con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllActives: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const deleteAllActives = await Active.deleteMany({ financeId: financeEnterprise._id })
            if (deleteAllActives.deletedCount === 0) return res.status(404).json({ message: "No se han encontrado activos." })
            return res.status(200).json({ message: "Todos los activos eliminados con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = activeController