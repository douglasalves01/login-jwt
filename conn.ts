import mysql from "mysql2";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import internal from "stream";

dotenv.config();

export const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.DATABASE_PASSWORD,
  database: "loginjwt",
});

export function usuarioExiste(
  parametro: string,
  valor: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM usuario WHERE ${parametro} = '${valor}'`;
    conn.query(sql, (error, results: any[]) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        resolve(results.length > 0);
      }
    });
  });
}
export function retornaDados(parametro: string, valor: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const sql = `select * from usuario where ${parametro}='${valor}'`;
    conn.query(sql, (err, data) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      const user: any = data;
      resolve(user);
    });
  });
}
export async function validaSenha(
  req: Request,
  res: Response,
  password: string,
  userPassword: string,
  idUser: BigInteger
) {
  const checkPassword = await bcrypt.compare(password, userPassword);
  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha inválida" });
  }
  try {
    const secret = process.env.SECRET;
    if (typeof secret !== "string") {
      throw new Error(
        "A variável de ambiente 'SECRET' não é uma string válida."
      );
    }
    const token = jwt.sign({ id: idUser }, secret);
    res.status(200).json({ msg: "Autenticação reaizada com sucesso", token });
  } catch (err) {
    console.log(err);
  }
}
export async function criarUsuario(
  name: string,
  email: string,
  password: string,
  req: Request,
  res: Response
) {
  //create password
  const salt = await bcrypt.genSalt(12);
  let passwordHash = await bcrypt.hash(password, salt);
  const sql = `Insert into usuario (name,email,password) value('${name}','${email}','${passwordHash}')`;
  conn.query(sql, (err) => {
    if (err) {
      console.log(err);
    }
    return res.status(201).json({ msg: "Usuário criado com sucesso" });
  });
}
export function checkToken(req: Request, res: Response, next?: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ msg: "Acesso negado" });
  }
  try {
    const secret = process.env.SECRET;
    if (typeof secret !== "string") {
      throw new Error(
        "A variável de ambiente 'SECRET' não é uma string válida."
      );
    }
    jwt.verify(token, secret);
    next();
  } catch (error) {
    res.status(400).json({ msg: "Token inválido" });
  }
}
