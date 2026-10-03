
const express = require("express");
const path = require("path");

const app = express();
const db = require("./database");

// Configurações do servidor
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configuração do EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Importar Router
const pessoasRouter = require("./routers/pessoasRouter");

// ==================================
// API DE PARTICIPANTES
// ==================================

// Listar participantes
app.get("/api/participantes", (req, res) => {
    const pessoas = db.prepare(
        "SELECT * FROM participantes ORDER BY id ASC"
    ).all();

    res.json(pessoas);
});

// Adicionar participante
app.post("/api/participantes", (req, res) => {
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
        return res.status(400).json({
            erro: "Digite um nome válido."
        });
    }

    const resultado = db.prepare(
        "INSERT INTO participantes (nome) VALUES (?)"
    ).run(nome.trim());

    res.json({
        id: resultado.lastInsertRowid,
        nome: nome.trim()
    });
});

// Excluir participante
app.delete("/api/participantes/:id", (req, res) => {
    const id = Number(req.params.id);

    const pessoa = db.prepare(
        "SELECT * FROM participantes WHERE id = ?"
    ).get(id);

    if (!pessoa) {
        return res.status(404).json({
            erro: "Participante não encontrado."
        });
    }

    const historico = db.prepare(
        "SELECT id FROM pagamentos WHERE participante_id = ?"
    ).get(id);

    if (historico) {
        return res.status(400).json({
            erro: "Essa pessoa possui pagamentos registrados."
        });
    }

    db.prepare(
        "DELETE FROM participantes WHERE id = ?"
    ).run(id);

    res.json({
        mensagem: "Participante excluído!"
    });
});

// ==================================
// PRÓXIMO RESPONSÁVEL
// ==================================

function proximoResponsavel() {
    const pessoas = db.prepare(
        "SELECT * FROM participantes ORDER BY id ASC"
    ).all();

    if (pessoas.length === 0) {
        return null;
    }

    const config = db.prepare(
        "SELECT proximo FROM configuracoes WHERE id = 1"
    ).get();

    return pessoas[config.proximo % pessoas.length];
}

app.get("/api/proximo", (req, res) => {
    res.json(proximoResponsavel());
});

// ==================================
// CONFIRMAR PAGAMENTO
// ==================================


app.post("/api/pagar", (req, res) => {
    const diaSemana = new Date().toLocaleDateString("en-US", {
        timeZone: "America/Sao_Paulo",
        weekday: "short"
    });

    if (diaSemana === "Sat" || diaSemana === "Sun") {
        return res.status(400).json({
            erro: "O rodízio funciona somente de segunda a sexta."
        });
    }

    const hoje = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo"
    });

    // Busca todos os participantes na ordem cadastrada
    const participantes = db.prepare(
        "SELECT * FROM participantes ORDER BY id ASC"
    ).all();

    if (participantes.length === 0) {
        return res.status(400).json({
            erro: "Cadastre participantes primeiro."
        });
    }

    // Se receber um ID, utiliza o participante escolhido manualmente.
    // Caso contrário, utiliza o próximo da fila.
    let pessoa;

    if (req.body && req.body.participante_id) {
        pessoa = participantes.find(
            p => p.id === Number(req.body.participante_id)
        );

        if (!pessoa) {
            return res.status(400).json({
                erro: "Participante não encontrado."
            });
        }
    } else {
        pessoa = proximoResponsavel();

        if (!pessoa) {
            return res.status(400).json({
                erro: "Não foi possível encontrar o próximo participante."
            });
        }
    }

    const registrar = db.transaction(() => {
        db.prepare(`
            INSERT INTO pagamentos (participante_id, data)
            VALUES (?, ?)
        `).run(pessoa.id, hoje);

        // Encontra a posição da pessoa que acabou de pagar
        const indice = participantes.findIndex(
            p => p.id === pessoa.id
        );

        // Define o próximo participante
        const proximo = (indice + 1) % participantes.length;

        db.prepare(`
            UPDATE configuracoes
            SET proximo = ?
            WHERE id = 1
        `).run(proximo);
    });

    registrar();

    res.json({
        mensagem: "Pagamento registrado!",
        participante: pessoa.nome
    });
});


// ==================================
// HISTÓRICO DE PAGAMENTOS
// ==================================


app.get("/api/historico", (req, res) => {
    const registros = db.prepare(`
        SELECT
            pagamentos.id,
            participantes.nome,
            pagamentos.data
        FROM pagamentos
        INNER JOIN participantes
        ON pagamentos.participante_id = participantes.id
        ORDER BY pagamentos.id DESC
    `).all();

    res.json(registros);
});

app.delete("/api/historico/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "ID inválido."
        });
    }

    const resultado = db.prepare(
        "DELETE FROM pagamentos WHERE id = ?"
    ).run(id);

    if (resultado.changes === 0) {
        return res.status(404).json({
            erro: "Pagamento não encontrado."
        });
    }

    res.json({
        mensagem: "Registro excluído com sucesso!"
    });
});

// ==================================
// PÁGINA DE PESSOAS
// ==================================

app.use("/pessoas", pessoasRouter);

// ==================================
// INICIAR SERVIDOR
// ==================================

const PORTA = 3000;

app.listen(PORTA, () => {
    console.log(`Sistema rodando em http://localhost:${PORTA}`);
});