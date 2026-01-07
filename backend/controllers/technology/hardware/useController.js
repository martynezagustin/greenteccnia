const mongoose = require("mongoose")
const Enterprise = require("../../../models/enterpriseModel")
const Technology = require("../../../models/technology/technologyModel")
const Hardware = require("../../../models/technology/hardware/hardwareModel")
const RRHH = require("../../../models/rrhh/rrhhModel")
const Employee = require("../../../models/rrhh/employees/employeeModel")
const Use = require("../../../models/technology/hardware/useModel")
const Report = require("../../../models/rrhh/sustainableRrhh/reportModel")
const Assist = require("../../../models/rrhh/assistModel")
const calculateCarbonFootprintByKwh = require("../../handlers/sustainable/calculateCarbonFootprintKwh")
const calculateTotalCarbonFootprintPerHardware = require("../../handlers/sustainable/calculateTotalCarbonFootprintPerHardware")
const carbonFootprintCalculatorToEmployee = require("../../handlers/sustainable/carbonFootprintCalculatorToEmployee")
const setSustainableValuesToEnterprise = require("../../handlers/sustainable/setSustainableValuesToEnterprise")
const assignAction = require("../../handlers/members/assignAction")

const useController = {

    addUse: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            const { detailsOrNotes, employee, hours, date, factorEmission } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
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
            if (isNaN(hours) || (hours) <= 0) {
                return res.status(400).json({ message: "Debe ser un número positivo el consumo de kWh." })
            }
            const rrhhEnterprise = await RRHH.findOne({
                enterpriseId: enterprise._id
            })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })

            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id,
                "personalInfo.name": employee.name,
                "personalInfo.lastname": employee.lastname
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            if (hours > 24) {
                return res.status(400).json({ message: "No pueden asignarse más de 24 horas al uso de un hardware en un día. Va en contra de la lógica." })
            }
            const useExists = await Use.findOne({
                hardwareId: hardware._id,
                employee: {
                    employeeId: employeeExists._id,
                    name: employeeExists.personalInfo.name,
                    lastname: employeeExists.personalInfo.lastname
                },
                date: date
            })
            if (useExists) {
                return res.status(404).json({ message: "Ya existe un uso de este hardware asociado al empleado. Por favor, actualiza el existente o elimínalo." })
            }
            const consumptionKwh = (hardware.consumptionW * hours) / 1000
            console.log(consumptionKwh)
            const createdBy = await assignAction(req, res, enterprise)
            const newUse = new Use({
                hardwareId: hardwareId,
                detailsOrNotes,
                employee: {
                    employeeId: employeeExists._id,
                    name: employeeExists.personalInfo.name,
                    lastname: employeeExists.personalInfo.lastname
                },
                hours,
                date,
                consumptionKwh: consumptionKwh,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            const assistInDate = await Assist.findOne({
                employeeId: employeeExists._id,
                dateAssist: new Date(date)
            })
            if (!assistInDate) {
                return res.status(404).json({ message: "No se ha encontrado asistencia de esta fecha." })
            }
            const reportInDate = await Report.findOne({
                assistId: assistInDate._id
            })
            if (!reportInDate) {
                return res.status(404).json({ message: "No se ha encontrado un reporte de esta fecha. Ten en cuenta que un nuevo uso de hardware debe asociarse a un reporte de asistencia." })
            }
            const carbonFootprintEnergy = calculateCarbonFootprintByKwh(hardware.consumptionW, hours, factorEmission)
            assistInDate.carbonFootprintForAssist.value += carbonFootprintEnergy
            hardware.uses.push(newUse._id)
            reportInDate.uses.push(newUse._id)
            reportInDate.consumptionKwh += parseFloat(consumptionKwh)
            await newUse.save()
            await hardware.save()
            await reportInDate.save()
            assistInDate.reportId = reportInDate._id
            await assistInDate.save()
            await calculateTotalCarbonFootprintPerHardware(req, res, hardware)
            await carbonFootprintCalculatorToEmployee(employeeExists)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ newUse, hardware, assistInDate, reportInDate })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getUse: async function (req, res) {
        try {
            const { enterpriseId, hardwareId, useId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId) || !mongoose.Types.ObjectId.isValid(useId)) {
                return res.status(404).json({ message: "ID de empresa, de hardware o de uso de hardware inválido." })
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
            const use = await Use.findOne({
                hardwareId: hardware._id,
                _id: useId
            })
            if (!use) {
                return res.status(404).json({ message: "No se ha encontrado el uso del hardware." })
            }
            return res.status(200).json(use)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllUses: async function (req, res) {
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
            const uses = await Use.find({
                hardwareId: hardware._id
            })
            if (uses.length === 0) {
                return res.status(404).json({ message: "No se han encontrado usos del hardware." })
            }
            return res.status(200).json(uses)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //FIJARSE ESTO
    updateUse: async function (req, res) {
        try {
            const { enterpriseId, hardwareId, useId } = req.params
            const { detailsOrNotes, employee, hours } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId) || !mongoose.Types.ObjectId.isValid(useId)) {
                return res.status(404).json({ message: "ID de empresa, de hardware o de uso de hardware inválido." })
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

            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })

            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })

            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id,
                "personalInfo.name": employee.name,
                "personalInfo.lastname": employee.lastname
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            //el uso previo 
            const previousUse = await Use.findOne({
                _id: useId,
                hardwareId: hardwareId
            })
            if (!previousUse) {
                return res.status(404).json({ message: "No se ha encontrado el uso previo." })
            }
            //el reporte previo
            const previousReport = await Report.findOne({
                uses: { $in: [previousUse._id] }
            })
            if (!previousReport) {
                return res.status(404).json({ message: "No se ha encontrado el reporte previo." })
            }
            console.log(previousReport)
            const previousAssist = await Assist.findOne({
                reportId: previousReport._id
            })
            const consumptionKwh = (hardware.consumptionW * hours) / 1000
            // aca se calcula la huella vieja
            const oldCarbonFootprintEnergy = calculateCarbonFootprintByKwh(hardware.consumptionW, previousUse.hours)
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedUse = await Use.findOneAndUpdate(
                { _id: useId, hardwareId: hardwareId },
                { detailsOrNotes, employee, hours, consumptionKwh: consumptionKwh, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() } },
                { new: true }
            )
            if (!updatedUse) {
                return res.status(404).json({ message: "No se ha encontrado el uso de hardware." })
            }
            console.log("Huella vieja del total de la asistencia", previousAssist.carbonFootprintForAssist.value)
            previousAssist.carbonFootprintForAssist.value -= oldCarbonFootprintEnergy
            //calcular huella de co2 nueva
            const carbonFootprintEnergy = calculateCarbonFootprintByKwh(hardware.consumptionW, hours)
            console.log("Nueva huella de carbono de energía", carbonFootprintEnergy)
            previousAssist.carbonFootprintForAssist.value += carbonFootprintEnergy
            console.log("Huella NUEVA del total de la asistencia", previousAssist.carbonFootprintForAssist.value)
            //resto el consumo al reporte para luego aniadir el nuevo
            previousReport.consumptionKwh -= previousUse.consumptionKwh
            previousReport.consumptionKwh += updatedUse.consumptionKwh
            //guardados
            await previousReport.save()
            await previousAssist.save()
            await hardware.save()
            await technology.save()
            await calculateTotalCarbonFootprintPerHardware(req, res, hardware)
            await carbonFootprintCalculatorToEmployee(employeeExists)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ updatedUse, previousAssist, hardware })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteUse: async function (req, res) {
        try {
            const { enterpriseId, hardwareId, useId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId) || !mongoose.Types.ObjectId.isValid(useId)) {
                return res.status(404).json({ message: "ID de empresa, de hardware o de uso de hardware inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }

            const hardware = await Hardware.findOne({ technologyId: technology._id, _id: hardwareId })
            if (!hardware) return res.status(404).json({ message: "No se ha encontrado el hardware." })

            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })

            //el uso previo 
            const previousUse = await Use.findOne({
                _id: useId,
                hardwareId: hardwareId
            })
            if (!previousUse) {
                return res.status(404).json({ message: "No se ha encontrado el uso previo." })
            }
            //el reporte previo
            const previousReport = await Report.findOne({
                uses: { $in: [previousUse._id] }
            })
            if (!previousReport) {
                return res.status(404).json({ message: "No se ha encontrado el reporte previo." })
            }
            const previousAssist = await Assist.findOne({
                reportId: previousReport._id
            })
            // aca se calcula la huella vieja
            const oldCarbonFootprintEnergy = calculateCarbonFootprintByKwh(hardware.consumptionW, previousUse.hours)
            console.log("Huella vieja de CO2 de energía", oldCarbonFootprintEnergy)
            const use = await Use.findOneAndDelete({
                hardwareId: hardwareId,
                _id: useId
            })
            if (!use) {
                return res.status(404).json({ message: "No se ha encontrado el uso de hardware." })
            }
            const employeeExists = await Employee.findOne({
                "personalInfo.name": use.employee.name,
                "personalInfo.lastname": use.employee.lastname
            })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            previousAssist.carbonFootprintForAssist.value -= oldCarbonFootprintEnergy
            previousReport.consumptionKwh -= use.consumptionKwh
            hardware.uses.pull(useId)
            await previousReport.save()
            await previousAssist.save()
            await hardware.save()
            await technology.save()
            await enterprise.save()
            await calculateTotalCarbonFootprintPerHardware(req, res, hardware)
            await carbonFootprintCalculatorToEmployee(employeeExists)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ message: "Eliminado exitosamente.", hardware, previousAssist })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllUses: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId)) {
                return res.status(404).json({ message: "ID de empresa o de uso de hardware inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }

            const hardware = await Hardware.findOne({ technologyId: technology._id, _id: hardwareId })
            if (!hardware) return res.status(404).json({ message: "No se ha encontrado el hardware." })

            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })

            const uses = await Use.find({ hardwareId: hardware._id })
            if (uses.length === 0) {
                return res.status(404).json({ message: "No se han encontrado usos del hardware." })
            }
            for (const use of uses) {
                const previousReport = await Report.findOne({ uses: { $in: [use._id] } })
                console.log(previousReport)
                if (previousReport) {
                    const previousAssist = await Assist.findOne({ reportId: previousReport._id })
                    if (previousAssist) {
                        const employeeExists = await Employee.findOne({
                            "personalInfo.name": use.employee.name,
                            "personalInfo.lastname": use.employee.lastname,
                            _id: use.employee.employeeId
                        })
                        const hoursKwhUse = use.hours
                        const carbonFootprintEnergy = calculateCarbonFootprintByKwh(hardware.consumptionW, hoursKwhUse)
                        console.log("Huella de co2 de energía", carbonFootprintEnergy)
                        previousReport.consumptionKwh -= use.consumptionKwh
                        previousAssist.carbonFootprintForAssist.value -= carbonFootprintEnergy

                        await previousReport.save()
                        await previousAssist.save()
                        await carbonFootprintCalculatorToEmployee(employeeExists)
                    }
                }
                await Use.findByIdAndDelete(use._id)
            }
            hardware.uses = []
            hardware.carbonFootprintTotal = {
                carbonFootprintG: 0,
                carbonFootprintKG: 0,
                carbonFootprintLB: 0,
                carbonFootprintMT: 0
            }
            await hardware.save()
            await calculateTotalCarbonFootprintPerHardware(req, res, hardware)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ message: "Usos eliminados exitosamente", hardware })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getUsesByCustomDate: async function (req, res) {
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
            const filteredUsesByCustomDate = await Use.find(
                {
                    hardwareId: hardwareId,
                    date: { $gte: start, $lte: end }
                },
            )
            console.log(filteredUsesByCustomDate);

            if (filteredUsesByCustomDate.length === 0) {
                return res.status(404).json({ message: "No hay usos del hardware registrados en las fechas proporcionadas." })
            }
            return res.status(200).json(filteredUsesByCustomDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getUsesByEmployee: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            const { name, lastname } = req.query
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
            const rrhhEnterprise = await RRHH.findOne({
                enterpriseId: enterprise._id
            })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })
            }
            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id,
                "personalInfo.name": name,
                "personalInfo.lastname": lastname
            })
            console.log(employeeExists)
            if (!employeeExists) {
                return res.status(404).json({ message: "Empleado no encontrado o no existe." })
            }
            const filteredUsesByEmployee = await Use.find({
                hardwareId: hardware._id,
                employee: {
                    employeeId: employeeExists._id,
                    name: employeeExists.personalInfo.name,
                    lastname: employeeExists.personalInfo.lastname
                }
            })
            if (filteredUsesByEmployee.length === 0) {
                return res.status(404).json({ message: "No se han encontrado usos del hardware relacionados al empleado." })
            }
            return res.status(200).json(filteredUsesByEmployee)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}


module.exports = useController