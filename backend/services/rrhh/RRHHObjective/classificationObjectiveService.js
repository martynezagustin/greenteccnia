const ClassificationObjective = require('../../../models/rrhh/objectivesSubSoftware/classificationObjectiveModel')

const classificationObjectiveService = {
    createClassification: async function (data, enterpriseId, user) {
        try {
            const clasificationObjectiveExists = await ClassificationObjective.findOne({ enterpriseId, name: data.name })
            if (clasificationObjectiveExists) return { error: 'Ya existe una clasificación de objetivos prácticamente similar.', code: 404 }
            const newClassificationObjective = new ClassificationObjective({
                enterpriseId,
                ...data,
                createdBy: user._id
            })
            await newClassificationObjective.save()
            return newClassificationObjective
        }
        catch (error) {
            return { error: `Ha ocurrido un error al crear la clasificación de objetivo RRHH: ${error.message}`, code: 500 }
        }
    },
    getClassification: async function (classificationId, enterpriseId) {
        try {
            const classification = await ClassificationObjective.findOne({ enterpriseId, _id: classificationId })
            if (!classification) return { error: 'No se ha encontrado la clasificación.', code: 404 }
            return classification
        } catch (error) {
            return { error: `Ha ocurrido un error al crear la clasificación de objetivo RRHH: ${error.message}`, code: 500 }
        }
    },
    getClassifications: async function (enterpriseId) {
        try {
            const classifications = await ClassificationObjective.find({
                enterpriseId
            })
            if (!classifications || classifications.length === 0) return { error: 'No se han encontrado clasificaciones.', code: 404 }
            return classifications
        } catch (error) {
            console.error(error);
            
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    deleteClassification: async function (clasificationId, enterpriseId) {
        try {
            const deletedClassification = await ClassificationObjective.findOneAndDelete({ enterpriseId, _id: clasificationId })
            if (!deletedClassification) return { error: 'No se ha encontrado la clasificación', code: 404 }
            return deletedClassification
        } catch (error) {
            return { error: `Ha ocurrido un error al crear la clasificación de objetivo RRHH: ${error.message}`, code: 500 }
        }
    }
}

module.exports = classificationObjectiveService