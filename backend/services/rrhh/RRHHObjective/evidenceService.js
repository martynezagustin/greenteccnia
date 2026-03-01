const Evidence = require('../../../models/rrhh/objectivesSubSoftware/evidenceModel')

const evidenceService = {
    createEvidence: async function ({objectiveId, file, uploadedBy}) {
        try {
            if (!objectiveId) return { error: 'No existe el ID del objetivo', code: 404 }
            const newEvidence = new Evidence({
                objectiveId,
                uploadedBy,
                originalName: file.originalName,
                filename: file.filename,
                mimeType: file.mimeType,
                size: file.size,
                path: file.path
            })
            await newEvidence.save()
            return newEvidence
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error}`, code: 500 }
        }
    },
    getEvidence: async function (evidenceId, objectiveId, enterpriseId) {
        try {
            const evidence = await Evidence.findOne({ objectiveId: objectiveId, _id: evidenceId, enterpriseId: enterpriseId })
            if (!evidence) return { error: 'No se ha encontrado la evidencia.', code: 404 }
            return evidence
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error}`, error: 500 }
        }
    },
    getAllEvidences: async function (objectiveId, enterpriseId) {
        try {
            const allEvidences = await Evidence.find({ objectiveId: objectiveId, enterpriseId: enterpriseId })
            if (!allEvidences || allEvidences.length === 0) return { error: 'No se han encontrado evidencias.', code: 404 }
            return allEvidences
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error}`, error: 500 }
        }
    },
    updateEvidence: async function (evidenceId, objectiveId, enterpriseId, data) {
        try {
            const updateEvidence = await Evidence.findByIdAndUpdate({ objectiveId: objectiveId, enterpriseId: enterpriseId, _id: evidenceId }, { ...data }, { new: true })
            if (!updateEvidence) return { error: 'No se ha encontrado la evidencia.', code: 404 }
            return updateEvidence
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error}`, error: 500 }
        }
    },
    deleteEvidence: async function (evidenceId, objectiveId, enterpriseId){
        try {
            const deletedEvidence = await Evidence.findOneAndDelete({_id: evidenceId, objectiveId: objectiveId, enterpriseId: enterpriseId})
            if(!deletedEvidence) return {error: 'No se ha encontrado la evidencia', code: 404}
            return deletedEvidence
        } catch (error) {
                        return { error: `Ha ocurrido un error de servidor: ${error}`, error: 500 }
        }
    }
}

module.exports = evidenceService