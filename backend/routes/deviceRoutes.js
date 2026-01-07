const express = require("express")
const authMiddleware = require("../middlewares/userMiddlewares/authMiddleware")
const router = express.Router()
const deviceController = require("../controllers/devices/deviceController")

router.get("/:userId/devices/:deviceId", authMiddleware, deviceController.getDevice)
router.delete("/:userId/devices/delete-device/:deviceId", authMiddleware, deviceController.deleteDevice)
router.get("/:userId/get-device-confirm", authMiddleware, deviceController.getDeviceForTrusted)
router.post("/:userId/confirm-device/:deviceId", authMiddleware, deviceController.setTrustedDevice)

module.exports = router