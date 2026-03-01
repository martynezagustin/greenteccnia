const evidenceService = require('../../../services/rrhh/RRHHObjective/evidenceService')

const evidenceController = {
    createEvidence: async function (req, res, next) {
        try {
            const { objectiveId } = req.params
            const userId = req.user
            console.log('¿El req file?',req.file)
            if (!req.file) return res.status(404).json({ message: 'No se subió ningún archivo' })
            const evidence = await evidenceService.createEvidence({
                objectiveId,
                uploadedBy: userId,
                file: req.file
            })
            if (evidence.error) return res.status(evidence.code).json({ message: evidence.error })
            return res.status(201).json({ message: 'Evidencia añadida con éxito.' })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = evidenceController