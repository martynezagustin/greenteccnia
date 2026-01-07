const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/userMiddlewares/authMiddleware")
const uxUserController = require("../controllers/ux/uxUserController")

router.post("/:userId/change-theme", authMiddleware, uxUserController.changeDarkTheme)
router.post("/:userId/change-font", authMiddleware, uxUserController.changeFont)
router.post("/:userId/change-buttons-style", authMiddleware, uxUserController.changeButtonsStyle)
router.post("/:userId/set-monochrome", authMiddleware, uxUserController.setMonochrome)
router.get("/:userId/ux-options", authMiddleware, uxUserController.getUxOptions)

module.exports = router