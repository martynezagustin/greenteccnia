const ClasificationObjective = require('../../../models/rrhh/objectivesSubSoftware/clasificationObjectiveModel')

const clasificationObjectiveService = {
    createClasification: async function (data, enterpriseId, user) {
        try {
            const clasificationObjectiveExists = await ClasificationObjective.findOne({ enterpriseId, name: data.name })
            if (clasificationObjectiveExists) return { error: 'Ya existe una clasificación de objetivos prácticamente similar.', code: 404 }
            const newClasificationObjective = new ClasificationObjective({
                enterpriseId,
                ...data,
                createdBy: user._id
            })
            await newClasificationObjective.save()
            return newClasificationObjective
        }
        catch (error) {
            return { error: `Ha ocurrido un error al crear la clasificación de objetivo RRHH: ${error.message}`, code: 500 }
        }
    },
    getClasification: async function (clasificationId, enterpriseId) {
        try {
            const clasification = await ClasificationObjective.findOne({ enterpriseId, _id: clasificationId })
            if (!clasification) return { error: 'No se ha encontrado la clasificación.', code: 404 }
            return clasification
        } catch (error) {
            return { error: `Ha ocurrido un error al crear la clasificación de objetivo RRHH: ${error.message}`, code: 500 }
        }
    },
    getClasifications: async function (enterpriseId) {
        try {
            const clasifications = await ClasificationObjective.find({
                enterpriseId
            })
            if (!clasifications || clasifications.length === 0) return { error: 'No se han encontrado clasificaciones de objetivos RRHH.', code: 404 }
            return clasifications
        } catch (error) {
            return { error: `Ha ocurrido un error al crear la clasificación de objetivo RRHH: ${error.message}`, code: 500 }
        }
    },
    deleteClasification: async function (clasificationId, enterpriseId) {
        try {
            const deletedClasification = await ClasificationObjective.findOneAndDelete({ enterpriseId, _id: clasificationId })
            if (!deletedClasification) return { error: 'No se ha encontrado la clasificación', code: 404 }
            return deletedClasification
        } catch (error) {
            return { error: `Ha ocurrido un error al crear la clasificación de objetivo RRHH: ${error.message}`, code: 500 }
        }
    }
}

module.exports = clasificationObjectiveService