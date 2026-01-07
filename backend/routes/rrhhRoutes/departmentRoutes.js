const departmentController = require("../../controllers/rrhh/employee/departments/departmentController")
const express = require("express")
const router = express.Router()
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../../middlewares/userMiddlewares/verifyOwnership")

router.post('/:enterpriseId/departments/add-department', authMiddleware, verifyOwnership, departmentController.addDepartment)
router.get('/:enterpriseId/departments/:departmentId', authMiddleware, verifyOwnership, departmentController.getDepartment)
router.get('/:enterpriseId/departments', authMiddleware, verifyOwnership, departmentController.getAllDepartments)

module.exports = router