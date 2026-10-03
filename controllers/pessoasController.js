
const db = require("../database");

// Exibir página com todas as pessoas
exports.listarPessoas = (req, res) => {
    const pessoas = db.prepare(`
        SELECT * FROM participantes
        ORDER BY id ASC
    `).all();

    res.render("pessoas", {
        pessoas: pessoas
    });
};

// Cadastrar nova pessoa
exports.adicionarPessoa = (req, res) => {
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
        return res.status(400).send("Digite um nome válido.");
    }

    db.prepare(`
        INSERT INTO participantes (nome)
        VALUES (?)
    `).run(nome.trim());

    res.redirect("/pessoas");
};