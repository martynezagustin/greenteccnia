//este módulo debe calcular el ambiente laboral de un empleado usando IA en UN FUTURO, por el momento, el cálculo usa parámetros establecidos por el propio greenteccnia
const { calculateAbsentism, calculateAbsentismPerMonth } = require("../../../../services/workEnvironmentAI/calculateAbsentism")
const { getWeightsWorkEnvironment } = require("./getWeightsWorkEnvironment")
//models
const RRHH = require("../../../../models/rrhh/rrhhModel")
const Survey = require("../../../../models/rrhh/satisfaction/surveyModel")
const WorkEnvironment = require("../../../../models/rrhh/satisfaction/workEnvironmentModel")
const Employee = require("../../../../models/rrhh/employees/employeeModel")
const { calculateTurnoverRate } = require("../../../rrhh/functions/employeeHelpers")

async function calculateGenericWorkEnvironment(enterpriseId, satisfaction, turnover, antiquity, accWorkEnvironments) {


    const absentismValue = await calculateAbsentism(enterpriseId)
    console.log("Calculando el work environment genérico con:", { enterpriseId, satisfaction, turnover, absentismValue, antiquity, accWorkEnvironments })
    const weights = await getWeightsWorkEnvironment(enterpriseId)

    //normalizamos los parámetros
    const normalizedParameters = {
        satisfaction: clamp(satisfaction, 0, 10),
        workEnvironments: clamp(accWorkEnvironments, 0, 10),
        turnover: normalize(turnover, 0, 50),
        absentism: normalize(absentismValue, 0, 50),
        antiquity: normalizeAntiquity(antiquity)
    }

    const score = normalizedParameters.satisfaction * weights.satisfaction +
        normalizedParameters.workEnvironments * weights.workEnvironments +
        (10 - normalizedParameters.turnover) * weights.turnover +
        (10 - normalizedParameters.absentism) * weights.absentism +
        normalizedParameters.antiquity * weights.antiquity
    return {number: parseFloat(score.toFixed(1)), message: score > 8 ? '😌 Índice positivo' : score <= 8 && score >= 5 ? '😐 Índice neutral' : '😔 Índice negativo'}
}

async function getAverageSatisfaction(enterpriseId, period) {
    let surveys = []
    switch (period) {
        case 'lastMonth':
            const now = new Date()

            const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            startLastMonth.setUTCHours(0, 0, 0, 0)

            const endLastMonth = new Date(startLastMonth)
            endLastMonth.setMonth(endLastMonth.getMonth() + 1)
            endLastMonth.setUTCHours(23, 59, 59, 999)

            surveys = await Survey.find({ enterpriseId: enterpriseId, dateSurvey: { $gte: startLastMonth, $lte: endLastMonth } })
            break;
        case 'current':
            surveys = await Survey.find({ enterpriseId: enterpriseId })
            break;
        default:
            throw new Error('Periodo no válido para el cálculo de satisfacción.')
    }
    if (surveys.length === 0) return 0
    const totalScore = surveys.reduce((acc, survey) => acc + survey.totalScore, 0)
    return parseFloat((totalScore / surveys.length).toFixed(2))
}

async function calculateGenericWorkEnvironmentPerMonth(enterpriseId, year, month) {

    const now = new Date()

    //📅 Empezando el mes
    const startMonth = new Date(year, month - 1, 1)
    startMonth.setUTCHours(0, 0, 0, 0)
    const endMonth = new Date(year, month, 0)
    endMonth.setUTCHours(23, 59, 59, 999)

    //⚖️ Acerca de los pesos
    const weights = await getWeightsWorkEnvironment(enterpriseId)

    //📊 Acerca de los parámetros
    const absentism = await calculateAbsentismPerMonth(enterpriseId, year, month)
    const turnover = await calculateTurnoverRate(enterpriseId, startMonth, endMonth)
    const satisfaction = await getAverageSatisfaction(enterpriseId, 'lastMonth')

    if (satisfaction === null) {
        console.error("No hay suficientes encuestas de satisfacción para brindar un cálculo confiable del clima laboral. Espera un tiempo o hazle encuestas a tus empleados para obtener un mejor resultado.")
    }

    const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterpriseId })
    if (!rrhhEnterprise) return 0

    //traemos los empleados de la empresa
    const employees = await Employee.find({
        rrhhEnterprise: rrhhEnterprise._id,
        'jobInfo.contractStartDate': { $lte: now }, //es decir, hasta hoy comenzó la relación laboral seguro
        $or: [
            { 'jobInfo.contractEndDate': null },
            { 'jobInfo.contractEndDate': { $gte: now } }
        ]
    })

    //obtener antiguedad promedio
    const totalAntiquityMonths = employees.reduce((acc, employee) => {
        const startDate = new Date(employee.jobInfo.contractStartDate)
        const currentDate = new Date()
        const diffTime = currentDate.getTime() - startDate.getTime()
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
        const diffMonths = diffYears * 12
        return acc + diffMonths
    }, 0)
    const averageAntiquity = employees.length > 0 ? (totalAntiquityMonths / 12) : 0
    const antiquityScore = averageAntiquity

    //traemos los ambientes laborales, cuya dependencia es de la encuesta
    console.log("Osea, buscar encuestas entre", startMonth, "y", endMonth)
    const workEnvironments = await WorkEnvironment.find({
        enterpriseId: enterpriseId,
        createdAt: { $gte: startMonth, $lte: endMonth }
    })

    const workEnvironmentsScore = workEnvironments.length > 0 ? workEnvironments.reduce((acc, we) => acc + we.score, 0) / workEnvironments.length : 5


    //normalizamos los parámetros
    const normalizedParameters = {
        satisfaction: clamp(satisfaction, 0, 10),
        workEnvironments: clamp(workEnvironmentsScore, 0, 10),
        turnover: normalize(turnover, 0, 50),
        absentism: normalize(absentism, 0, 50),
        antiquity: normalizeAntiquity(antiquityScore)
    }

    console.log('Tomando datos', normalizedParameters);

    const score = normalizedParameters.satisfaction * weights.satisfaction +
        normalizedParameters.workEnvironments * weights.workEnvironments +
        (10 - normalizedParameters.turnover) * weights.turnover +
        (10 - normalizedParameters.absentism) * weights.absentism +
        normalizedParameters.antiquity * weights.antiquity
    return parseFloat(score.toFixed(2))
}

function normalize(value, min, max) {
    if (max === min) return 0
    return ((value - min) / (max - min)) * 10
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function normalizeAntiquity(value) {
    const MAX_YEARS = 10
    const normalize = (Math.log(value + 1) / Math.log(MAX_YEARS + 1)) * 10
    return Number(Math.min(normalize, 10).toFixed(2))
}

module.exports = { calculateGenericWorkEnvironment, calculateGenericWorkEnvironmentPerMonth }