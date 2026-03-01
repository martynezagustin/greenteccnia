//NOTA, este campo solo aplica para progreso. Es parecido a ese dashboard de habits de excel
const mongoose = require('mongoose')

const ChecklistSchema = new mongoose.Schema({
    objectiveId: {type: mongoose.Schema.Types.ObjectId, ref: 'RRHHObjective'},
    title:  {type: String, required: true},
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    completed: {type: Boolean, default: false}
})

module.exports = mongoose.model('Checklist', ChecklistSchema)