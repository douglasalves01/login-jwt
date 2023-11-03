import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

import {
  checkToken,
  conn,
  criarUsuario,
  retornaDados,
  usuarioExiste,
  validaSenha,
} from "./conn";
dotenv.config();
const app = express();
app.use(express.json()); //config json
//public route
app.get("/", (req, res) => {
  res.send("ola");
});
//private Route
app.get("/users/:id", checkToken, async (req, res) => {
  const id = req.params.id;
  usuarioExiste("id", id)
    .then((existe) => {
      if (!existe) {
        return res.status(404).json({ msg: "Usuário não encontrado" });
      } else {
        retornaDados("id", id)
          .then((user) => {
            if (user.length > 0) {
              res.status(200).json({ user });
            }
            checkToken(req, res);
          })
          .catch((error) => {
            console.error("Ocorreu um erro:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Ocorreu um erro:", error);
    });
});
//Register User
app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  //validações
  if (!name) {
    return res.status(422).json({ msg: "O nome é obtigatório!" });
  }
  if (!email) {
    return res.status(422).json({ msg: "O email é obtigatório!" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obtigatória!" });
  }
  if (password != confirmPassword) {
    return res.status(422).json({ msg: "As senhas não conferem!" });
  }
  usuarioExiste("email", email)
    .then((existe) => {
      if (existe) {
        return res.status(422).json({ msg: "Por favor, utilize outro e-mail" });
      } else {
        criarUsuario(name, email, password, req, res);
      }
    })
    .catch((error) => {
      console.error("Ocorreu um erro:", error);
    });
});
//Login User
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  //validações
  if (!email) {
    return res.status(422).json({ msg: "O email é obtigatório!" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obtigatória!" });
  }
  //verificar se o usuário existe
  usuarioExiste("email", email)
    .then((existe) => {
      if (!existe) {
        return res.status(422).json({ msg: "Usuário não encontrado" });
      } else {
        retornaDados("email", email)
          .then((user) => {
            if (user.length > 0) {
              const id = user[0].id;
              const userPassword = user[0].password;
              validaSenha(req, res, password, userPassword, id);
            }
          })
          .catch((error) => {
            console.error("Ocorreu um erro:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Ocorreu um erro:", error);
    });
});
conn.connect((err) => {
  //conectando no banco
  if (err) {
    console.log(err);
  }
  app.listen(3000);
  console.log("Conectado no banco de dados.....");
});
