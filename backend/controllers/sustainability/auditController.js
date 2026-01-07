const mongoose = require("mongoose")
const Audit = require("../../models/sustainability/audit/auditModel")
const Enterprise = require("../../models/enterpriseModel")
const SustainabilityEnterprise = require("../../models/sustainability/sustainabilityModel")
const SustainableObjective = require("../../models/sustainability/sustainableObjectiveModel")
const SustainablePolitic = require("../../models/sustainability/sustainablePoliticModel")
const SustainableTask = require("../../models/sustainability/sustainableTaskModel")
const RRHH = require("../../models/rrhh/rrhhModel")
const Employee = require("../../models/rrhh/employees/employeeModel")
const assignAction = require("../handlers/members/assignAction")

const auditController = {
    addAudit: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { date, observations, objectivesInvolved, tasksInvolved, scope, documents, phasePDAC, teamAuditor } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({
                enterpriseId
            })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const existsSustainablePolitics = await SustainablePolitic.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (existsSustainablePolitics.length === 0) {
                return res.status(400).json({ message: "Lo sentimos, pero para añadir una auditoría debes tener definida al menos 1 política sustentable." })
            }
            //comenzar a filtrar tareas
            let sustainableTasksFound = []
            if (tasksInvolved) {
                for (const task of tasksInvolved) {
                    const tasksName = Array.isArray(task.name) ? task.name : [task.name]
                    const sustainableTasks = await SustainableTask.find({
                        sustainabilityEnterprise: sustainabilityEnterprise._id,
                        name: { $in: tasksName }
                    })
                    sustainableTasksFound.push(...sustainableTasks)
                }
            }
            //comenzar a filtrar objetivos
            let sustainableObjectivesFound = []
            if (objectivesInvolved) {
                for (const objective of objectivesInvolved) {
                    const objectivesTitle = Array.isArray(objective.title) ? objective.title : [objective.title]
                    const sustainableObjectives = await SustainableObjective.find({
                        sustainabilityEnterprise: sustainabilityEnterprise._id,
                        title: { $in: objectivesTitle }
                    })
                    sustainableObjectivesFound.push(...sustainableObjectives)
                }
            }
            //comenzar a filtrar empleados
            let employeesFound = []
            if (teamAuditor) {
                for (const employeeExists of teamAuditor) {
                    const employeesName = Array.isArray(employeeExists.name) ? employeeExists.name : [employeeExists.name]
                    const employeesLastname = Array.isArray(employeeExists.lastname) ? employeeExists.lastname : [employeeExists.lastname]
                    const employeesEmail = Array.isArray(employeeExists.email) ? employeeExists.email : [employeeExists.email]

                    const employees = await Employee.find({
                        enterpriseId: enterprise._id,
                        "personalInfo.name": { $in: employeesName },
                        "personalInfo.lastname": { $in: employeesLastname },
                        "personalInfo.email": { $in: employeesEmail }
                    })
                    employeesFound.push(...employees)
                    if (employees.length === 0) {
                        return res.status(404).json({ message: "No se encontraron los empleados proporcionados." })
                    }
                }
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newAudit = new Audit({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                date,
                observations,
                scope,
                phasePDAC,
                documents,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            //filtrado de tareas sustentables
            let filteredSustainableTasks = []
            if (tasksInvolved) {
                for (const task of sustainableTasksFound) {
                    filteredSustainableTasks.push({
                        sustainableTaskId: task._id,
                        name: task.name
                    })
                }
            }
            //filtrado de objetivos sustentables
            let filteredSustainableObjectives = []
            if (objectivesInvolved) {
                for (const objective of sustainableObjectivesFound) {
                    filteredSustainableObjectives.push({
                        sustainableObjectiveId: objective._id,
                        title: objective.title
                    })
                }
            }
            //filtrado de empleados
            let filteredEmployees = []
            if (teamAuditor) {
                for (const employee of employeesFound) {
                    filteredEmployees.push({
                        employeeId: employee._id,
                        name: employee.personalInfo.name,
                        lastname: employee.personalInfo.lastname,
                        email: employee.personalInfo.email
                    })
                }
            }
            newAudit.tasksInvolved = filteredSustainableTasks
            newAudit.objectivesInvolved = filteredSustainableObjectives
            newAudit.teamAuditor = filteredEmployees
            sustainabilityEnterprise.audits.push(newAudit._id)
            await newAudit.save()
            await sustainabilityEnterprise.save()
            enterprise.logsData.push({ event: "Añadido de auditoría", date: new Date(), details: "Se ha añadido una auditoría con éxito.", by: createdBy.username })
            await enterprise.save()
            return res.status(200).json({ newAudit, sustainabilityEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAudit: async function (req, res) {
        try {
            const { enterpriseId, auditId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(auditId)) {
                return res.status(404).json({ message: "ID de empresa o de auditoría inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const audit = await Audit.findOne({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: auditId
            })
            if (!audit) {
                return res.status(404).json({ message: "No se ha encontrado la auditoría" })
            }
            return res.status(200).json({ audit, sustainabilityEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllAudits: async function (req, res) {
        try {
            const { enterpriseId, auditId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(auditId)) {
                return res.status(404).json({ message: "ID de empresa o de auditoría inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const allAudits = await Audit.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (allAudits.length === 0) {
                return res.status(404).json({ message: "No se han encontrado auditorías." })
            }
            return res.status(200).json(allAudits)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateAudit: async function (req, res) {
        try {
            const { enterpriseId, auditId } = req.params
            const { date, observations, objectivesAccomplished, tasksAccomplished, scope, documents, teamAuditor, phasePDAC } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(auditId)) {
                return res.status(404).json({ message: "ID de empresa o de auditoría inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({
                enterpriseId
            })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            //comenzar a filtrar tareas
            let sustainableTasksFound = []
            if (tasksAccomplished) {
                for (const task of tasksAccomplished) {
                    const tasksName = Array.isArray(task.name) ? task.name : [task.name]
                    const sustainableTasks = await SustainableTask.find({
                        sustainabilityEnterprise: sustainabilityEnterprise._id,
                        name: { $in: tasksName }
                    })
                    sustainableTasksFound.push(...sustainableTasks)
                }
            }
            //comenzar a filtrar objetivos
            let sustainableObjectivesFound = []
            if (objectivesAccomplished) {
                for (const objective of objectivesAccomplished) {
                    const objectivesTitle = Array.isArray(objective.title) ? objective.title : [objective.title]
                    const sustainableObjectives = await SustainableObjective.find({
                        sustainabilityEnterprise: sustainabilityEnterprise._id,
                        title: { $in: objectivesTitle }
                    })
                    sustainableObjectivesFound.push(...sustainableObjectives)
                }
            }
            //comenzar a filtrar empleados
            let employeesFound = []
            if (teamAuditor) {
                for (const employeeExists of teamAuditor) {
                    const employeesName = Array.isArray(employeeExists.name) ? employeeExists.name : [employeeExists.name]
                    const employeesLastname = Array.isArray(employeeExists.lastname) ? employeeExists.lastname : [employeeExists.lastname]
                    const employeesIdentityCard = Array.isArray(employeeExists.identityCard) ? employeeExists.identityCard : [employeeExists.identityCard]

                    const employees = await Employee.find({
                        enterpriseId: enterprise._id,
                        "personalInfo.name": { $in: employeesName },
                        "personalInfo.lastname": { $in: employeesLastname },
                        "personalInfo.identityCard": { $in: employeesIdentityCard }
                    })
                    employeesFound.push(...employees)
                }
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedAudit = await Audit.findOneAndUpdate({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: auditId
            }, {
                date,
                observations,
                scope,
                documents,
                phasePDAC,
                updatedBy: {
                    username: updatedBy.username,
                    position: updatedBy.position,
                    date: new Date()
                }
            }, {
                new: true
            })
            //filtrado de tareas sustentables
            let filteredSustainableTasks = []
            if (tasksAccomplished) {
                for (const task of sustainableTasksFound) {
                    filteredSustainableTasks.push({
                        sustainableTaskId: task._id,
                        name: task.name
                    })
                }
            }
            //filtrado de objetivos sustentables
            let filteredSustainableObjectives = []
            if (objectivesAccomplished) {
                for (const objective of sustainableObjectivesFound) {
                    filteredSustainableObjectives.push({
                        sustainableObjectiveId: objective._id,
                        title: objective.title
                    })
                }
            }
            //filtrado de empleados
            let filteredEmployees = []
            if (teamAuditor) {
                for (const employee of employeesFound) {
                    filteredEmployees.push({
                        employeeId: employee._id,
                        name: employee.personalInfo.name,
                        lastname: employee.personalInfo.lastname,
                        identityCard: employee.personalInfo.identityCard
                    })
                }
            }
            if (!updatedAudit) {
                return res.status(404).json({ message: "No se ha encontrado la auditoría." })
            }
            updatedAudit.tasksAccomplished = filteredSustainableTasks
            updatedAudit.objectivesAccomplished = filteredSustainableObjectives
            updatedAudit.teamAuditor = filteredEmployees
            enterprise.logsData.push({ event: "Actualización de auditoría", date: new Date(), details: "Se ha actualizado una auditoría con éxito.", by: updatedBy.username })
            await enterprise.save()
            return res.status(200).json(updatedAudit)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAudit: async function (req, res) {
        try {
            const { enterpriseId, auditId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(auditId)) {
                return res.status(404).json({ message: "ID de empresa o de auditoría inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const deletedBy = await assignAction(req, res, enterprise)
            const deletedAudit = await Audit.findOneAndDelete({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: auditId
            })
            if (!deletedAudit) {
                return res.status(404).json({ message: "No se ha encontrado la auditoría." })
            }
            sustainabilityEnterprise.audits.pull(deletedAudit._id)
            await sustainabilityEnterprise.save()
            enterprise.logsData.push({ event: "Eliminado de auditoría", date: new Date(), details: "Se ha eliminado una auditoría con éxito.", by: deletedBy.username })
            await enterprise.save()
            return res.status(200).json(deletedAudit)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllAudits: async function (req, res) {
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
            const deletedAllAudits = await Audit.deleteMany({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (deletedAllAudits.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado auditorías." })
            }
            const deletedBy = await assignAction(req, res, enterprise)
            const updatedSustainabilityEnterprise = await SustainabilityEnterprise.findOneAndUpdate({
                _id: sustainabilityEnterprise._id
            }, {
                $pull: { audits: { $in: sustainabilityEnterprise.audits } }
            })
            if (!updatedSustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad de la empresa." })
            }
            enterprise.logsData.push({ event: "Eliminado de todas las auditorías", date: new Date(), details: "Se han eliminado todas las auditorías con éxito.", by: deletedBy.username })
            await enterprise.save()
            return res.status(200).json(sustainabilityEnterprise)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterAuditsByDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { date } = req.query
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
            const filteredAuditsByDate = await Audit.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                date: date
            })
            if (filteredAuditsByDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado auditorías en la fecha proporcionada." })
            }
            return res.status(200).json(filteredAuditsByDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterAuditsByCustomDates: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { startDate, endDate } = req.query
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
            const start = new Date(startDate)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            const filteredAuditsByCustomDates = await Audit.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                date: { $gte: start, $lte: end }
            })
            if (filteredAuditsByCustomDates.length === 0) {
                return res.status(404).json({ message: "No se han encontrado auditorías en el mes." })
            }
            return res.status(200).json(filteredAuditsByCustomDates)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterAuditsByCurrentMonth: async function (req, res) {
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
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const currentYear = actualDate.getFullYear()
            const startDate = new Date(currentYear, currentMonth, 1)
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(currentYear, currentMonth, 31)
            endDate.setUTCHours(23, 59, 59, 999)
            const filteredAuditsByMonth = await Audit.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                date: { $gte: startDate, $lte: endDate }
            })
            if (filteredAuditsByMonth.length === 0) {
                return res.status(404).json({ message: "No se han encontrado auditorías en el mes." })
            }
            return res.status(200).json(filteredAuditsByMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterAuditsByCurrentWeek: async function (req, res) {
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
            const actualDate = new Date()
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDate.setUTCHours(23, 59, 59, 999)
            const filteredAuditsByWeek = await Audit.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                date: { $gte: startDate, $lte: endDate }
            })
            if (filteredAuditsByWeek.length === 0) {
                return res.status(404).json({ message: "No se han encontrado auditorías en la semana." })
            }
            return res.status(200).json(filteredAuditsByWeek)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterAuditsByCurrentYear: async function (req, res) {
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
            //inicializar fechas
            const actualDate = new Date()
            const startCurrentYear = new Date(actualDate.getFullYear(), 0, 1)
            startCurrentYear.setUTCHours(0, 0, 0, 0)
            const endCurrentYear = new Date(actualDate.getFullYear(), 11, 31)
            endCurrentYear.setUTCHours(23, 59, 59, 999)
            const filteredAuditsByYear = await Audit.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                date: { $gte: startCurrentYear, $lte: endCurrentYear }
            })
            if (filteredAuditsByYear.length === 0) {
                return res.status(404).json({ message: "No se han encontrado auditorías en el año." })
            }
            return res.status(200).json(filteredAuditsByYear)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = auditController