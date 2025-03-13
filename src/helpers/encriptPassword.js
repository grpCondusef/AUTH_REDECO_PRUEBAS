import bcryptjs from 'bcryptjs';


export const encriptPassword = (password) => { 
    //ENCRIPTAR LA CONTRASEÑA DEL USUARIO
    const salt = bcryptjs.genSaltSync(10);
    const hashedPassword = bcryptjs.hashSync(password, salt);

    return hashedPassword
}