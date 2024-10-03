const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const { calculateNetValuesByCurrentMonth, calculateNetValuesByCurrentDate, calculateNetValuesByCurrentYear, calculateProjectedCashFlow } = require("../handlers/handlersToFinance")

const cashFlowController = {
    //obtener flujo de caja
    getCashFlow: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            res.json(financeEnterprise.cashFlow.cashFlow)
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
            res.json(totalCashFlow)
        } catch (error) {
            return res.status(500).json({ message: "Ha ocurrido un error: " + error })
        }
    },
    //obtener flujo de caja por mes concurrente
    getCashFlowByCurrentMonth: async function (req, res) {
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
            const cashFlowByCurrentMonth = calculateNetValuesByCurrentMonth(financeEnterprise, currentMonth, currentYear, "incomes", "expenses")
            res.json(cashFlowByCurrentMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener flujo de caja del día concurrente
    getCashFlowByCurrentDate: async function (req, res) {
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
            const currentDate = actualDate.getUTCDate()
            const cashFlowByCurrentDate = calculateNetValuesByCurrentDate(financeEnterprise, currentDate, currentMonth, currentYear, "incomes", "expenses")
            res.json(cashFlowByCurrentDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener flujo de caja del año concurrente
    getCashFlowByCurrentYear: async function (req, res) {
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
            const cashFlowByCurrentDate = calculateNetValuesByCurrentYear(financeEnterprise, currentYear, "incomes", "expenses")
            res.json(cashFlowByCurrentDate)
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
            const lastWeekStart = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            const lastWeekEnd = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())

            const filteredIncomesLastWeek = financeEnterprise.incomes.filter((income) => {
                const incomeDate = new Date(income.date)
                return incomeDate >= lastWeekStart && incomeDate <= lastWeekEnd
            })
            const filteredExpensesLastWeek = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= lastWeekStart && expenseDate <= lastWeekEnd
            })

            const totalIncomesLastWeek = filteredIncomesLastWeek.reduce((acc, currentValue) => acc + currentValue.amount, 0)
            const totalExpensesLastWeek = filteredExpensesLastWeek.reduce((acc, currentValue) => acc + currentValue.amount, 0)

            const averageIncomes = totalIncomesLastWeek / 7
            const averageExpenses = totalExpensesLastWeek / 7
            const projectedCashFlowInNextDate = averageIncomes - averageExpenses
            res.json({ message: `Proyección del flujo de caja para el próximo día: $${projectedCashFlowInNextDate.toFixed(2)}` })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar flujo de caja del mes siguiente
    projectionCashFlowInNextMonth: async function (req, res) {
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
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth() - 2, 1)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth() + 1, 1)

            const filteredIncomesLastMonths = financeEnterprise.incomes.filter((income) => {
                const incomeDate = new Date(income.date)
                return incomeDate >= startDate && incomeDate <= endDate
            })
            const filteredExpensesLastMonths = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= startDate && expenseDate <= endDate
            })

            const totalIncomesLastWeek = filteredIncomesLastMonths.reduce((acc, currentValue) => acc + currentValue.amount, 0)
            const totalExpensesLastWeek = filteredExpensesLastMonths.reduce((acc, currentValue) => acc + currentValue.amount, 0)

            const averageIncomes = totalIncomesLastWeek / 3
            const averageExpenses = totalExpensesLastWeek / 3
            const projectedCashFlowInNextMonth = averageIncomes - averageExpenses
            res.json({ message: `Proyección del flujo de caja para el próximo mes: $${projectedCashFlowInNextMonth.toFixed(2)}` })
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
            await calculateProjectedCashFlow(res,startDate, endDate, 3, financeEnterprise, "año")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}

module.exports = cashFlowController