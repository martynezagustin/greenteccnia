const express = require("express")
const router = express.Router()
const employeeController = require("../../controllers/rrhh/employee/employeeController")
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../../middlewares/userMiddlewares/verifyOwnership")

router.post("/:enterpriseId/employees/add-employee", authMiddleware, verifyOwnership, employeeController.addEmployee)
router.get("/:enterpriseId/employees", authMiddleware, verifyOwnership, employeeController.getAllEmployees)
router.get("/:enterpriseId/employees/:employeeId", employeeController.getEmployeeByID)
router.put("/:enterpriseId/employees/update-employee/:employeeId", authMiddleware, employeeController.updateEmployee)
router.delete("/:enterpriseId/employees/delete-employee/:employeeId", employeeController.deleteEmployee)
router.delete("/:enterpriseId/employees/delete-all", employeeController.deleteAllEmployees)
router.get("/:enterpriseId/employees/filter/by-gender-parity", authMiddleware, verifyOwnership, employeeController.getGenderParity)
router.get("/:enterpriseId/employees/print/dashboard", authMiddleware, verifyOwnership, employeeController.printDashboardEmployees)
router.put('/:enterpriseId/employees/:employeeId/end-contract', authMiddleware, verifyOwnership,employeeController.endContract)

module.exports = router