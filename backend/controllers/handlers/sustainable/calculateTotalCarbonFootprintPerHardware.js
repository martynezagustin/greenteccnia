const mongoose = require("mongoose")
const Use = require("../../../models/technology/hardware/useModel")
const calculateCarbonFootprintByKwh = require("./calculateCarbonFootprintKwh")

const calculateTotalCarbonFootprintPerHardware = async function (req, res, hardware) {
    try {
        const uses = await Use.find({
            hardwareId: hardware._id
        })
        const totalHours = uses.reduce((acc, use) => acc + use.hours, 0) || 0
        const totalCarbonFootprint = calculateCarbonFootprintByKwh(hardware.consumptionW, totalHours)
        console.log("Huella de carbono de electricidad: ", totalCarbonFootprint)
        hardware.carbonFootprintTotal.carbonFootprintG = totalCarbonFootprint * 1000 || 0
        hardware.carbonFootprintTotal.carbonFootprintKG = totalCarbonFootprint || 0
        hardware.carbonFootprintTotal.carbonFootprintLB = totalCarbonFootprint * 2.205 || 0
        hardware.carbonFootprintTotal.carbonFootprintLB = totalCarbonFootprint / 1000 || 0
        await hardware.save()
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}

module.exports = calculateTotalCarbonFootprintPerHardware