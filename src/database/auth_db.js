import Pool from 'pg-pool';
import dotenv from 'dotenv'; // PARA TRABAJAR CON LAS VARIABLES DE ENTORNO

dotenv.config() //PARA OBTENER LAS VARIABLES DE ENTORN

// CONECTARNOS A LA BASE DE DATOS
export const pool = new Pool({
    database: 'auth_y',
    user: 'adminauth',
    host: process.env.HOST,
    password: process.env.PASSWORD,
    port: 5432, // El puerto por defecto de PostgreSQL es el 5432
})