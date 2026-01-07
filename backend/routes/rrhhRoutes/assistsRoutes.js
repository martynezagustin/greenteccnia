const express = require("express")
const router = express.Router()
const assistController = require("../../controllers/rrhh/assistController")
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../../middlewares/userMiddlewares/verifyOwnership")

router.post("/:enterpriseId/employees/:employeeId/add-assist", authMiddleware, verifyOwnership, assistController.addAssistToEmployee)
router.get("/:enterpriseId/assists", authMiddleware, verifyOwnership, assistController.getAllAssists)
router.get("/:enterpriseId/employees/:employeeId/assists/:assistId", assistController.getAssistToEmployee)
router.get("/:enterpriseId/employees/:employeeId/assists", assistController.getAllAsistsToEmployee)
router.put("/:enterpriseId/employees/:employeeId/assists/update-assist/:assistId", assistController.updateAssistToEmployee)
router.delete("/:enterpriseId/employees/:employeeId/assists/delete-assist/:assistId", assistController.deleteAssistToEmployee)
router.delete("/:enterpriseId/employees/:employeeId/assists/delete-all", assistController.deleteAllAssistsToEmployee)

module.exports = router