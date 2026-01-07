const Project = require("../../../models/projects/projectModel")

const setSavingValuesToEnterprise = async function (enterprise, sustainabilityEnterprise) {
    try {
        const allProjects = await Project.find({
            enterpriseId: enterprise._id,
            statusProject: "Completado"
        })
        if (!sustainabilityEnterprise.estimatedSavings) {
            sustainabilityEnterprise.estimatedSavings = {}
        }
        const totalWaterConsumptionReductionAccumulated = allProjects.reduce((acc, project) => acc + project.ambientalImpact?.waterConsumptionReduction?.value || 0, 0)
        const totalConsumptionEnergyReductionAccumulated = allProjects.reduce((acc, project) => acc + project.ambientalImpact?.energyConsumptionReduction?.value || 0, 0)
        const totalCO2ConsumptionReductionAccumulated = allProjects.reduce((acc, project) => acc + project.ambientalImpact?.CO2ConsumptionReduction?.value || 0, 0)
        const totalScrapsReductionAccumulated = allProjects.reduce((acc, project) => acc + project.ambientalImpact?.scrapsReduction?.value || 0, 0)

        console.log(totalWaterConsumptionReductionAccumulated, totalConsumptionEnergyReductionAccumulated, totalCO2ConsumptionReductionAccumulated, totalScrapsReductionAccumulated)

        sustainabilityEnterprise.estimatedSavings.consumptionKwh.value = totalConsumptionEnergyReductionAccumulated
        sustainabilityEnterprise.estimatedSavings.water.value = totalWaterConsumptionReductionAccumulated
        sustainabilityEnterprise.estimatedSavings.waste.value = totalScrapsReductionAccumulated
        sustainabilityEnterprise.estimatedSavings.CO2.value = totalCO2ConsumptionReductionAccumulated
        await sustainabilityEnterprise.save()
    } catch (error) {
        console.error(error)
    }
}
module.exports = setSavingValuesToEnterprise