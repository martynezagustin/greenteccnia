const SustainableObjective = require("../../../models/sustainability/sustainableObjectiveModel")
const LegalRequirement = require("../../../models/sustainability/legalRequirementModel")

const updateSustainabilityScoreEnterprise = async (sustainabilityEnterprise) => {
    const currentMonth = new Date()
    if (!sustainabilityEnterprise.sustainabilityScore || sustainabilityEnterprise.sustainabilityScore.lastUpdated.getMonth() !== currentMonth.getMonth()) {
        sustainabilityEnterprise.sustainabilityScore = { value: 0, lastUpdated: currentMonth }
    } else {
        sustainabilityEnterprise.sustainabilityScore.value = 0
    }
    const sustainableObjectives = await SustainableObjective.find({
        sustainabilityEnterprise: sustainabilityEnterprise._id
    })
    const legalRequirements = await LegalRequirement.find({
        sustainabilityEnterprise: sustainabilityEnterprise._id
    })

    const impactScores = {
        "Muy alto": 50,
        "Alto": 35,
        "Mediano": 20,
        "Bajo": 10,
        "Muy bajo": 5
    }
    const complianceStatusScore = {
        true: 20,
        false: -10
    }
    if (sustainableObjectives.length === 0) {
        sustainabilityEnterprise.sustainabilityScore = { value: 0, lastUpdated: currentMonth }
    }
    sustainableObjectives.forEach((objective) => {
        if (impactScores[objective.impact]) {
            console.log("Datos que van sumando", impactScores[objective.impact])
            sustainabilityEnterprise.sustainabilityScore.value += impactScores[objective.impact]
        }
    })
    legalRequirements.forEach((legalRequirement) => {
        if (complianceStatusScore[legalRequirement.complianceStatus]) {
            sustainabilityEnterprise.sustainabilityScore.value += complianceStatusScore[legalRequirement.complianceStatus]
        }
    })
    if (sustainabilityEnterprise.sustainabilityScore.value > 1000) {
        sustainabilityEnterprise.sustainabilityScore.value = 1000
    }
    if (sustainabilityEnterprise.sustainabilityScore.value <= 0) {
        sustainabilityEnterprise.sustainabilityScore.value = 0
    }
    sustainabilityEnterprise.sustainabilityScore.lastUpdated = new Date()
    await sustainabilityEnterprise.save()
}

module.exports = updateSustainabilityScoreEnterprise