
import { Router } from 'express'
import { changePassword, createSuperUser, createUser, getUsers, generateToken, tokenIsNotExpired, deactivateUser, addSystem, generateTestToken } from '../controllers/users.controllers.js'
import { userExists } from '../middlewares/userExists.js'
import { validarJWT } from '../middlewares/validateJWT.js'


const router = Router()

router.post('/users/create-super-user/', userExists, createSuperUser)
router.post('/users/create-user/', validarJWT, userExists, createUser)
router.get('/users/token/', generateToken)
router.post('/users/token/', generateToken)
router.get('/users/test-token/', generateTestToken)
router.get('/users/users-list/', validarJWT, getUsers)
router.delete('/users/user/', validarJWT, deactivateUser)
router.put('/users/change-password/', changePassword)
router.post('/users/valid-token/', tokenIsNotExpired)
router.post('/users/system/', addSystem)

export default router