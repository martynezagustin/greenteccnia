const express = require("express")
const router = express.Router()
const memberRequestController = require("../controllers/members/memberRequestController")

router.post("/:enterpriseId/requests/:requestId/approve", memberRequestController.approveMemberRequest)
router.get("/:enterpriseId/requests/:requestId", memberRequestController.getMemberRequest)

module.exports = router