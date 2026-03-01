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
        
        const rawWorkLoad = this.workLoadLevel
        const rawNoise = this.noiseLevel

        //invertimos la polaridad
        const invertedWorkLoad = (rawWorkLoad != null) ? (ORIGINAL_MAX + 1) - rawWorkLoad : null //si rawWorkLoad no es nulo, al valor original (5) sumale 1 y restale el level
        const invertedNoise = (rawNoise != null) ? (ORIGINAL_MAX + 1) - rawNoise : null
        //lo mismo arriba ☝️
        
        const fields = [
            invertedWorkLoad,
            invertedNoise,
            this.ergonomics,
            this.temperatureConfort,
            this.airQuality
        ]
        const validFields = fields.filter(v => v !== undefined && v !== null && typeof v === 'number' && !isNaN(v))
        if (validFields.length > 0) {
            const totalSum = validFields.reduce((acc, value) => acc + value, 0)
            const average = totalSum / validFields.length
            const scaledScore = (average / ORIGINAL_MAX) * MAX_SCORE
            this.score = parseFloat(scaledScore.toFixed(2))
        } else {
            this.score = 0
        }
        console.log("El work environment score", this.score)
        next()
    } catch (error) {
        next(error)
    }
})

module.exports = mongoose.model('WorkEnvironment', WorkEnvironmentSchema)