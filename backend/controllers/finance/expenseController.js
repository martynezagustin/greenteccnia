const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const { addItemToCashFlow, deleteItemToCashFlow, getOptionsForMonth, updateItemToCashFlow } = require("../handlers/handlersToFinance")

const expenseController = {
    //add egresos
    addExpense: async function (req, res) {
        try {
            addItemToCashFlow(req, res, "expenses", "Añadido de egreso", "El usuario añadió un egreso a las finanzas exitosamente.")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener egresos
    getExpenses: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            res.json(financeEnterprise.expenses)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener egresos por fecha
    getExpensesByDate: async function (req, res) {
        const { enterpriseId } = req.params
        const { startDate, endDate } = req.query
        const financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setUTCHours(23, 59, 59, 999)
        const filteredExpenses = financeEnterprise.expenses.filter((expense) => {
            const expenseDate = new Date(expense.date)
            return expenseDate >= start && expenseDate <= end
        })
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
            const filteredExpenses = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= startOfMonth && expenseDate <= endOfMonth
            })
            if (filteredExpenses.length === 0) {
                return res.status(404).json({ message: "No se han encontrado egresos." })
            }
            res.json(filteredExpenses)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener egresos del mes concurrente
    getExpensesByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const currentYear = actualDate.getFullYear()

            const filteredExpensesByCurrentMonth = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
            })
            res.json(filteredExpensesByCurrentMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener egresos por fecha concurrente
    getExpensesByCurrentDate: async function (req, res) {
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

            const filteredExpensesByCurrentDate = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate.getUTCDate() === currentDate && expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
            })
            res.json(filteredExpensesByCurrentDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener egresos del año concurrente
    getExpensesByCurrentYear: async function (req, res) {
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
            const currentYear = actualDate.getFullYear()
            const filteredExpensesByCurrentYear = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate.getFullYear() === currentYear
            })
            res.json(filteredExpensesByCurrentYear)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //actualizar egreso
    updateExpense: async function (req, res) {
        try {
            updateItemToCashFlow(req,res,"expenses","Actualización de egreso", "El egreso se ha actualizado correctamente.")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //borrar egreso
    deleteExpense: async function (req, res) {
        try {
            deleteItemToCashFlow(req, res, "expenses", "Eliminado de egreso", "El egreso se eliminó exitosamente.")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //proyectar egresos para el dia siguiente
    projectionExpensesInNextDate: async function (req, res) {
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

            const filteredExpensesLastWeek = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= lastWeekStart && expenseDate <= lastWeekEnd
            })

            const expensesLastWeek = filteredExpensesLastWeek.reduce((acc, currentValue) => acc + currentValue.amount, 0)
            if (expensesLastWeek === 0) {
                return res.json({ message: "Los egresos de los días anteriores son 0. Es imposible hacer una proyección precisa." })
            }
            const averageDailyExpense = expensesLastWeek / 7
            res.json({ message: `Proyección de egresos para el próximo día: $${averageDailyExpense.toFixed(2)}` })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar egresos para el mes siguiente
    projectionExpensesInNextMonth: async function (req, res) {
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

            const startDate = new Date(currentYear, currentMonth - 2, 1)
            const endDate = new Date(currentYear, currentMonth + 1, 1)

            const filteredExpensesLastThreeMonths = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= startDate && expenseDate <= endDate
            })

            const expensesLastMonths = filteredExpensesLastThreeMonths.reduce((acc, currentValue) => acc + currentValue.amount, 0)
            if (expensesLastMonths === 0) {
                return res.json({ message: "Los egresos de los meses anteriores son 0. Es imposible hacer una proyección precisa." })
            }
            const averageExpensesLastMonths = expensesLastMonths / 3
            res.json({
                message: `Proyección de egresos para el próximo mes: $${averageExpensesLastMonths.toFixed(2)}`
            })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar egresos para el próximo año
    projectionExpensesInNextYear: async function (req, res) {
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
            const startDate = new Date(currentYear - 3, 0, 1)
            const endDate = new Date(currentYear, 11, 31)
            const filteredExpensesLastThreeYears = financeEnterprise.expenses.filter((expense) => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= startDate && expenseDate <= endDate
            })
            const expensesLastThreeYears = filteredExpensesLastThreeYears.reduce((acc, currentValue) => acc + currentValue.amount, 0)
            if (expensesLastThreeYears === 0) {
                return res.json({ message: "Los egresos de los años anteriores son 0. Es imposible hacer una proyección precisa." })
            }
            const uniqueYears = new Set(filteredExpensesLastThreeYears.map((income) => new Date(income.date).getFullYear()))
            const yearsWithData = uniqueYears.size

            const averageExpensesLastYears = expensesLastThreeYears / yearsWithData
            res.json({ message: `Proyección de egresos para el próximo año: $${averageExpensesLastYears.toFixed(2)}` })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = expenseController