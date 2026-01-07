const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const Expense = require("../../models/finances/expenseModel")
const { deleteItemToCashFlow, getOptionsForMonth, updateItemToCashFlow, deleteAllItemsToCashFlow, getTotalItemsByNumberOfCashFlowOrNetWorth, getValueItemsByCompositionCategory, getItemsByCompositionCategoryPerPeriod, getAllItems, projectedItemsForNextPeriod, getItemsByCompositionPaymentMethod, getItemsByCompositionPaymentMethodPerPeriod, getValueItemsByCurrentPeriod, getItemsByCurrentPeriod } = require("../handlers/handlersToFinance")
const assignAction = require("../handlers/members/assignAction")

const expenseController = {
    //add egresos
    addExpense: async function (req, res) {
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
            const newExpense = new Expense({
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
                type: 'expense'
            })
            console.log(newExpense)
            await newExpense.save()
            financeEnterprise.expenses.push(newExpense._id)
            financeEnterprise.logsData.push({ event: "Añadido de egreso", details: "El egreso se añadió correctamente." })
            await financeEnterprise.save()
            return res.status(200).json({ message: "Egreso creado con éxito." })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener egresos
    getExpenses: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            let expenses = await Expense.find({ financeId: financeEnterprise._id }).sort({ date: -1 })
            expenses = !expenses ? [] : expenses
            return res.status(200).json(expenses)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getTotalExpensesForNumber: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const expenses = await Expense.find({ financeId: financeEnterprise._id })
            if (expenses.length === 0) return res.status(404).json({ message: "No se han encontrado datos de egresos." })
            const valueTotalExpenses = expenses.reduce((acc, value) => acc + value.amount, 0)
            return res.status(200).json(valueTotalExpenses)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getExpensesByCompositionCategory: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { category } = req.query
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const filter = await Expense.find({ financeId: financeEnterprise._id })

            const totals = {}
            filter.forEach((expense) => {
                const category = expense.category
                totals[category] = (totals[category] || 0) + parseFloat(expense.amount)
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
    getExpensesByCompositionCategoryPerDay: async function (req, res) {
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

            const filteredExpensesCurrentDate = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startDate, $lte: endDate } })
            if (filteredExpensesCurrentDate.length === 0) return res.status(404).json({ message: "No se han encontrado egresos en las fechas proporcionadas." })
            const valueCurrentDate = filteredExpensesCurrentDate.reduce((acc, value) => acc + value.amount, 0)

            const filteredExpensesLastDate = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startLastDate, $lte: endLastDate } })
            if (filteredExpensesLastDate.length === 0) console.error("Error al traer los datos del día anterior.")

            const valueLastDate = filteredExpensesLastDate.reduce((acc, value) => acc + value.amount, 0)

            let variation = ((valueCurrentDate - valueLastDate) / valueLastDate) * 100
            if (!isFinite(variation)) {
                variation = valueCurrentDate
            }
            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentDate, percentage: variation.toFixed(2) })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getExpensesByCompositionCategoryPerMonth: async function (req, res) {
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

            const filter = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            console.log(filter)
            const totals = {}
            filter.forEach((expense) => {
                const category = expense.category
                totals[category] = (totals[category] || 0) + parseFloat(expense.amount)
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
    getExpensesByCompositionCategoryPerYear: async function (req, res) {
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


            const filter = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            const totals = {}
            filter.forEach((expense) => {
                const category = expense.category
                totals[category] = (totals[category] || 0) + parseFloat(expense.amount)
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
    getExpensesByCompositionPaymentMethod: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const totals = {}

            const filter = await Expense.find({ financeId: financeEnterprise._id })
            filter.forEach((expense) => {
                const paymentMethod = expense.paymentMethod
                totals[paymentMethod] = (totals[paymentMethod] || 0) + parseFloat(expense.amount)
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
    getExpensesByCompositionPaymentMethodPerDay: async function (req, res) {
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

            console.log(start, end)

            const filter = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            console.log("expensess de hoy", filter)
            filter.forEach((expense) => {
                const paymentMethod = expense.paymentMethod
                totals[paymentMethod] = (totals[paymentMethod] || 0) + parseFloat(expense.amount)
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
    getExpensesByCompositionPaymentMethodPerMonth: async function (req, res) {
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

            const filter = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            filter.forEach((expense) => {
                const paymentMethod = expense.paymentMethod
                totals[paymentMethod] = (totals[paymentMethod] || 0) + parseFloat(expense.amount)
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
    getExpensesByCompositionPaymentMethodPerYear: async function (req, res) {
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

            const filter = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            filter.forEach((expense) => {
                const paymentMethod = expense.paymentMethod
                totals[paymentMethod] = (totals[paymentMethod] || 0) + parseFloat(expense.amount)
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
    //obtener egresos por fecha
    getExpensesByDate: async function (req, res) {
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
        const filteredExpenses = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
        if (filteredExpenses.length === 0) return res.status(404).json({ message: "No se han encontrado egresos en las fechas proporcionadas." })
        res.json(filteredExpenses)
    },
    //obtener egresos por mes
    getExpensesByMonth: async function (req, res) {
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
            const filteredExpenses = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startOfMonth, $lte: endOfMonth } })
            if (filteredExpenses.length === 0) return res.status(404).json({ message: "No se han encontrado egresos en las fechas proporcionadas." })
            res.json(filteredExpenses)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener egresos del mes concurrente
    getValueExpensesByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const date = new Date()
            const startMonth = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
            const endMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

            const startLastMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1)
            const endLastMonth = new Date(endMonth.getFullYear(), endMonth.getMonth(), 0)

            let filteredExpensesByCurrentMonth = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startMonth, $lte: endMonth } })
            filteredExpensesByCurrentMonth = !filteredExpensesByCurrentMonth ? [] : filteredExpensesByCurrentMonth
            const valueCurrentMonth = filteredExpensesByCurrentMonth.reduce((acc, value) => acc + value.amount, 0) || 0

            const filteredExpensesByLastMonth = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startLastMonth, $lte: endLastMonth } })
            if (filteredExpensesByLastMonth.length === 0) console.log("No se han encontrado ingresos en las fechas proporcionadas.")
            const valueLastMonth = filteredExpensesByLastMonth.reduce((acc, value) => acc + value.amount, 0)

            let variation = ((valueCurrentMonth - valueLastMonth) / valueLastMonth) * 100
            if (!isFinite(variation)) {
                variation = valueCurrentMonth
            }

            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentMonth ? valueCurrentMonth : 0, percentage: variation.toFixed(2) })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener egresos del día concurrente
    getValueExpensesByCurrentDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const now = new Date()

            const startDate = new Date()
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date()
            endDate.setUTCHours(23, 59, 59, 999)
            const startLastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            startLastDate.setUTCHours(0, 0, 0, 0)
            const endLastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            endLastDate.setUTCHours(23, 59, 59, 999)

            const filteredExpensesCurrentDate = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startDate, $lte: endDate } })
            if (filteredExpensesCurrentDate.length === 0) return res.status(404).json({ message: "No se han encontrado egresos en las fechas proporcionadas." })
            const valueCurrentDate = filteredExpensesCurrentDate.reduce((acc, value) => acc + value.amount, 0)

            const filteredExpensesLastDate = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startLastDate, $lte: endLastDate } })
            if (filteredExpensesLastDate.length === 0) console.error("Error al traer los datos del día anterior.")

            const valueLastDate = filteredExpensesLastDate.reduce((acc, value) => acc + value.amount, 0)

            let variation = ((valueCurrentDate - valueLastDate) / valueLastDate) * 100
            if (!isFinite(variation)) {
                variation = 100
            }
            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentDate, percentage: variation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener egresos del mes concurrente
    getValueExpensesByCurrentYear: async function (req, res) {
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


            const filteredExpensesByCurrentYear = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startYear, $lte: endYear } })
            if (filteredExpensesByCurrentYear.length === 0) console.error("No se han encontrado egresos en las fechas proporcionadas.")
            const valueCurrentYear = filteredExpensesByCurrentYear.reduce((acc, value) => acc + value.amount, 0) || 0

            const filteredExpensesByLastYear = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startLastYear, $lte: endLastYear } })
            if (filteredExpensesByLastYear.length === 0) console.error("No se han encontrado ingresos en las fechas proporcionadas.")
            const valueLastYear = filteredExpensesByLastYear.reduce((acc, value) => acc + value.amount, 0) || 0

            let variation = ((valueCurrentYear - valueLastYear) / valueLastYear) * 100
            if (!isFinite(variation)) {
                variation = 100
            }

            return res.status(200).json({ getItemsByCurrentPeriod: valueCurrentYear, percentage: variation ? variation : 0 })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    getExpensesByCurrentMonth: async function (req, res) {
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
            let filteredExpenses = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            filteredExpenses = filteredExpenses ? filteredExpenses : []
            return res.status(200).json(filteredExpenses)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener egresos por fecha concurrente
    getExpensesByCurrentDate: async function (req, res) {
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
            const filteredExpenses = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            console.log("Expenses de hoy", filteredExpenses)
            if (filteredExpenses.length === 0) return res.status(404).json({ message: "No se han encontrado egresos en la fecha proporcionada." })
            const value = filteredExpenses.reduce((acc, value) => acc + value.amount, 0)
            return res.status(200).json(value)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener egresos del año concurrente
    getExpensesByCurrentYear: async function (req, res) {
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
            let filteredExpenses = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            filteredExpenses = filteredExpenses ? filteredExpenses : []
            return res.status(200).json(filteredExpenses)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //actualizar egreso
    updateExpense: async function (req, res) {
        try {
            const { enterpriseId, expenseId } = req.params
            const { concept, date, amount, category, paymentMethod } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const updateExpense = await Expense.findOneAndUpdate({ financeId: financeEnterprise._id, _id: expenseId }, { concept, date, amount, category, paymentMethod }, { new: true })
            if (!updateExpense) return res.status(404).json({ message: "No se ha encontrado el egreso." })
            return res.status(200).json({ message: "Egreso actualizado con éxito.", updateExpense })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //borrar egreso
    deleteExpense: async function (req, res) {
        try {
            const { enterpriseId, expenseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const deleteExpense = await Expense.findOneAndDelete({ financeId: financeEnterprise._id, _id: expenseId })
            if (!deleteExpense) return res.status(404).json({ message: "No se ha encontrado el egreso." })
            return res.status(200).json({ message: "Egreso eliminado con éxito.", deleteExpense })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    deleteAllExpenses: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            const deleteAllExpenses = await Expense.deleteMany({ financeId: financeEnterprise._id })
            if (deleteAllExpenses.deletedCount === 0) return res.status(404).json({ message: "No se han encontrado egresos." })
            return res.status(200).json({ message: "Egresos eliminados con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //proyectar egresos para el dia siguiente
    projectionExpensesInNextDate: async function (req, res) {
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
            const totalExpenses = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (totalExpenses.length === 0) return res.status(404).json({ message: "No se han encontrado ingresos en el periodo seleccionado." })
            const valueTotalExpenses = totalExpenses.reduce((acc, value) => acc + value.amount, 0)
            const averageDay = valueTotalExpenses / 4 || 0
            console.log("Projected current date: ", averageDay)
            return res.status(200).json(averageDay)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar egresos para el mes siguiente
    projectionExpensesInNextMonth: async function (req, res) {
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
            const totalExpenses = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: end } })
            if (totalExpenses.length === 0) return res.status(404).json({ message: "No se han encontrado egresos en el periodo seleccionado." })
            const valueTotalExpenses = totalExpenses.reduce((acc, value) => acc + value.amount, 0)
            const averageDay = valueTotalExpenses / 90

            //projected current month
            const projected = averageDay * 31 || 0
            console.log("Projected current month: ", projected)
            return res.status(200).json(projected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar egresos para el próximo año
    projectionExpensesInNextYear: async function (req, res) {
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

            const expenses = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: start, $lte: now } })

            const totalForNow = expenses.reduce((acc, expense) => acc + expense.amount, 0)
            const dayAverage = totalForNow / transcurredDays
            const anualProjected = dayAverage * 365 || 0
            return res.status(200).json(anualProjected)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = expenseController