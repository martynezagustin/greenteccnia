const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const { addItemToNetWorth, getOptionsForMonth, calculateNetWorth, deleteItemToNetWorth, updateItemToNetWorth } = require("../handlers/handlersToFinance")

const activeController = {
    //add activos
    addActive: async function (req, res) {
        try {
            addItemToNetWorth(req, res, "actives", "Añadido de activo", "El activo se añadió exitosamente.", "Activo corriente", "Activo no corriente", "Activo intangible", "Otro activo no corriente")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener activos
    getActives: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            res.json(financeEnterprise.actives)
        } catch (error) {
            res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener activos por día
    getActivesByDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { startDate, endDate } = req.query
            const { typeAccount } = req.body
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            const validTypes = ["Activo corriente", "Activo no corriente", "Activo intangible", "Otro activo no corriente"]
            if (!validTypes.includes(typeAccount)) {
                return res.status(404).json({ message: "El campo ingresado como tipo de cuenta no es disponible." })
            }
            if (!startDate || !endDate) {
                return res.json(financeEnterprise.actives.filter((active) => active.typeAccount === typeAccount))
            }
            const filteredActivesByType = financeEnterprise.actives.filter((active) => {
                const activeDate = new Date(active.date)
                return active.typeAccount === typeAccount && activeDate >= start && activeDate <= end
            })
            res.json(filteredActivesByType)
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

            const filteredActives = financeEnterprise.actives.filter((active) => {
                const activeDate = new Date(active.date)
                return activeDate >= startOfMonth && activeDate <= endOfMonth
            })
            if (filteredActives.length === 0) {
                return res.status(404).json({ message: "No se han encontrado activos." })
            }
            res.json(filteredActives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener activos del mes concurrente
    getActivesByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const currentYear = actualDate.getFullYear()

            const filteredActivesByCurrentMonth = financeEnterprise.actives.filter((active) => {
                const activeDate = new Date(active.date)
                return activeDate.getMonth() === currentMonth && activeDate.getFullYear() === currentYear
            })
            res.json(filteredActivesByCurrentMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener activos de la fecha concurrente
    getActivesByCurrentDate: async function (req, res) {
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

            const filteredActivesByCurrentDate = financeEnterprise.actives.filter((active) => {
                const activeDate = new Date(active.date)
                return activeDate.getUTCDate() === currentDate && activeDate.getMonth() === currentMonth && activeDate.getFullYear() === currentYear
            })
            res.json(filteredActivesByCurrentDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener activos del año concurrente
    getActivesByCurrentYear: async function (req, res) {
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
            const filteredActivesByCurrentYear = financeEnterprise.actives.filter((active) => {
                const activeDate = new Date(active.date)
                return activeDate.getFullYear() === currentYear
            })
            res.json(filteredActivesByCurrentYear)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //actualizar activo
    updateActive: async function (req, res) {
        try {
            updateItemToNetWorth(req, res, "actives", "Actualización de activo", "El activo se actualizó exitosamente.", "Activo corriente", "Activo no corriente", "Activo intangible", "Otro activo no corriente")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //eliminar activo
    deleteActive: async function (req, res) {
        try {
            deleteItemToNetWorth(req, res, "actives", "Eliminado de activo", "El activo se eliminó exitosamente.", "Eliminado de activo", "El activo se ha eliminado exitosamente.")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
}

module.exports = activeController