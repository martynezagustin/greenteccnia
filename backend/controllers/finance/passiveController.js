const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const { addItemToNetWorth, getOptionsForMonth, calculateNetWorth } = require("../handlers/handlersToFinance")

const passiveController = {
    //add pasivos
    addPassive: async function (req, res) {
        try {
            addItemToNetWorth(req, res, "liabilities", "Pasivo corriente", "Pasivo no corriente", "Pasivo contingente")
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
            const validTypes = ["Pasivo corriente", "Pasivo no corriente", "Pasivos contingentes"]
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
            const currentDate = actualDate.getUTCDate()

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
            const { typeAccount, date, amount, details, provider } = req.body
            const { enterpriseId, passiveId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa" })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const passive = financeEnterprise.liabilities.find((passive) => passive._id.toString() === passiveId)
            if (!passive) {
                return res.status(404).json({ message: "No se ha encontrado el pasivo." })
            }
            const validTypes = ["Pasivo corriente", "Pasivo no corriente", "Pasivo contingente"]
            if (!validTypes.includes(typeAccount)) {
                return res.status(400).json({ message: "El campo ingresado como tipo de cuenta no es disponible." })
            }
            const passiveUpdate = await Finance.findOneAndUpdate({ enterpriseId, "liabilities._id": passiveId }, { $set: { "liabilities.$.typeAccount": typeAccount, "liabilities.$.date": date, "liabilities.$.amount": amount, "liabilities.$.details": details, "liabilities.$.provider": provider } }, { new: true })
            if (!passiveUpdate) {
                return res.status(404).json({ message: "No se ha podido actualizar el pasivo." })
            }
            calculateNetWorth(financeEnterprise)
            const updatedPassive = activeUpdate.liabilities.find((passive) => passive._id.toString() === passiveId)
            res.json(updatedPassive)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //eliminar pasivo
    deletePassive: async function (req, res) {
        try {
            const { enterpriseId, passiveId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const passive = financeEnterprise.liabilities.id(passiveId)
            if (!passive) {
                return res.status(404).json({ message: "No se ha encontrado el pasivo." })
            }
            financeEnterprise.liabilities.pull(passiveId)
            calculateNetWorth(financeEnterprise)
            await financeEnterprise.save()
            await enterprise.save()
            res.json({ message: "Eliminado exitosamente." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
}

module.exports = passiveController