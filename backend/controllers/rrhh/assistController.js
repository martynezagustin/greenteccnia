const Assist = require("../../models/rrhh/assistModel")
const Enterprise = require("../../models/enterpriseModel")
const Employee = require("../../models/rrhh/employees/employeeModel")
const RRHH = require("../../models/rrhh/rrhhModel")
const assignAction = require("../handlers/members/assignAction")
const { calculateMonthlyIndexPuntuality, calculatePunctuality } = require("./functions/punctualityFunctions")
const PunctualityHistory = require("../../models/rrhh/employees/performance/punctualityHistoryModel")
const Punctuality = require("../../models/rrhh/employees/performance/punctualityModel")

const assistController = {
    addAssistToEmployee: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const { observations, dateAssist, checkIn, checkOut, transportationMode, remote, distanceKm, fuelType } = req.body
            let { status } = req.body
            if (!status) status = "present"

            console.log(req.body);


            if (!dateAssist) return res.status(400).json({ message: "Debe proporcionar una fecha de asistencia." })
            let hoursWorked
            console.log('Horas trabajadas sin nada', hoursWorked);


            const dateParts = dateAssist.split("-"); // ["11","13","2025"]
            const [year, month, day] = dateParts
            console.log("El year?", year);

            let checkInDate
            let checkOutDate
            if (checkIn && checkOut) {
                checkInDate = new Date(year, month - 1, day, ...checkIn.split(":").map(Number))
                checkOutDate = new Date(year, month - 1, day, ...checkOut.split(':').map(Number))
            }

            if (checkIn && checkOut) {
                hoursWorked = Math.abs(checkInDate - checkOutDate) / (1000 * 60 * 60)
                console.log('Hubieron horas trabjadas?', hoursWorked)
            }
            //buscar módulo rrhh
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })

            //¿existe el empleado?
            const employeeExists = await Employee.findOne({
                rrhhEnterprise: rrhhEnterprise._id,
                _id: employeeId
            })
            if (!employeeExists) return res.status(404).json({ message: "No se ha encontrado el empleado." })

            const assistExists = await Assist.findOne({
                employeeId: employeeExists._id,
                dateAssist: new Date(dateAssist)
            })
            if (assistExists) {
                if (!assistExists.checkOut && checkOut) {
                    assistExists.checkOut = checkOut
                    const inTime = new Date(assistExists.checkIn)
                    const outTime = new Date(checkOut)
                    assistExists.hoursWorked = Math.abs(outTime - inTime) / (1000 * 60 * 60)
                    await assistExists.save()
                }
                return res.status(409).json({ message: "Ya existe una asistencia de este día." })
            }

            const puntuality = calculatePunctuality(employeeExists.jobInfo.expectedCheckInTime, checkInDate)

            if (status === 'on-time') {
                if (!dateAssist || !checkIn || !checkOut) return res.status(400).json({ message: "Si la asistencia es 'presente', indica al menos fecha, horario de entrada y salida." })
            }
            const newAssist = new Assist({
                enterpriseId: enterprise._id,
                employeeId: employeeExists._id,
                observations,
                dateAssist,
                status,
                hoursWorked: hoursWorked,
                checkIn: status === 'on-time' ? checkInDate : null,
                checkOut: status === 'on-time' ? checkOutDate : null,
                remote: status === 'on-time' ? true : false,
                transportationMode: status === 'on-time' && !remote ? transportationMode : null,
                punctualityStatus: puntuality.status,
                distanceKm: status === 'on-time' && !remote ? distanceKm : 0,
                fuelType: status === 'on-time' && !remote ? fuelType : 'none',
            })
            const createdBy = await assignAction(req, res, enterprise)
            newAssist.createdBy = {
                username: createdBy.username,
                position: createdBy.position,
                date: new Date()
            }
            await newAssist.save()
            employeeExists.assists.push(newAssist._id)

            const currentMonth = new Date(dateAssist).getMonth() + 1
            const currentYear = new Date(dateAssist).getFullYear()

            const newPunctuality = new Punctuality({
                employeeId: employeeExists._id,
                date: new Date(dateAssist)
            })

            await newPunctuality.save()
            //actualizar historial de puntualidad
            let punctualityHistory = await PunctualityHistory.findOne({ employeeId: employeeExists._id })
            const resultIndexPuntuality = await calculateMonthlyIndexPuntuality(employeeExists._id, currentMonth, currentYear)
            if (!punctualityHistory) {
                punctualityHistory = new PunctualityHistory({
                    employeeId: employeeExists._id,
                    records: [newPunctuality._id],
                    generalIndexNumber: resultIndexPuntuality
                })
            } else {
                //verificar si ya existe registro para mes y año actual
                const existingRecordIndex = punctualityHistory.records.findIndex(recordId => recordId.toString() === newPunctuality._id.toString())
                if (existingRecordIndex === -1) {
                    punctualityHistory.records.push(newPunctuality._id)
                } else {
                    punctualityHistory.records[existingRecordIndex] = newPunctuality._id
                }
                //recalcular el índice general
                punctualityHistory.generalIndexNumber = Number(resultIndexPuntuality.toFixed(2))
            }
            await punctualityHistory.save()
            employeeExists.punctualityHistory = punctualityHistory._id
            employeeExists.generalPunctualityIndex = punctualityHistory.generalIndexNumber
            await employeeExists.save()

            return res.status(200).json({ message: "Asistencia añadida exitosamente.", newAssist, newPunctuality })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //en forma indiscriminada
    getAllAssists: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos de la empresa." })
            const assists = await Assist.find({
                enterpriseId: enterprise._id
            }).populate('employeeId')
            console.log('Hay asistencias?', assists)
            if (assists.length === 0) return res.status(404).json({ message: "No se han encontrado asistencias." })
            return res.status(200).json(assists)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //en forma discriminada
    getAssistToEmployee: async function (req, res) {
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
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const assist = await Assist.findOne({
                employeeId: employeeExists._id,
            })
            if (!assist) {
                return res.status(404).json({ message: "No se ha encontrado la asistencia del empleado." })
            }
            return res.status(200).json(assist)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllAsistsToEmployee: async function (req, res) {
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
            const assists = await Assist.find({ employeeId: employeeExists._id })
            if (assists.length === 0) return res.status(404).json({ message: "No se han encontrado asistencias del empleado." })
            return res.status(200).json(assists)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateAssistToEmployee: async function (req, res) {
        try {
            const { description, dateAssist, status, details, transportationMode, distanceKm, fuelType } = req.body
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
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const updateData = {
                description, dateAssist, status, details, transportationMode, distanceKm, fuelType
            }
            const previousTotalCarbonFootprint = await Assist.findOne({
                _id: assistId, employeeId: employeeExists._id
            })
            if (!previousTotalCarbonFootprint) {
                return res.status(404).json({ message: "No se pueden obtener datos de la huella de carbono anterior." })
            }
            //¿cuál es el total de la huella de transporte anterior?
            const previousCarbonFootprintTransport = previousTotalCarbonFootprint.carbonFootprintForAssist.transport
            console.log("La huella de carbono anterior es: " + previousCarbonFootprintTransport)

            //¿cuál va a ser la nueva huella de transporte de carbono?
            const carbonFootprintTransport = (distanceKm * (emissionFactors.internalTransport[fuelType]) / 100) * emissionFactors.emissionFactorsFuel[fuelType]

            //restamos la huella de co2 anterior por el valor viejo para limpiarlo y luego sumar el nuevo
            const clearCarbonFootprint = previousTotalCarbonFootprint.carbonFootprintForAssist.value - previousCarbonFootprintTransport
            //actualizar asistencia
            const updatedAssist = await Assist.findOneAndUpdate(
                { _id: assistId, employeeId: employeeExists._id },
                { $set: updateData },
                { new: true }
            )
            updatedAssist.carbonFootprintForAssist = {
                transport: carbonFootprintTransport,
                value: parseFloat(clearCarbonFootprint + carbonFootprintTransport)
            }
            const updatedBy = await assignAction(req, res, enterprise)
            updatedAssist.updatedBy = {
                username: updatedBy.username,
                position: updatedBy.position,
                date: new Date()
            }
            await updatedAssist.save()
            await carbonFootprintCalculatorToEmployee(employeeExists)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json(updatedAssist)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAssistToEmployee: async function (req, res) {
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
            const deletedAssist = await Assist.findOneAndDelete({
                _id: assistId,
                employeeId: employeeExists._id,
            })
            if (!deletedAssist) {
                return res.status(404).json({ message: "No se ha encontrado la asistencia." })
            }
            const deletedReport = await Report.findOne({
                assistId: deletedAssist._id,
                _id: deletedAssist.reportId
            })
            if (deletedAssist.reportId) {
                if (!deletedReport) {
                    return res.status(404).json({ message: "No se ha encontrado el reporte asociado a la asistencia." })
                }
            }
            employeeExists.assists.pull(assistId)
            await carbonFootprintCalculatorToEmployee(employeeExists)
            await employeeExists.save()
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ message: "Eliminado exitosamente.", deletedAssist })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllAssistsToEmployee: async function (req, res) {
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
            const employeeExists = await Employee.findOne({ _id: employeeId, rrhhEnterprise: rrhhEnterprise._id })
            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const allAssists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (allAssists.length === 0) return res.status(404).json({ message: "No se han encontrado asistencias." })
            const assistsIds = allAssists.map((assist) => assist._id)
            const deletedAllAssists = await Assist.deleteMany(
                { employeeId: employeeExists._id }
            )
            if (deletedAllAssists.deletedCount === 0) return res.status(404).json({ message: "No se han encontrado asistencias del empleado." })

            const updatedEmployee = await Employee.findOneAndUpdate(
                { _id: employeeExists._id, rrhhEnterprise: rrhhEnterprise._id },
                { $pull: { assists: { $in: employeeExists.assists } } },
                { new: true }
            )
            const deletedReports = await Report.deleteMany({
                assistId: { $in: assistsIds }
            })
            if (deletedReports.length === 0) return res.status(404).json({ message: "No se han encontrado reportes asociados a la asistencia." })
            await carbonFootprintCalculatorToEmployee(updatedEmployee)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ message: "Todas las asistencias eliminadas exitosamente.", updatedEmployee })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = assistController