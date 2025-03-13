
import { Router } from 'express'
import { getInstituciones, getSingleInstitucion, searchInstitucion, updateInstitucion } from '../controllers/instituciones.controllers.js'


const router = Router()

router.get('/instituciones/', getInstituciones)
router.get('/instituciones/search/', searchInstitucion)
router.get('/instituciones/info/', getSingleInstitucion)
router.put('/instituciones/info/', updateInstitucion)

export default router