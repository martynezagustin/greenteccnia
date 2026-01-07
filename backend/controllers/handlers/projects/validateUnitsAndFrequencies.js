function validateUnits(req, res, ambientalImpact, sustainabilityEnterprise) {
    try {
        if (!ambientalImpact || !sustainabilityEnterprise) {
            return res.status(400).json({ message: "Los datos ambientales o de la sustentabilidad de la empresa no están disponibles." })
        }
        const { waterConsumptionReduction, energyConsumptionReduction, CO2ConsumptionReduction, scrapsReduction } = ambientalImpact
        const { estimatedSavings } = sustainabilityEnterprise
        if (waterConsumptionReduction.unit != estimatedSavings.water.unit ||
            energyConsumptionReduction.unit != estimatedSavings.consumptionKwh.unit ||
            CO2ConsumptionReduction.unit != estimatedSavings.CO2.unit ||
            scrapsReduction.unit != estimatedSavings.waste.unit) {
            return res.status(400).json({ message: "No coinciden las unidades con las que estableciste para la empresa. Por favor, vuelve a intentarlo." })
        }
        return true
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}

function validateFrequencies(req, res, ambientalImpact, sustainabilityEnterprise) {
    try {
        if (!ambientalImpact || !sustainabilityEnterprise) {
            return res.status(400).json({ message: "Los datos ambientales o de la sustentabilidad de la empresa no están disponibles." })
        }
        const { waterConsumptionReduction, energyConsumptionReduction, CO2ConsumptionReduction, scrapsReduction } = ambientalImpact
        const { estimatedSavings } = sustainabilityEnterprise
        
        return true
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrio un error de servidor: " + error })
    }
}

module.exports = { validateUnits, validateFrequencies }