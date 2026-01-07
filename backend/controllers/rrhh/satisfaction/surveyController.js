const Enterprise = require("../../../models/enterpriseModel")
const Survey = require("../../../models/rrhh/satisfaction/surveyModel")
const Category = require("../../../models/rrhh/satisfaction/categorySchema")
const Mood = require("../../../models/rrhh/satisfaction/moodModel")
const Employee = require("../../../models/rrhh/employees/employeeModel")
const WorkEnvironment = require("../../../models/rrhh/satisfaction/workEnvironmentModel")

const surveyController = {
    createSurvey: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const { satisfaction, relationshipWithTeam, categories, mood, workEnvironment, comments, dateSurvey } = req.body
            console.log(req.body)

            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })

            const employeeData = await Employee.findOne({
                enterpriseId: enterprise._id,
                _id: employeeId
            })
            if (!employeeData) return res.status(404).json({ message: "No se ha encontrado el empleado en la empresa." })

            const surveyExists = await Survey.findOne({
                enterpriseId: enterprise._id,
                employeeId: employeeData._id,
                dateSurvey: dateSurvey
            })
            console.log("Existe el survey", surveyExists)
            if (surveyExists) return res.status(400).json({ message: "Ya existe una encuesta para esta fecha y asistencia." })


            if (!categories || Object.keys(categories).length === 0) return res.status(400).json({ message: "Debes completar las categorías de evaluación." })

            const newCategory = new Category({
                surveyId: null,
                ...categories
            })

            await newCategory.save()

            const newWorkEnvironment = new WorkEnvironment({
                enterpriseId: enterprise._id,
                ...workEnvironment
            })


            const newSurvey = new Survey({
                dateSurvey: dateSurvey,
                enterpriseId: enterprise._id,
                employeeId: employeeData._id,
                relationshipWithTeam,
                satisfaction,
                categoryId: newCategory._id,
                workEnvironment: newWorkEnvironment._id,
                comments,
            })
            console.log("Como es el newSurvey", newSurvey)


            newCategory.surveyId = newSurvey._id
            await newCategory.save()

            newWorkEnvironment.surveyId = newSurvey._id

            console.log("El surveyId?", newSurvey._id)

            const validMood = Array.isArray(mood) ? mood.filter(v => v) : []

            const newMood = new Mood({
                surveyId: newSurvey._id,
                mood: validMood
            })

            await newMood.save()

            newSurvey.moodId = newMood._id

            await newWorkEnvironment.save()
            await newSurvey.save()

            return res.status(200).json({ message: "Encuesta creada con éxito.", newSurvey })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor " + error })
        }
    },
    getSurvey: async function (req, res) {
        try {
            const { enterpriseId, surveyId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const survey = await Survey.findOne({ enterpriseId: enterprise._id, _id: surveyId })
            if (!survey) return res.status(404).json({ message: "No se ha encontrado la encuesta de satisfacción." })
            return res.status(200).json(survey)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSurveys: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const surveys = await Survey.find({ enterpriseId: enterprise._id })
            if (!surveys || surveys.length === 0) return res.status(404).json({ message: "No se han encontrado encuestas de satisfacción." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSurveysByEmployee: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const employee = await Employee.findOne({ enterpriseId: enterprise._id, _id: employeeId })
            if (!employee) return res.status(404).json({ message: "No se ha encontrado el empleado en la empresa." })
            const surveys = await Survey.find({ enterpriseId: enterprise._id, employeeId: employee._id })
            if (!surveys || surveys.length === 0) return res.status(404).json({ message: "No se han encontrado encuestas de satisfacción para este empleado." })
            return res.status(200).json(surveys)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = surveyController