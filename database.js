
const Database = require("better-sqlite3");

// Criar ou abrir o banco de dados
const db = new Database("banco.db");

// Criar tabela de participantes
db.exec(`
    CREATE TABLE IF NOT EXISTS participantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pagamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participante_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (participante_id) REFERENCES participantes(id)
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
        id INTEGER PRIMARY KEY,
        proximo INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO configuracoes (id, proximo)
    VALUES (1, 0);
`);

console.log("Banco de dados criado com sucesso!");

module.exports = db;