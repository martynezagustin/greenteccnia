const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const {addItemToNetWorth, getOptionsForMonth, calculateNetWorth} = require("../handlers/handlersToFinance")

const activeController = {
    //add activos
    addActive: async function (req, res) {
        try {
            addItemToNetWorth(req,res,"actives", "Activo corriente", "Activo no corriente", "Activo intangible", "Otro activos no corrientes")
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
            const currentDate = actualDate.getUTCDate()

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
                return res.status(404).json({ message: "No se ha enccontrado le rmpresa." })
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
            const { typeAccount, date, amount, details, provider } = req.body
            const { enterpriseId, activeId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa" })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const active = financeEnterprise.actives.find((active) => active._id.toString() === activeId)
            if (!active) {
                return res.status(404).json({ message: "No se ha encontrado el activo." })
            }
            const validTypes = ["Activo corriente", "Activo no corriente", "Activo intangible", "Otro activo no corriente"]
            if (!validTypes.includes(typeAccount)) {
                return res.status(400).json({ message: "El campo ingresado como tipo de cuenta no es disponible." })
            }
            const activeUpdate = await Finance.findOneAndUpdate({ enterpriseId, "actives._id": activeId }, { $set: { "actives.$.typeAccount": typeAccount, "actives.$.date": date, "actives.$.amount": amount, "actives.$.details": details, "actives.$.provider": provider } }, { new: true })
            if (!activeUpdate) {
                return res.status(404).json({ message: "No se ha podido actualizar el egreso." })
            }
            calculateNetWorth(financeEnterprise)
            financeEnterprise.save()
            enterprise.save()
            const updatedActive = activeUpdate.actives.find((active) => active._id.toString() === activeId)
            res.json(updatedActive)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //eliminar activo
    deleteActive: async function (req, res) {
        try {
            const { enterpriseId, activeId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const active = financeEnterprise.actives.id(activeId)
            if (!active) {
                return res.status(404).json({ message: "No se ha encontrado el activo." })
            }
            financeEnterprise.actives.pull(activeId)
            calculateNetWorth(financeEnterprise)
            await financeEnterprise.save()
            await enterprise.save()
            res.json({ message: "Eliminado exitosamente." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
}

module.exports = activeController