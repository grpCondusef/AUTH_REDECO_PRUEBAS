import express from 'express'
import cors from 'cors'
import usersRoutes from './routes/users.routes.js'
import institucionesRoutes from './routes/instituciones.routes.js'


const app = express()
app.use(cors())
app.use(express.json())
app.use(usersRoutes, institucionesRoutes)

export default app