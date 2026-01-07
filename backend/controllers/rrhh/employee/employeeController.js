const Employee = require("../../../models/rrhh/employees/employeeModel")
const Enterprise = require("../../../models/enterpriseModel")
const RRHH = require("../../../models/rrhh/rrhhModel")
const SustainableEmployee = require("../../../models/rrhh/sustainableRrhh/sustainableEmployeeModel")
const Syndicate = require("../../../models/rrhh/employees/syndicate/syndicateModel")
const ART = require("../../../models/rrhh/employees/ART/artModel")
const CCT = require("../../../models/rrhh/employees/cct/cctModel")
const Department = require("../../../models/rrhh/employees/departments/departmentModel")
const User = require("../../../models/userModel")
const mongoose = require("mongoose")
const assignAction = require("../../handlers/members/assignAction")
const Assist = require("../../../models/rrhh/assistModel")
const Survey = require("../../../models/rrhh/satisfaction/surveyModel")
const SurveyHistory = require("../../../models/rrhh/satisfaction/surveyHistoryModel")
const PunctualityHistory = require('../../../models/rrhh/employees/performance/punctualityHistoryModel')
const ContractHistory = require("../../../models/rrhh/employees/contractHistory/contractHistoryModel")
const WorkEnvironment = require("../../../models/rrhh/satisfaction/workEnvironmentModel")
const WorkEnvironmentSnapshot = require("../../../models/rrhh/satisfaction/workEnvironmentSnapshotModel")
const { getGenderParity, calculateTurnoverRate } = require("../functions/employeeHelpers")
const { calculateGenericWorkEnvironment } = require("../../handlers/rrhh/employees/calculateWorkEnvironment")

const employeeController = {
    addEmployee: async function (req, res) {
        try {
            const { userId, personalInfo, jobInfo, financialInformation, sustainability, verifiedData, privacityData } = req.body
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID inválido de empresa." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            let rrhhEnterprise = await RRHH.findOne({ enterpriseId })
            if (!rrhhEnterprise) {
                rrhhEnterprise = new RRHH({ enterpriseId: enterprise._id, employees: [] })
                enterprise.RRHH = rrhhEnterprise._id
            }
            let user
            if (userId) {
                user = await User.findById(userId)
                if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            }
            const employeeExists = await Employee.findOne({
                "personalInfo.name": personalInfo.name, "personalInfo.lastname": personalInfo.lastname, "personalInfo.identityCard.value": personalInfo.identityCard.value
            })
            if (employeeExists) {
                return res.status(409).json({ message: "Ya existe este empleado." })
            }
            const searchEmployeeByIdentityCard = await Employee.findOne({
                "personalInfo.identityCard": personalInfo.identityCard
            })
            if (searchEmployeeByIdentityCard) {
                return res.status(409).json({ message: "Ya existe una cédula de identidad similar asociado a un empleado." })
            }
            if (user) {
                const searchEmployeeByUser = await Employee.findOne({
                    enterpriseId: enterprise._id,
                    userId: user._id
                })
                if (searchEmployeeByUser) return res.status(400).json({ message: "El usuario ya está registrado como empleado." })
            }
            let syndicate
            let CCTExists
            let ARTExists
            let department
            if (jobInfo.syndicate.name) {
                syndicate = await Syndicate.findOne({ name: jobInfo.syndicate.name })
                if (!syndicate) return res.status(400).json({ message: "Sindicato inválido." })
            }
            if (jobInfo.CCT.name) {

                CCTExists = await CCT.findOne({ name: jobInfo.CCT.name, cctNumber: jobInfo.CCT.cctNumber })
                if (!CCTExists) return res.status(404).json({ message: "No se ha encontrado el Convenio Colectivo de Trabajo." })
            }
            if (jobInfo.ART.name) {
                ARTExists = await ART.findOne({ name: jobInfo.ART.name })
            }
            if (!verifiedData || !privacityData) return res.status(400).json({ message: "Debe aceptar la veracidad y privacidad de los datos." })

            if (jobInfo.department) {
                department = await Department.findOne({ enterpriseId: enterprise._id, name: jobInfo.department.name })
                if (!department) return res.status(404).json({ message: "No se ha encontrado el departamento." })
            }

            const newEmployee = new Employee({
                enterpriseId: enterprise._id,
                rrhhEnterprise: rrhhEnterprise._id,
                personalInfo,
                jobInfo,
                financialInformation,
                sustainability,
                verifiedData,
                privacityData
            })
            newEmployee.jobInfo.syndicate.id = jobInfo.syndicate.name ? syndicate._id : null
            newEmployee.jobInfo.CCT.id = jobInfo.CCT.name ? CCTExists._id : null
            newEmployee.jobInfo.ART.id = jobInfo.ART.name ? ARTExists._id : null
            newEmployee.jobInfo.department.id = jobInfo.department.name ? department._id : null
            const newSustainableEmployee = new SustainableEmployee({
                employeeId: newEmployee._id
            })

            const newContractHistory = new ContractHistory({
                employeeId: newEmployee._id,
                startDate: newEmployee.jobInfo.contractStartDate,
                registrationDate: new Date()
            })

            await newContractHistory.save()

            const createdBy = await assignAction(req, res, enterprise)
            newEmployee.createdBy = {
                username: createdBy.username,
                position: createdBy.position,
                date: new Date()
            }
            rrhhEnterprise.employees.push(newEmployee._id)
            department.employees.push(newEmployee._id)
            newEmployee.sustainability = newSustainableEmployee
            newEmployee.jobInfo.contractHistory = newContractHistory._id
            await newEmployee.save()
            await newSustainableEmployee.save()
            await rrhhEnterprise.save()
            await department.save()
            return res.status(200).json({ message: "Has agregado un empleado con éxito." })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getEmployeeByID: async function (req, res) {
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
            const employee = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId }).populate('assists').populate('punctualityHistory')
            if (!employee) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            //busquemos si existe una asistencia el día de hoy por si generamos una alerta
            let alertAssist = true
            const assistToday = await Assist.findOne({
                employeeId: employee._id,
                dateAssist: { $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)), $lte: new Date(new Date().setUTCHours(23, 59, 59, 999)) }
            })
            if (assistToday) {
                alertAssist = false
            }
            //cargamos el módulo de encuestas. Este tendrá que registrar
            /*el puntaje más alto alcanzado por el empleado
            la fecha de la última medición
            el puntaje más bajo alcanzado
            el promedio de puntajes en el tiempo
            los estados de ánimo más comunes 
            */
            const surveyHistory = await SurveyHistory.findOne({ employeeId: employee._id })
            if (!surveyHistory) {
                employee.surveyHistory = null
            }
            //acá se traen las últimas DOS Encuestas
            const surveys = await Survey.find({ enterpriseId: enterprise._id, employeeId: employee._id }).sort({ dateSurvey: -1 }).limit(2)

            let lastSurvey
            let growth

            if (surveys.length > 0) {
                lastSurvey = surveys[0]?.totalScore ?? null
                const previousSurvey = surveys[1]?.totalScore ?? null
                if (lastSurvey !== null && previousSurvey !== null) {
                    growth = previousSurvey ? (((lastSurvey - previousSurvey) / previousSurvey) * 100).toFixed(2) : null
                }
            }

            //el mayor puntaje y el menor puntaje
            const mostScoredSurvey = await Survey.findOne({ enterpriseId: enterprise._id, employeeId: employee._id }).sort({ totalScore: -1 }) || null
            const lowestScoredSurvey = await Survey.findOne({ enterpriseId: enterprise._id, employeeId: employee._id }).sort({ totalScore: 1 }) || null

            const minScore = lowestScoredSurvey ? lowestScoredSurvey?.totalScore : null
            const maxScore = mostScoredSurvey ? mostScoredSurvey?.totalScore : null

            const averageScoreAggregation = await Survey.aggregate([
                { $match: { enterpriseId: enterprise._id, employeeId: employee._id } },
                { $group: { _id: null, averageScore: { $avg: "$totalScore" } } }
            ])

            const punctualityHistory = await PunctualityHistory.findOne({employeeId: employee._id})

            const averageScore = averageScoreAggregation.length > 0 ? parseFloat(averageScoreAggregation[0].averageScore.toFixed(2)) : null

            //estados de ánimo más comunes

            const moodStats = await Survey.aggregate([
                { $match: { employeeId: employee._id, enterpriseId: enterprise._id } },
                {
                    $lookup: {
                        from: 'moods',
                        localField: '_id',
                        foreignField: 'surveyId',
                        as: 'moods'
                    }
                },
                {
                    $unwind: '$moods'
                },
                {
                    $unwind: '$moods.mood'
                },
                {
                    $group: {
                        _id: '$moods.mood',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 7 }
            ])

            console.log("Qué obtengo de moods que da tanto error?", moodStats);

            if (!lastSurvey) {
                employee.lastSurvey = null
            }

            //este apartado se destinará al gráfico para mostrar la evolución del puntaje en el tiempo
            //empecemos por asignar las fechas, serán: 
            // 1 semana
            // 1 mes
            // 1 año

            //pongo la fecha 
            const now = new Date()

            //arranco con ESTA semana
            const currentWeek = new Date(now)
            currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay())
            currentWeek.setUTCHours(0, 0, 0, 0)
            //arranco con ESTE mes
            const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            startCurrentMonth.setUTCHours(0, 0, 0, 0)
            //finalmente, año

            const startCurrentYear = new Date(now.getFullYear(), 0, 1)
            startCurrentYear.setUTCHours(0, 0, 0, 0)

            const surveysCurrentWeek = await Survey.find({
                employeeId: employee._id,
                enterpriseId: enterprise._id,
                dateSurvey: {
                    $gte: currentWeek,
                    $lte: now
                }
            })

            const surveysCurrentMonth = await Survey.find({
                employeeId: employee._id,
                enterpriseId: enterprise._id,
                dateSurvey: {
                    $gte: startCurrentMonth,
                    $lte: now
                }
            })

            const surveysCurrentYear = await Survey.find({
                employeeId: employee._id,
                enterpriseId: enterprise._id,
                dateSurvey: {
                    $gte: startCurrentYear,
                    $lte: now
                }
            })

            return res.status(200).json({
                employee,
                punctualityIndex: punctualityHistory.generalIndexNumber,
                alertAssist: alertAssist,
                surveyGreen: {
                    surveyHistory: surveyHistory,
                    lastSurvey: {
                        lastSurvey: surveys[0],
                        growth: growth
                    },
                    mostScoredSurvey: maxScore,
                    lowestScoredSurvey: minScore,
                    averageScore: averageScore,
                    commonMoods: moodStats,
                    surveysCurrentWeek,
                    surveysCurrentMonth,
                    surveysCurrentYear
                },
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllEmployees: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID inválido de empresa." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employees = await Employee.find({ rrhhEnterprise: rrhhEnterprise._id }).populate('assists').populate('punctualityHistory').limit(3)
            if (employees.length === 0) return res.status(404).json({ message: "No se han registrado empleados.", createAvaiable: true })
            let viewMore = false
            if (employees.length >= 3) {
                viewMore = true
            }
            return res.status(200).json({ employees, viewMore, createAvaiable: false })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateEmployee: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const { personalInfo, jobInfo, financialInformation } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            console.log(req.body)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            console.log(rrhhEnterprise)
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            //guarda con esto
            const employeeUpdate = await Employee.findOneAndUpdate({ _id: employeeId, rrhhEnterprise: rrhhEnterprise._id }, { personalInfo, jobInfo, financialInformation }, { new: true })
            employeeUpdate.updatedBy = {
                username: updatedBy.username,
                position: updatedBy.position,
                date: new Date()
            }
            if (!employeeUpdate) {
                return res.status(404).json({ message: "Empleado no encontrado." })
            }
            return res.status(200).json({ message: "Empleado actualizado con éxito." })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteEmployee: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeDeleted = await Employee.findOneAndDelete({ _id: employeeId, rrhhEnterprise: rrhhEnterprise._id })
            if (!employeeDeleted) {
                return res.status(404).json({ message: "Empleado no encontrado." })
            }
            rrhhEnterprise.employees.pull(employeeId)
            await rrhhEnterprise.save()
            return res.status(200).json(employeeDeleted)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllEmployees: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID inválido de empresa." })
            }
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const deletedAllEmployees = await Employee.deleteMany({
                rrhhEnterprise: rrhhEnterprise._id
            })
            if (deletedAllEmployees.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado empleados." })
            }
            const updatedRRHH = await RRHH.findOneAndUpdate(
                { enterpriseId: enterprise._id, _id: rrhhEnterprise._id },
                { $pull: { employees: { $in: rrhhEnterprise.employees } } },
                { new: true }
            )
            if (!updatedRRHH) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            return res.status(200).json({ message: "Eliminado exitoso", updatedRRHH, enterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getGenderParity: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos de la empresa." })
            const employees = await Employee.countDocuments({
                rrhhEnterprise: rrhhEnterprise._id
            })
            if (employees === 0) return res.status(404).json({ message: "No se han encontrado empleados." })
            const employeesFilter = await getGenderParity(enterpriseId, rrhhEnterprise, 'generic')
            return res.status(200).json(employeesFilter)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    printDashboardEmployees: async function (req, res) {
        //dejamos las fechas preparadas
        const now = new Date()
        //inicio del día
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        startDate.setUTCHours(0, 0, 0, 0)
        console.log("Cuándo empieza realmente el día para esta fecha?", startDate)
        //finalización del día
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate.setUTCHours(23, 59, 59, 999)
        console.log("Cuándo termina realmente el día para esta fecha?", endDate)
        //inicio del mes
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        startMonth.setUTCHours(0, 0, 0, 0)
        //finalización del mes
        const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endMonth.setUTCHours(23, 59, 59, 999)

        //inicio del año
        const startYear = new Date(now.getFullYear(), 0, 1)
        startYear.setUTCHours(0, 0, 0, 0)
        const endYear = new Date(now.getFullYear(), 11, 31)
        endYear.setUTCHours(23, 59, 59, 999)

        //inicio del año pasado
        const startLastYear = new Date(now.getFullYear() - 1, 0, 1)
        startLastYear.setUTCHours(0, 0, 0, 0)
        const endLastYear = new Date(now.getFullYear() - 1, 11, 31)
        endLastYear.setUTCHours(23, 59, 59, 999)
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            //obtener todos los empleados
            const employees = await Employee.find({ rrhhEnterprise: rrhhEnterprise._id })
            const employeesId = employees.map((e) => e._id)
            //obtener los empleados del año pasado - contarlos solamente
            const employeesLastYear = await Employee.find({
                rrhhEnterprise: rrhhEnterprise._id,
                'jobInfo.contractStartDate': { $lte: endLastYear }, //es decir, hasta fin del año pasado comenzó la relación laboral seguro
                $or: [
                    { 'jobInfo.contractEndDate': null },
                    { 'jobInfo.contractEndDate': { $gte: startLastYear } }
                ]
            })
            //ahora traigamos los empleados actuales - contarlos solamente
            const currentEmployees = await Employee.find({
                rrhhEnterprise: rrhhEnterprise._id,
                'jobInfo.contractStartDate': { $lte: now }, //es decir, hasta hoy comenzó la relación laboral seguro
                $or: [
                    { 'jobInfo.contractEndDate': null },
                    { 'jobInfo.contractEndDate': { $gte: now } }
                ]
            })

            const percentageGrowthEmployees = employeesLastYear.length > 0 ? (((currentEmployees.length - employeesLastYear.length) / employeesLastYear.length) * 100).toFixed(2) : null
            //obtener antiguedad promedio
            const totalAntiquityMonths = employees.reduce((acc, employee) => {
                const startDate = new Date(employee.jobInfo.contractStartDate)
                const currentDate = new Date()
                const diffTime = currentDate.getTime() - startDate.getTime()
                const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
                const diffMonths = diffYears * 12
                return acc + diffMonths
            }, 0)
            const averageAntiquity = employees.length > 0 ? (totalAntiquityMonths / employees.length) : 0
            const averageAntiquityYears = averageAntiquity / 12
            //esta fn Formatea la antiguedad para devolvera estandarizada
            function formatAntiquity(totalMonths) {
                const years = Math.round(totalMonths / 12)
                const months = Math.round(totalMonths % 12)

                if (years > 0 && months === 0) {
                    return `${years} año${years > 1 ? 's' : ''}`
                }

                //solo meses
                if (years === 0 && months > 0) {
                    return `${months} mes${months > 1 ? 'es' : ''}`
                }

                //años y meses
                if (years > 0 && months > 0) {
                    return `${years} año${years > 1 ? 's' : ''} y ${months} mes${months > 1 ? 'es' : ''}`
                }

                return '0 meses'
            }

            //obteniendo satisfacciones de empleados
            const surveyHistories = await SurveyHistory.find({
                employeeId: { $in: employeesId }
            }).populate({
                path: 'employeeId',
                select: 'personalInfo'
            })

            let topSatisfactionEmployees = []

            surveyHistories.forEach((s) => {
                topSatisfactionEmployees.push({
                    name: s.employeeId.personalInfo.name,
                    lastname: s.employeeId.personalInfo.lastname,
                    index: s.lastIndex
                })
            })

            topSatisfactionEmployees.sort((a, b) => { return b.index - a.index })

            //obtener paridad de genero
            const totalGender = await getGenderParity(enterpriseId, rrhhEnterprise, 'generic')
            const totalGenderPerDepartments = await getGenderParity(enterpriseId, rrhhEnterprise, 'per-department')

            //obtener composición por departamentos
            let totalDepartments = {}
            employees.forEach((e) => {
                const department = e.jobInfo.department.name
                totalDepartments[department] = (totalDepartments[department] || 0) + 1
            })
            //obtener rotación por empleados

            //calculo de rotación mensual
            const turnoverMonth = await calculateTurnoverRate(enterpriseId, startMonth, endMonth) || 0
            //cálculo de rotación anual
            const turnoverYear = await calculateTurnoverRate(enterpriseId, startYear, endYear) || 0
            //asistencias de hoy
            let totalAssists = {}
            let totalAssistsPerPunctuality = {}
            //obtenemos todas las asistencias

            const assists = await Assist.find({
                dateAssist: { $gte: startDate, $lte: endDate },
                employeeId: { $in: employeesId }
            })
            //filtramos las asistencias por estado
            assists.forEach((a) => {
                const status = a.status
                totalAssists[status] = (totalAssists[status] || 0) + 1 || 0
            })
            //filtramos las asistencias por eficiencia
            assists.forEach((a) => {
                const punctuality = a.punctualityStatus
                if(punctuality !== null){
                    totalAssistsPerPunctuality[punctuality] = (totalAssistsPerPunctuality[punctuality] || 0) + 1 || 0 
                }
            })
            //filtramos todo el indice de satisfacción laboral
            const surveys = await Survey.find({
                enterpriseId: enterprise._id,
                employeeId: { $in: employeesId }
            })

            //traemos los ambientes laborales, cuya dependencia es de la encuesta
            const workEnvironments = await WorkEnvironment.find({
                enterpriseId: enterprise._id
            })

            const accWorkEnvironmentsScore = workEnvironments.reduce((acc, we) => acc + we.score, 0) / workEnvironments.length

            const total = surveys.reduce((acc, s) => acc + s.totalScore, 0)
            const averageSatisfaction = surveys.length > 0 ? ((total / surveys.length)).toFixed(1) : null

            //clima laboral
            const workEnvironmentCurrent = await calculateGenericWorkEnvironment(enterpriseId, averageSatisfaction, turnoverMonth, averageAntiquityYears, accWorkEnvironmentsScore) | null

            const lastWorkEnvironments = await WorkEnvironmentSnapshot.find({ enterpriseId: enterprise._id }).sort({ createdAt: -1 }).limit(7)
            return res.status(200).json({
                totalEmployees: {
                    current: currentEmployees.length,
                    growth: percentageGrowthEmployees
                },
                averageAntiquity: formatAntiquity(averageAntiquity),
                totalGender,
                totalDepartments,
                totalGenderPerDepartments: totalGenderPerDepartments || null,
                topEmployeesOfSatisfaction: topSatisfactionEmployees.slice(0, 3),
                turnoverMonth: turnoverMonth ? turnoverMonth : 0, //expresado en porcentaje
                turnoverYear: turnoverYear ? turnoverYear : 0, //expresado en porcentaje
                totalAssists,
                totalAssistsPerPunctuality,
                workEnvironment: {
                    workEnvironmentCurrent: workEnvironmentCurrent.number,
                    message: workEnvironmentCurrent.message
                },
                workEnvironmentSnapshots: lastWorkEnvironments ? lastWorkEnvironments : 0,
                averageSatisfaction: averageSatisfaction ? averageSatisfaction : null,
                totalEmployeesList: currentEmployees
            })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAverageAntiquity: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employees = await Employee.find({ rrhhEnterprise: rrhhEnterprise._id })
            employees.length === 0 && res.status(404).json({ message: "No se han encontrado empleados." })
            const totalAntiquity = employees.reduce((acc, employee) => {
                const startDate = new Date(employee.jobInfo.startDate)
                const currentDate = new Date()
                const diffTime = currentDate - startDate
                const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
                return acc + diffYears
            }, 0)
            const averageAntiquity = employees.length > 0 ? (totalAntiquity / employees.length) : 0
            return res.status(200).json({ averageAntiquity })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    endContract: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const { note } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employee = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId }).populate('assists').populate('punctualityHistory')
            if (!employee) {
                return res.status(404).json({ message: "No se ha encontrado el empleado." })
            }
            const contractHistory = await ContractHistory.findOne({ employeeId: employee._id })
            if (!contractHistory) return res.status(404).json({ message: "No se encontró un módulo de contrato para el empleado." })

            //damos por finalizado el vínculo laboral
            const newDate = new Date()
            newDate.setUTCHours(0, 0, 0, 0)

            employee.isActive = false
            employee.jobInfo.contractEndDate = newDate

            //actualizamos el módulo contractual
            contractHistory.endDate = newDate
            if (note) contractHistory.note = note

            await employee.save()
            await contractHistory.save()
            return res.status(200).json({ message: "El contrato laboral fue finalizado con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = employeeController
