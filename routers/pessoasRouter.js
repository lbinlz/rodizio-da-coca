
const express = require("express");

const router = express.Router();

const pessoasController = require("../controllers/pessoasController");

// Página de pessoas
router.get("/", pessoasController.listarPessoas);

// Cadastro de pessoas
router.post("/adicionar", pessoasController.adicionarPessoa);

module.exports = router;