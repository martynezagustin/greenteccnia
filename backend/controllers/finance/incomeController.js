const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const { addItemToCashFlow, deleteItemToCashFlow, getOptionsForMonth, updateItemToCashFlow } = require("../handlers/handlersToFinance")

const incomeController = {
    //add ingresos
    addIncome: async function (req, res) {
        try {
            addItemToCashFlow(req, res, "incomes", "Añadido de ingreso", "El usuario añadió un ingreso a las finanzas exitosamente.")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener ingresos
    getIncomes: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            console.log(financeEnterprise.cashFlow);
            res.json(financeEnterprise.incomes)
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
        const end = new Date(endDate)
        end.setUTCHours(23, 59, 59, 999)
        const filteredIncomes = financeEnterprise.incomes.filter((income) => {
            const incomeDate = new Date(income.date)
            return incomeDate >= start && incomeDate <= end
        })
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

            const filteredIncomes = financeEnterprise.incomes.filter((income) => {
                const incomeDate = new Date(income.date)
                return incomeDate >= startOfMonth && incomeDate <= endOfMonth
            })
            if (filteredIncomes.length === 0) {
                return res.status(404).json({ message: "No se han encontrado ingresos." })
            }
            res.json(filteredIncomes)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener ingresos por mes actual
    getIncomesByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const currentYear = actualDate.getFullYear()

            const filteredIncomesByCurrentMonth = financeEnterprise.incomes.filter((income) => {
                const incomeDate = new Date(income.date)
                return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear
            })
            res.json(filteredIncomesByCurrentMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener ingresos por fecha concurrente
    getIncomesByCurrentDate: async function (req, res) {
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

            const filteredIncomesByCurrentDate = financeEnterprise.incomes.filter((income) => {
                const incomeDate = new Date(income.date)
                return incomeDate.getUTCDate() === currentDate && incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear
            })
            res.json(filteredIncomesByCurrentDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener ingresos por año concurrente
    getIncomesByCurrentYear: async function (req, res) {
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
            const filteredIncomesByCurrentYear = financeEnterprise.incomes.filter((income) => {
                const incomeDate = new Date(income.date)
                return incomeDate.getFullYear() === currentYear
            })
            res.json(filteredIncomesByCurrentYear)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //actualizar ingreso
    updateIncome: async function (req, res) {
        try {
            updateItemToCashFlow(req,res, "incomes", "Actualización de ingreso", "El ingreso se ha actualizado exitosamente.")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //eliminar ingreso
    deleteIncome: async function (req, res) {
        try {
            deleteItemToCashFlow(req, res, "incomes", "Eliminado de ingreso", "El ingreso se eliminó exitosamente.")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //proyectar ingresos para el próximo día
    projectionIncomesInNextDate: async function (req, res) {
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

            const incomesLastWeek = filteredIncomesLastWeek.reduce((acc, currentValue) => acc + currentValue.amount, 0)
            if(incomesLastWeek === 0){
                return res.json({message: "Los ingresos de los días anteriores son 0. Es imposible hacer una proyección precisa."})
            }
            const averageDailyIncome = incomesLastWeek / 7
            res.json({message: `Proyección de ingresos para el próximo día: $${averageDailyIncome.toFixed(2)}`})
        } catch (error) {
            return res.status(500).json({error: "Ha ocurrido un error de servidor: " + error})
        }
    },
    //proyectar ingresos para el mes siguiente
    projectionIncomesInNextMonth: async function (req, res) {
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

            const filteredIncomesLastThreeMonths = financeEnterprise.incomes.filter((income) => {
                const incomeDate = new Date(income.date)
                return incomeDate >= startDate && incomeDate <= endDate
            })

            const incomesLastMonths = filteredIncomesLastThreeMonths.reduce((acc, currentValue) => acc + currentValue.amount, 0)
            console.log(incomesLastMonths);

            if (incomesLastMonths === 0) {
                return res.json({ message: "Los ingresos de los meses anteriores son 0. Es imposible hacer una proyección precisa." })
            }
            const averageIncomesLastMonths = incomesLastMonths / 3
            res.json({
                message: `Proyección de ingresos para el próximo mes: $${averageIncomesLastMonths.toFixed(2)}`
            })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //proyectar ingresos para el próximo año
    projectionIncomesInNextYear: async function (req, res) {
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
            const filteredIncomesLastThreeYears = financeEnterprise.incomes.filter((income) => {
                const incomeDate = new Date(income.date)
                return incomeDate >= startDate && incomeDate <= endDate
            })
            const incomesLastThreeYears = filteredIncomesLastThreeYears.reduce((acc, currentValue) => acc + currentValue.amount, 0)
            if (incomesLastThreeYears === 0) {
                return res.json({ message: "Los ingresos de los años anteriores son 0. Es imposible hacer una proyección precisa." })
            }
            const uniqueYears = new Set(filteredIncomesLastThreeYears.map((income) => new Date(income.date).getFullYear()))
            const yearsWithData = uniqueYears.size
            console.log(yearsWithData);

            const averageIncomesLastYears = incomesLastThreeYears / yearsWithData
            res.json({ message: `Proyección de ingresos para el próximo año: $${averageIncomesLastYears.toFixed(2)}` })
        } catch (error) {
            return res.status(500).json({error: "Ha ocurrido un error de servidor: " + error})
        }
    }
}

module.exports = incomeController