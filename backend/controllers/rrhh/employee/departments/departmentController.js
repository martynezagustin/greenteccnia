const Department = require("../../../../models/rrhh/employees/departments/departmentModel")
const Employee = require("../../../../models/rrhh/employees/employeeModel")
const Enterprise = require("../../../../models/enterpriseModel")

const departmentController = {
    addDepartment: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { name, description } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const departmentExists = await Department.findOne({ enterpriseId: enterprise._id, name: name })
            if (departmentExists) return res.status(400).json({ message: "Ya existe un departamento similar registrado." })
            if (!name || !description) return res.status(409).json({ message: "Por favor, complete los campos vacíos." })
            const newDepartment = new Department({
                enterpriseId, name, description
            })
            await newDepartment.save()
            return res.status(200).json({ message: "Departamento creado con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getDepartment: async function (req, res) {
        try {
            const { enterpriseId, departmentId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const department = await Department.findOne({ enterpriseId: enterprise._id, _id: departmentId })
            if (!department) return res.status(404).sjon({ message: "No se ha encontrado el departamento." })
            return res.status(200).json(department)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllDepartments: async function (req, res) {
        try {
            const { enterpriseId, departmentId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const departments = await Department.find({ enterpriseId: enterprise._id })
            if (!departments || departments.length === 0) return res.status(404).json({ message: 'No se han encontrado departamentos.' })
            return res.status(200).json(departments)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = departmentController