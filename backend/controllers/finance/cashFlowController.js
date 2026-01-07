const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const Income = require("../../models/finances/incomeModel")
const Expense = require("../../models/finances/expenseModel")
const { calculateProjectedCashFlowOrNetWorth } = require("../handlers/handlersToFinance")

const cashFlowController = {
    //obtener flujo de caja
    getCashFlow: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }

            const incomes = await Income.find({ financeId: financeEnterprise._id })
            const expenses = await Expense.find({ financeId: financeEnterprise._id })

            const totalValueIncomes = incomes.reduce((acc, value) => acc + value.amount, 0)
            const totalValueExpenses = expenses.reduce((acc, value) => acc + value.amount, 0)

            const cashFlow = totalValueIncomes - totalValueExpenses
            return res.status(200).json(cashFlow)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener flujo de caja por fecha
    getCashFlowByDate: async function (req, res) {
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
            const filteredIncomes = financeEnterprise.incomes.filter((income) => {
                const incomeDate = new Date(income.date)
                return incomeDate >= start && incomeDate <= end
            })
            const totalIncomes = filteredIncomes.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
            const filteredExpenses = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= start && expenseDate <= end
            })
            const totalExpenses = filteredExpenses.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
            const totalCashFlow = totalIncomes - totalExpenses
            return res.status(200).json(totalCashFlow)
        } catch (error) {
            return res.status(500).json({ message: "Ha ocurrido un error: " + error })
        }
    },
    //obtener flujo de caja por mes concurrente
    getCashFlowByCurrentMonth: async function (req, res) {
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
            endMonth.setUTCHours(0, 0, 0, 0)

            console.log(startMonth, endMonth, "los dias filtrados")

            const startLastMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1)
            const endLastMonth = new Date(endMonth.getFullYear(), endMonth.getMonth(), 0)

            //empezamos a traer los items
            const incomesCurrentMonth = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startMonth, $lte: endMonth } })
            const expensesCurrentMonth = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startMonth, $lte: endMonth } })
            const incomesLastMonth = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startLastMonth, $lte: endLastMonth } })
            const expensesLastMonth = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startLastMonth, $lte: endLastMonth } })

            console.log('Mes actual incomes', incomesCurrentMonth, 'Mes actual expenses', expensesCurrentMonth)

            //cto vale en total cada uno?
            const totalValueIncomesCurrentMonth = incomesCurrentMonth.reduce((acc, value) => acc + value.amount, 0)
            const totalValueExpensesCurrentMonth = expensesCurrentMonth.reduce((acc, value) => acc + value.amount, 0)
            const totalValueIncomesLastMonth = incomesLastMonth.reduce((acc, value) => acc + value.amount, 0)
            const totalValueExpensesLastMonth = expensesLastMonth.reduce((acc, value) => acc + value.amount, 0)

            const cashFlowByCurrentMonth = totalValueIncomesCurrentMonth - totalValueExpensesCurrentMonth
            const cashFlowByLastMonth = totalValueIncomesLastMonth - totalValueExpensesLastMonth
            let variation = ((cashFlowByCurrentMonth - cashFlowByLastMonth) / cashFlowByLastMonth) * 100
            if (!isFinite(variation)) {
                variation = 100
            }

            return res.status(200).json({ cashFlowByCurrentPeriod: cashFlowByCurrentMonth, percentage: variation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener flujo de caja del día concurrente
    getCashFlowByCurrentDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })

            //establecemos fechas
            const date = new Date()
            const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
            endDate.setUTCHours(23, 59, 59, 999)

            const startLastDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
            startLastDate.setUTCHours(0, 0, 0, 0)
            console.log("Dias en obtener diario?", startLastDate)
            const endLastDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
            endLastDate.setUTCHours(23, 59, 59, 999)
            console.log(endLastDate)

            //empezamos a traer los items
            const incomesCurrentDate = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startDate, $lte: endDate } })
            const expensesCurrentDate = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startDate, $lte: endDate } })
            const incomesLastDate = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startLastDate, $lte: endLastDate } })
            const expensesLastDate = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startLastDate, $lte: endLastDate } })


            //cto vale en total cada uno?
            const totalValueIncomesCurrentDate = incomesCurrentDate.reduce((acc, value) => acc + value.amount, 0) || 0
            const totalValueExpensesCurrentDate = expensesCurrentDate.reduce((acc, value) => acc + value.amount, 0) || 0
            const totalValueIncomesLastDate = incomesLastDate.reduce((acc, value) => acc + value.amount, 0) || 0
            const totalValueExpensesLastDate = expensesLastDate.reduce((acc, value) => acc + value.amount, 0) || 0

            const cashFlowByCurrentDate = totalValueIncomesCurrentDate - totalValueExpensesCurrentDate
            const cashFlowByLastDate = totalValueIncomesLastDate - totalValueExpensesLastDate

            let variation = ((cashFlowByCurrentDate - cashFlowByLastDate) / cashFlowByLastDate) * 100 || 0
            if (!isFinite(variation)) {
                variation = 100
            }

            return res.status(200).json({ cashFlowByCurrentPeriod: cashFlowByCurrentDate, percentage: variation ? variation : 0 })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener flujo de caja del año concurrente
    getCashFlowByCurrentYear: async function (req, res) {
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
            const incomesCurrentYear = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startYear, $lte: endYear } })
            const expensesCurrentYear = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startYear, $lte: endYear } })
            const incomesLastYear = await Income.find({ financeId: financeEnterprise._id, date: { $gte: startLastYear, $lte: endLastYear } })
            const expensesLastYear = await Expense.find({ financeId: financeEnterprise._id, date: { $gte: startLastYear, $lte: endLastYear } })


            //cto vale en total cada uno?
            const totalValueIncomesCurrentYear = incomesCurrentYear.reduce((acc, value) => acc + value.amount, 0) || 0
            const totalValueExpensesCurrentYear = expensesCurrentYear.reduce((acc, value) => acc + value.amount, 0) || 0
            const totalValueIncomesLastYear = incomesLastYear.reduce((acc, value) => acc + value.amount, 0) || 0
            const totalValueExpensesLastYear = expensesLastYear.reduce((acc, value) => acc + value.amount, 0) || 0

            const cashFlowByCurrentYear = totalValueIncomesCurrentYear - totalValueExpensesCurrentYear
            const cashFlowByLastYear = totalValueIncomesLastYear - totalValueExpensesLastYear
            console.log("Cuanto es el cash flow del year actual?", cashFlowByCurrentYear, "y del year pasado? ==>", cashFlowByLastYear)
            let variation = ((cashFlowByCurrentYear - cashFlowByLastYear) / cashFlowByLastYear) * 100
            if (!isFinite(variation)) {
                variation = 100
            }

            return res.status(200).json({ cashFlowByCurrentPeriod: cashFlowByCurrentYear, percentage: variation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar flujo de caja del día siguiente
    projectionCashFlowInNextDate: async function (req, res) {
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
            const start = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(actualDate.getFullYear(), actual.getMonth(), actualDate.getDate())
            end.setUTCHours(23, 59, 59, 999)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar flujo de caja del mes siguiente
    projectionCashFlowInNextMonth: async function (req, res) {
        try {
            const actualDate = new Date()
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth() - 2, 1)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth() + 1, 1)

            await calculateProjectedCashFlowOrNetWorth(req, res, startDate, endDate, "incomes", "expenses", 3)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar flujo de caja del año siguiente
    projectionCashFlowInNextYear: async function (req, res) {
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
            const startDate = new Date(actualDate.getFullYear() - 3, 0, 1)
            const endDate = new Date(actualDate.getFullYear(), 11, 31)
            await calculateProjectedCashFlowOrNetWorth(res, startDate, endDate, "incomes", "expenses", 3, financeEnterprise, "año", "flujo de caja")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}

module.exports = cashFlowController