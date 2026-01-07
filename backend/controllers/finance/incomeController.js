const Finance = require("../../models/finances/financeModel")
const Income = require("../../models/finances/incomeModel")
const Enterprise = require("../../models/enterpriseModel")
const { getOptionsForMonth } = require("../handlers/handlersToFinance")
const assignAction = require("../handlers/members/assignAction")

const incomeController = {
    //add ingresos
    addIncome: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { concept, date, category, amount, paymentMethod } = req.body
            if (!concept || !amount || !category || !paymentMethod || !date) return res.status(400).json({ message: "Faltan completar campos obligatorios." })
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const validTypesPaymentMethod = ["Efectivo",
                "Transferencia bancaria",
                "Cheque",
                "Tarjeta de crédito",
                "Tarjeta de débito",
                "Criptomonedas",
                "Otros"]
            if (!validTypesPaymentMethod.includes(paymentMethod)) {
                return res.status(404).json({ message: "El campo ingresado como método de pago no es válido." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newIncome = new Income({
                financeId: financeEnterprise._id,
                concept: concept,
                date: date,
                category: category,
                amount: amount,
                paymentMethod: paymentMethod,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                },
                type: 'income'
            })
            console.log(newIncome)
            await newIncome.save()
            financeEnterprise.incomes.push(newIncome._id)
            financeEnterprise.logsData.push({ event: "Añadido de ingreso", details: "El ingreso se añadió correctamente." })
            await financeEnterprise.save()
            return res.status(200).json({ message: "Ingreso creado con éxito." })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener ingresos
    getIncomes: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            let incomes = await Income.find({ financeId: financeEnterprise._id }).sort({ date: -1 })
            incomes = incomes.length === 0 ? [] : incomes
            return res.status(200).json(incomes)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getTotalIncomesForNumber: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const incomes = await Income.find({ financeId: financeEnterprise._id })
            if (incomes.length === 0) return res.status(404).json({ message: "No se han encontrado datos de ingresos" })
            const valueTotalIncomes = incomes.reduce((acc, value) => acc + value.amount, 0)
            return res.status(200).json(valueTotalIncomes)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getIncomesByCompositionCategory: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const filter = await Income.find({ financeId: financeEnterprise._id })

            const totals = {}

            filter.forEach((income) => {
                const category = income.category
                totals[category] = (totals[category] || 0) + parseFloat(income.amount)
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
    getIncomesByCompositionCategoryPerDay: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()

            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            end.setUTCHours(23, 59, 59, 999)


            const filter = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            const totals = {}
            filter.forEach((income) => {
                const category = income.category
                totals[category] = (totals[category] || 0) + parseFloat(income.amount)
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
    getIncomesByCompositionCategoryPerMonth: async function (req, res) {
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

            const filter = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            console.log(filter)
            const totals = {}
            filter.forEach((income) => {
                const category = income.category
                totals[category] = (totals[category] || 0) + parseFloat(income.amount)
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
    getIncomesByCompositionCategoryPerYear: async function (req, res) {
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


            const filter = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            const totals = {}
            filter.forEach((income) => {
                const category = income.category
                totals[category] = (totals[category] || 0) + parseFloat(income.amount)
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
    getIncomesByCompositionPaymentMethod: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const totals = {}

            const filter = await Income.find({ financeId: financeEnterprise._id })
            filter.forEach((income) => {
                const paymentMethod = income.paymentMethod
                totals[paymentMethod] = (totals[paymentMethod] || 0) + parseFloat(income.amount)
            })
            const totalValue = Object.values(totals).reduce((acc, value) => acc + value, 0)
            if (!totalValue || totalValue === 0) {
                return res.status(404).json({ message: "Los valores del periodo seleccionado son 0." })
            }
            const composition = Object.entries(totals).map(([paymentMethod, amount]) => {
                return {
                    paymentMethod,
                    amount,
                    percentage: parseFloat((amount / totalValue) * 100).toFixed(2)
                }
            })
            return res.status(200).json(composition)
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getIncomesByCompositionPaymentMethodPerDay: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const totals = {}

            const now = new Date()

            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            end.setUTCHours(23, 59, 59, 999)

            const filter = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            filter.forEach((income) => {
                const paymentMethod = income.paymentMethod
                totals[paymentMethod] = (totals[paymentMethod] || 0) + parseFloat(income.amount)
            })
            const totalValue = Object.values(totals).reduce((acc, value) => acc + value, 0)
            if (!totalValue || totalValue === 0) {
                return res.status(404).json({ message: "Los valores del periodo seleccionado son 0." })
            }
            const composition = Object.entries(totals).map(([paymentMethod, amount]) => {
                return {
                    paymentMethod,
                    amount,
                    percentage: parseFloat((amount / totalValue) * 100).toFixed(2)
                }
            })
            return res.status(200).json(composition)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getIncomesByCompositionPaymentMethodPerMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const totals = {}


            const now = new Date()

            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            end.setUTCHours(23, 59, 59, 999)

            const filter = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            filter.forEach((income) => {
                const paymentMethod = income.paymentMethod
                totals[paymentMethod] = (totals[paymentMethod] || 0) + parseFloat(income.amount)
            })
            const totalValue = Object.values(totals).reduce((acc, value) => acc + value, 0)
            const composition = Object.entries(totals).map(([paymentMethod, amount]) => {
                return {
                    paymentMethod,
                    amount,
                    percentage: parseFloat((amount / totalValue) * 100).toFixed(2)
                }
            })
            return res.status(200).json(composition)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getIncomesByCompositionPaymentMethodPerYear: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const totals = {}


            const now = new Date()

            const start = new Date(now.getFullYear(), 0, 1)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), 11, 31)
            end.setUTCHours(23, 59, 59, 999)

            const filter = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            filter.forEach((income) => {
                const paymentMethod = income.paymentMethod
                totals[paymentMethod] = (totals[paymentMethod] || 0) + parseFloat(income.amount)
            })
            const totalValue = Object.values(totals).reduce((acc, value) => acc + value, 0)
            const composition = Object.entries(totals).map(([paymentMethod, amount]) => {
                return {
                    paymentMethod,
                    amount,
                    percentage: parseFloat((amount / totalValue) * 100).toFixed(2)
                }
            })
            return res.status(200).json(composition)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener ingresos por fecha
    getIncomesByDate: async function (req, res) {
        const { enterpriseId } = req.params
        const { startDate, endDate } = req.query
        const financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Las fechas de inicio y fin son requeridas." })
        }
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        const start = new Date(startDate)
        start.setUTCHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setUTCHours(23, 59, 59, 999)
        const filteredIncomes = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
        if (filteredIncomes.length === 0) return res.status(404).json({ message: "No se han encontrado ingresos en las fechas proporcionadas." })
        res.json(filteredIncomes)
    },
    //obtener ingresos por mes
    getIncomesByMonth: async function (req, res) {
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
            const filteredIncomes = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startOfMonth, $lte: endOfMonth } })
            if (filteredIncomes.length === 0) return res.status(404).json({ message: "No se han encontrado ingresos en las fechas proporcionadas." })
            res.json(filteredIncomes)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener ingresos por mes actual
    getValueIncomesByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const date = new Date()
            const startMonth = new Date(date.getFullYear(), date.getMonth(), 1)
            startMonth.setUTCHours(0, 0, 0, 0)
            const endMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
            endMonth.setUTCHours(23, 59, 59, 999)

            const startLastMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1)
            const endLastMonth = new Date(endMonth.getFullYear(), endMonth.getMonth(), 0)

            let filteredIncomesByCurrentMonth = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startMonth, $lte: endMonth } })
            filteredIncomesByCurrentMonth = !filteredIncomesByCurrentMonth ? 0 : filteredIncomesByCurrentMonth
            const valueCurrentMonth = filteredIncomesByCurrentMonth.reduce((acc, value) => acc + value.amount, 0) || 0

            const filteredIncomesByLastMonth = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startLastMonth, $lte: endLastMonth } })
            if (filteredIncomesByLastMonth.length === 0) console.log("No se han encontrado ingresos en las fechas proporcionadas.")
            const valueLastMonth = filteredIncomesByLastMonth.reduce((acc, value) => acc + value.amount, 0)

            let variation = ((valueCurrentMonth - valueLastMonth) / valueLastMonth) * 100
            if (!isFinite(variation)) {
                variation = 100
            }

            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentMonth ? valueCurrentMonth : 0, percentage: variation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener ingresos por día actual
    getValueIncomesByCurrentDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const now = new Date()

            const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            endDate.setUTCHours(23, 59, 59, 999)
            const startLastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            startLastDate.setUTCHours(0, 0, 0, 0)
            const endLastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            endLastDate.setUTCHours(23, 59, 59, 999)

            const filteredIncomesCurrentDate = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startDate, $lte: endDate } })
            if (filteredIncomesCurrentDate.length === 0) return res.status(404).json({ message: "No se han encontrado ingresos en las fechas proporcionadas." })
            const valueCurrentDate = filteredIncomesCurrentDate.reduce((acc, value) => acc + value.amount, 0)

            const filteredIncomesLastDate = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startLastDate, $lte: endLastDate } })
            if (filteredIncomesLastDate.length === 0) console.error("Error al traer los datos del día anterior.")

            const valueLastDate = filteredIncomesLastDate.reduce((acc, value) => acc + value.amount, 0)

            let variation = ((valueCurrentDate - valueLastDate) / valueLastDate) * 100
            if (!isFinite(variation)) {
                variation = 100
            }
            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentDate, percentage: variation })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener ingresos por año actual
    getValueIncomesByCurrentYear: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const actualDate = new Date()

            const startYear = new Date(actualDate.getFullYear(), 0, 1)
            startYear.setUTCHours(0, 0, 0, 0)
            const endYear = new Date(actualDate.getFullYear(), 11, 31)

            const startLastYear = new Date(startYear.getFullYear() - 1, 0, 1)
            const endLastYear = new Date(endYear.getFullYear() - 1, 11, 31)
            endLastYear.setUTCHours(23, 59, 59, 999)


            const filteredIncomesByCurrentYear = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startYear, $lte: endYear } })
            if (filteredIncomesByCurrentYear.length === 0) return res.status(404).json({ message: "No se han encontrado ingresos en las fechas proporcionadas." })
            const valueCurrentYear = filteredIncomesByCurrentYear.reduce((acc, value) => acc + value.amount, 0)

            const filteredIncomesByLastYear = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startLastYear, $lte: endLastYear } })
            if (filteredIncomesByLastYear.length === 0) console.error("No se han encontrado ingresos en las fechas proporcionadas.")
            const valueLastYear = filteredIncomesByLastYear.reduce((acc, value) => acc + value.amount, 0)

            let variation = ((valueCurrentYear - valueLastYear) / valueLastYear) * 100
            if (variation === Infinity) {
                variation = 100
            }

            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentYear, percentage: variation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    getIncomesByCurrentMonth: async function (req, res) {
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
            const filteredIncomes = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            return res.status(200).json(filteredIncomes)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener ingresos por fecha concurrente
    getIncomesByCurrentDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            end.setUTCHours(23, 59, 59, 999)
            const filteredIncomes = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (filteredIncomes.length === 0) return res.status(404).json({ message: "No se han encontrado ingresos en la fecha proporcionada." })
            const value = filteredIncomes.reduce((acc, value) => acc + value.amount, 0)
            return res.status(200).json(value)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener ingresos por año concurrente
    getIncomesByCurrentYear: async function (req, res) {
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
            const filteredIncomes = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            return res.status(200).json(filteredIncomes)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //actualizar ingreso
    updateIncome: async function (req, res) {
        try {
            const { enterpriseId, incomeId } = req.params
            const { concept, date, amount, category, paymentMethod } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const updateIncome = await Income.findOneAndUpdate({ financeId: financeEnterprise._id, _id: incomeId }, { concept, date, amount, category, paymentMethod }, { new: true })
            if (!updateIncome) return res.status(404).json({ message: "No se ha encontrado el ingreso." })
            return res.status(200).json({ message: "Ingreso actualizado con éxito.", updateIncome })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //eliminar ingreso
    deleteIncome: async function (req, res) {
        try {
            const { enterpriseId, elementId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const deleteIncome = await Income.findOneAndDelete({ financeId: financeEnterprise._id, _id: elementId })
            if (!deleteIncome) return res.status(404).json({ message: "No se ha encontrado el ingreso." })
            financeEnterprise.incomes.pull(deleteIncome._id)
            await financeEnterprise.save()
            return res.status(200).json({ message: "Ingreso eliminado con éxito.", deleteIncome })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //borrar todos
    deleteAllIncomes: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const deleteAllIncomes = await Income.deleteMany({ financeId: financeEnterprise._id })
            if (deleteAllIncomes.deletedCount === 0) return res.status(404).json({ message: "No se han encontrado ingresos." })
            return res.status(200).json({ message: "Ingresos eliminados con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar ingresos para el próximo día
    projectionIncomesInCurrentDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const now = new Date()
            const start = new Date(now)
            start.setUTCDate(start.getDate() - 4)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(now)
            end.setUTCHours(23, 59, 59, 999)
            const totalIncomes = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (totalIncomes.length === 0) return res.status(404).json({ message: "No se han encontrado ingresos en el periodo seleccionado." })
            const valueTotalIncomes = totalIncomes.reduce((acc, value) => acc + value.amount, 0)
            const averageDay = valueTotalIncomes / 4
            console.log("Projected current date: ", averageDay)
            return res.status(200).json(averageDay)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar ingresos para el mes siguiente
    projectionIncomesInCurrentMonth: async function (req, res) {
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
            const totalIncomes = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (totalIncomes.length === 0) return res.status(404).json({ message: "No se han encontrado ingresos en el periodo seleccionado." })
            const valueTotalIncomes = totalIncomes.reduce((acc, value) => acc + value.amount, 0)
            const averageDay = valueTotalIncomes / 90

            //projected current month
            const projected = averageDay * 31
            console.log("Projected current month: ", projected)
            return res.status(200).json(projected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar ingresos para el próximo año
    projectionIncomesInCurrentYear: async function (req, res) {
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

            const incomes = await Income.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: now } })

            const totalForNow = incomes.reduce((acc, income) => acc + income.amount, 0)
            const dayAverage = totalForNow / transcurredDays
            const anualProjected = dayAverage * 365
            return res.status(200).json(anualProjected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = incomeController