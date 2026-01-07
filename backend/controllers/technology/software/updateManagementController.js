const mongoose = require("mongoose")
const Enterprise = require("../../../models/enterpriseModel")
const Technology = require("../../../models/technology/technologyModel")
const UpdateManagement = require("../../../models/technology/software/updateManagementModel")
const Software = require("../../../models/technology/software/softwareModel")
const assignAction = require("../../handlers/members/assignAction")

const updateManagementController = {
    addUpdateManagement: async function (req, res) {
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
            const newUpdateManagement = new UpdateManagement({
                softwareId: software._id,
                description,
                date,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            software.updateManagements.push(newUpdateManagement._id)
            await newUpdateManagement.save()
            await software.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ newUpdateManagement, software, technology })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getUpdateManagement: async function (req, res) {
        try {
            const { enterpriseId, softwareId, updateManagementId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(updateManagementId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de actualización de software inválido." })
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
            const updateManagement = await UpdateManagement.findOne({
                softwareId: software._id,
                _id: updateManagementId
            })
            if (!updateManagement) {
                return res.status(404).json({ message: "No se ha encontrado la actualización de softwares." })
            }
            return res.status(200).json(updateManagement)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllUpdateManagements: async function (req, res) {
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
            const updateManagements = await UpdateManagement.find({
                softwareId: software
            })
            console.log(updateManagements)
            if (updateManagements.length === 0) {
                return res.status(404).json({ message: "No se han encontrado actualizaciones de software." })
            }
            return res.status(200).json(updateManagements)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateUpdateManagement: async function (req, res) {
        try {
            const { enterpriseId, softwareId, updateManagementId } = req.params
            const { description, date } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(updateManagementId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de actualización de software inválido." })
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
                description, date, updatedBy: {
                    username: updatedBy.username,
                    position: updatedBy.position,
                    date: new Date()
                }
            }
            const updatedUpdateManagement = await UpdateManagement.findOneAndUpdate(
                { _id: updateManagementId, softwareId: softwareId },
                { $set: updateData },
                { new: true }
            )
            if (!updatedUpdateManagement) {
                return res.status(404).json({ message: "No se ha encontrado la actualización de software." })
            }
            return res.status(200).json(updatedUpdateManagement)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteUpdateManagement: async function (req, res) {
        try {
            const { enterpriseId, softwareId, updateManagementId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(updateManagementId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de actualización de software inválido." })
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
            const updateManagement = await UpdateManagement.findOneAndDelete({
                softwareId: softwareId,
                _id: updateManagementId
            })
            if (!updateManagement) {
                return res.status(404).json({ message: "No se ha encontrado la actualización de software." })
            }
            software.updateManagements.pull(updateManagementId)
            await software.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ message: "Eliminado exitosamente.", software })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllUpdateManagements: async function (req, res) {
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
            const deletedAllUpdateManagements = await UpdateManagement.deleteMany({
                softwareId: software._id
            })
            if (deletedAllUpdateManagements.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado actualizaciones del software." })
            }
            const updatedSoftware = await Software.findOneAndUpdate(
                { technologyId: technology._id, _id: softwareId },
                { $pull: { updateManagements: { $in: software.updateManagements } } },
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
    getUpdateManagementsByCustomDate: async function (req, res) {
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
            const end = new Date(endDate)
            const filteredUpdateManagementsByCustomerDate = await UpdateManagement.find(
                {
                    softwareId: softwareId,
                    date: { $gte: start, $lte: end }
                },
            )
            console.log(filteredUpdateManagementsByCustomerDate);

            if (filteredUpdateManagementsByCustomerDate.length === 0) {
                return res.status(404).json({ message: "No hay actualizaciones de software en las fechas proporcionadas." })
            }
            return res.status(200).json(filteredUpdateManagementsByCustomerDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getUpdateManagementsByCurrentYear: async function (req, res) {
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
            const updateManagementsFilteredByYear = await UpdateManagement.find({
                softwareId: softwareId,
                date: { $gte: startCurrentYear, $lte: endCurrentYear }
            })
            if (updateManagementsFilteredByYear.length === 0) {
                return res.status(404).json({ message: "No se han encontrado actualizaciones de software." })
            }
            return res.status(200).json(updateManagementsFilteredByYear)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getUpdateManagementsByCurrentMonth: async function (req, res) {
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
            const startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0)
            const endDate = new Date(currentYear, currentMonth, 30, 23, 59, 59, 999)
            const updateManagementsFilteredByMonth = await UpdateManagement.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (updateManagementsFilteredByMonth.length === 0) {
                return res.status(404).json({ message: "No se han encontrado actualizaciones de software." })
            }
            return res.status(200).json(updateManagementsFilteredByMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getUpdateManagementsByCurrentWeek: async function (req, res) {
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
            const updateManagementsFilteredByWeek = await UpdateManagement.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (updateManagementsFilteredByWeek.length === 0) {
                return res.status(404).json({ message: "No se han encontrado actualizaciones de software." })
            }
            return res.status(200).json(updateManagementsFilteredByWeek)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getUpdateManagementsByCurrentDate: async function (req, res) {
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
            const updateManagementsFilteredByDate = await UpdateManagement.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (updateManagementsFilteredByDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado actualizaciones de software." })
            }
            return res.status(200).json(updateManagementsFilteredByDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}

module.exports = updateManagementController