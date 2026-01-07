const mongoose = require("mongoose")

const WorkEnvironmentSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise", required: true },
    surveyId: { type: mongoose.Schema.Types.ObjectId, ref: "Survey", required: true },
    remote: { type: Boolean, default: false },
    workLoadLevel: { type: Number, min: 1, max: 5 },
    noiseLevel: { type: Number, min: 1, max: 5 },
    ergonomics: { type: Number, min: 1, max: 5 },
    temperatureConfort: { type: Number, min: 1, max: 5 },
    airQuality: { type: Number, min: 1, max: 5 },
    score: { type: Number, min: 1, max: 5 }
}, { timestamps: true })

const MAX_SCORE = 10
const ORIGINAL_MAX = 5

WorkEnvironmentSchema.pre('save', async function (next) {
    try {
        const fields = [
            this.workLoadLevel,
            this.noiseLevel,
            this.ergonomics,
            this.temperatureConfort,
            this.airQuality
        ]
        const validFields = fields.filter(v => v !== undefined && v !== null && typeof v === 'number')
        console.log("Los fields válidos?", validFields)
        if (validFields.length > 0) {
            const total = validFields.reduce((acc, value) => acc + value, 0) / validFields.length

            const scaledScore = (total / ORIGINAL_MAX) * MAX_SCORE
            this.score = parseFloat(scaledScore.toFixed(2))
        } else {
            this.score = 6
        }
        console.log("El work environment score", this.score)
        next()
    } catch (error) {

    }
})

module.exports = mongoose.model('WorkEnvironment', WorkEnvironmentSchema)