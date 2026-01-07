const express = require("express")
const router = express.Router()
const liquidationController = require("../../controllers/rrhh/liquidationController")
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")

router.post("/:enterpriseId/employees/:employeeId/add-liquidation", authMiddleware, liquidationController.addLiquidation)
router.get("/:enterpriseId/employees/:employeeId/liquidations", liquidationController.getAllLiquidations)
router.get("/:enterpriseId/employees/:employeeId/liquidations/:liquidationId", liquidationController.getLiquidation)
router.put("/:enterpriseId/employees/:employeeId/liquidations/update-liquidation/:liquidationId", liquidationController.updateLiquidation)
router.delete("/:enterpriseId/employees/:employeeId/liquidations/delete-liquidation/:liquidationId", authMiddleware, liquidationController.deleteLiquidation)
router.delete("/:enterpriseId/employees/:employeeId/liquidations/delete-all", liquidationController.deleteAllLiquidations)


module.exports = router