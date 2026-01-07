const mongoose = require("mongoose")
const Enterprise = require("../../../models/enterpriseModel")
const Technology = require("../../../models/technology/technologyModel")
const Software = require("../../../models/technology/software/softwareModel")
const SecurityUpdate = require("../../../models/technology/software/securityUpdateModel")
const assignAction = require("../../handlers/members/assignAction")

const securityUpdateController = {
    addSecurityUpdate: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { description, date } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newSecurityUpdate = new SecurityUpdate({
                softwareId: software._id,
                description,
                date,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            software.securityUpdates.push(newSecurityUpdate._id)
            await newSecurityUpdate.save()
            await software.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ software, technology, newSecurityUpdate })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSecurityUpdate: async function (req, res) {
        try {
            const { enterpriseId, softwareId, securityUpdateId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(securityUpdateId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de copia de seguridad inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const securityUpdate = await SecurityUpdate.findOne({
                softwareId: software._id,
                _id: securityUpdateId
            })
            if (!securityUpdate) {
                return res.status(404).json({ message: "No se ha encontrado la copia de seguridad del software." })
            }
            return res.status(200).json(securityUpdate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSecurityUpdates: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            const securityUpdates = await SecurityUpdate.find({
                softwareId: software._id
            })
            if (securityUpdates.length === 0) {
                return res.status(404).json({ message: "No se han encontrado copias de seguridad del software." })
            }
            return res.status(200).json(securityUpdates)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateSecurityUpdate: async function (req, res) {
        try {
            const { enterpriseId, softwareId, securityUpdateId } = req.params
            const { description, date } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(securityUpdateId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de copia de seguridad inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updateData = {
                description, date, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() }
            }
            const updatedSecurityUpdate = await SecurityUpdate.findOneAndUpdate(
                { _id: securityUpdateId, softwareId: softwareId },
                { $set: updateData },
                { new: true }
            )
            if (!updatedSecurityUpdate) {
                return res.status(404).json({ message: "No se ha encontrado la copia de seguridad del software." })
            }
            return res.status(200).json(updatedSecurityUpdate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteSecurityUpdate: async function (req, res) {
        try {
            const { enterpriseId, softwareId, securityUpdateId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(securityUpdateId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de copia de seguridad inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const securityUpdate = await SecurityUpdate.findOneAndDelete({
                softwareId: softwareId,
                _id: securityUpdateId
            })
            if (!securityUpdate) {
                return res.status(404).json({ message: "No se ha encontrado la copia de seguridad del software." })
            }
            software.securityUpdates.pull(securityUpdateId)
            await software.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ message: "Eliminado exitosamente.", software })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllSecurityUpdates: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha localizado el software." })
            }
            const deletedAllSecurityUpdates = await SecurityUpdate.deleteMany({
                softwareId: software._id
            })
            if (deletedAllSecurityUpdates.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado copias de seguridad del software." })
            }
            const updatedSoftware = await Software.findOneAndUpdate(
                { technologyId: technology._id, _id: softwareId },
                { $pull: { securityUpdates: { $in: software.securityUpdates } } },
                { new: true }
            )
            if (!updatedSoftware) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ message: "Eliminado exitoso", updatedSoftware })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSecurityUpdatesByCustomDate: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { startDate, endDate } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software" })
            }
            if (!startDate || !endDate) {
                return res.status(400).json({ message: "Debes proporcionar fechas válidas para la consulta." })
            }
            const start = new Date(startDate)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            console.log(start, end);
            const filteredSecurityUpdatesByCustomDate = await SecurityUpdate.find(
                {
                    softwareId: softwareId,
                    date: { $gte: start, $lte: end }
                },
            )
            console.log(filteredSecurityUpdatesByCustomDate);

            if (filteredSecurityUpdatesByCustomDate.length === 0) {
                return res.status(404).json({ message: "No hay copias de seguridad del software en las fechas proporcionadas." })
            }
            return res.status(200).json(filteredSecurityUpdatesByCustomDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSecurityUpdatesByCurrentYear: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            //inicializar fechas
            const actualDate = new Date()
            const startCurrentYear = new Date(actualDate.getFullYear(), 0, 1)
            startCurrentYear.setUTCHours(0, 0, 0, 0)
            const endCurrentYear = new Date(actualDate.getFullYear(), 11, 31)
            endCurrentYear.setUTCHours(23, 59, 59, 999)

            const securityUpdatesFilteredByYear = await SecurityUpdate.find({
                softwareId: softwareId,
                date: {
                    $gte: startCurrentYear,
                    $lte: endCurrentYear
                }
            })
            console.log(securityUpdatesFilteredByYear);

            if (securityUpdatesFilteredByYear.length === 0) {
                return res.status(404).json({ message: "No se han encontrado copias de seguridad del software." })
            }
            return res.status(200).json(securityUpdatesFilteredByYear)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSecurityUpdatesByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            //inicializar fechas
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const currentYear = actualDate.getFullYear()
            const startDate = new Date(currentYear, currentMonth, 1)
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(currentYear, currentMonth, 31)
            endDate.setUTCHours(23, 59, 59, 999)
            const securityUpdatesFilteredByMonth = await SecurityUpdate.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (securityUpdatesFilteredByMonth.length === 0) {
                return res.status(404).json({ message: "No se han encontrado copias de seguridad del software." })
            }
            return res.status(200).json(securityUpdatesFilteredByMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSecurityUpdatesByCurrentWeek: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            //inicializar fechas
            const actualDate = new Date()
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDate.setUTCHours(23, 59, 59, 999)
            console.log(startDate, endDate);
            const securityUpdatesFilteredByWeek = await SecurityUpdate.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (securityUpdatesFilteredByWeek.length === 0) {
                return res.status(404).json({ message: "No se han encontrado copias de seguridad del software." })
            }
            return res.status(200).json(securityUpdatesFilteredByWeek)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSecurityUpdatesByCurrentDate: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            //inicializar fechas
            const actualDate = new Date()
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDate.setUTCHours(23, 59, 59, 999)
            console.log(startDate, endDate);
            const securityUpdatesFilteredByDate = await SecurityUpdate.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (securityUpdatesFilteredByDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado copias de seguridad del software." })
            }
            return res.status(200).json(securityUpdatesFilteredByDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = securityUpdateController