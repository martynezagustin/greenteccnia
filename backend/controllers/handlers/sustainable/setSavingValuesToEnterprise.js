const Project = require("../../../models/projects/projectModel")

const setSavingValuesToEnterprise = async (req, res, enterprise, sustainabilityEnterprise) => {
    try {
        const allProjects = await Project.find({
            enterpriseId: enterprise._id
        })
        if (allProjects.length === 0) return res.status(404).json({ message: "No se han encontrado proyectos." })
        const totalWaterConsumptionReductionAccumulated = allProjects.reduce((acc, project) => acc + project.ambientalImpact?.waterConsumptionReduction?.value, 0)
        const totalConsumptionEnergyReductionAccumulated = allProjects.reduce((acc, project) => acc + project.ambientalImpact?.energyConsumptionReduction?.value, 0)
        const totalCO2ConsumptionReductionAccumulated = allProjects.reduce((acc, project) => acc + project.ambientalImpact?.CO2ConsumptionReduction?.value, 0)
        const totalScrapsReductionAccumulated = allProjects.reduce((acc, project) => acc + project.ambientalImpact?.scrapsReduction?.value, 0)

        sustainabilityEnterprise.estimatedSavings.consumptionKwh = {
            value: totalConsumptionEnergyReductionAccumulated,
            unit: "kWh",
            frequency: "día"
        }
        sustainabilityEnterprise.estimatedSavings.water = {
            value: totalWaterConsumpt
        }
        sustainabilityEnterprise.estimatedSavings.waste
        sustainabilityEnterprise.estimatedSavings.CO2
        await sustainabilityEnterprise.save()
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
module.exports = setSavingValuesToEnterprise