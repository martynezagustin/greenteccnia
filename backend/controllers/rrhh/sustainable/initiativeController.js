const mongoose = require("mongoose")
const Enterprise = require("../../../models/enterpriseModel")
const RRHH = require("../../../models/rrhh/rrhhModel")
const Employee = require("../../../models/rrhh/employees/employeeModel")
const Initiative = require("../../../models/rrhh/sustainableRrhh/initiativeModel")
const SustainableEmployee = require("../../../models/rrhh/sustainableRrhh/sustainableEmployeeModel")
const updateSustainabilityScoreEmployee = require("../../handlers/sustainable/updateSustainabilityScoreEmployee")
const assignAction = require("../../handlers/members/assignAction")

const initiativeController = {
    addInitiative: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const { description, impact, date } = req.body
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
            const validTypes = ["Muy bajo", "Bajo", "Mediano", "Alto", "Muy alto"]
            if (!validTypes.includes(impact)) {
                return res.status(400).json({ message: "Tipo de impacto ingresado no válido." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newInitiative = new Initiative({
                sustainableEmployeeId: sustainableEmployee._id,
                description: description,
                impact: impact,
                date: date,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            sustainableEmployee.initiatives.push(newInitiative._id)
            await newInitiative.save()
            await updateSustainabilityScoreEmployee(sustainableEmployee, employeeExists, rrhhEnterprise, enterprise)
            return res.status(200).json({ employeeExists, sustainableEmployee, newInitiative })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getInitiative: async function (req, res) {
        try {
            const { enterpriseId, employeeId, initiativeId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(initiativeId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado o de iniciativa." })
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
            const initiative = await Initiative.findOne({
                sustainableEmployeeId: sustainableEmployee._id,
                _id: initiativeId
            })
            if (!initiative) {
                return res.status(404).json({ message: "No se ha encontrado la iniciativa." })
            }
            return res.status(200).json(initiative)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllInitiatives: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id }).populate("initiatives")
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const initiatives = sustainableEmployee.initiatives
            if (initiatives === 0) {
                return res.status(404).json({ message: "No se han encontrado certificaciones." })
            }
            return res.status(200).json(initiatives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateInitiative: async function (req, res) {
        try {
            const { enterpriseId, employeeId, initiativeId } = req.params
            const { description, impact, date } = req.body
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
            const validTypes = ["Muy bajo", "Bajo", "Mediano", "Alto", "Muy alto"]
            if (!validTypes.includes(impact)) {
                return res.status(400).json({ message: "Tipo de impacto ingresado no válido." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updateData = {
                description, impact, date, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() }
            }
            const updatedInitiative = await Initiative.findOneAndUpdate(
                { _id: initiativeId, sustainableEmployeeId: sustainableEmployee._id },
                { $set: updateData },
                { new: true }
            )
            if (!updatedInitiative) {
                return res.status(404).json({ message: "No se ha encontrado la iniciativa." })
            }
            await updateSustainabilityScoreEmployee(sustainableEmployee, employeeExists, rrhhEnterprise, enterprise)
            return res.status(200).json(updatedInitiative)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteInitiative: async function (req, res) {
        try {
            const { enterpriseId, employeeId, initiativeId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(initiativeId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado o de iniciativa." })
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
            const deleteInitiative = await Initiative.findOneAndDelete({
                _id: initiativeId,
                sustainableEmployeeId: sustainableEmployee._id
            })
            console.log(deleteInitiative);

            if (!deleteInitiative) {
                return res.status(404).json({ message: "No se ha encontrado la iniciativa." })
            }
            sustainableEmployee.initiatives.pull(initiativeId)
            await sustainableEmployee.save()
            await updateSustainabilityScoreEmployee(sustainableEmployee, employeeExists, rrhhEnterprise, enterprise)
            return res.status(200).json({ message: "Eliminado exitosamente.", deleteInitiative })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllInitiatives: async function (req, res) {
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
            const deletedAllInitiatives = await Initiative.deleteMany({
                sustainableEmployeeId: sustainableEmployee._id
            })
            if (deletedAllInitiatives.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado iniciativas del empleado." })
            }
            const updatedSustainableEmployee = await SustainableEmployee.findOneAndUpdate({
                _id: sustainableEmployee._id,
                employeeId: employeeExists._id
            }, {
                $pull: { initiatives: { $in: sustainableEmployee.initiatives } }
            }, {
                new: true
            })
            if (!updatedSustainableEmployee) return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad de la empresa." })
            await updateSustainabilityScoreEmployee(updatedSustainableEmployee, employeeExists, rrhhEnterprise, enterprise)
            return res.status(200).json({ message: "Eliminado exitoso de todas las iniciativas.", updatedSustainableEmployee })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getInitiativesByDate: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const { startDate, endDate } = req.query
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id }).populate("initiatives")
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            const filteredInitiatives = sustainableEmployee.initiatives.filter((initiative) => {
                const initiativeDate = new Date(initiative.date)
                return initiativeDate >= start && initiativeDate <= end
            })
            return res.status(200).json({ message: "Iniciativas filtradas: ", filteredInitiatives })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}

module.exports = initiativeController