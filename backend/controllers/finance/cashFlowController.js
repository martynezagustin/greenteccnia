const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const { calculateNetValuesByCurrentMonth, calculateNetValuesByCurrentDate, calculateNetValuesByCurrentYear, calculateProjectedCashFlowOrNetWorth } = require("../handlers/handlersToFinance")

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
            const currentDate = actualDate.getDate()
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
            const currentYear = actualDate.getFullYear()
            const currentMonth = actualDate.getMonth()
            const currentDate = actualDate.getUTCDate()
            const lastWeekStart = new Date(currentYear, currentMonth, currentDate - 7)
            const lastWeekEnd = new Date(currentYear, currentMonth, currentDate)

            await calculateProjectedCashFlowOrNetWorth(res, lastWeekStart, lastWeekEnd, "incomes", "expenses", 7, financeEnterprise, "día", "flujo de caja")
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

            await calculateProjectedCashFlowOrNetWorth(res, startDate, endDate, "incomes", "expenses", 3, financeEnterprise, "mes", "flujo de caja")
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