const brain = require("brain.js")
const { normalize1to10 } = require("../../utils/workEnvironmentAINormalizeValues")
const {calculateAbsentism} = require("./calculateAbsentism")

let net

const workEnvironmentAIService = {
    
    trainModel: (surveyHistories) => {
        net = new brain.NeuralNetwork({
            hiddenLayers: [6, 4],
            activation: 'relu'
        })

        const trainingData = surveyHistories.map(s => ({
            input: {
                relationshipWithTeam: normalize1to10(s.relationshipWithTeam),
                satisfaction: normalize1to10(s.satisfaction),
                workEnvironment: normalize1to10(s.workEnvironment),
                absentism: normalize1to10()
            },
            output: {}
        }))
    }
}
module.exports = workEnvironmentAIService