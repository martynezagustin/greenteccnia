const Enterprise = require("../../../models/enterpriseModel")
const RRHH = require("../../../models/rrhh/rrhhModel")
const Employee = require("../../../models/rrhh/employees/employeeModel")
const SustainableEmployee = require("../../../models/rrhh/sustainableRrhh/sustainableEmployeeModel")
const Certification = require("../../../models/rrhh/sustainableRrhh/certificationModel")
const mongoose = require("mongoose")
const assignAction = require("../../handlers/members/assignAction")


const certificationController = {
    addCertification: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const { name, institution, date, details } = req.body
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
            const certificationExists = await Certification.findOne({
                name: name,
                institution: institution
            })
            if (certificationExists) {
                return res.status(409).json({ message: "Ya existe esta certificación." })
            }
            const createdBy = assignAction(req, res, enterprise)
            const newCertification = new Certification({
                sustainableEmployeeId: sustainableEmployee._id,
                name,
                institution,
                date,
                details,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            sustainableEmployee.certifications.push(newCertification._id)
            await newCertification.save()
            await sustainableEmployee.save()
            await employeeExists.save()
            await rrhhEnterprise.save()
            await enterprise.save()
            return res.status(200).json({ newCertification, sustainableEmployee, employeeExists })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getCertification: async function (req, res) {
        try {
            const { enterpriseId, employeeId, certificationId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(certificationId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado o de certificación." })
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
            const certification = await Certification.findOne({
                _id: certificationId,
                sustainableEmployeeId: sustainableEmployee._id
            })
            if (!certification) {
                return res.status(404).json({ message: "No se ha encontrado la certificación." })
            }
            return res.status(200).json(certification)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllCertifications: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id }).populate("certifications")
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const certifications = sustainableEmployee.certifications
            if (certifications === 0) {
                return res.status(404).json({ message: "No se han encontrado certificaciones." })
            }
            return res.status(200).json(certifications)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateCertification: async function (req, res) {
        try {
            const { enterpriseId, employeeId, certificationId } = req.params
            const { name, institution, date, details } = req.body
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
            const updatedBy = await assignAction(req, res, enterprise)
            const updateData = {
                name, institution, date, details, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() }
            }
            const updatedCertification = await Certification.findOneAndUpdate(
                { _id: certificationId, sustainableEmployeeId: sustainableEmployee._id },
                { $set: updateData },
                { new: true }
            )
            if (!updatedCertification) {
                return res.status(404).json({ message: "No se ha encontrado la certificación." })
            }
            return res.status(200).json(updatedCertification)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteCertification: async function (req, res) {
        try {
            const { enterpriseId, employeeId, certificationId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(certificationId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado o de certificación." })
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
            const deleteCertification = await Certification.findOneAndDelete({
                _id: certificationId,
                sustainableEmployeeId: sustainableEmployee._id
            })
            console.log(deleteCertification);

            if (!deleteCertification) {
                return res.status(404).json({ message: "No se ha encontrado la certificación." })
            }
            sustainableEmployee.certifications.pull(certificationId)
            await sustainableEmployee.save()
            return res.status(200).json({ message: "Eliminado exitosamente.", deleteCertification })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllCertifications: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).jon({ message: "ID de empresa o de empleado inválido." })
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
            const deletedAllCertifications = await Certification.deleteMany({
                sustainableEmployeeId: sustainableEmployee._id
            })
            if (deletedAllCertifications.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado certificaciones del empleado." })
            }
            const updatedSustainableEmployee = await SustainableEmployee.findOneAndUpdate({
                _id: sustainableEmployee._id
            }, {
                $pull: { certifications: { $in: sustainableEmployee.certifications } }
            }, {
                new: true
            })
            if (!updatedSustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad del empleado." })
            }
            return res.status(200).json(updatedSustainableEmployee)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getCertificationsByDate: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id }).populate("certifications")
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            const filteredCertifications = sustainableEmployee.certifications.filter((certification) => {
                const certificationDate = new Date(certification.date)
                return certificationDate >= start && certificationDate <= end
            })
            return res.status(200).json({ message: "Certificaciones filtradas: ", filteredCertifications })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}

module.exports = certificationController