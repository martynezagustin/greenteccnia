const express = require("express")
const router = express.Router()
const accidentController = require("../../controllers/rrhh/accidentController")

router.post("/:enterpriseId/employees/:employeeId/add-accident", accidentController.addAccident)
router.get("/:enterpriseId/employees/:employeeId/accidents/:accidentId", accidentController.getAccident)
router.get("/:enterpriseId/employees/:employeeId/accidents", accidentController.getAllAccidents)
router.put("/:enterpriseId/employees/:employeeId/accidents/update-accident/:accidentId", accidentController.updateAccident)
router.delete("/:enterpriseId/employees/:employeeId/accidents/delete-accident/:accidentId", accidentController.deleteAccident)
router.delete("/:enterpriseId/employees/:employeeId/accidents/delete-all", accidentController.deleteAllAccidents)
router.get("/:enterpriseId/employees/:employeeId/accidents/filter/by-custom-date", accidentController.getAccidentsByCustomDate)

module.exports = router