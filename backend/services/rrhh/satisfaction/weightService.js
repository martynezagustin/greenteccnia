const Weight = require('../../../models/rrhh/satisfaction/weightModel')

const weightService = {
    saveWeights: async function(data, enterpriseId){
        try {
            let weight = await Weight.findOne({enterpriseId})
            if(weight){
                weight.satisfaction = data.satisfaction
                weight.workEnvironment = data.workEnvironment
                weight.relationshipWithTeam = data.relationshipWithTeam
            } else {
                weight = new Weight({...data, enterpriseId})
            }
            const saveConfig = await weight.save()
            return saveConfig
        } catch (error) {
            return {error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500}
        }
    },
    getWeights: async function(enterpriseId){
        try {
            const weight = await Weight.findOne({enterpriseId})
            if(!weight) return {error: 'No se han encontrado pesos.', code: 404}
            return weight
        } catch (error) {
            return {error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500}
        }
    }
}

module.exports = weightService