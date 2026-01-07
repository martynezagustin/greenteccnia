const mongoose = require("mongoose")
const Enterprise = require("../../models/enterpriseModel")
const SustainableTask = require("../../models/sustainability/sustainableTaskModel")
const SustainabilityEnterprise = require("../../models/sustainability/sustainabilityModel")
const Audit = require("../../models/sustainability/audit/auditModel")
const assignAction = require("../../controllers/handlers/members/assignAction")

const sustainableTaskController = {
    addSustainableTask: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { name, description, dateStart, dateEnd, impact, phasePDAC, auditId } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const validTypes = ["Bajo", "Mediano", "Alto"]
            if (!validTypes.includes(impact)) {
                return res.status(400).json({ message: "El tipo de impacto proporcionado no es válido." })
            }
            let audit
            if (auditId) {
                if (!mongoose.Types.ObjectId.isValid(auditId)) {
                    return res.status(404).json({ message: "ID de auditoría inválido." })
                }
                audit = await Audit.findOne({
                    sustainabilityEnterprise: sustainabilityEnterprise._id,
                    _id: auditId
                })
                if (!audit) {
                    return res.status(404).json({ message: "No se ha encontrado la auditoría relacionada." })
                }
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newSustainableTask = new SustainableTask({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                name,
                description,
                dateStart,
                dateEnd,
                impact,
                phasePDAC,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            if (auditId) {
                if (audit) {
                    newSustainableTask.auditId = audit._id
                }
            }
            sustainabilityEnterprise.sustainableTasks.push(newSustainableTask._id)
            await newSustainableTask.save()
            await sustainabilityEnterprise.save()
            enterprise.logsData.push({ event: "Añadido de tarea sustentable", date: new Date(), details: "Se ha añadido la tarea sustentable con éxito.", by: createdBy.username })
            await enterprise.save()
            return res.status(200).json({ newSustainableTask, sustainabilityEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSustainableTask: async function (req, res) {
        try {
            const { enterpriseId, sustainableTaskId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(sustainableTaskId)) {
                return res.status(404).json({ message: "ID de empresa o de tarea sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const sustainableTask = await SustainableTask.findOne({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: sustainableTaskId
            })
            if (!sustainableTask) {
                return res.status(404).json({ message: "No se ha encontrado la tarea sustentable." })
            }
            return res.status(200).json(sustainableTask)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSustainableTasks: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const allSustainableTasks = await SustainableTask.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (allSustainableTasks.length === 0) {
                return res.status(404).json({ message: "No se han encontrado tareas sustentables." })
            }
            return res.status(200).json(allSustainableTasks)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateSustainableTask: async function (req, res) {
        try {
            const { enterpriseId, sustainableTaskId } = req.params
            const { name, description, dateStart, dateEnd, impact, phasePDAC, auditId } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(sustainableTaskId)) {
                return res.status(404).json({ message: "ID de empresa o de tarea sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const validTypes = ["Bajo", "Mediano", "Alto"]
            if (!validTypes.includes(impact)) {
                return res.status(400).json({ message: "El tipo de impacto proporcionado no es válido." })
            }
            let audit
            if (auditId) {
                if (!mongoose.Types.ObjectId.isValid(auditId)) {
                    return res.status(404).json({ message: "ID de auditoría inválido." })
                }
                audit = await Audit.findOne({
                    sustainabilityEnterprise: sustainabilityEnterprise._id,
                    _id: auditId
                })
                if (!audit) {
                    return res.status(404).json({ message: "No se ha encontrado la auditoría relacionada." })
                }
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedSustainableTask = await SustainableTask.findOneAndUpdate({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: sustainableTaskId
            },
                {
                    name, description, dateStart, dateEnd, impact, phasePDAC, updatedBy: {
                        username: updatedBy.username,
                        position: updatedBy.position,
                        date: new Date()
                    }
                },
                {
                    new: true
                })
            if (auditId) {
                if (audit) {
                    updatedSustainableTask.auditId = audit._id
                }
            }
            if (!updatedSustainableTask) {
                return res.status(200).json({ message: "No se ha encontrado la tarea sustentable" })
            }
            enterprise.logsData.push({ event: "Actualización de tarea sustentable", date: new Date(), details: "Se ha actualizado la tarea sustentable con éxito.", by: updatedBy.username })
            await enterprise.save()
            return res.status(200).json(updatedSustainableTask)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteSustainableTask: async function (req, res) {
        try {
            const { enterpriseId, sustainableTaskId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(sustainableTaskId)) {
                return res.status(404).json({ message: "ID de empresa o de tarea sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const deletedSustainableTask = await SustainableTask.findOneAndDelete({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: sustainableTaskId
            })
            if (!deletedSustainableTask) {
                return res.status(404).json({ message: "No se ha encontrado la tarea sustentable." })
            }
            return res.status(200).json(deletedSustainableTask)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllSustainableTasks: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa o de tarea sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const deletedBy = await assignAction(req,res,enterprise)
            const deletedAllSustainableTasks = await SustainableTask.deleteMany({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (deletedAllSustainableTasks.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado tareas sustentables." })
            }
            const updatedSustainabilityEnterprise = await SustainabilityEnterprise.findOneAndUpdate({
                enterpriseId: enterprise._id
            }, {
                $pull: { sustainableTasks: { $in: sustainabilityEnterprise.sustainableTasks } }
            }, {
                new: true
            })
            if (!updatedSustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad de la empresa." })
            }
            enterprise.logsData.push({event: "Eliminado de tarea sustentable", date: new Date(), details: "Todas las tareas sustentables fueron eliminadas con éxito.", by: deletedBy.username})
            return res.status(200).json({ updatedSustainabilityEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainableTasksByCustomDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { start, end } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa o de tarea sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const startDate = new Date(start)
            const endDate = new Date(end)
            const filteredTasksByCustomDate = await SustainableTask.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                dateStart: startDate,
                dateEnd: endDate
            })
            if (filteredTasksByCustomDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado tareas sustentables en las fechas proporcionadas" })
            }
            return res.status(200).json(filteredTasksByCustomDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainableTasksByStartDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { startDate } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa o de tarea sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const filteredSustainableTasksByStartDate = await SustainableTask.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                dateStart: startDate
            })
            if (filteredSustainableTasksByStartDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado tareas sustentables en la fecha proporcionada." })
            }
            return res.status(200).json(filteredSustainableTasksByStartDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainableTasksByEndDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { endDate } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa o de tarea sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const filteredSustainableTasksByEndDate = await SustainableTask.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                dateEnd: endDate
            })
            if (filteredSustainableTasksByEndDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado tareas sustentables en la fecha proporcionada." })
            }
            return res.status(200).json(filteredSustainableTasksByEndDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainableTasksByImpact: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { impact } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa o de tarea sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const validTypes = ["Bajo", "Mediano", "Alto"]
            if (!validTypes.includes(impact)) {
                return res.status(400).json({ message: "Los valores proporcionados no son válidos." })
            }
            const filteredSustainableTasksByImpact = await SustainableTask.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                impact: impact
            })
            if (filteredSustainableTasksByImpact.length === 0) {
                return res.status(404).json({ message: "No se han encontrado tareas sustentables con el impacto proporcionado." })
            }
            return res.status(200).json(filteredSustainableTasksByImpact)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainableTasksByPhase: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { phasePDAC } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa o de tarea sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterpriseId })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const validTypes = ["Planificar", "Hacer", "Verificar", "Actuar"]
            if (!validTypes.includes(phasePDAC)) {
                return res.status(400).json({ message: "Los datos de filtrado proporcionados no son válidos." })
            }
            const filteredSustainableTasksByPhasePDAC = await SustainableTask.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                phasePDAC: phasePDAC
            })
            if (filteredSustainableTasksByPhasePDAC.length === 0) {
                return res.status(404).json({ message: "No se han encontrado tareas sustentables con el impacto proporcionado." })
            }
            return res.status(200).json(filteredSustainableTasksByPhasePDAC)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = sustainableTaskController