const mongoose = require("mongoose")
const Enterprise = require("../../../models/enterpriseModel")
const Hardware = require("../../../models/technology/hardware/hardwareModel")
const Technology = require("../../../models/technology/technologyModel")
const Maintenance = require("../../../models/technology/hardware/maintenanceModel")
const assignAction = require("../../handlers/members/assignAction")

const maintenanceController = {
    addMaintenance: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            const { description, date } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId)) {
                return res.status(404).json({ message: "ID de empresa o de hardware inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const hardware = await Hardware.findOne({
                technologyId: technology._id,
                _id: hardwareId
            })
            if (!hardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware" })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newMaintenance = new Maintenance({
                hardwareId: hardware._id,
                description,
                date,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            hardware.maintenances.push(newMaintenance._id)
            await newMaintenance.save()
            await hardware.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ hardware, technology })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getMaintenance: async function (req, res) {
        try {
            const { enterpriseId, hardwareId, maintenanceId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId) || !mongoose.Types.ObjectId.isValid(maintenanceId)) {
                return res.status(404).json({ message: "ID de empresa, de hardware o de mantenimiento inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const hardware = await Hardware.findOne({
                technologyId: technology._id,
                _id: hardwareId
            })
            if (!hardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware" })
            }
            const maintenance = await Maintenance.findOne({
                hardwareId: hardware._id,
                _id: maintenanceId
            })
            if (!maintenance) {
                return res.status(404).json({ message: "No se ha encontrado el mantenimiento." })
            }
            return res.status(200).json(maintenance)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllMaintenances: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId)) {
                return res.status(404).json({ message: "ID de empresa o de hardware inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const hardware = await Hardware.findOne({
                technologyId: technology._id,
                _id: hardwareId
            })
            if (!hardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware" })
            }
            const maintenances = await Maintenance.find({
                hardwareId: hardware._id
            })
            if (maintenances.length === 0) {
                return res.status(404).json({ message: "No se han encontrado mantenimientos" })
            }
            return res.status(200).json(maintenances)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateMaintenance: async function (req, res) {
        try {
            const { enterpriseId, hardwareId, maintenanceId } = req.params
            const { description, date } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId) || !mongoose.Types.ObjectId.isValid(maintenanceId)) {
                return res.status(404).json({ message: "ID de empresa, de hardware o de mantenimiento inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const hardware = await Hardware.findOne({
                technologyId: technology._id,
                _id: hardwareId
            })
            if (!hardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware" })
            }
            const updateData = {
                description, date
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedMaintenance = await Maintenance.findOneAndUpdate(
                { _id: maintenanceId, hardwareId: hardwareId },
                { $set: updateData },
                { new: true }
            )
            if (!updatedMaintenance) {
                return res.status(404).json({ message: "No se ha encontrado el mantenimiento" })
            }
            updatedMaintenance.updatedBy = {
                username: updatedBy.username,
                position: updatedBy.position,
                date: new Date()
            }
            await updatedMaintenance.save()
            return res.status(200).json(updatedMaintenance)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteMaintenance: async function (req, res) {
        try {
            const { enterpriseId, hardwareId, maintenanceId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId) || !mongoose.Types.ObjectId.isValid(maintenanceId)) {
                return res.status(404).json({ message: "ID de empresa, de hardware o de mantenimiento inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const hardware = await Hardware.findOne({
                technologyId: technology._id,
                _id: hardwareId
            })
            if (!hardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware." })
            }
            const maintenance = await Maintenance.findOneAndDelete({
                hardwareId: hardwareId,
                _id: maintenanceId
            })
            if (!maintenance) {
                return res.status(404).json({ message: "No se ha encontrado el mantenimiento." })
            }
            hardware.maintenances.pull(maintenanceId)
            await hardware.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ message: "Eliminado exitosamente.", hardware })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllMaintenances: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId)) {
                return res.status(404).json({ message: "ID de empresa o de hardware inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const hardware = await Hardware.findOne({
                technologyId: technology._id,
                _id: hardwareId
            })
            if (!hardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware." })
            }
            const deletedAllMaintenances = await Maintenance.deleteMany({
                hardwareId: hardware._id
            })
            if (deletedAllMaintenances.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado mantenimientos del hardware." })
            }
            const updatedHardware = await Hardware.findOneAndUpdate(
                { technologyId: technology._id, _id: hardwareId },
                { $pull: { maintenances: { $in: hardware.maintenances } } },
                { new: true }
            )
            if (!updatedHardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware." })
            }
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ message: "Eliminado exitosamente.", updatedHardware })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getMaintenancesByCustomDate: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            const { startDate, endDate } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId)) {
                return res.status(404).json({ message: "ID de empresa o de hardware inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const hardware = await Hardware.findOne({
                technologyId: technology._id,
                _id: hardwareId
            })
            if (!hardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware" })
            }
            if (!startDate || !endDate) {
                return res.status(400).json({ message: "Debes proporcionar fechas válidas para la consulta." })
            }
            const start = new Date(startDate)
            const end = new Date(endDate)
            const filteredMaintenancesByCustomDate = await Maintenance.find(
                {
                    hardwareId: hardwareId,
                    date: { $gte: start, $lte: end }
                },
            )
            console.log(filteredMaintenancesByCustomDate);

            if (filteredMaintenancesByCustomDate.length === 0) {
                return res.status(404).json({ message: "No hay mantenimientos registrados en las fechas proporcionadas." })
            }
            return res.status(200).json(filteredMaintenancesByCustomDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}

module.exports = maintenanceController