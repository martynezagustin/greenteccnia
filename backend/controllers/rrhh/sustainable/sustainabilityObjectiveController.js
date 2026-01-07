const mongoose = require("mongoose")
const Enterprise = require("../../../models/enterpriseModel")
const RRHH = require("../../../models/rrhh/rrhhModel")
const Employee = require("../../../models/rrhh/employees/employeeModel")
const SustainableEmployee = require("../../../models/rrhh/sustainableRrhh/sustainableEmployeeModel")
const SustainabilityObjective = require("../../../models/rrhh/sustainableRrhh/sustainableObjective")
const assignAction = require("../../handlers/members/assignAction")

const sustainabilityObjectiveController = {
    addSustainabilityObjective: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const { description, startDate, endDate, status } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newSustainableObjective = new SustainabilityObjective({
                sustainableEmployeeId: sustainableEmployee._id,
                description: description,
                startDate: startDate,
                endDate: endDate,
                status: status,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            sustainableEmployee.sustainabilityObjectives.push(newSustainableObjective._id)
            await newSustainableObjective.save()
            await sustainableEmployee.save()
            await employeeExists.save()
            await rrhhEnterprise.save()
            await enterprise.save()
            return res.status(200).json({ message: "Nuevo objetivo sustentable", newSustainableObjective })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSustainabilityObjective: async function (req, res) {
        try {
            const { enterpriseId, employeeId, sustainabilityObjectiveId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(sustainabilityObjectiveId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado o de objetivo sustentable." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const sustainableObjective = await SustainabilityObjective.findOne({
                sustainableEmployeeId: sustainableEmployee._id,
                _id: sustainabilityObjectiveId
            })
            if (!sustainableObjective) {
                return res.status(404).json({ message: "No se ha encontrado el objetivo sustentable." })
            }
            return res.status(200).json(sustainableObjective)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSustainabilityObjectives: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id }).populate("sustainabilityObjectives")
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const sustainabilityObjectives = sustainableEmployee.sustainabilityObjectives
            if (sustainabilityObjectives === 0) {
                return res.status(404).json({ message: "No se han encontrado certificaciones." })
            }
            return res.status(200).json(sustainabilityObjectives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateSustainabilityObjective: async function (req, res) {
        try {
            const { enterpriseId, employeeId, sustainabilityObjectiveId } = req.params
            const { description, startDate, endDate, status } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(sustainabilityObjectiveId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado o de objetivo sustentable." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updateData = {
                description, startDate, endDate, status
            }
            const updateSustainabilityObjective = await SustainabilityObjective.findOneAndUpdate(
                { _id: sustainabilityObjectiveId, sustainableEmployeeId: sustainableEmployee._id },
                { $set: updateData },
                { new: true }
            )
            updateSustainabilityObjective.updatedBy = {
                username: updatedBy.username,
                position: updatedBy.position,
                date: new Date()
            }
            if (!updateSustainabilityObjective) {
                return res.status(404).json({ message: "No se ha encontrado el objetivo sustentable." })
            }
            return res.status(200).json(updateSustainabilityObjective)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteSustainabilityObjective: async function (req, res) {
        try {
            const { enterpriseId, employeeId, sustainabilityObjectiveId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(sustainabilityObjectiveId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado o de objetivo sustentable." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })

            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const deleteSustainabilityObjective = await SustainabilityObjective.findOneAndDelete({
                _id: sustainabilityObjectiveId,
                sustainableEmployeeId: sustainableEmployee._id
            })
            console.log(deleteSustainabilityObjective);

            if (!deleteSustainabilityObjective) {
                return res.status(404).json({ message: "No se ha encontrado el objetivo sustentable." })
            }
            sustainableEmployee.sustainabilityObjectives.pull(sustainabilityObjectiveId)
            await sustainableEmployee.save()
            return res.status(200).json({ message: "Eliminado exitosamente.", deleteSustainabilityObjective })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllSustainabilityObjectives: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID de empresa o de empleado inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })

            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const deletedAllSustainableObjectives = await SustainabilityObjective.deleteMany({
                sustainableEmployeeId: sustainableEmployee._id
            })
            if (deletedAllSustainableObjectives.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado objetivos sustentables." })
            }
            const updatedSustainableEmployee = await SustainableEmployee.findOneAndUpdate({
                _id: sustainableEmployee._id
            }, {
                $pull: { sustainabilityObjectives: { $in: sustainableEmployee.sustainabilityObjectives } }
            })
            if (!updatedSustainableEmployee) return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad del empleado." })
            return res.status(200).json({ message: "Todos los objetivos sustentables eliminados.", updatedSustainableEmployee })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = sustainabilityObjectiveController