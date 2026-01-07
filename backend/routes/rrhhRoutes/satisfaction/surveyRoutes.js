const express = require("express")
const surveyController = require("../../../controllers/rrhh/satisfaction/surveyController")
const router = express.Router()
const authMiddleware = require("../../../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../../../middlewares/userMiddlewares/verifyOwnership")

router.post("/:enterpriseId/employees/:employeeId/surveys/create-survey", authMiddleware, verifyOwnership, surveyController.createSurvey)
router.get("/:enterpriseId/employees/:surveyId", authMiddleware, verifyOwnership, surveyController.getSurvey)

module.exports = router