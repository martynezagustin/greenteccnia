const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const { addItemToNetWorth, getOptionsForMonth, calculateNetWorth, deleteItemToNetWorth, updateItemToNetWorth } = require("../handlers/handlersToFinance")

const passiveController = {
    //add pasivos
    addPassive: async function (req, res) {
        try {
            addItemToNetWorth(req, res, "liabilities", "Añadido de pasivo", "El pasivo ha sido añadido con éxito.", "Pasivo corriente", "Pasivo no corriente", "Pasivo contingente")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    //obtener pasivos
    getLiabilities: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            res.json(financeEnterprise.liabilities)
        } catch (error) {
            res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener pasivos por fecha personalizada
    getLiabilitiesByDate: async function (req, res) {
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
            const validTypes = ["Pasivo corriente", "Pasivo no corriente", "Pasivo contingente"]
            if (!validTypes.includes(typeAccount)) {
                return res.status(404).json({ message: "El campo ingresado como tipo de cuenta no es disponible." })
            }
            if (!startDate || !endDate) {
                return res.json(financeEnterprise.liabilities.filter((passive) => passive.typeAccount === typeAccount))
            }
            const filteredLiabilitiesByType = financeEnterprise.liabilities.filter((passive) => {
                const passiveDate = new Date(passive.date)
                return passive.typeAccount === typeAccount && passiveDate >= start && passiveDate <= end
            })
            res.json(filteredLiabilitiesByType)
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

            const filteredLiabilities = financeEnterprise.liabilities.filter((passive) => {
                const passiveDate = new Date(passive.date)
                return passiveDate >= startOfMonth && passiveDate <= endOfMonth
            })
            if (filteredLiabilities.length === 0) {
                return res.status(404).json({ message: "No se han encontrado pasivos." })
            }
            res.json(filteredLiabilities)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener pasivos por mes concurrente
    getLiabilitiesByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const currentYear = actualDate.getFullYear()

            const filteredLiabilitiesByCurrentMonth = financeEnterprise.liabilities.filter((passive) => {
                const passiveDate = new Date(passive.date)
                return passiveDate.getMonth() === currentMonth && passiveDate.getFullYear() === currentYear
            })
            res.json(filteredLiabilitiesByCurrentMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener pasivos del día concurrente
    getLiabilitiesByCurrentDate: async function (req, res) {
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

            const filteredLiabilitiesByCurrentDate = financeEnterprise.liabilities.filter((passive) => {
                const passiveDate = new Date(passive.date)
                return passiveDate.getUTCDate() === currentDate && passiveDate.getMonth() === currentMonth && passiveDate.getFullYear() === currentYear
            })
            res.json(filteredLiabilitiesByCurrentDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //obtener pasivos del año concurrente
    getLiabilitiesByCurrentYear: async function (req, res) {
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
            const filteredLiabilitiesByCurrentYear = financeEnterprise.liabilities.filter((passive) => {
                const passiveDate = new Date(passive.date)
                return passiveDate.getFullYear() === currentYear
            })
            res.json(filteredLiabilitiesByCurrentYear)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //actualizar pasivo
    updatePassive: async function (req, res) {
        try {
            updateItemToNetWorth(req, res, "liabilities", "Actualización de pasivo", "El pasivo se actualizó exitosamente", "Pasivo corriente", "Pasivo no corriente", "Pasivo contingente")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //eliminar pasivo
    deletePassive: async function (req, res) {
        try {
            deleteItemToNetWorth(req, res, "liabilities", "Eliminado de pasivo", "El pasivo se ha eliminado exitosamente.")
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
}

module.exports = passiveController