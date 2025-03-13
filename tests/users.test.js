import request from "supertest";
import app from "../src/app";

let token = ''

describe('POST /users/create-super-user/', () => {
    test('debe registrar un super usuario', async () => {
        const userData = {
            key: "927|40|40017|NO|NO",
            username: "superusertest4",
            password: "1234",
            confirm_password: "1234"
        }

        const response = await request(app)
            .post('/users/create-super-user/')
            .send(userData);

        token = response.body.data.token_access

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toEqual('El usuario ha sido creado exitosamente!');

        expect(response.body.data.userid).toBeDefined()
        expect(response.body.data.username).toBeDefined()
        expect(response.body.data.password).toBeDefined()
        expect(response.body.data.institucionid).toBeDefined()
        expect(response.body.data.is_active).toBeDefined()
        expect(response.body.data.profileid).toBeDefined()
        expect(response.body.data.token_access).toBeDefined()

        expect(response.body.data.is_active).toBe(true)
        expect(response.body.data.profileid).toBe("2")

    })
})

describe('POST /users/create-user/', () => {
    test('debe registrar un usuario normal usando un token de super usuario', async () => {
        const userData = {
            "username": "usertest4",
            "password": "1234",
            "confirm_password": "1234"
        }

        const response = await request(app)
            .post('/users/create-user/')
            .set('Authorization', `${token}`)
            .send(userData);

        expect(response.statusCode).toBe(201);

    })
})

describe('GET /users/token/', () => {
    test('debe generar el token de un usuario', async () => {
        const userData = {
            "username": "usertest4",
            "password": "1234",
        }

        const response = await request(app)
            .get('/users/token/')
            .send(userData);

        expect(response.statusCode).toBe(200);

        expect(response.body.user.token_access).toBeDefined()
        expect(response.body.user.username).toBeDefined()

    })
})