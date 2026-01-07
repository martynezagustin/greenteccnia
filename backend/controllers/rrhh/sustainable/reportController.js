const mongoose = require("mongoose")
const Enterprise = require("../../../models/enterpriseModel")
const RRHH = require("../../../models/rrhh/rrhhModel")
const Employee = require("../../../models/rrhh/employees/employeeModel")
const SustainableEmployee = require("../../../models/rrhh/sustainableRrhh/sustainableEmployeeModel")
const emissionFactors = require("../../../apis/carbon-footprint-api/emissionFactors")
const Assist = require("../../../models/rrhh/assistModel")
const Report = require("../../../models/rrhh/sustainableRrhh/reportModel")
const Technology = require("../../../models/technology/technologyModel")
const Use = require("../../../models/technology/hardware/useModel")
const carbonFootprintCalculatorToEmployee = require("../../handlers/sustainable/carbonFootprintCalculatorToEmployee")
const { isValidObjectId } = require("../../handlers/sustainable/helpers")
const setSustainableValuesToEnterprise = require("../../handlers/sustainable/setSustainableValuesToEnterprise")
const { setEmissions } = require("../../handlers/sustainable/setFactorEmissions")
const assignAction = require("../../handlers/members/assignAction")

const reportController = {
    addReport: async function (req, res) {
        try {
            const { enterpriseId, employeeId, assistId } = req.params
            const { paperUsage, wasteGenerated, otherEmissionsCO2, internalTransport, chemicalUsage } = req.body
            if (!isValidObjectId(enterpriseId) || !isValidObjectId(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })

            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })

            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })

            if (!sustainableEmployee) return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })

            const assist = await Assist.findOne({
                employeeId: employeeExists._id,
                _id: assistId
            })
            if (!assist) return res.status(404).json({ message: "No se ha encontrado la asistencia." })

            const reportExists = assist.reportId
            if (reportExists) return res.status(409).json({ message: "Ya existe un reporte." })

            if (isNaN(paperUsage.value) || isNaN(wasteGenerated.value)) return res.status(400).json({ message: "Los valores proporcionados no son válidos." })

            const technology = await Technology.findOne({
                enterpriseId: enterprise._id
            })

            if (!technology) return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            const createdBy = await assignAction(req, res, enterprise)
            const newReport = new Report({
                assistId: assist._id,
                paperUsage,
                wasteGenerated,
                otherEmissionsCO2,
                internalTransport,
                chemicalUsage,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            //empezando a hacer calculos
            //conjunto de emisiones totales
            let totalCO2 = 0
            totalCO2 += setEmissions(paperUsage, emissionFactors.paperUsage || 0)
            totalCO2 += setEmissions(wasteGenerated, emissionFactors.wasteGenerated?.[wasteGenerated?.process] || 0)
            totalCO2 += setEmissions(otherEmissionsCO2, emissionFactors.otherEmissionsCO2?.[otherEmissionsCO2?.source] || 0)
            totalCO2 += setEmissions(internalTransport, emissionFactors.internalTransport?.[internalTransport?.fuelType] || 0)
            totalCO2 += setEmissions(chemicalUsage, emissionFactors.chemicalUsage?.[chemicalUsage?.type])
            newReport.carbonFootprintKG = totalCO2
            //las guardamos aqui
            await newReport.save()
            console.log("Antes de actualizar", assist.carbonFootprintForAssist.value)
            assist.carbonFootprintForAssist.value += parseFloat(newReport.carbonFootprintKG)
            console.log("Post actualizar", assist.carbonFootprintForAssist.value)
            assist.reportId = newReport._id
            await assist.save()
            console.log("Se actualizó la asistencia?", assist)
            await carbonFootprintCalculatorToEmployee(employeeExists)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ newReport, assist, sustainableEmployee })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getReport: async function (req, res) {
        try {
            const { enterpriseId, employeeId, assistId, reportId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(assistId) || !mongoose.Types.ObjectId.isValid(reportId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado, de asistencia o de reporte." })
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
            const assist = await Assist.findOne({
                employeeId: employeeExists._id,
                _id: assistId
            })
            if (!assist) {
                return res.status(404).json({ message: "No se ha encontrado la asistencia." })
            }
            const report = await Report.findOne({
                assistId: assist._id,
                _id: reportId
            })
            if (!report) {
                return res.status(404).json({ message: "No se ha encontrado el reporte de asistencia." })
            }
            return res.status(200).json(report)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllReports: async function (req, res) {
        try {
            const { enterpriseId, employeeId, assistId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(assistId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado o de asistencia." })
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
            const assist = await Assist.findOne({
                employeeId: employeeExists._id,
                _id: assistId
            })
            if (!assist) {
                return res.status(404).json({ message: "No se encontró la asistencia." })
            }
            const reports = await Report.find({
                assistId: assist._id
            })
            if (reports.length === 0) {
                return res.status(404).json({ message: "No se han encontrado reportes." })
            }
            return res.status(200).json(reports)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateReport: async function (req, res) {
        try {
            const { enterpriseId, employeeId, assistId, reportId } = req.params
            const { paperUsage, wasteGenerated, otherEmissionsCO2, internalTransport, chemicalUsage } = req.body
            if (!isValidObjectId(enterpriseId) || !isValidObjectId(employeeId) || !isValidObjectId(assistId) || !isValidObjectId(reportId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado, de asistencia o de reporte." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })

            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })

            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })

            if (!sustainableEmployee) return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })

            const assist = await Assist.findOne({
                _id: assistId,
                reportId: reportId
            })
            if (!assist) return res.status(404).json({ message: "No se ha encontrado la asistencia." })
            //debemos obtener el reporte anterior para restar los datos
            const previousReport = await Report.findOne({
                _id: reportId,
                assistId: assist._id
            })

            if (!previousReport) return res.status(404).json({ message: "Debe obtenerse el reporte previo para hacer el cálculo nuevamente. No se ha encontrado." })
            //debemos restar el valor para luego sumarlo de nuevo
            //obtenemos la huella de carbono de la asistencia y le restamos el valor del reporte previo
            assist.carbonFootprintForAssist.value -= previousReport.carbonFootprintKG
            console.log("Ahora que se restó el valor previo del reporte, es el mismo que el original de la asistencia", assist.carbonFootprintForAssist.value)
            //ahora, debemos hacer el total de co2
            let totalCO2 = 0
            totalCO2 += setEmissions(paperUsage, emissionFactors.paperUsage || 0)
            totalCO2 += setEmissions(wasteGenerated, emissionFactors.wasteGenerated?.[wasteGenerated?.process] || 0)
            totalCO2 += setEmissions(otherEmissionsCO2, emissionFactors.otherEmissionsCO2?.[otherEmissionsCO2?.source] || 0)
            totalCO2 += setEmissions(internalTransport, emissionFactors.internalTransport?.[internalTransport?.fuelType] || 0)
            totalCO2 += setEmissions(internalTransport, emissionFactors.internalTransport?.[internalTransport?.fuelType] || 0)
            //actualizamos acá el reporte
            const updatedBy = await assignAssist(req, res, enterprise)
            const updatedReport = await Report.findOneAndUpdate({
                _id: reportId,
                assistId: assist._id
            }, {
                paperUsage,
                wasteGenerated,
                otherEmissionsCO2,
                internalTransport,
                chemicalUsage,
                carbonFootprintKG: totalCO2,
                updatedBy: {
                    username: updatedBy.username,
                    position: updatedBy.position,
                    date: new Date()
                }
            }, {
                new: true
            })
            if (!updatedReport) return res.status(404).json({ message: "No se ha encontrado el reporte." })
            //sumamos el kgCO2 a la asistencia
            assist.carbonFootprintForAssist.value += updatedReport.carbonFootprintKG
            await assist.save()
            await carbonFootprintCalculatorToEmployee(employeeExists)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ updatedReport, assist })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteReport: async function (req, res) {
        try {
            const { enterpriseId, employeeId, assistId, reportId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(assistId) || !mongoose.Types.ObjectId.isValid(reportId)) {
                return res.status(404).json({ message: "ID inválido de empresa, de empleado, de asistencia o reporte." })
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
            let assist = await Assist.findOne({
                employeeId: employeeExists._id,
                _id: assistId
            })
            if (!assist) {
                return res.status(404).json({ message: "No se ha encontrado la asistencia." })
            }
            const previousReport = await Report.findOne({
                _id: reportId, assistId: assist._id
            })
            console.log(previousReport)
            if (!previousReport) {
                return res.status(404).json({ message: "No se ha encontrado el reporte previo." })
            }
            const deleteReport = await Report.findOneAndDelete({
                _id: reportId,
                assistId: assist._id
            })
            if (!deleteReport) {
                return res.status(404).json({ message: "No se ha encontrado el reporte." })
            }
            console.log("Debe restarse", previousReport.carbonFootprintKG)
            assist.carbonFootprintForAssist.value -= parseFloat(previousReport.carbonFootprintKG).toFixed(2)
            await assist.save()
            assist = await Assist.findOneAndUpdate({
                employeeId: employeeExists._id,
                _id: assistId
            }, {
                $unset: { reportId: deleteReport._id }
            })
            console.log(assist)
            await carbonFootprintCalculatorToEmployee(employeeExists)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ message: "Eliminado exitosamente.", deleteReport, assist })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = reportController