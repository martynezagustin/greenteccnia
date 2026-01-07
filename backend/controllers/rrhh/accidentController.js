const mongoose = require("mongoose")
const Accident = require("../../models/rrhh/accidents/accidentModel")
const Enterprise = require("../../models/enterpriseModel")
const RRHH = require("../../models/rrhh/rrhhModel")
const Employee = require("../../models/rrhh/employees/employeeModel")
const assignAction = require("../handlers/members/assignAction")

const accidentController = {
    addAccident: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const { date, place, description, typeAccident, signs, consequences, daysOff, medicalAttention, nonExistentSymptoms } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
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
            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id, _id: employeeId
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newAccident = new Accident({
                employee: {
                    employeeId: employeeExists._id,
                    name: employeeExists.personalInfo.name,
                    lastname: employeeExists.personalInfo.lastname
                },
                date,
                place,
                description,
                typeAccident,
                signs,
                consequences,
                daysOff,
                medicalAttention,
                nonExistentSymptoms
            })
            newAccident.createdBy = {
                username: createdBy.username,
                position: createdBy.position,
                date: new Date()
            }
            await newAccident.save()
            employeeExists.accidents.push(newAccident._id)
            await employeeExists.save()
            await rrhhEnterprise.save()
            await enterprise.save()
            return res.status(200).json({ message: "Accidente añadido.", newAccident, employeeExists })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAccident: async function (req, res) {
        try {
            const { enterpriseId, employeeId, accidentId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(accidentId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de asistencia o de empleado." })
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
            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id, _id: employeeId
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const accident = await Accident.findOne({
                _id: accidentId,
                "employee.employeeId": employeeExists._id,
            })
            if (!accident) {
                return res.status(404).json({ message: "No se ha encontrado el accidente de trabajo." })
            }
            return res.status(200).json(accident)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllAccidents: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
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
            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id, _id: employeeId
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const accidents = await Accident.find({
                employee: {
                    employeeId: employeeExists._id,
                    name: employeeExists.personalInfo.name,
                    lastname: employeeExists.personalInfo.lastname,
                }
            })
            if (accidents.length === 0) {
                return res.status(404).json({ message: "No se han encontrado accidentes de trabajo." })
            }
            return res.status(200).json(accidents)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAccident: async function (req, res) {
        try {
            const { enterpriseId, employeeId, accidentId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(accidentId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de asistencia o de empleado." })
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
            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id, _id: employeeId
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const deletedAccident = await Accident.findOneAndDelete({
                _id: accidentId,
                "employee.employeeId": employeeExists._id,
            })
            if (!deletedAccident) {
                return res.status(404).json({ message: "No se ha encontrado el accidente." })
            }
            employeeExists.accidents.pull(accidentId)
            await employeeExists.save()
            return res.status(200).json(deletedAccident)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllAccidents: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de accidente." })
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
            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id, _id: employeeId
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const deletedAllAccidents = await Accident.deleteMany(
                { "employee.employeeId": employeeExists._id, }
            )
            if (deletedAllAccidents.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado accidentes laborales." })
            }
            const updatedEmployee = await Employee.findOneAndUpdate(
                { _id: employeeExists._id, rrhhEnterprise: rrhhEnterprise._id },
                { $pull: { accidents: { $in: employeeExists.accidents } } },
                { new: true }
            )
            if (!updatedEmployee) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            return res.status(200).json(updatedEmployee)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateAccident: async function (req, res) {
        try {
            const { enterpriseId, employeeId, accidentId } = req.params
            const { date, place, description, typeAccident, signs, consequences, daysOff, medicalAttention, nonExistentSymptoms } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(accidentId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de asistencia o de empleado." })
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
            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id, _id: employeeId
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updateData = {
                date, place, description, typeAccident, signs, consequences, daysOff, medicalAttention, nonExistentSymptoms
            }
            const updatedAccident = await Accident.findOneAndUpdate(
                {
                    _id: accidentId,
                    "employee.employeeId": employeeExists._id,
                },
                { $set: updateData },
                { new: true }
            )
            updatedAccident.updatedBy = {
                username: updatedBy.username,
                position: updatedBy.position,
                date: new Date()
            }
            if (!updatedAccident) {
                return res.status(404).json({ message: "No se ha encontrado el accidente de trabajo." })
            }
            await updatedAccident.save()
            return res.status(200).json(updatedAccident)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAccidentsByCustomDate: async function (req, res) {
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
            const rrhhEnterprise = await RRHH.findOne({
                enterpriseId
            })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })
            }
            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id, _id: employeeId
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const start = new Date(startDate)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)

            const filteredAccidentsByCustomDate = await Accident.find({
                "employee.employeeId": employeeExists._id,
                date: {
                    $gte: start,
                    $lte: end
                }
            })
            if (filteredAccidentsByCustomDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias de la fecha." })
            }
            return res.status(200).json(filteredAccidentsByCustomDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = accidentController