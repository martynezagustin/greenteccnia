const Supplier = require("../../models/suppliers/supplierModel")
const Enterprise = require("../../models/enterpriseModel")
const mongoose = require("mongoose")
const assignAction = require("../handlers/members/assignAction")

const providerController = {
    addSupplier: async function (req, res) {
        try {
            const { name, phone, siteWeb, category, address, description, taxCategory } = req.body
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newSupplier = new Supplier({
                enterpriseId: enterprise._id, name: name, phone: phone, siteWeb: siteWeb, category: category, address: address, description: description, taxCategory: taxCategory, createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            await newSupplier.save()
            enterprise.suppliers.push(newSupplier._id)
            await enterprise.save()
            return res.json(newSupplier)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSupplier: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const supplierId = req.params.supplierId
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const supplier = await Supplier.findById(supplierId)
            if (!supplier) {
                return res.status(404).json({ message: "No se ha encontrado el proveedor" })
            }
            return res.json(supplier)
        } catch (error) {
            return res.statu(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSuppliers: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const suppliers = await Supplier.find({ enterpriseId })
            return res.json(suppliers)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteSupplier: async function (req, res) {
        try {
            const { enterpriseId, supplierId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const supplierToDelete = await Supplier.findByIdAndDelete(supplierId)
            if (!supplierToDelete) {
                return res.status(404).json({ message: "No se ha encontrado el proveedor." })
            }
            return res.json(supplierToDelete)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }

    },
    updateSupplier: async function (req, res) {
        try {
            const { name, phone, siteWeb, category, address, description, taxCategory } = req.body
            const { enterpriseId, supplierId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const supplierToUpdate = await Supplier.findByIdAndUpdate(supplierId, {
                name, phone, siteWeb, category, address, description, taxCategory, updatedBy: {
                    username: updatedBy.username,
                    position: updatedBy.position,
                    date: new Date()
                }
            }, { new: true })
            if (!supplierToUpdate) {
                return res.status(404).json({ message: "No se ha podido actualizar el proveedor." })
            }
            return res.json(supplierToUpdate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllSuppliers: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterprise)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const deletedAllSuppliers = await Supplier.deleteMany({
                enterpriseId: enterprise._id
            })
            if (deletedAllSuppliers.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado proveedores." })
            }
            const updatedEnterprise = await Enterprise.findOneAndUpdate(
                { _id: enterprise._id },
                { $pull: { suppliers: { $in: enterprise.suppliers } } },
                { new: true }
            )
            return res.status(200).json(updatedEnterprise)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSuppliersByTaxCategory: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { taxCategory } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const filteredSuppliersByTaxCategory = await Supplier.find({
                enterpriseId: enterprise._id,
                taxCategory: taxCategory
            })
            if (filteredSuppliersByTaxCategory.length === 0) {
                return res.status(404).json({ message: "No se han encontrado proveedores con la categoría de impuestos proporcionada." })
            }
            return res.status(200).json(filteredSuppliersByTaxCategory)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}


module.exports = providerController