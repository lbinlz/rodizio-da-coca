
const API = "/api";

// Carregar participantes
async function carregarParticipantes() {
    try {
        const resposta = await fetch(`${API}/participantes`);

        if (!resposta.ok) {
            throw new Error("Erro ao buscar participantes.");
        }

        const pessoas = await resposta.json();

        const lista = document.getElementById("lista");

        if (!lista) return;

        lista.innerHTML = "";

        pessoas.forEach(pessoa => {
            lista.innerHTML += `
                <div class="pessoa">
                    <span>${pessoa.nome}</span>

                    <button class="excluir"
                        onclick="excluirPessoa(${pessoa.id})">
                        Excluir
                    </button>
                </div>
            `;
        });

        await carregarProximo();

    } catch (erro) {
        console.error("Erro:", erro);
        alert("Não foi possível carregar os participantes.");
    }
}

// Adicionar participante
async function adicionarPessoa() {
    const campo = document.getElementById("nome");
    const nome = campo.value.trim();

    if (!nome) {
        alert("Digite um nome!");
        return;
    }

    try {
        const resposta = await fetch(`${API}/participantes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Erro ao cadastrar.");
            return;
        }

        alert("Participante cadastrado com sucesso!");

        campo.value = "";

        await carregarParticipantes();

    } catch (erro) {
        console.error(erro);
        alert("Erro de conexão com o servidor.");
    }
}

// Excluir participante
async function excluirPessoa(id) {
    if (!confirm("Deseja excluir este participante?")) {
        return;
    }

    try {
        const resposta = await fetch(`${API}/participantes/${id}`, {
            method: "DELETE"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Erro ao excluir.");
            return;
        }

        alert("Participante excluído!");

        await carregarParticipantes();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao excluir participante.");
    }
}

// Mostrar próximo responsável
async function carregarProximo() {
    try {
        const resposta = await fetch(`${API}/proximo`);
        const pessoa = await resposta.json();

        const elemento = document.getElementById("proximo");

        if (elemento) {
            elemento.textContent =
                pessoa ? pessoa.nome : "Cadastre participantes";
        }

    } catch (erro) {
        console.error("Erro ao carregar próximo responsável:", erro);
    }
}

// Confirmar pagamento
async function registrarPagamento() {
    try {
        const resposta = await fetch("/api/pagar", {
            method: "POST"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Erro ao registrar pagamento.");
            return;
        }

        alert(`${dados.participante} pagou a Coca!`);

        // Atualiza os dados da página inicial
        await carregarParticipantes();
        await carregarProximo();
        await carregarHistorico();

    } catch (erro) {
        console.error("Erro:", erro);
        alert("Não foi possível registrar o pagamento.");
    }
}

// Carregar histórico

async function carregarHistorico() {
    try {
        const resposta = await fetch(`${API}/historico`);

        if (!resposta.ok) {
            throw new Error("Erro ao buscar histórico.");
        }

        const registros = await resposta.json();
        const tabela = document.getElementById("historico");

        if (!tabela) return;

        tabela.innerHTML = "";

        registros.forEach(registro => {
            const data = registro.data.split("-").reverse().join("/");

            tabela.innerHTML += `
                <tr>
                    <td>${registro.nome}</td>
                    <td>${data}</td>
                    <td>
                        <button
                            type="button"
                            class="excluir"
                            onclick="excluirHistorico(${registro.id})">
                            Excluir
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (erro) {
        console.error("Erro no histórico:", erro);
    }
}

// Excluir um pagamento individual
async function excluirHistorico(id) {
    const confirmar = confirm(
        "Tem certeza que deseja excluir este pagamento do histórico?"
    );

    if (!confirmar) return;

    try {
        const resposta = await fetch(`${API}/historico/${id}`, {
            method: "DELETE"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Erro ao excluir pagamento.");
            return;
        }

        alert("Pagamento excluído do histórico!");

        await carregarHistorico();

    } catch (erro) {
        console.error("Erro ao excluir histórico:", erro);
        alert("Não foi possível excluir o pagamento.");
    }
}
// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    carregarParticipantes();
    carregarHistorico();
});


// Carregar participantes no seletor manual
async function carregarParticipantesManual() {
    const select = document.getElementById("participanteManual");

    if (!select) {
        console.error("Seletor não encontrado no HTML!");
        return;
    }

    try {
        const resposta = await fetch("/api/participantes");

        if (!resposta.ok) {
            throw new Error("Erro ao consultar participantes");
        }

        const pessoas = await resposta.json();

        select.innerHTML = '<option value="">Selecione quem pagou</option>';

        pessoas.forEach(pessoa => {
            const opcao = document.createElement("option");

            opcao.value = pessoa.id;
            opcao.textContent = pessoa.nome;

            select.appendChild(opcao);
        });

        console.log("Participantes carregados:", pessoas);

    } catch (erro) {
        console.error("Erro ao preencher participantes:", erro);
    }
}

// Registrar pagamento manual
async function registrarPagamentoManual() {
    const select = document.getElementById("participanteManual");
    const participanteId = select.value;

    if (!participanteId) {
        alert("Selecione quem pagou!");
        return;
    }

    try {
        const resposta = await fetch("/api/pagar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                participante_id: Number(participanteId)
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Erro ao registrar pagamento.");
            return;
        }

        alert(dados.participante + " foi registrado como pagante!");

        select.value = "";

        await carregarParticipantes();
        await carregarHistorico();
        await carregarParticipantesManual();

    } catch (erro) {
        console.error("Erro no pagamento manual:", erro);
        alert("Não foi possível registrar o pagamento.");
    }
}

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
    carregarParticipantes();
    carregarHistorico();
    carregarParticipantesManual();
});