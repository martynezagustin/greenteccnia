const mongoose = require("mongoose")
const MemberRequest = require("../../models/team/teamApprovedModel")
const Enterprise = require("../../models/enterpriseModel")
const Employee = require("../../models/rrhh/employees/employeeModel")
const RRHH = require("../../models/rrhh/rrhhModel")
const User = require("../../models/userModel")

const memberRequestController = {
    approveMemberRequest: async function (req, res) {
        try {
            const { enterpriseId, requestId } = req.params
            const { status } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(requestId)) {
                return res.status(404).json({ message: "ID de empresa o de solicitud inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({
                enterpriseId: enterprise._id
            })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })
            }
            const request = await MemberRequest.findOne({
                enterpriseId: enterprise._id,
                _id: requestId
            })
            if (!request) {
                return res.status(404).json({ message: "No se ha encontrado la solicitud." })
            }
            const user = await User.findById(request.userId)
            if (!user) {
                return res.status(404).json({ message: "No se ha encontrado el usuario a agregar." })
            }
            const validTypes = ["Pendiente", "Aprobado", "Rechazado", "Notificado"]
            if (!validTypes.includes(status)) {
                return res.status(400).json({ message: "Tipo de estado proporcionado no válido." })
            }
            if (status === "Aprobado") {
                const date = new Date()
                const newEmployee = new Employee({
                    enterpriseId: enterprise._id,
                    userId: user._id,
                    personalInfo: {
                        name: user.name,
                        lastname: user.lastname,
                        gender: user.genre,
                        phone: user.phone,
                        email: user.email,
                        address: user.address,
                        identityCard: user.identityCard
                    },
                    jobInfo: {
                        startDate: date,
                        position: user.position
                    }
                })
                request.status = status
                user.enterprise = enterprise._id
                rrhhEnterprise.employees.push(newEmployee._id)
                await newEmployee.save()
                await rrhhEnterprise.save()
                await user.save()
            } else {
                request.status = "Rechazado"
            }
            await request.save()
            return res.status(200).json({ message: `Solicitud de ${user.name} ${user.lastname}: ${status}. Te recomendamos actualizar los datos del empleado para asignar los datos correspondientes y terminar el proceso de inscripción.` })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getMemberRequest: async function (req, res) {
        try {
            const { enterpriseId, requestId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(requestId)) {
                return res.status(404).json({ message: "ID de empresa o de solicitud inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({
                enterpriseId
            })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })
            }
            const request = await MemberRequest.findOne({
                enterpriseId: enterprise._id,
                _id: requestId
            })
            if (!request) {
                return res.status(404).json({ message: "No se ha encontrado la solicitud." })
            }
            return res.status(200).json(request)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = memberRequestController