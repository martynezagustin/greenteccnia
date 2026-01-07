function calculateCarbonFootprintByKwh(consumptionW, hours, factorEmission) {
    const CO2_FACTOR = (factorEmission) => {
        const defaultFactor = 0.1908
        return isNaN(factorEmission) ?  defaultFactor: factorEmission
    }
    if (consumptionW < 0) {
        return 0
    }
    const consumptionKwh = (consumptionW * hours) / 1000
    return consumptionKwh * CO2_FACTOR
}

module.exports = calculateCarbonFootprintByKwh