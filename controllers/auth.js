const { response } = require("express");
const bcryptjs = require('bcryptjs')
const Usuario = require('../models/usuario');

const { generarJWT } = require("../helpers/generarJWT");
const { googleVerify } = require("../helpers/google-verify");


const login = async(req, res = response) => {

    const {correo, password} = req.body;

    try{
        //verificar si el correo existe
        const usuario = await Usuario.findOne({correo});
        if (!usuario) {
            return res.status(400).json({
                msg: 'Usuario / contraseña no son validos'
            });
        }

        //si el usuario esta activo
        if (!usuario.estado) {
            return res.status(400).json({
                msg: 'Usuario / contraseña no son validos'
            });
        }

        //verificar contraseña
        const validPassword = bcryptjs.compareSync(password, usuario.password);
        if(!validPassword) {
            return req.status(400).json({
                msg: 'Usuario / Contraseña no son validos'
            });
        }

        //generar el JWT
        const token = await generarJWT(usuario.id);

        res.json({
            usuario,
            token,
        })
    


    } catch (error) {
        console.log(error) 
            res.status(500).json({
                msg: 'Hable con el administrador'
            });
        

    }

};


const googleSignIn = async(req, res = response) => {

    const {id_token} = req.body;

    try {
        const {correo, nombre, img} = await googleVerify(id_token);
        let usuario = await Usuario.findOne({correo});

        if (!usuario) {
            //Tengo que crearlo
            const data = {
                nombre,
                correo,
                password: ':P',
                img,
                google: true
            };

            usuario = new Usuario(data);
            await usuario.save();

        }

        //si el usuario en DB
        if (!usuario.estado) {
            return res.status(401).json({
                msg: 'Hable con el administrador, usuario bloqueado'
            })
        };

        //GEnerar el jwt
        const token = await generarJWT(usuario.id);

        res.json({
           usuario,
           token,
        })

    } catch(error) {
        res.status(400).json({
            msg: 'El Token no se pudo verificar'
        });

    }

}


module.exports = {
    login,
    googleSignIn,
}