const weightService = require("../../../services/rrhh/satisfaction/weightService")
const { validateEnterprise } = require('../../enterprise/handler/utilEnterprise')

const weightController = {
    saveWeight: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            const newWeight = await weightService.saveWeights(req.body, enterprise._id)
            if (newWeight.error) return res.status(newWeight.code).json({ message: newWeight.message })
            return res.status(200).json({ message: 'Pesos configurados con éxito.' })
        } catch (error) {
            next(error)
        }
    },
    getWeights: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            const weights = await weightService.getWeights(enterprise._id)
            if (weights.error) return res.status(weights.code).json({ message: weights.error })
            return res.status(200).json(weights)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = weightController