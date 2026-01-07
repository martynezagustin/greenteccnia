const Employee = require("../../models/rrhh/employees/employeeModel")
const SustainableEmployee = require("../../models/rrhh/sustainableRrhh/sustainableEmployeeModel")
const Assist = require("../../models/rrhh/assistModel")
const Report = require("../../models/rrhh/sustainableRrhh/reportModel")
const Enterprise = require("../../models/enterpriseModel")
const RRHH = require("../../models/rrhh/rrhhModel")
const mongoose = require("mongoose")


const sustainableEmployeeController = {

    getCarbonFootprintByCurrentMonth: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const actualDate = new Date()
            const startOfMonth = new Date(actualDate.getFullYear(), actualDate.getMonth(), 1)
            const endOfMonth = new Date(actualDate.getFullYear(), actualDate.getMonth() + 1, 0, 23.59, 59)
            const filteredAssists = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            })
            const carbonFootprintInCurrentMonth = filteredAssists.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            return res.status(200).json({ carbonFootprintInCurrentMonth })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //esto podria cambiarse
    getCarbonFootprintByCurrentYear: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const actualDate = new Date()
            const filteredAssists = assists.filter((assist) => {
                const assistDate = new Date(assist.dateAssist)
                console.log(assistDate)
                return assistDate.getFullYear() === actualDate.getFullYear()
            })
            console.log(filteredAssists)
            const carbonFootprintInCurrentYear = filteredAssists.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            return res.status(200).json({ carbonFootprintInCurrentYear })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getCarbonFootprintByCurrentWeek: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const actualDate = new Date()
            const currentYear = actualDate.getFullYear()
            const currentMonth = actualDate.getMonth()
            const currentDate = actualDate.getDate()
            const lastWeekStart = new Date(currentYear, currentMonth, currentDate - 7)
            const endWeekStart = new Date(currentYear, currentMonth, currentDate)
            console.log(actualDate.getFullYear())
            const filteredAssists = await Assist.find({
                dateAssist: {
                    $gte: lastWeekStart,
                    $lte: endWeekStart
                }
            })
            const carbonFootprintInCurrentWeek = filteredAssists.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            return res.status(200).json({ message: "Huella de carbono de la semana", carbonFootprintInCurrentWeek })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getCarbonFootprintByCustomDate: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            const filteredAssists = await Assist.find({
                dateAssist: {
                    $gte: start,
                    $lte: end
                }
            })
            const carbonFootprintInCustomDate = filteredAssists.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            return res.status(200).json({ message: "Huella de co2 en fecha filtrada: ", carbonFootprintInCustomDate })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareCarbonFootprintByLastYear: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const actualDate = new Date()
            const startCurrentYear = new Date(actualDate.getFullYear(), 0, 1, 0, 0, 0, 0)
            const endCurrentYear = new Date(actualDate.getFullYear(), 11, 31, 23, 59, 59, 999)
            const startLastYear = new Date(actualDate.getFullYear() - 1, 0, 1, 0, 0, 0, 0)
            const endLastYear = new Date(actualDate.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
            //mes actual
            const filteredAssistsInCurrentYear = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: startCurrentYear,
                    $lte: endCurrentYear
                }
            })
            //mes anterior
            const filteredAssistsInLastYear = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: startLastYear,
                    $lte: endLastYear
                }
            })
            const carbonFootprintInCurrentYear = filteredAssistsInCurrentYear.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            console.log("Del year actual", carbonFootprintInCurrentYear)
            const carbonFootprintInLastYear = filteredAssistsInLastYear.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            console.log("Del year pasado", carbonFootprintInLastYear)
            const difference = parseFloat(carbonFootprintInCurrentYear) - parseFloat(carbonFootprintInLastYear)
            const absoluteDifference = Math.abs(difference)
            const averageCarbonFootprint = (carbonFootprintInLastYear + carbonFootprintInCurrentYear) / 2
            const accumulator = parseFloat(carbonFootprintInLastYear) + parseFloat(carbonFootprintInCurrentYear)
            const percentage = carbonFootprintInLastYear !== 0 ? (difference / carbonFootprintInLastYear) * 100 : 0
            const carbonChange = difference > 0 ? "Aumento en emisión" : difference < 0 ? "Reducción en emisión" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageCarbonFootprint, carbonChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareCarbonFootprintByLastMonth: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const lastMonth = actualDate.getMonth() - 1
            const currentYear = actualDate.getFullYear()
            //mes actual
            const filteredAssistsInCurrentMonth = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: new Date(currentYear, currentMonth, 1),
                    $lte: new Date(currentYear, currentMonth + 1, 1)
                }
            })
            //mes anterior
            const filteredAssistsInLastMonth = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: new Date(currentYear, lastMonth, 1),
                    $lte: new Date(currentYear, lastMonth + 1, 1)
                }
            })
            const carbonFootprintInCurrentMonth = filteredAssistsInCurrentMonth.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            const carbonFootprintInLastMonth = filteredAssistsInLastMonth.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            console.log(carbonFootprintInLastMonth, carbonFootprintInCurrentMonth);

            const difference = parseFloat(carbonFootprintInCurrentMonth) - parseFloat(carbonFootprintInLastMonth)
            const absoluteDifference = Math.abs(difference)
            const averageCarbonFootprint = (carbonFootprintInLastMonth + carbonFootprintInCurrentMonth) / 2
            const accumulator = parseFloat(carbonFootprintInLastMonth) + parseFloat(carbonFootprintInCurrentMonth)
            const percentage = carbonFootprintInLastMonth !== 0 ? (difference / carbonFootprintInLastMonth) * 100 : 0
            const carbonChange = difference > 0 ? "Aumento en emisión" : difference < 0 ? "Reducción en emisión" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageCarbonFootprint, carbonChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareCarbonFootprintByLastDate: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            //del día de hoy
            const actualDate = new Date()
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDate.setUTCHours(23, 59, 59, 999)
            const startDateOfYesterday = new Date(startDate)
            startDateOfYesterday.setDate(startDateOfYesterday.getDate() - 1)
            const endDateOfYesterday = new Date(endDate)
            endDateOfYesterday.setDate(endDateOfYesterday.getDate() - 1)
            //aca copypaste pa
            const filteredAssistsByCurrentDate = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
            console.log(`De este día`, filteredAssistsByCurrentDate)
            //mes anterior
            const filteredAssistsByLastDate = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDateOfYesterday, $lte: endDateOfYesterday }
            })
            console.log("De ayer: ", filteredAssistsByLastDate);

            const carbonFootprintInCurrentDate = filteredAssistsByCurrentDate.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            const carbonFootprintInLastDate = filteredAssistsByLastDate.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            const difference = parseFloat(carbonFootprintInCurrentDate) - parseFloat(carbonFootprintInLastDate)
            const absoluteDifference = Math.abs(difference)
            const averageCarbonFootprint = (carbonFootprintInLastDate + carbonFootprintInCurrentDate) / 2
            const accumulator = parseFloat(carbonFootprintInLastDate) + parseFloat(carbonFootprintInCurrentDate)
            const percentage = carbonFootprintInLastDate !== 0 ? (difference / carbonFootprintInLastDate) * 100 : 0
            const carbonChange = difference > 0 ? "Aumento en emisión" : difference < 0 ? "Reducción en emisión" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageCarbonFootprint, carbonChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareCarbonFootprintByLastWeek: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            //del día de hoy
            const actualDate = new Date()
            const startDateInCurrentWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            startDateInCurrentWeek.setUTCHours(0, 0, 0, 0)
            const endDateInCurrentWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDateInCurrentWeek.setUTCHours(23, 59, 59, 999)
            const startDateInLastWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 14)
            startDateInLastWeek.setUTCHours(0, 0, 0, 0)
            const endDateInLastWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            endDateInLastWeek.setUTCHours(23, 59, 59, 999)
            console.log(startDateInLastWeek, endDateInLastWeek);
            console.log(startDateInCurrentWeek, endDateInCurrentWeek)

            //aca copypaste pa
            const filteredAssistsByCurrentWeek = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDateInCurrentWeek, $lte: endDateInCurrentWeek }
            })
            //mes anterior
            const filteredAssistsByLastWeek = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDateInLastWeek, $lte: endDateInLastWeek }
            })

            const carbonFootprintInCurrentWeek = filteredAssistsByCurrentWeek.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)
            const carbonFootprintInLastWeek = filteredAssistsByLastWeek.reduce((acc, assist) =>
                acc + parseFloat(assist.carbonFootprintForAssist.value)
                , 0)

            const difference = parseFloat(carbonFootprintInCurrentWeek) - parseFloat(carbonFootprintInLastWeek)
            const absoluteDifference = Math.abs(difference)
            const averageCarbonFootprint = (carbonFootprintInLastWeek + carbonFootprintInCurrentWeek) / 2
            const accumulator = parseFloat(carbonFootprintInLastWeek) + parseFloat(carbonFootprintInCurrentWeek)
            const percentage = carbonFootprintInLastWeek !== 0 ? (difference / carbonFootprintInLastWeek) * 100 : 0
            const carbonChange = difference > 0 ? "Aumento en emisión" : difference < 0 ? "Reducción en emisión" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageCarbonFootprint, carbonChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareKwhConsumptionInLastYear: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const actualDate = new Date()
            const startCurrentYear = new Date(actualDate.getFullYear(), 0, 1, 0, 0, 0, 0)
            const endCurrentYear = new Date(actualDate.getFullYear(), 11, 31, 23, 59, 59, 999)
            const startLastYear = new Date(actualDate.getFullYear() - 1, 0, 1, 0, 0, 0, 0)
            const endLastYear = new Date(actualDate.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
            //year actual
            const filteredAssistsInCurrentYear = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: startCurrentYear,
                    $lte: endCurrentYear
                }
            })
            let filteredReportsInCurrentYear = []
            for (const assist of filteredAssistsInCurrentYear) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInCurrentYear.push(...reports)
            }
            //year anterior
            const filteredAssistsInLastYear = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: startLastYear,
                    $lte: endLastYear
                }
            })
            let filteredReportsInLastYear = []
            for (const assist of filteredAssistsInLastYear) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInLastYear.push(...reports)
            }
            const consumptionKwhInLastYear = filteredReportsInLastYear.reduce((acc, report) => acc + report.consumptionKwh, 0)
            const consumptionKwhInCurrentYear = filteredReportsInCurrentYear.reduce((acc, report) => acc + report.consumptionKwh, 0)
            console.log("Pasado", consumptionKwhInLastYear)
            console.log("Presente", consumptionKwhInCurrentYear)
            const difference = parseFloat(consumptionKwhInCurrentYear) - parseFloat(consumptionKwhInLastYear)
            const absoluteDifference = Math.abs(difference)
            const averageConsumptionKwh = (consumptionKwhInLastYear + consumptionKwhInCurrentYear) / 2
            const accumulator = parseFloat(consumptionKwhInLastYear) + parseFloat(consumptionKwhInCurrentYear)
            const percentage = consumptionKwhInLastYear !== 0 ? (difference / consumptionKwhInLastYear) * 100 : 0
            const consumptionKwhChange = difference > 0 ? "Aumento en consumo de kWh" : difference < 0 ? "Reducción en consumo de kWh" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageConsumptionKwh, consumptionKwhChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareKwhConsumptionInLastMonth: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const lastMonth = actualDate.getMonth() - 1
            const currentYear = actualDate.getFullYear()
            //mes actual
            //mes actual
            const filteredAssistsInCurrentMonth = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: new Date(currentYear, currentMonth, 1),
                    $lte: new Date(currentYear, currentMonth + 1, 1)
                }
            })

            let filteredReportsInCurrentMonth = []
            for (const assist of filteredAssistsInCurrentMonth) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInCurrentMonth.push(...reports)
            }
            console.log(filteredReportsInCurrentMonth);
            //mes anterior
            const filteredAssistsInLastMonth = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: new Date(currentYear, lastMonth, 1),
                    $lte: new Date(currentYear, lastMonth + 1, 1)
                }
            })
            let filteredReportsInLastMonth = []
            for (const assist of filteredAssistsInLastMonth) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInLastMonth.push(...reports)
            }
            const consumptionKwhInLastMonth = filteredReportsInLastMonth.reduce((acc, report) => acc + parseFloat(report.consumptionKwh), 0)
            const consumptionKwhInCurrentMonth = filteredReportsInCurrentMonth.reduce((acc, report) => acc + parseFloat(report.consumptionKwh), 0)
            console.log("Pasado", consumptionKwhInLastMonth)
            console.log("Presente", consumptionKwhInCurrentMonth)
            const difference = parseFloat(consumptionKwhInCurrentMonth) - parseFloat(consumptionKwhInLastMonth)
            const absoluteDifference = Math.abs(difference)
            const averageConsumptionKwh = (consumptionKwhInLastMonth + consumptionKwhInCurrentMonth) / 2
            const accumulator = parseFloat(consumptionKwhInLastMonth) + parseFloat(consumptionKwhInCurrentMonth)
            const percentage = consumptionKwhInLastMonth !== 0 ? (difference / consumptionKwhInLastMonth) * 100 : 0
            const consumptionKwhChange = difference > 0 ? "Aumento en consumo de kWh" : difference < 0 ? "Reducción en consumo de kWh" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageConsumptionKwh, consumptionKwhChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareKwhConsumptionInLastDate: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            //del día de hoy
            const actualDate = new Date()
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDate.setUTCHours(23, 59, 59, 999)
            const startDateOfYesterday = new Date(startDate)
            startDateOfYesterday.setDate(startDateOfYesterday.getDate() - 1)
            const endDateOfYesterday = new Date(endDate)
            endDateOfYesterday.setDate(endDateOfYesterday.getDate() - 1)
            //aca copypaste pa
            const filteredAssistsInCurrentDate = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDate, $lte: endDate }
            })
            let filteredReportsInCurrentDate = []
            for (const assist of filteredAssistsInCurrentDate) {
                const reports = await Report.find({
                    assistId: assist._id,
                })
                filteredReportsInCurrentDate.push(...reports)
            }
            //mes anterior
            const filteredAssistsInLastDate = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDateOfYesterday, $lte: endDateOfYesterday }
            })
            let filteredReportsInLastDate = []
            for (const assist of filteredAssistsInLastDate) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInLastDate.push(...reports)
            }
            const consumptionKwhInLastDate = filteredReportsInLastDate.reduce((acc, report) => acc + parseFloat(report.consumptionKwh), 0)
            const consumptionKwhInCurrentDate = filteredReportsInCurrentDate.reduce((acc, report) => acc + parseFloat(report.consumptionKwh), 0)
            console.log("Pasado", consumptionKwhInLastDate)
            console.log("Presente", consumptionKwhInCurrentDate)
            const difference = parseFloat(consumptionKwhInCurrentDate) - parseFloat(consumptionKwhInLastDate)
            const absoluteDifference = Math.abs(difference)
            const averageConsumptionKwh = (consumptionKwhInLastDate + consumptionKwhInCurrentDate) / 2
            const accumulator = parseFloat(consumptionKwhInLastDate) + parseFloat(consumptionKwhInCurrentDate)
            const percentage = consumptionKwhInLastDate !== 0 ? (difference / consumptionKwhInLastDate) * 100 : 0
            const consumptionKwhChange = difference > 0 ? "Aumento en consumo de kWh" : difference < 0 ? "Reducción en consumo de kWh" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageConsumptionKwh, consumptionKwhChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareKwhConsumptionInLastWeek: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            //del día de hoy
            //del día de hoy
            const actualDate = new Date()
            const startDateInCurrentWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            startDateInCurrentWeek.setUTCHours(0, 0, 0, 0)
            const endDateInCurrentWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDateInCurrentWeek.setUTCHours(23, 59, 59, 999)
            const startDateInLastWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 14)
            startDateInLastWeek.setUTCHours(0, 0, 0, 0)
            const endDateInLastWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            endDateInLastWeek.setUTCHours(23, 59, 59, 999)
            console.log(startDateInLastWeek, endDateInLastWeek);
            console.log(startDateInCurrentWeek, endDateInCurrentWeek)

            //aca copypaste pa
            const filteredAssistsInCurrentWeek = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDateInCurrentWeek, $lte: endDateInCurrentWeek }
            })
            let filteredReportsInCurrentWeek = []
            for (const assist of filteredAssistsInCurrentWeek) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInCurrentWeek.push(...reports)
            }
            //mes anterior
            const filteredAssistsInLastWeek = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDateInLastWeek, $lte: endDateInLastWeek }
            })
            let filteredReportsInLastWeek = []
            for (const assist of filteredAssistsInLastWeek) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInLastWeek.push(...reports)
            }
            const consumptionKwhInLastWeek = filteredReportsInLastWeek.reduce((acc, report) => acc + parseFloat(report.consumptionKwh), 0)
            const consumptionKwhInCurrentWeek = filteredReportsInCurrentWeek.reduce((acc, report) => acc + parseFloat(report.consumptionKwh), 0)
            const difference = parseFloat(consumptionKwhInCurrentWeek) - parseFloat(consumptionKwhInLastWeek)
            const absoluteDifference = Math.abs(difference)
            const averageConsumptionKwh = (consumptionKwhInLastWeek + consumptionKwhInCurrentWeek) / 2
            const accumulator = parseFloat(consumptionKwhInLastWeek) + parseFloat(consumptionKwhInCurrentWeek)
            const percentage = consumptionKwhInLastWeek !== 0 ? (difference / consumptionKwhInLastWeek) * 100 : 0
            const consumptionKwhChange = difference > 0 ? "Aumento en consumo de kWh" : difference < 0 ? "Reducción en consumo de kWh" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageConsumptionKwh, consumptionKwhChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareWasteGeneratedInLastYear: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const actualDate = new Date()
            const startCurrentYear = new Date(actualDate.getFullYear(), 0, 1, 0, 0, 0, 0)
            const endCurrentYear = new Date(actualDate.getFullYear(), 11, 31, 23, 59, 59, 999)
            const startLastYear = new Date(actualDate.getFullYear() - 1, 0, 1, 0, 0, 0, 0)
            const endLastYear = new Date(actualDate.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
            //year actual
            const filteredAssistsInCurrentYear = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: startCurrentYear,
                    $lte: endCurrentYear
                }
            })
            let filteredReportsInCurrentYear = []
            for (const assist of filteredAssistsInCurrentYear) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInCurrentYear.push(...reports)
            }
            //year anterior
            const filteredAssistsInLastYear = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: startLastYear,
                    $lte: endLastYear
                }
            })
            let filteredReportsInLastYear = []
            for (const assist of filteredAssistsInLastYear) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInLastYear.push(...reports)
            }
            const wasteGeneratedInLastYear = filteredReportsInLastYear.reduce((acc, report) => acc + report.wasteGenerated.value, 0)
            const wasteGeneratedInCurrentYear = filteredReportsInCurrentYear.reduce((acc, report) => acc + report.wasteGenerated.value, 0)
            console.log("Pasado", wasteGeneratedInLastYear)
            console.log("Presente", wasteGeneratedInCurrentYear)
            const difference = parseFloat(wasteGeneratedInCurrentYear) - parseFloat(wasteGeneratedInLastYear)
            const absoluteDifference = Math.abs(difference)
            const averageWasteGenerated = (wasteGeneratedInLastYear + wasteGeneratedInCurrentYear) / 2
            const accumulator = parseFloat(wasteGeneratedInLastYear) + parseFloat(wasteGeneratedInCurrentYear)
            const percentage = wasteGeneratedInCurrentYear !== 0 ? (difference / wasteGeneratedInCurrentYear) * 100 : 0
            const wasteGeneratedChange = difference > 0 ? "Aumento en residuos generados" : difference < 0 ? "Reducción en residuos generados" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageWasteGenerated, wasteGeneratedChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareWasteGeneratedInLastMonth: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            const assists = await Assist.find({
                employeeId: employeeExists._id
            })
            if (assists.length === 0) {
                return res.status(404).json({ message: "No se han encontrado asistencias" })
            }
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const lastMonth = actualDate.getMonth() - 1
            const currentYear = actualDate.getFullYear()
            //mes actual
            //mes actual
            const filteredAssistsInCurrentMonth = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: new Date(currentYear, currentMonth, 1),
                    $lte: new Date(currentYear, currentMonth + 1, 1)
                }
            })

            let filteredReportsInCurrentMonth = []
            for (const assist of filteredAssistsInCurrentMonth) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInCurrentMonth.push(...reports)
            }
            console.log(filteredReportsInCurrentMonth);
            //mes anterior
            const filteredAssistsInLastMonth = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: {
                    $gte: new Date(currentYear, lastMonth, 1),
                    $lte: new Date(currentYear, lastMonth + 1, 1)
                }
            })
            let filteredReportsInLastMonth = []
            for (const assist of filteredAssistsInLastMonth) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInLastMonth.push(...reports)
            }
            const wasteGeneratedInLastMonth = filteredReportsInLastMonth.reduce((acc, report) => acc + report.wasteGenerated.value, 0)
            const wasteGeneratedInCurrentMonth = filteredReportsInCurrentMonth.reduce((acc, report) => acc + report.wasteGenerated.value, 0)
            console.log("Pasado", wasteGeneratedInLastMonth)
            console.log("Presente", wasteGeneratedInCurrentMonth)
            const difference = parseFloat(wasteGeneratedInCurrentMonth) - parseFloat(wasteGeneratedInLastMonth)
            const absoluteDifference = Math.abs(difference)
            const averageWasteGenerated = (wasteGeneratedInLastMonth + wasteGeneratedInCurrentMonth) / 2
            const accumulator = parseFloat(wasteGeneratedInLastMonth) + parseFloat(wasteGeneratedInCurrentMonth)
            const percentage = wasteGeneratedInCurrentMonth !== 0 ? (difference / wasteGeneratedInCurrentMonth) * 100 : 0
            const wasteGeneratedChange = difference > 0 ? "Aumento en residuos generados" : difference < 0 ? "Reducción en residuos generados" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageWasteGenerated, wasteGeneratedChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareWasteGeneratedInLastDate: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            //del día de hoy
            const actualDate = new Date()
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDate.setUTCHours(23, 59, 59, 999)
            const startDateOfYesterday = new Date(startDate)
            startDateOfYesterday.setDate(startDateOfYesterday.getDate() - 1)
            const endDateOfYesterday = new Date(endDate)
            endDateOfYesterday.setDate(endDateOfYesterday.getDate() - 1)
            //aca copypaste pa
            console.log(startDate)
            const filteredAssistsInCurrentDate = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDate, $lte: endDate }
            })
            console.log(filteredAssistsInCurrentDate)
            let filteredReportsInCurrentDate = []
            for (const assist of filteredAssistsInCurrentDate) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInCurrentDate.push(...reports)
            }
            //mes anterior
            const filteredAssistsInLastDate = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDateOfYesterday, $lte: endDateOfYesterday }
            })
            let filteredReportsInLastDate = []
            for (const assist of filteredAssistsInLastDate) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInLastDate.push(...reports)
            }
            const wasteGeneratedInLastDate = filteredReportsInLastDate.reduce((acc, report) => acc + parseFloat(report.wasteGenerated.value), 0)
            const wasteGeneratedInCurrentDate = filteredReportsInCurrentDate.reduce((acc, report) => acc + parseFloat(report.wasteGenerated.value), 0)
            console.log("Pasado", wasteGeneratedInLastDate)
            console.log("Presente", wasteGeneratedInCurrentDate)
            const difference = parseFloat(wasteGeneratedInCurrentDate) - parseFloat(wasteGeneratedInLastDate)
            const absoluteDifference = Math.abs(difference)
            const averageWasteGenerated = (wasteGeneratedInLastDate + wasteGeneratedInCurrentDate) / 2
            const accumulator = parseFloat(wasteGeneratedInLastDate) + parseFloat(wasteGeneratedInCurrentDate)
            const percentage = wasteGeneratedInLastDate !== 0 ? (difference / wasteGeneratedInLastDate) * 100 : 0
            const wasteGeneratedChange = difference > 0 ? "Aumento en residuos generados" : difference < 0 ? "Reducción en residuos generados" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageWasteGenerated, wasteGeneratedChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    compareWasteGeneratedInLastWeek: async function (req, res) {
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
            const sustainableEmployee = await SustainableEmployee.findOne({ employeeId: employeeExists._id })
            if (!sustainableEmployee) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para el empleado." })
            }
            //del día de hoy
            //del día de hoy
            const actualDate = new Date()
            const startDateInCurrentWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            startDateInCurrentWeek.setUTCHours(0, 0, 0, 0)
            const endDateInCurrentWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDateInCurrentWeek.setUTCHours(23, 59, 59, 999)
            const startDateInLastWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 14)
            startDateInLastWeek.setUTCHours(0, 0, 0, 0)
            const endDateInLastWeek = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            endDateInLastWeek.setUTCHours(23, 59, 59, 999)
            console.log(startDateInLastWeek, endDateInLastWeek);
            console.log(startDateInCurrentWeek, endDateInCurrentWeek)

            //aca copypaste pa
            const filteredAssistsInCurrentWeek = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDateInCurrentWeek, $lte: endDateInCurrentWeek }
            })
            let filteredReportsInCurrentWeek = []
            for (const assist of filteredAssistsInCurrentWeek) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInCurrentWeek.push(...reports)
            }
            //mes anterior
            const filteredAssistsInLastWeek = await Assist.find({
                employeeId: employeeExists._id,
                dateAssist: { $gte: startDateInLastWeek, $lte: endDateInLastWeek }
            })
            let filteredReportsInLastWeek = []
            for (const assist of filteredAssistsInLastWeek) {
                const reports = await Report.find({
                    assistId: assist._id
                })
                filteredReportsInLastWeek.push(...reports)
            }
            const wasteGeneratedInLastWeek = filteredReportsInLastWeek.reduce((acc, report) => acc + parseFloat(report.wasteGenerated.value), 0)
            const wasteGeneratedInCurrentWeek = filteredReportsInCurrentWeek.reduce((acc, report) => acc + parseFloat(report.wasteGenerated.value), 0)
            const difference = parseFloat(wasteGeneratedInCurrentWeek) - parseFloat(wasteGeneratedInLastWeek)
            const absoluteDifference = Math.abs(difference)
            const averageWasteGenerated = (wasteGeneratedInLastWeek + wasteGeneratedInCurrentWeek) / 2
            const accumulator = parseFloat(wasteGeneratedInLastWeek) + parseFloat(wasteGeneratedInCurrentWeek)
            const percentage = wasteGeneratedInCurrentWeek !== 0 ? (difference / wasteGeneratedInCurrentWeek) * 100 : 0
            const wasteGeneratedChange = difference > 0 ? "Aumento en residuos generados" : difference < 0 ? "Reducción en residuos generados" : "Sin cambios"
            return res.status(200).json({ difference, absoluteDifference, percentage, accumulator, averageWasteGenerated, wasteGeneratedChange })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}



module.exports = sustainableEmployeeController