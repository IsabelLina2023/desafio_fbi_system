import { addUserQuery, verifyUserQuery } from "../models/userQueries.js";
import { check, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendEmail } from "../helpers/sendEmail.js";
import dotenv from "dotenv";


dotenv.config();
//process.loadEnvFile();

const secretKey = process.env.JWT_SECRET_KEY;

export const home = (req, res) => {
    res.render("home", {
        title: "Home Page",
    });
};
export const loginForm = (req, res) => {
    res.render("login", {
        title: "Login Page",
    });
};
export const registerForm = (req, res) => {
    res.render("register", {
        title: "Register Page",
    });
};
export const contactForm = (req, res) => {
    res.render("contact", {
        title: "Contact Page",
    });
};
export const admin = (req, res) => {
    try {
        const token = req.cookies.jwtToken;
        const { email } = jwt.verify(token, secretKey);

        if (!email) {
            return new Error("No autorizado para entrar al dashboard");
        }
        res.render("admin", {
            title: "Admin Page",
            email,
        });
    } catch (error) {
        res
            .status(401)
            .send(
                `No autorizado para entrar al dashboard => ${error.message}`
            );
    };
};
export const addUser = async (req, res) => {
    try {
        const { name, email, password, confirm_password } = req.body;

        await check("name").notEmpty().withMessage("Debe ingresar el nombre").run(req);
        await check("email").isEmail().withMessage("Debe ingresar un correo").run(req);
        await check("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres").run(req);
        await check("confirm_password").equals(password).withMessage("No coincide la contraseña").run(req);

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render("register", {
                title: "Register Page",
                errors: errors.array(),
                old: req.body
            });
        };

        //Verificamos que el usuario no se encuentre en la BBDD
        const userVerify = await verifyUserQuery(email);

        if (userVerify) {
            res.render("register", {
                title: "Register Page",
                errors: [{ msg: "El correo ya está registrado" }],
            })
        };

        //Encriptamos el password
        const passwordHash = await bcrypt.hash(password, 10);

        //Insertamos el usuario en la BBDD
        await addUserQuery(name, email, passwordHash);
        res.status(201).redirect("/login");
    } catch (error) {
        res.status(500).send(error.message)
    };
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userVerify = await verifyUserQuery(email);

        if (!userVerify) {
            return res.render("login", {
                title: "Login Page",
                errors: [{ msg: "El usuario no existe" }],
                old: req.body,
            });
        };

        //Comparamos el password
        const passwordMatch = await bcrypt.compare(password, userVerify.password);
        if (!passwordMatch) {
            return res.render("login", {
                title: "Login Page",
                errors: [{ msg: "La contraseña es incorrecta" }],
                old: req.body,
            });
        };

        //Generamos el token
        const token = jwt.sign({ email: userVerify.email }, secretKey, {
            expiresIn: 40,
        });
        res
            .cookie("jwtToken", token, {
                httpOnly: true,
                maxAge: 40000,
            })
            .redirect("/admin");
    } catch (error) {
        res.status(500).send(error.message)
    };
};
export const contact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        //Validaciones
        await check("name").notEmpty().withMessage("Nombre es requerido").run(req);
        await check("email").isEmail().withMessage("Email es requerido").run(req);
        await check("subject").notEmpty().withMessage("Asunto es requerido").run(req);
        await check("message").notEmpty().withMessage("Mensaje es requerido").run(req);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("contact", {
                title: "Contact Page",
                errors: errors.array(),
                old: req.body
            });
        };

        //Enviamos el email
        const result = await sendEmail(name, email, subject, message);
        if (result) {
            return res.render("contact", {
                title: "Contact Page",
                success: "Correo enviado"
            });
        };

    } catch (error) {
        res.status(500).send(error.message)
    };

};