const ClassificationObjectiveService = require('../../../services/rrhh/RRHHObjective/classificationObjectiveService')
const { validateEnterprise } = require('../../enterprise/handler/utilEnterprise')

const classificationController = {
    addClassificationObjective: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            if (enterprise.error) return res.status(enterprise.code).json({ message: enterprise.error })
            const newClassificationObjective = await ClassificationObjectiveService.createClassification(req.body, enterprise._id, req.user)
            if (newClassificationObjective.error) return res.status(newClassificationObjective.code).json({ message: newClassificationObjective.error })
            return res.status(200).json({ message: 'Clasificación de objetivo creada con éxito', newClassificationObjective })
        } catch (error) {
            next(error)
        }
    },
    getClassificationObjective: async function (req, res, next) {
        try {
            const { classificationId } = req.params
            const enterprise = await validateEnterprise(req, res)
            if (enterprise.error) return res.status(enterprise.code).json({ message: enterprise.error })
            const classification = await ClassificationObjectiveService.getClassification(classificationId, enterprise._id)
            if (classification.error) return res.status(classification.code).json({ message: classification.error })
            return res.status(200).json(classification)
        } catch (error) {
            next(error)
        }
    },
    getClassifications: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            if (enterprise.error) return res.status(enterprise.code).json({ message: enterprise.error })
            const classifications = await ClassificationObjectiveService.getClassifications(enterprise._id)
            if (classifications.error) return res.status(classifications.code).json({ message: classifications.error })
            return res.status(200).json(classifications)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = classificationController