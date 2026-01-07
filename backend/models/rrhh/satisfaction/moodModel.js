const mongoose = require("mongoose")

const MoodSchema = new mongoose.Schema({
    surveyId: { type: mongoose.Schema.Types.ObjectId, ref: "Survey" },
    mood: [{ 
        type: String, enum: ["Aliviado", "Ansioso", "Cansado", "Contento", "Deprimido", "Energizado", "Estresado", "Frustrado", "Indiferente", "Motivado", "Orgulloso", "Preocupado"] }],
})

module.exports = mongoose.model('Mood', MoodSchema)