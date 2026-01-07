const mongoose = require("mongoose")

const TechnologySchema = new mongoose.Schema({
    enterpriseId: {type: mongoose.Schema.Types.ObjectId, ref: "Enterprise"},
    hardwares: [{type: mongoose.Schema.Types.ObjectId, ref: "Hardware"}],
    softwares: [{type: mongoose.Schema.Types.ObjectId, ref: "Software"}],
})

module.exports = mongoose.model("Technology", TechnologySchema)