const mongoose = require("mongoose")
const SurveyHistory = require("./surveyHistoryModel")

const SurveySchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    dateSurvey: { type: Date, default: Date.now, required: true },
    relationshipWithTeam: { type: Number, min: 1, max: 5 },
    satisfaction: { type: Number, min: 1, max: 5, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    moodId: { type: mongoose.Schema.Types.ObjectId, ref: "Mood", required: false },
    comments: { type: String },
    personalFactorId: { type: mongoose.Schema.Types.ObjectId, ref: "PersonalFactor" },
    workEnvironment: { type: mongoose.Schema.Types.ObjectId, ref: "WorkEnvironment" },
    totalScore: { type: Number, min: 0, max: 100, required: false },
    predictedMood: { type: String, enum: ['Muy positivo', 'Positivo', 'Neutral', 'Negativo'] },
    createdBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    },
    updatedBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    }
}, { timestamps: true })

SurveySchema.pre('save', async function (next) {

    const startMonth = new Date()
    startMonth.setDate(1)
    startMonth.setHours(0, 0, 0, 0)

    const endMonth = new Date(startMonth)
    endMonth.setMonth(endMonth.getMonth() + 1)
    endMonth.setMilliseconds(-1)
    const existing = await mongoose.model('Survey').findOne({
        employeeId: this.employeeId,
        dateSurvey: new Date()
    });
    if (existing) {
        throw new Error('Ya existe una encuesta para este empleado en el período actual.')
    }
    next()
})

const MAX_SCORE = 10
const ORIGINAL_MAX = 5

SurveySchema.pre('save', async function (next) {
    try {
        const survey = this
        //Los pesos de cada dimensión
        const weights = {
            relationshipWithTeam: 0.3,
            satisfaction: 0.5,
            workEnvironment: 0.2
        }

        let workEnvironmentScore = 3

        if (survey.workEnvironment) {
            const WorkEnvironment = mongoose.model('WorkEnvironment')
            const workEnv = await WorkEnvironment.findById(survey.workEnvironment)
            if (workEnv && workEnv.score) workEnvironmentScore = workEnv.score
        }

        const clamp = v => Math.min(Math.max(v, 1), ORIGINAL_MAX)

        const rel = clamp(survey.relationshipWithTeam)
        const sat = clamp(survey.satisfaction)
        const env = clamp(workEnvironmentScore)

        const totalWeight = weights.relationshipWithTeam + weights.satisfaction + weights.workEnvironment

        const weightAvg = (
            rel * weights.relationshipWithTeam +
            sat * weights.satisfaction +
            env * weights.workEnvironment) / totalWeight

        const scaledScore = (weightAvg / ORIGINAL_MAX) * MAX_SCORE
        survey.totalScore = parseFloat(scaledScore.toFixed(2))
        console.log("El survey totalScore", survey.totalScore)
        let history = await SurveyHistory.findOne({ employeeId: survey.employeeId })
        if (!history) {
            history = new SurveyHistory({
                employeeId: survey.employeeId,
                snapshots: [survey.toObject()],
                lastIndex: survey.totalScore
            })
        } else {
            history.lastIndex = survey.totalScore
            history.snapshots.push(survey.toObject())
        }
        await history.save()
        next()
    } catch (err) {
        throw new Error('Error al calcular los puntajes de la encuesta: ' + err.message)
    }
})



module.exports = mongoose.model("Survey", SurveySchema)