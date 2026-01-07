const express = require("express")
const router = express.Router()
const supplierController = require("../controllers/suppliers/supplierController")
const authMiddleware = require("../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../middlewares/userMiddlewares/verifyOwnership")

router.post("/:enterpriseId/suppliers/add-supplier", supplierController.addSupplier)
router.get("/:enterpriseId/suppliers/:supplierId", supplierController.getSupplier)
router.get("/:enterpriseId/suppliers", supplierController.getAllSuppliers)
router.delete("/:enterpriseId/suppliers/delete-supplier/:supplierId", supplierController.deleteSupplier)
router.put("/:enterpriseId/suppliers/update-supplier/:supplierId", supplierController.updateSupplier)


module.exports = router