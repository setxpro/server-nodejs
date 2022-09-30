import dotenv from "dotenv";
dotenv.config();
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const Person = require("../Models/User");
const Message = require("../Models/Message");

const app = express();
const port = process.env.APP_URL;

app.use(express.json());
app.use(cors());

// Get user Database

// CREATE USER
app.post("/user/create", async (req: Request, res: Response) => {
  const {
    name,
    middlename,
    email,
    login,
    password,
    assignments,
    charge,
    avatar,
  } = req.body;

  if (!name) {
    res.status(500).json({ error: "O nome é obrigatório!" });
    return;
  }
  if (!middlename) {
    res.status(422).json({ error: "Sobrenome é obrigatório!" });
    return;
  }
  if (!email) {
    res.status(422).json({ error: "O email é obrigatório!" });
    return;
  }
  // if (!login) {
  //   res.status(422).json({ error: "login é obrigatório!" });
  //   return;
  // }
  if (!password) {
    res.status(422).json({ error: "Senha é obrigatório!" });
    return;
  }
  if (!assignments) {
    res.status(422).json({ error: "A atribuição é obrigatória!" });
    return;
  }
  // if (!charge) {
  //   res.status(422).json({ error: "Cargo é obrigatório" });
  //   return;
  // }

  const userExists = await Person.findOne({ email: email, login: login });

  if (userExists) {
    res.status(422).json({ message: "Usuário já cadastrado no sistma!" });
    return;
  }

  // Create Password

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = {
    name,
    middlename,
    email,
    login,
    password: passwordHash,
    assignments,
    charge,
    avatar,
  };

  try {
    await Person.create(user);
    res.status(201).json({ message: "Usuário Cadastrado com Sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// READ

// FindAll
app.get("/users", async (req: Request, res: Response) => {
  try {
    const user = await Person.find();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// FIND ONE
app.get("/users/:id", async (req: Request, res: Response) => {
  // extrair o dado da requisição, pela url = req.params

  const id = req.params.id;

  try {
    const user = await Person.findOne({ _id: id });

    if (!user) {
      res.status(422).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// UPDATE USER
app.patch("/users/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const {
    name,
    middlename,
    email,
    login,
    password,
    assignments,
    charge,
    avatar,
  } = req.body;

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = {
    name,
    middlename,
    email,
    login,
    password: passwordHash,
    assignments,
    charge,
    avatar,
  };

  try {
    const userUpdate = await Person.updateOne({ _id: id }, user);
    if (userUpdate) {
      res.status(200).json({ message: "Usuário Atualizado com Sucesso!" });
      return;
    }
    if (userUpdate.matchedCount === 0) {
      res.status(422).json({ message: "Não foi possível alterar o usuário" });
      return;
    }
    res.status(200).json(userUpdate);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// UPDATE Owner to user

app.patch("/users-update/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  const { name, middlename, assignments, charge, avatar } = req.body;

  const user = {
    name,
    middlename,
    assignments,
    charge,
    avatar,
  };

  try {
    const userUpdate = await Person.updateOne({ _id: id }, user);
    if (userUpdate) {
      res.status(200).json({ message: "Usuário Atualizado com Sucesso!" });
      return;
    }
    if (userUpdate.matchedCount === 0) {
      res.status(422).json({ message: "Não foi possível alterar o usuário" });
      return;
    }
    res.status(200).json(userUpdate);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// DELETE USER

app.delete("/users/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  const user = await Person.findOne({ _id: id });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    await Person.deleteOne({ _id: id });
    res.status(200).json({ message: "Usuário deletado com Sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// PRIVATE ROUTE USER

app.get("/auth/user/:id", checkToken, async (req: Request, res: Response) => {
  const id = req.params.id;

  // Check if user is already exists
  const user = await Person.findById(id, "-password");

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

// SIGNIN USER

app.post("/auth", async (req: Request, res: Response) => {
  const { login, password } = req.body;
  // const id = req.params.id;

  // validate login and password

  if (!login) {
    res.status(422).json({ error: "Login é obrigatório!" });
    return;
  }
  if (!password) {
    res.status(422).json({ error: "Senha é obrigatório!" });
    return;
  }

  // Check if user already exists
  const user = await Person.findOne({ login });

  // Check if user not exists
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado!" });
  }

  // Check if password match

  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(422).json({ message: "Senha inválida!" });
  }

  const dados = await Person.findById(user._id, "-password");

  try {
    const secretKey = JSON.stringify(process.env.SECRET_HASH);

    const token = jwt.sign(
      {
        id: user._id,
      },
      secretKey
    );

    res.status(200).json({
      message: "Autenticação realizada com Sucesso!",
      user: {
        dados,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Aconteceu um erro no Servidor, tente novamente mais tarde!",
    });
  }
});

// Check the token is valid

function checkToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Acesso Negado!" });
  }

  try {
    const secretKey = JSON.stringify(process.env.SECRET_HASH);
    jwt.verify(token, secretKey);
    next();
  } catch (error) {
    res.status(400).json({ message: "Token not valid" });
  }
}

app.post("/send-message", async (req: Request, res: Response) => {
  const { message } = req.body;
  const messages = {
    message,
  };

  try {
    await Message.create(messages);
    res.status(201).json({ message: "Mensagem enviada com sucess!" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

app.get("/find-message", async (req: Request, res: Response) => {
  try {
    const message = await Message.find();
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Credentials
const URI_CONNECT = process.env.MONGO_URL;

mongoose
  .connect(`${URI_CONNECT}`)
  .then(() => {
    console.log("Database connection established");
  })
  .catch((err) => console.error(err));

app.listen(port);
