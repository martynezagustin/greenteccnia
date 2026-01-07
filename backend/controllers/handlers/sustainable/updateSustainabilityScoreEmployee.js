const Initiative = require("../../../models/rrhh/sustainableRrhh/initiativeModel")

async function updateSustainabilityScoreEmployee(sustainableEmployee, employeeExists, rrhhEnterprise, enterprise) {
    try {
        const currentMonth = new Date()
        if (!sustainableEmployee.sustainabilityScore.lastUpdated || new Date(sustainableEmployee.sustainabilityScore.lastUpdated).getMonth() !== currentMonth) {
            sustainableEmployee.sustainabilityScore = {
                value: 0,
                lastUpdated: currentMonth
            }
        }

        const initiatives = await Initiative.find({
            sustainableEmployeeId: sustainableEmployee._id
        })

        const impactScores = {
            "Muy alto": 50,
            "Alto": 35,
            "Mediano": 20,
            "Bajo": 10,
            "Muy bajo": 5
        }
        initiatives.forEach((initiative) => {
            if (impactScores[initiative.impact]) {
                sustainableEmployee.sustainabilityScore.value += impactScores[initiative.impact] || 0
            }
        })
        if (sustainableEmployee.sustainabilityScore.value > 1000) {
            sustainableEmployee.sustainabilityScore.value = 1000
        }
        sustainableEmployee.sustainabilityScore.lastUpdated = new Date()
        sustainableEmployee.save()
        employeeExists.save()
        rrhhEnterprise.save()
        enterprise.save()
    } catch (error) {
        console.error(error);
    }
}

module.exports = updateSustainabilityScoreEmployee