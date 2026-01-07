const calculateCarbonFootprintByKwh = require("./calculateCarbonFootprintKwh")
const { getEmissionFactorsByPaper, getEmissionFactorsByWasted, getEmissionFactorsByFuel, getFuelConsumptionByType } = require("./getEmissionFactors")

const calculateNewCarbonFootprint = async function (req, res, use, assist, paperUsage, wasteGenerated, waterConsumptionLiter) {
    console.log(use,assist)
    const unitiesWater = {
        m3: 1000,
        gallons: 3.785,
        ounces: 33.814
    }
    let emissionFactorPaper = await getEmissionFactorsByPaper(req, res)
    let emissionFactorWasted = await getEmissionFactorsByWasted(req, res)
    let emissionFactorsByFuel = await getEmissionFactorsByFuel(req, res)
    let fuelConsumptionByType = await getFuelConsumptionByType(req, res)
    //calcular consumo kwh
    const kwhValue = use?.consumptionKwh ?? 0
    const hours = use?.hours ?? 0
    const newCarbonFootprintEnergy = (kwhValue > 0 && hours > 0) ? calculateCarbonFootprintByKwh(kwhValue, hours) : 0
    console.log("Nueva huella de energia", newCarbonFootprintEnergy)
    const newCarbonFootprintTransport = (assist.distanceKm * (fuelConsumptionByType[assist.fuelType]) / 100) * emissionFactorsByFuel[assist.fuelType]
    console.log("Nueva huella de transporte", newCarbonFootprintTransport)
    const newCarbonFootprintPaper = paperUsage.value * emissionFactorPaper[paperUsage.typePaper]
    console.log("Nueva huella de papel", newCarbonFootprintPaper )
    const newCarbonFootprintWasted = wasteGenerated.value * emissionFactorWasted[wasteGenerated.process]
    console.log("Nueva huella de residuos", newCarbonFootprintWasted )
    const newCarbonFootprintWater = ((waterConsumptionLiter.value / unitiesWater.m3) * 0.30)
    console.log("Nueva huella de agua", newCarbonFootprintWater )
    const newTotalCarbonFootprint = parseFloat(newCarbonFootprintEnergy) + parseFloat(newCarbonFootprintPaper) + parseFloat(newCarbonFootprintWasted) + parseFloat(newCarbonFootprintWater) + parseFloat(newCarbonFootprintTransport)
    console.log("Nueva huella?",newTotalCarbonFootprint)
    return parseFloat(newTotalCarbonFootprint)
}

module.exports = calculateNewCarbonFootprint