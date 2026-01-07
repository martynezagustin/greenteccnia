const calculateCarbonFootprintByKwh = require("./calculateCarbonFootprintKwh")
const { getEmissionFactorsByPaper, getEmissionFactorsByWasted, getEmissionFactorsByFuel, getFuelConsumptionByType } = require("./getEmissionFactors")

const calculatePreviousCarbonFootprint = async function (req, res, report, assist) {
    const unitiesWater = {
        m3: 1000,
        gallons: 3.785,
        ounces: 33.814
    }
    let emissionFactorPaper = await getEmissionFactorsByPaper(req, res)
    let emissionFactorWasted = await getEmissionFactorsByWasted(req, res)
    let emissionFactorsByFuel = await getEmissionFactorsByFuel(req, res)
    let fuelConsumptionByType = await getFuelConsumptionByType(req, res)
    const previousCarbonFootprintTransport = (assist.distanceKm * (fuelConsumptionByType[assist.fuelType]) / 100) * emissionFactorsByFuel[assist.fuelType]
    //calcular consumo kwh
    if(!report.consumptionKwh){
        console.error("No hay reporte de KWH.")
    }
    const kwhValue = report.consumptionKwh?.value ?? 0
    const hours = report.consumptionKwh?.hours ?? 0
    const previousCarbonFootprintEnergy = (kwhValue > 0 && hours > 0) ? calculateCarbonFootprintByKwh(kwhValue, hours) : 0
    console.log(`Huella de co2 de energía ${previousCarbonFootprintEnergy}`)
    const previousCarbonFootprintPaper = report.paperUsage.value * emissionFactorPaper[report.paperUsage.typePaper]
    console.log(`Huella de co2 de papel ${previousCarbonFootprintPaper}`)
    const previousCarbonFootprintWasted = report.wasteGenerated.value * emissionFactorWasted[report.wasteGenerated.process]
    console.log(`Huella de co2 de residuos ${previousCarbonFootprintWasted}`)
    const previousCarbonFootprintWater = ((report.waterConsumptionLiter.value / unitiesWater.m3) * 0.30)
    console.log(`Huella de co2 de agua ${previousCarbonFootprintWater}`)
    const previousTotalCarbonFootprint = parseFloat(previousCarbonFootprintEnergy) + parseFloat(previousCarbonFootprintPaper) + parseFloat(previousCarbonFootprintWasted) + parseFloat(previousCarbonFootprintWater) + parseFloat(previousCarbonFootprintTransport)
    return previousTotalCarbonFootprint
}

module.exports = calculatePreviousCarbonFootprint