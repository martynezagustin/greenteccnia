const LogUser = require("../../../models/logs/logUserModel")
const User = require("../../../models/userModel")
const Enterprise = require("../../../models/enterpriseModel")
const { Parser } = require("json2csv")


const exportDataController = {
    exportCSVData: async function (req, res) {
        try {
            const { userId } = req.params
            const user = await User.findById(userId).select("-security.password")
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const logs = await LogUser.find({ userId: user._id })
            const enterprise = await Enterprise.findOne({ userId: user._id })
            const userData = [{
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                age: user.age,
                gender: user.gender,
                address: user.address,
                identityCard: user.identityCard,
                position: user.position,
                phone: user.phone,
                username: user.username,
                isActive: user.security.isActive,
                twoFAActived: user.security.twoFA.twoFAActived,
            }]
            const json2csv = new Parser()
            const csvUser = json2csv.parse(userData)

            let csvLogs = '\nNo hay registros de logs.'
            if (logs.length > 0) {
                const userLogsData = logs.map(log => ({
                    logEvent: log.event,
                    logDetails: log.details,
                    logDate: log.date
                }))
                const json2csvLogs = new Parser()
                csvLogs = "\n\nLogs del Usuario\n" + json2csvLogs.parse(userLogsData)
            }
            let csvEnterprise = '\nSin empresa'
            if (enterprise) {
                const enterpriseData = {
                    nameEnterprise: enterprise.nameEnterprise,
                    address: enterprise.address,
                    city: enterprise.city,
                    businessSector: enterprise.stateOrProvince,
                    country: enterprise.country,
                    companySize: enterprise.companySize,
                    businessSector: enterprise.businessSector,
                    bussinessType: enterprise.businessType
                }
                const json2csvLogs = new Parser()
                csvEnterprise = "\n\nDatos de empresa\n" + json2csvLogs.parse(enterpriseData)

            }
            const finalCSV = `Datos del Usuario\n${csvUser}${csvLogs}${csvEnterprise}`
            res.setHeader("Content-Disposition", `attachment; filename=user_${userId}.csv`)
            res.set("Content-Type", "text/csv")
            res.send(finalCSV)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    exportJSONData: async function (req, res) {
        try {
            const { userId } = req.params
            const user = await User.findById(userId).select("-security.password")
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario" })
            const logs = await LogUser.find({ userId: user._id })
            const enterprise = await Enterprise.findOne({ userId: user._id })
            const userData = [{
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                age: user.age,
                gender: user.gender,
                address: user.address,
                identityCard: user.identityCard,
                position: user.position,
                phone: user.phone,
                username: user.username,
                isActive: user.security.isActive,
                twoFAActived: user.security.twoFA.twoFAActived,
                enterprise: enterprise ? { nameEnterprise: enterprise.nameEnterprise, stateOrProvince: enterprise.stateOrProvince, country: enterprise.country } : "Sin empresa",
                logsData: logs.length > 0 ? logs.map(log => ({ event: log.event, details: log.details, date: log.date })) : "Sin registros",
                enterprise: enterprise ? {
                    nameEnterprise: enterprise.nameEnterprise,
                    address: enterprise.address,
                    city: enterprise.city,
                    businessSector: enterprise.stateOrProvince,
                    country: enterprise.country,
                    companySize: enterprise.companySize,
                    businessSector: enterprise.businessSector,
                    bussinessType: enterprise.businessType
                } : "Sin empresa"
            }]
            res.setHeader("Content-Disposition", `attachment; filename=user_${userId}.json`)
            res.setHeader("Content-Type", "application/json")
            res.json(userData)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    exportLogsCSV: async function (req, res) {
        try {
            const { userId } = req.params
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const logs = await LogUser.find({ userId: user._id })
            const logsData = [{
                logsData: logs.length > 0 ? logs.map((log) => ({ event: log.event, details: log.details, date: log.date })) : "No hay registros"
            }]
            const json2csv = new Parser()
            const csvData = json2csv.parse(logsData)
            const finalCSV = `Logs del usuario\n\n${csvData}`
            res.setHeader("Content-Disposition", `attachment; filename=logs_data_${userId}.csv`)
            res.set("Content-Type", "text/csv")
            res.send(finalCSV)
        } catch (error) {
            return res.status(500).json({error: "Ha ocurrido un error de servidor: " + error})
        }
    }
}

module.exports = exportDataController