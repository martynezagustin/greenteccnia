const ClimateConfig = require("../../../../models/rrhh/employees/climateConfig/climateConfigModel")

async function getWeightsWorkEnvironment(enterpriseId) {
    //por el momento hay pesos fijos, en la base de datos se pueden visualizar si existen

    const weights = await ClimateConfig.findOne({ enterpriseId: enterpriseId })
    if (!weights) {
        return {
            satisfaction: 0.4,
            workEnvironments: 0.3,
            turnover: 0.1,
            absentism: 0.1,
            antiquity: 0.1
        }
    }
}

module.exports = {getWeightsWorkEnvironment}