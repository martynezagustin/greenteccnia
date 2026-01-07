const Project = require("../../models/projects/projectModel")
const Enterprise = require("../../models/enterpriseModel")
const SustainabilityEnterprise = require("../../models/sustainability/sustainabilityModel")
const Client = require("../../models/clients/clientModel")
const mongoose = require("mongoose")
const { convertToDays, calculateProgress } = require("../handlers/projects/handlersToProject")
const setSavingValuesToEnterprise = require("../handlers/projects/setSavingValuesToEnterprise")
const assignAction = require("../handlers/members/assignAction")

const projectController = {
    addProject: async function (req, res) {
        try {
            const { title, description, justification, startDate, endDate, budget, tasksAssigned, costs, ambientalImpact, clientId, employee, statusProject } = req.body
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            console.log(enterpriseId);

            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({
                enterpriseId: enterprise._id
            })
            if (!sustainabilityEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad de la empresa." })
            const projectExists = await Project.findOne({ enterpriseId: enterpriseId, title: title, description: description, justification: justification })
            if (projectExists) {
                return res.status(409).json({ error: "Ya existe un proyecto con similares características." })
            }
            const totalTasks = Array.isArray(tasksAssigned) ? tasksAssigned : []
            const completedTasks = []
            if (totalTasks != 0) {
                const filteredTasks = totalTasks.filter((task) => task.status === "Completada")
                completedTasks.push(...filteredTasks)
            }
            if (!ambientalImpact || !sustainabilityEnterprise) {
                return res.status(400).json({ message: "Los datos ambientales o de la sustentabilidad de la empresa no están disponibles." })
            }
            //comenzar a validar las unidades
            const { waterConsumptionReduction, energyConsumptionReduction, CO2ConsumptionReduction, scrapsReduction } = ambientalImpact
            const { estimatedSavings } = sustainabilityEnterprise
            if (waterConsumptionReduction.unit != estimatedSavings.water.unit ||
                energyConsumptionReduction.unit != estimatedSavings.consumptionKwh.unit ||
                CO2ConsumptionReduction.unit != estimatedSavings.CO2.unit ||
                scrapsReduction.unit != estimatedSavings.waste.unit) {
                return res.status(400).json({ message: "No coinciden las unidades con las que estableciste para la empresa. Por favor, vuelve a intentarlo." })
            }
            //comenzar a validar las frecuencias
            if (waterConsumptionReduction.frequency !== estimatedSavings.water.frequency || energyConsumptionReduction.frequency !== estimatedSavings.consumptionKwh.frequency || CO2ConsumptionReduction.frequency !== estimatedSavings.CO2.frequency || scrapsReduction.frequency !== estimatedSavings.waste.frequency) {
                return res.status(400).json({ message: "No coinciden las frecuencias de tiempo con las que estableciste para la empresa. Por favor, vuelve a intentarlo." })
            }
            const newPercentageProject = totalTasks.length > 0 ? (completedTasks.length / totalTasks.length) * 100 : 0
            const createdBy = await assignAction(req, res, enterprise)
            const newProject = new Project({
                enterpriseId: enterprise._id,
                title,
                description,
                justification,
                startDate,
                endDate,
                budget,
                tasksAssigned: tasksAssigned || [],
                costs: costs || [],
                ambientalImpact: {
                    waterConsumptionReduction: convertToDays(ambientalImpact.waterConsumptionReduction),
                    energyConsumptionReduction: convertToDays(ambientalImpact.energyConsumptionReduction),
                    CO2ConsumptionReduction: convertToDays(ambientalImpact.CO2ConsumptionReduction),
                    scrapsReduction: convertToDays(ambientalImpact.scrapsReduction),
                },
                employee,
                statusProject,
                percentageProject: newPercentageProject,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            newProject.client = clientId
            newProject.logsData.push({ event: "Creado del proyecto", details: "El proyecto fue creado exitosamente." })
            enterprise.projects.push(newProject._id)
            await newProject.save()
            await setSavingValuesToEnterprise(enterprise, sustainabilityEnterprise)
            await enterprise.save()
            return res.json({ newProject, enterprise, sustainabilityEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getProject: async function (req, res) {
        try {
            const { enterpriseId, projectId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const project = await Project.findOne({ _id: projectId, enterpriseId: enterpriseId })
            if (!project) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto." })
            }
            return res.json(project)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllProjects: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const projects = await Project.find({ enterpriseId })
            return res.json(projects)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateProject: async function (req, res) {
        try {
            const { title, description, justification, startDate, endDate, budget, tasksAssigned, costs, ambientalImpact, statusProject, clientId, employee } = req.body
            const { enterpriseId, projectId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto o no pertenece a la empresa." })
            }
            if (clientId) {
                if (!mongoose.Types.ObjectId.isValid(clientId)) {
                    return res.status(404).json({ message: "No es válido el cliente, no existe." })
                }
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({
                enterpriseId: enterprise._id
            })
            if (!sustainabilityEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad de la empresa." })
            const project = await Project.findOne({ _id: projectId, enterpriseId: enterpriseId })
            const client = await Client.findOne({ _id: clientId, enterpriseId: enterpriseId })
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const totalTasks = project.tasksAssigned || []
            const completedTasks = project.tasksAssigned.filter((task) => task.status === "Completado")
            const percentageProject = totalTasks.length > 0 ? (completedTasks.length / totalTasks.length) * 100 : 0
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedProject = await Project.findOneAndUpdate({ _id: projectId, enterpriseId: enterpriseId }, { title, description, justification, startDate, endDate, budget, tasksAssigned, costs, ambientalImpact, client: client, employee, percentageProject, statusProject, updatedBy: { username: updatedBy.username, position: updatedBy.username, date: new Date() } }, { new: true })
            if (!updatedProject) {
                return res.status(404).json({ message: "No se ha podido actualizar el proyecto." })
            }
            project.logsData.push({ event: "Actualizado del proyecto", details: "El proyecto fue actualizado exitosamente." })
            await setSavingValuesToEnterprise(enterprise, sustainabilityEnterprise)
            await enterprise.save()
            return res.status(200).json(updatedProject)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }

    },
    deleteProject: async function (req, res) {
        try {
            const { enterpriseId, projectId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto o no pertenece a la empresa." })
            }
            const project = await Project.findOne({ _id: projectId, enterpriseId: enterpriseId })
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({
                enterpriseId: enterprise._id
            })
            if (!sustainabilityEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad de la empresa." })
            const deletedProject = await Project.findOneAndDelete({ _id: projectId, enterpriseId: enterpriseId })
            if (!deletedProject) {
                return res.status(404).json({ message: "No se ha podido eliminar el proyecto. No existe." })
            }
            project.logsData.push({ event: "Borrado del proyecto", details: "El proyecto fue borrado exitosamente." })
            enterprise.projects.pull(projectId)
            await enterprise.save()
            await setSavingValuesToEnterprise(enterprise, sustainabilityEnterprise)
            return res.json(deletedProject)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllProjects: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({
                enterpriseId: enterprise._id
            })
            if (!sustainabilityEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad de la empresa." })
            const deletedAllProjects = await Project.deleteMany({
                enterpriseId: enterprise._id
            })
            if (deletedAllProjects.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado proyectos." })
            }
            const updatedEnterprise = await Enterprise.findOneAndUpdate(
                { _id: enterprise._id },
                { $pull: { projects: { $in: enterprise.projects } } },
                { new: true }
            )
            await setSavingValuesToEnterprise(enterprise, sustainabilityEnterprise)
            return res.status(200).json(updatedEnterprise)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    addTaskToProject: async function (req, res) {
        try {
            const { task, startDate, endDate, status } = req.body
            const { enterpriseId, projectId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const project = await Project.findOne({ _id: projectId, enterpriseId: enterpriseId })
            if (!project) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto." })
            }
            const enumTypes = ["Pendiente", "En progreso", "Completada"]
            if (!enumTypes.includes(status)) {
                return res.status(404).json({ error: "El campo ingresado como estado no es disponible." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            project.logsData.push({ event: "Añadido de tarea al proyecto", details: "La tarea al proyecto fue añadida exitosamente." })
            project.tasksAssigned.push({ task: task, startDate: startDate, endDate: endDate, status: status, createdBy: { username: createdBy.username, position: createdBy.position, date: new Date() } })
            await project.save()
            await enterprise.save()
            return res.json(project)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getTaskToProject: async function (req, res) {
        try {
            const { enterpriseId, projectId, taskId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const project = await Project.findOne({ _id: projectId, enterpriseId: enterpriseId })
            if (!project) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto." })
            }
            const task = project.tasksAssigned.find((task) => task._id.toString() === taskId)
            if (!task) {
                return res.status(404).json({ message: "No se ha encontrado la tarea." })
            }
            return res.json(task)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllTaskToProject: async function (req, res) {
        try {
            const { enterpriseId, projectId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const project = await Project.findOne({ _id: projectId, enterpriseId: enterpriseId })
            if (!project) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto." })
            }
            return res.json(project.tasksAssigned)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateTaskToProject: async function (req, res) {
        try {
            const { task, startDate, endDate, status } = req.body
            const { enterpriseId, projectId, taskId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const project = await Project.findOne({ _id: projectId, enterpriseId: enterpriseId })
            if (!project) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto." })
            }
            const enumTypes = ["Pendiente", "En progreso", "Completada"]
            const validTypes = []
            validTypes.push(...enumTypes)
            if (!validTypes.includes(status)) {
                return res.status(404).json({ error: "El campo ingresado como estado no es disponible." })
            }
            const updateData = {}
            if (task) updateData[`tasksAssigned.$.task`] = task
            if (startDate) updateData[`tasksAssigned.$.startDate`] = startDate
            if (endDate) updateData[`tasksAssigned.$.endDate`] = endDate
            if (status) updateData[`tasksAssigned.$.status`] = status
            const taskUpdated = await Project.findOneAndUpdate(
                { _id: projectId, enterpriseId: enterpriseId, ['tasksAssigned._id']: taskId },
                { $set: updateData },
                { new: true }
            )
            if (!taskUpdated) {
                return res.status(404).json({ message: "No se ha podido actualizar la tarea." })
            }
            project.logsData.push({ event: "Actualización de tarea al proyecto", details: "La tarea al proyecto fue actualizada exitosamente." })
            const getTaskUpdated = project["tasksAssigned"].find((task) => task._id.toString() === taskId)
            calculateProgress(project.tasksAssigned)
            return res.status(200).json(getTaskUpdated)
        } catch (error) {
            return res.status(500).json({ message: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteTaskToProject: async function (req, res) {
        try {
            const { enterpriseId, projectId, taskId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const project = await Project.findOne({ _id: projectId, enterpriseId: enterpriseId })
            if (!project) {
                return res.status(404).json({ message: "No se ha encontrado el proyecto." })
            }
            const task = project["tasksAssigned"].id(taskId)
            if (task) {
                project.tasksAssigned.pull(taskId)
            } else {
                return res.status(404).json({ message: "No se ha encontrado la tarea." })
            }
            project.logsData.push({ event: "Borrado de tarea al proyecto", details: "La tarea al proyecto fue eliminada exitosamente." })
            await project.save()
            await enterprise.save()
            calculateProgress(project.tasksAssigned)
            return res.status(200).json(task)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}


module.exports = projectController