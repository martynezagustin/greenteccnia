const mongoose = require("mongoose")

const UxUserSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    darkMode: { type: Boolean, default: false },
    montserratFont: { type: Boolean, default: true },
    monochrome: {type: Boolean, default: false},
    roundedButtons: {type: Boolean, default: true}
})

module.exports = mongoose.model("UxUser", UxUserSchema)