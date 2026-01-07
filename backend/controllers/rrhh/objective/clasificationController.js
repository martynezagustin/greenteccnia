const ClasificationObjectiveService = require('../../../services/rrhh/RRHHObjective/clasificationObjectiveService')
const { validateEnterprise } = require('../../enterprise/handler/utilEnterprise')

const clasificationController = {
    addClasificationObjective: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            if (enterprise.error) return res.status(enterprise.code).json({ message: enterprise.error })
            const newClasificationObjective = await ClasificationObjectiveService.createClasification(req.body, enterprise._id, req.user)
            if (newClasificationObjective.error) return res.status(newClasificationObjective.code).json({ message: newClasificationObjective.error })
            return res.status(200).json({ message: 'Clasificación de objetivo creada con éxito', newClasificationObjective })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = clasificationController