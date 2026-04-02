// ==========================================
// CONFIGURAÇÕES DO ADMINISTRADOR MESTRE
// ==========================================
const LOGIN_MESTRE = "Rodrigo Campos";   
const SENHA_MESTRE = "100769";  
// ==========================================

let chartDashMestre = null;
let chartAtivosStatus = null;
let chartAtivosFluxo = null;

function getMesAtualStr() { let d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function getDataAtualStr() { let d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

let mesSelecionadoFinanceiro = getMesAtualStr(); 
let despesaEditandoIndex = -1; 
let filtroBuscaAtual = ""; 
let filtroStatusAtual = "TODOS"; 

function getUsuarios() {
    try {
        let lista = JSON.parse(localStorage.getItem('usuariosTreePrime'));
        if (Array.isArray(lista)) return lista.filter(u => u && typeof u === 'object' && u.usuario);
        return [];
    } catch (e) { return []; }
}

function setUsuarios(lista) { localStorage.setItem('usuariosTreePrime', JSON.stringify(lista)); }

let USUARIO_LOGADO = null; 
let clientesCadastrados = JSON.parse(localStorage.getItem('clientesTreePrime')) || [];
let checklistRotinas = JSON.parse(localStorage.getItem('checklistRotinasTreePrime')) || {}; 
let despesasCadastradas = JSON.parse(localStorage.getItem('despesasTreePrime')) || []; 
let categoriaAtual = 'home'; 

let despesasPrecisamSalvar = false;
despesasCadastradas.forEach(d => {
    if (!d.data) { d.data = getDataAtualStr(); despesasPrecisamSalvar = true; }
});
if (despesasPrecisamSalvar) { localStorage.setItem('despesasTreePrime', JSON.stringify(despesasCadastradas)); }

// LOGIN
function verificarSenha() {
    const userField = document.getElementById('login-usuario');
    const passField = document.getElementById('senha-acesso');
    const erroMsg = document.getElementById('login-erro');
    if (!userField) return;

    const userDigitado = userField.value.trim().toLowerCase();
    const senhaDigitada = passField.value.trim();

    if (userDigitado === LOGIN_MESTRE.toLowerCase() && senhaDigitada === SENHA_MESTRE) {
        USUARIO_LOGADO = "admin_mestre";
        autorizarEntrada("Mestre " + LOGIN_MESTRE.toUpperCase());
        return; 
    }

    const usuariosSistema = getUsuarios();
    const usuarioEncontrado = usuariosSistema.find(u => (u.usuario || "").toLowerCase() === userDigitado && u.senha === senhaDigitada);

    if (usuarioEncontrado) {
        if (usuarioEncontrado.status === "INATIVO") { erroMsg.innerText = "Usuário inativo! Fale com o administrador."; erroMsg.style.display = "block"; passField.value = ""; return; }
        USUARIO_LOGADO = usuarioEncontrado.tipo;
        autorizarEntrada(usuarioEncontrado.usuario);
    } else {
        erroMsg.innerText = "Usuário ou senha incorretos!"; erroMsg.style.display = "block"; passField.value = "";
    }
}

function autorizarEntrada(nomeUser) {
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('main-app').style.display = "flex";
    
    if (USUARIO_LOGADO === "admin_mestre") {
        document.getElementById('btn-admin').style.display = "block"; document.getElementById('area-backup-admin').style.display = "block"; document.getElementById('btn-excluir-admin').style.display = "inline-block";
    } else {
        document.getElementById('btn-admin').style.display = "none"; document.getElementById('area-backup-admin').style.display = "none"; document.getElementById('btn-excluir-admin').style.display = "none";
    }
    carregarLista('home');
    let cargo = USUARIO_LOGADO === 'admin_mestre' ? 'MESTRE' : 'OPERACIONAL';
    mostrarToast(`Bem-vindo, ${nomeUser}! Acesso: ${cargo}`, "sucesso");
}

function fazerLogout() { window.location.reload(); }

// NAVEGAÇÃO
function carregarLista(categoria) {
    categoriaAtual = categoria;
    const containerLista = document.getElementById("lista-tarefas");
    const areaBuscaClientes = document.getElementById("area-busca-clientes");
    const acoesSistema = document.getElementById("acoes-sistema");
    const dashboardArea = document.getElementById("dashboard-area");
    
    acoesSistema.style.display = "none";
    containerLista.innerHTML = "";

    if (categoria === 'home') {
        document.getElementById("titulo-sessao").innerText = "Painel Tree Prime";
        areaBuscaClientes.style.display = "none";
        dashboardArea.style.display = "block";
        renderizarDashboard();
        
    } else if (categoria === 'admin') {
        document.getElementById("titulo-sessao").innerText = "Gerenciar Usuários e Acessos";
        areaBuscaClientes.style.display = "none";
        dashboardArea.style.display = "none";
        renderizarGerenciamentoUsuarios(containerLista);
        
    } else if (categoria === 'abertura') {
        document.getElementById("titulo-sessao").innerText = "Cadastro de Abertura / Alterações";
        areaBuscaClientes.style.display = "block";
        dashboardArea.style.display = "none";
        
        const btnNovo = document.getElementById("btn-novo-cliente");
        if (btnNovo) {
            btnNovo.style.display = "inline-block";
            btnNovo.style.marginBottom = "15px";
            
            if (!document.getElementById("btn-alteracao-contratual")) {
                const btnAlt = document.createElement("button");
                btnAlt.id = "btn-alteracao-contratual";
                btnAlt.innerHTML = `<i class="fas fa-file-contract"></i> Alterações Contratuais`;
                btnAlt.style.cssText = "background: #8b5cf6; color: white; border: none; padding: 10px 15px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.3s; margin-left: 10px; display: inline-block; vertical-align: bottom; margin-bottom: 15px;";
                btnAlt.onclick = abrirModalSelectAlteracao;
                btnNovo.parentNode.insertBefore(btnAlt, btnNovo.nextSibling);
            }
        }
        
        renderizarFormularioCadastro(containerLista);
        atualizarListaClientes(); 
        
    } else if (categoria === 'ativos') {
        document.getElementById("titulo-sessao").innerText = ""; 
        areaBuscaClientes.style.display = "none"; 
        dashboardArea.style.display = "none";
        renderizarPainelAtivosImagem(containerLista);

    } else if (['mensal', 'fiscal', 'pessoal', 'obrigacoes'].includes(categoria)) {
        document.getElementById("titulo-sessao").innerText = "Gestão de Rotinas do Escritório";
        areaBuscaClientes.style.display = "none";
        dashboardArea.style.display = "none";
        renderizarRotinas(containerLista, categoria);
    }
}

// ==========================================
// NOVO: SISTEMA DE ALTERAÇÕES CONTRATUAIS
// ==========================================
function abrirModalSelectAlteracao() {
    let ativos = clientesCadastrados.filter(c => c['status-processo'] === 'CONCLUIDO' || c['status-processo'] === 'CONCLUÍDO');
    ativos = ativos.filter(c => !c['em-alteracao']); 
    
    if (ativos.length === 0) {
        mostrarToast("Todos os clientes ativos já estão em processo ou não há clientes ativos.", "erro");
        return;
    }
    
    let overlay = document.createElement("div");
    overlay.id = "modal-alt-overlay";
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:9999;";
    
    let options = ativos.map(c => `<option value="${c.nome}">${c.nome} (${c.cnpj || c.cpf || 'Sem doc'})</option>`).join('');
    
    let box = document.createElement("div");
    box.style.cssText = "background:white; padding:30px; border-radius:12px; width:450px; max-width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.3); border-top: 5px solid #8b5cf6;";
    box.innerHTML = `
        <h3 style="color:#1e293b; margin-bottom:15px; font-size:1.4rem;"><i class="fas fa-file-signature" style="color:#8b5cf6;"></i> Iniciar Alteração</h3>
        <p style="color:#475569; font-size:0.95rem; margin-bottom:20px; line-height: 1.5;">Selecione o cliente da base <b>ATIVA</b>. Ele será enviado para o painel de Aberturas/Alterações para controle, mas continuará gerando cobrança nos Ativos.</p>
        <select id="select-cliente-alt" style="width:100%; padding:12px; margin-bottom:25px; border:2px solid #cbd5e1; border-radius:6px; font-size: 1rem; color: #1e293b; outline: none;">
            ${options}
        </select>
        <div style="display:flex; justify-content:flex-end; gap:15px;">
            <button onclick="document.getElementById('modal-alt-overlay').remove()" style="padding:12px 20px; border:none; background:#e2e8f0; color:#475569; border-radius:6px; cursor:pointer; font-weight:bold; transition: 0.2s;">Cancelar</button>
            <button onclick="iniciarAlteracaoSelecionada()" style="padding:12px 20px; border:none; background:#8b5cf6; color:white; border-radius:6px; cursor:pointer; font-weight:bold; transition: 0.2s;">Iniciar Fluxo</button>
        </div>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function iniciarAlteracaoSelecionada() {
    let nomeSelecionado = document.getElementById("select-cliente-alt").value;
    let index = clientesCadastrados.findIndex(c => c.nome === nomeSelecionado);
    if (index !== -1) {
        clientesCadastrados[index]['em-alteracao'] = true;
        clientesCadastrados[index]['status-alteracao'] = 'INICIAR';
        clientesCadastrados[index]['prioridade-alteracao'] = 'BAIXA';
        localStorage.setItem('clientesTreePrime', JSON.stringify(clientesCadastrados));
        mostrarToast("Alteração contratual iniciada!", "sucesso");
        document.getElementById('modal-alt-overlay').remove();
        carregarLista('abertura'); 
    }
}

// GERENCIAMENTO DE USUÁRIOS
function renderizarGerenciamentoUsuarios(container) {
    container.innerHTML = `
        <div class="registration-form" style="max-width: 700px;">
            <h2 style="color:#8e44ad; border-bottom: 3px solid #8e44ad; padding-bottom:10px; margin-bottom: 20px;">⚙️ Adicionar Novo Usuário Operacional</h2>
            <div style="display:flex; gap:15px; align-items:flex-end; flex-wrap: wrap;">
                <div class="form-group" style="flex:1; min-width: 150px;">
                    <label>NOME DE USUÁRIO</label>
                    <input type="text" id="novo-user-nome" placeholder="Ex: joao.silva">
                </div>
                <div class="form-group" style="flex:1; min-width: 150px;">
                    <label>SENHA DE ACESSO</label>
                    <input type="text" id="novo-user-senha" placeholder="Ex: senha123">
                </div>
                <button type="button" onclick="adicionarUsuario()" style="background:#27ae60; color:white; border:none; padding:12px 20px; border-radius:6px; font-weight:bold; cursor:pointer;">➕ CRIAR CONTA</button>
            </div>
            <hr class="divisor">
            <h3 style="color:#1e293b; margin-bottom: 15px;">👥 Equipe Cadastrada</h3>
            <div id="lista-usuarios-cadastrados" style="display:flex; flex-direction:column; gap:10px;"></div>
        </div>
    `;
    atualizarListaUsuariosUI();
}

function adicionarUsuario() {
    try {
        const u = document.getElementById('novo-user-nome').value.trim(); const s = document.getElementById('novo-user-senha').value.trim();
        if(!u || !s) { alert("Erro: Preencha o nome de usuário e a senha!"); return; }
        let usuariosSistema = getUsuarios();
        if(usuariosSistema.some(user => (user.usuario || "").toLowerCase() === u.toLowerCase()) || u.toLowerCase() === LOGIN_MESTRE.toLowerCase()) { alert("Erro: Esse nome de usuário já existe ou é reservado!"); return; }
        usuariosSistema.push({ usuario: u, senha: s, tipo: "comum", status: "ATIVO" });
        setUsuarios(usuariosSistema); mostrarToast("Usuário adicionado com sucesso!", "sucesso");
        document.getElementById('novo-user-nome').value = ""; document.getElementById('novo-user-senha').value = "";
        atualizarListaUsuariosUI();
    } catch (erro) { alert("Ops! Ocorreu um erro no sistema: " + erro.message); }
}

function alternarStatusUsuario(nomeUsuario) {
    let usuariosSistema = getUsuarios(); let index = usuariosSistema.findIndex(u => u.usuario === nomeUsuario);
    if (index !== -1) {
        usuariosSistema[index].status = usuariosSistema[index].status === "INATIVO" ? "ATIVO" : "INATIVO";
        mostrarToast(`Status alterado!`, "sucesso");
        setUsuarios(usuariosSistema); atualizarListaUsuariosUI();
    }
}

function removerUsuario(usuarioParaRemover) {
    if(confirm(`Tem certeza que deseja excluir DEFINITIVAMENTE o usuário: ${usuarioParaRemover}?`)) {
        let usuariosSistema = getUsuarios(); usuariosSistema = usuariosSistema.filter(u => u.usuario !== usuarioParaRemover);
        setUsuarios(usuariosSistema); atualizarListaUsuariosUI(); mostrarToast("Usuário removido do sistema!");
    }
}

function atualizarListaUsuariosUI() {
    const lista = document.getElementById('lista-usuarios-cadastrados'); if(!lista) return; lista.innerHTML = ""; let usuariosSistema = getUsuarios();
    lista.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:#cbd5e1; padding:12px 15px; border-radius:8px; border-left: 5px solid #8e44ad"><span style="font-weight:bold; color:#1e293b; font-size: 1.1rem;">👤 ${LOGIN_MESTRE}</span><span style="color:#8e44ad; font-weight:bold; background:#e2e8f0; padding:5px 10px; border-radius:15px; font-size:0.8rem;">👑 MESTRE (Intocável)</span></div>`;
    usuariosSistema.forEach(u => {
        if((u.usuario || "").toLowerCase() !== LOGIN_MESTRE.toLowerCase()) {
            const isAtivo = u.status !== "INATIVO"; const corStatus = isAtivo ? "#1abc9c" : "#e74c3c"; const textoStatus = isAtivo ? "🟢 ATIVO" : "🔴 INATIVO";
            lista.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:#cbd5e1; padding:12px 15px; border-radius:8px; border-left: 5px solid ${corStatus}; gap: 10px;"><span style="font-weight:bold; color:#1e293b; font-size: 1.1rem; flex: 1;">👤 ${u.usuario}</span><button type="button" onclick="alternarStatusUsuario('${u.usuario}')" style="background:${corStatus}; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold; font-size: 0.8rem; width: 110px;">${textoStatus}</button><button type="button" onclick="removerUsuario('${u.usuario}')" style="background:#334155; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold; font-size: 0.8rem;">🗑️ EXCLUIR</button></div>`;
        }
    });
}

// FORMULÁRIO VERTICAL E FUNÇÕES DE CLIENTE
function renderizarFormularioCadastro(container) {
    container.innerHTML = `
        <div class="registration-form" id="area-pdf" style="display: none; flex-direction: column; gap: 20px;">
            <h2 id="titulo-form-cliente" style="text-align:center; color:#1e293b; border-bottom: 3px solid #3498db; padding-bottom:10px;">FICHA DE CADASTRO TREE PRIME</h2>
            
            <div class="form-group"><label>PRIORIDADE</label>
                <select id="reg-prioridade"><option value="PRIORIDADE-1">PRIORIDADE 1</option><option value="PRIORIDADE-2">PRIORIDADE 2</option><option value="MÉDIA">MÉDIA</option><option value="BAIXA" selected>BAIXA</option></select>
            </div>
            <div class="form-group"><label>STATUS DO PROCESSO</label>
                <select id="reg-status-processo"><option value="INICIAR" selected>INICIAR</option><option value="VIABILIDADE">VIABILIDADE</option><option value="AGUARDANDO ASSINATURA">AGUARDANDO ASSINATURA</option><option value="CONCLUIDO">CONCLUIDO</option></select>
            </div>
            <div class="form-group"><label>NOME DA PESSOA / EMPRESA</label><input type="text" id="reg-nome"></div>
            <div class="form-group"><label>PAGOU ABERTURA</label><select id="reg-pagou-abertura"><option>SIM</option><option>NÃO</option></select></div>
            <div class="form-group"><label>PAGOU CERTIFICADO</label><select id="reg-pagou-cert"><option>SIM</option><option>NÃO</option></select></div>
            <div class="form-group"><label>PROFISSÃO</label><input type="text" id="reg-profissao"></div>
            <div class="form-group"><label>TIPO DE EMPRESA</label>
                <select id="reg-tipo-empresa"><option>EMPRESARIO INDIVIDUAL</option><option>LTDA</option><option>MEI</option></select>
            </div>
            <div class="form-group"><label>FORMA DE ATUAÇÃO</label>
                <select id="reg-atuacao" onchange="const d=document.getElementById('area-campos-fixos'); d.style.display=(this.value==='ESTABELECIMENTO FIXO' ? 'flex' : 'none');"><option value="ESTABELECIMENTO FIXO">ESTABELECIMENTO FIXO</option><option value="NÃO FIXO" selected>NÃO FIXO</option></select>
            </div>
            <div class="form-group"><label>ATIVIDADE</label><select id="reg-atividade"><option>COMERCIO</option><option>PRESTAÇÃO DE SERVIÇOS</option><option>INDUSTRIA</option></select></div>
            <div class="form-group"><label>NOME DA EMPRESA</label><input type="text" id="reg-nome-empresa"></div>
            <div class="form-group"><label>CNAE</label><input type="text" id="reg-cnae"></div>
            <div class="form-group"><label>CPF</label><input type="text" id="reg-cpf" oninput="this.value=mascaraCpfCnpj(this.value)"></div>
            <div class="form-group"><label>SENHA GOV</label><input type="text" id="reg-senha-gov"></div>
            <div class="form-group"><label>RG / CNH</label><input type="text" id="reg-rg"></div>
            <div class="form-group"><label>DATA DE EXPEDIÇÃO</label><input type="date" id="reg-expedicao"></div>
            <div class="form-group"><label>ÓRGÃO EMISSOR</label><input type="text" id="reg-emissor"></div>
            <div class="form-group"><label>NATURALIDADE</label><input type="text" id="reg-naturalidade"></div>
            <div class="form-group"><label>DATA DE NASCIMENTO</label><input type="date" id="reg-nascimento"></div>
            <hr class="divisor">
            <div class="form-group"><label>NOME DA MÃE</label><input type="text" id="reg-mae"></div>
            <div class="form-group"><label>NOME DO PAI</label><input type="text" id="reg-pai"></div>
            <div class="form-group"><label>ESTADO CIVIL</label>
                <select id="reg-estado-civil" onchange="const d=document.getElementById('reg-outro-civil-box'); this.value==='OUTROS'? d.style.display='block': d.style.display='none'"><option>SOLTEIRO</option><option>CASADO</option><option>DIVORCIADO</option><option>VIUVO</option><option>OUTROS</option></select>
                <input type="text" id="reg-outro-civil-box" placeholder="Qual?" style="display:none; margin-top:5px;">
            </div>
            <div class="form-group"><label>COMUNHÃO / REGIME DE BENS</label><input type="text" id="reg-regime"></div>
            <div class="form-group"><label>NOME DO CONJUGE</label><input type="text" id="reg-conjuge-nome"></div>
            <div class="form-group"><label>CPF DO CONJUGE</label><input type="text" id="reg-conjuge-cpf"></div>
            <div class="form-group"><label>COR</label><select id="reg-cor"><option>BRANCA</option><option>AMARELA</option><option>PARDA</option><option>INDIGENA</option><option>PRETA</option></select></div>
            <hr class="divisor">
            <div class="form-group"><label>CEP</label><input type="text" id="reg-cep" onblur="buscarCEP(this.value)"></div>
            <div class="form-group"><label>ENDEREÇO</label><input type="text" id="reg-endereco"></div>
            <div class="form-group"><label>BAIRRO</label><input type="text" id="reg-bairro"></div>
            <div class="form-group"><label>ESTADO</label><input type="text" id="reg-uf" maxlength="2"></div>
            <div class="form-group"><label>MUNICIPIO</label><input type="text" id="reg-mun"></div>
            <div class="form-group"><label>NÚMERO DO IPTU</label><input type="text" id="reg-iptu"></div>
            <div id="area-campos-fixos" style="display: none; flex-direction: column; gap: 20px; width: 100%;">
                <div class="form-group"><label>ÁREA CONSTRUÍDA</label><input type="text" id="reg-area-construida"></div>
                <div class="form-group"><label>ÁREA TOTAL</label><input type="text" id="reg-area-total"></div>
            </div>
            <hr class="divisor">
            <div class="form-group"><label>VALOR DA MENSALIDADE</label><input type="text" id="reg-mensal-valor" oninput="aplicarMascaraMoeda(this)"></div>
            <div class="form-group"><label>MENSALIDADE A PARTIR DE</label><input type="date" id="reg-mensal-data"></div>
            <div class="form-group"><label>OBSERVAÇÃO (MÁX 300 CARACTERES)</label><textarea id="reg-obs" maxlength="300" rows="4"></textarea></div>
            <hr class="divisor">
            <div class="form-group" style="align-items: center; background: #cbd5e1; padding: 15px; border-radius: 8px; border: 2px dashed #94a3b8;">
                <label style="color: #1e293b; font-size: 1rem; margin-bottom: 5px;">STATUS DO CLIENTE NO SISTEMA</label>
                <input type="hidden" id="reg-status" value="ATIVO">
                <button type="button" id="btn-status-cliente" onclick="alternarStatusCliente()" style="background:#1abc9c; color:white; border:none; padding:15px 30px; border-radius:8px; font-weight:bold; cursor:pointer; font-size: 1.1rem; width: 100%; max-width: 400px; transition: 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🟢 CLIENTE ATIVO</button>
            </div>
        </div>`;
}

function alternarStatusCliente() {
    const inputStatus = document.getElementById("reg-status"); const btnStatus = document.getElementById("btn-status-cliente");
    if (inputStatus.value === "ATIVO") { inputStatus.value = "INATIVO"; btnStatus.style.background = "#e74c3c"; btnStatus.innerHTML = "🔴 CLIENTE INATIVO"; } 
    else { inputStatus.value = "ATIVO"; btnStatus.style.background = "#1abc9c"; btnStatus.innerHTML = "🟢 CLIENTE ATIVO"; }
}

function salvarChecklist() {
    const nome = document.getElementById('reg-nome').value;
    if (!nome) return mostrarToast("Nome obrigatório!", "erro");
    const dados = {};
    document.querySelectorAll('[id^="reg-"]').forEach(el => dados[el.id.replace('reg-', '')] = el.value);
    
    dados['status-pagamento'] = "DEVEDOR"; 
    dados['em-alteracao'] = false; 
    
    clientesCadastrados.push(dados);
    localStorage.setItem('clientesTreePrime', JSON.stringify(clientesCadastrados));
    mostrarToast("Salvo!");
    document.getElementById("area-pdf").style.display = "none";
    document.getElementById("acoes-sistema").style.display = "none";
    atualizarListaClientes();
}

function atualizarCliente() {
    const nomeOriginal = document.getElementById('reg-nome').dataset.originalName;
    const index = clientesCadastrados.findIndex(x => x.nome === nomeOriginal);
    if (index === -1) return;
    
    const isAlt = document.getElementById('reg-nome').dataset.isAlteracao === 'true';

    document.querySelectorAll('[id^="reg-"]').forEach(el => {
        let key = el.id.replace('reg-', '');
        
        if (isAlt) {
            if (key === 'status-processo') {
                clientesCadastrados[index]['status-alteracao'] = el.value;
            } else if (key === 'prioridade') {
                clientesCadastrados[index]['prioridade-alteracao'] = el.value;
            } else {
                clientesCadastrados[index][key] = el.value;
            }
        } else {
            clientesCadastrados[index][key] = el.value;
        }
    });

    if (isAlt && clientesCadastrados[index]['status-alteracao'] === 'CONCLUIDO') {
        clientesCadastrados[index]['em-alteracao'] = false;
        mostrarToast("Alteração finalizada com sucesso!", "sucesso");
    } else {
        mostrarToast("Atualizado!");
    }

    localStorage.setItem('clientesTreePrime', JSON.stringify(clientesCadastrados));
    document.getElementById("area-pdf").style.display = "none";
    document.getElementById("acoes-sistema").style.display = "none";
    atualizarListaClientes();
}

function carregarCliente(nome) {
    const c = clientesCadastrados.find(x => x.nome === nome);
    if (!c) return;
    document.getElementById("area-pdf").style.display = "flex";
    document.getElementById("acoes-sistema").style.display = "flex";
    document.getElementById("btn-salvar").style.display = "none";
    document.getElementById("btn-atualizar").style.display = "inline-block";
    
    document.getElementById("reg-nome").dataset.originalName = nome;
    let isAlt = c['em-alteracao'] === true;
    document.getElementById("reg-nome").dataset.isAlteracao = isAlt ? 'true' : 'false';
    
    let tituloForm = document.getElementById("titulo-form-cliente");
    if (tituloForm) {
        tituloForm.innerHTML = isAlt ? "FICHA DE ALTERAÇÃO CONTRATUAL" : "FICHA DE CADASTRO TREE PRIME";
        tituloForm.style.borderColor = isAlt ? "#8b5cf6" : "#3498db";
    }

    Object.keys(c).forEach(key => {
        const el = document.getElementById(`reg-${key}`);
        if (el) { el.value = c[key]; if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change')); }
    });

    if (isAlt) {
        document.getElementById('reg-status-processo').value = c['status-alteracao'] || 'INICIAR';
        document.getElementById('reg-prioridade').value = c['prioridade-alteracao'] || 'BAIXA';
    }

    const btnStatus = document.getElementById("btn-status-cliente");
    if (btnStatus) {
        if (c.status === "INATIVO") { btnStatus.style.background = "#e74c3c"; btnStatus.innerHTML = "🔴 CLIENTE INATIVO"; } 
        else { btnStatus.style.background = "#1abc9c"; btnStatus.innerHTML = "🟢 CLIENTE ATIVO"; }
    }
    document.getElementById("area-pdf").scrollIntoView({ behavior: 'smooth' });
}

function novoCliente() {
    document.getElementById("area-pdf").style.display = "flex";
    document.getElementById("acoes-sistema").style.display = "flex";
    document.getElementById("btn-salvar").style.display = "inline-block";
    document.getElementById("btn-atualizar").style.display = "none";
    
    document.getElementById("reg-nome").dataset.isAlteracao = 'false';
    let tituloForm = document.getElementById("titulo-form-cliente");
    if (tituloForm) { tituloForm.innerHTML = "FICHA DE CADASTRO TREE PRIME"; tituloForm.style.borderColor = "#3498db"; }

    document.querySelectorAll('[id^="reg-"]').forEach(el => {
        if (el.tagName === 'SELECT') { el.selectedIndex = 0; el.dispatchEvent(new Event('change')); } else { el.value = ""; }
    });
    
    document.getElementById("reg-status").value = "ATIVO"; document.getElementById("reg-status-processo").value = "INICIAR";
    const btnStatus = document.getElementById("btn-status-cliente");
    if (btnStatus) { btnStatus.style.background = "#1abc9c"; btnStatus.innerHTML = "🟢 CLIENTE ATIVO"; }
    document.getElementById("area-pdf").scrollIntoView({ behavior: 'smooth' });
}

function atualizarListaClientes(filtro = "") {
    const listaDiv = document.getElementById("lista-clientes-salvos");
    if(!listaDiv) return;
    listaDiv.innerHTML = "";
    let lista = [...clientesCadastrados];
    
    if (categoriaAtual === 'abertura') {
        lista = lista.filter(c => 
            (c['status-processo'] !== 'CONCLUIDO' && c['status-processo'] !== 'CONCLUÍDO') || 
            (c['em-alteracao'] === true)
        );

        // ========================================================
        // NOVO: ORDENAÇÃO POR PRIORIDADE NA TELA DE ABERTURA
        // ========================================================
        lista.sort((a, b) => {
            let prioA = a['em-alteracao'] ? (a['prioridade-alteracao'] || "BAIXA") : (a.prioridade || "BAIXA");
            let prioB = b['em-alteracao'] ? (b['prioridade-alteracao'] || "BAIXA") : (b.prioridade || "BAIXA");
            
            // Dicionário de pesos (quanto maior, mais pro topo fica)
            const pesos = { "PRIORIDADE-1": 4, "PRIORIDADE-2": 3, "MÉDIA": 2, "BAIXA": 1 };
            
            let pesoA = pesos[prioA.toUpperCase()] || 0;
            let pesoB = pesos[prioB.toUpperCase()] || 0;
            
            if (pesoB !== pesoA) {
                return pesoB - pesoA; // Maior prioridade aparece primeiro
            }
            
            // Se as prioridades forem iguais, desempata pela ordem alfabética
            return (a.nome || "").localeCompare(b.nome || "");
        });
    }
    
    if (categoriaAtual === 'ativos') {
        lista = lista.filter(c => c['status-processo'] === 'CONCLUIDO' || c['status-processo'] === 'CONCLUÍDO');
    }
    
    if (filtro) lista = lista.filter(c => c.nome.toLowerCase().includes(filtro.toLowerCase()));
    document.getElementById("cabecalho-lista").style.display = lista.length ? "grid" : "none";
    
    lista.forEach(c => {
        const item = document.createElement("div");
        item.className = `client-item`; 
        
        let isAlt = c['em-alteracao'] === true;
        
        let prioTexto = isAlt ? (c['prioridade-alteracao'] || "BAIXA").toUpperCase() : (c.prioridade || "BAIXA").toUpperCase();
        let statusProcTexto = isAlt ? (c['status-alteracao'] || 'INICIAR').toUpperCase() : (c['status-processo'] || 'INICIAR').toUpperCase();
        let statusCliTexto = (c.status || 'ATIVO').toUpperCase();
        
        let prioClass = "prio-" + prioTexto.toLowerCase().replace(" ", "-").replace("é", "e");
        let statusProcClass = "status-" + statusProcTexto.toLowerCase().replace(" ", "-");
        if(statusProcTexto === 'AGUARDANDO ASSINATURA') statusProcClass = 'status-aguardando';
        let statusCliClass = "cliente-" + statusCliTexto.toLowerCase();

        let tagTipo = "";
        if (categoriaAtual === 'abertura') {
            tagTipo = isAlt 
                ? `<span style="background:#8b5cf6; color:white; padding:4px 8px; border-radius:4px; font-size:0.7rem; margin-right:10px; font-weight:bold; display:inline-block; vertical-align:middle;">ALTERAÇÃO</span>` 
                : `<span style="background:#3b82f6; color:white; padding:4px 8px; border-radius:4px; font-size:0.7rem; margin-right:10px; font-weight:bold; display:inline-block; vertical-align:middle;">NOVO</span>`;
        }

        item.innerHTML = `
            <div class="client-name-area" onclick="carregarCliente('${c.nome}')" style="padding:12px; cursor:pointer; font-weight:bold; color: #1e293b; display:flex; align-items:center;">
                ${tagTipo} <span>${c.nome}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:center;"><span class="badge ${statusProcClass}">${statusProcTexto}</span></div>
            <div style="display:flex; align-items:center; justify-content:center;"><span class="badge ${prioClass}">${prioTexto.replace('-', ' ')}</span></div>
            <div style="display:flex; align-items:center; justify-content:center;"><span class="badge ${statusCliClass}">${statusCliTexto}</span></div>
        `;
        listaDiv.appendChild(item);
    });
}

// ==========================================
// FUNÇÕES DE DESPESAS (COM EDIÇÃO)
// ==========================================
function atualizarMesFinanceiro(novoMes) { mesSelecionadoFinanceiro = novoMes; despesaEditandoIndex = -1; carregarLista('home'); }

function salvarDespesaBtn() {
    let desc = document.getElementById('nova-despesa-desc').value.trim();
    let valorInput = document.getElementById('nova-despesa-valor').value;
    let dataInput = document.getElementById('nova-despesa-data').value;
    
    if (!desc || !valorInput || !dataInput) { mostrarToast("Preencha a descrição, valor e a data!", "erro"); return; }
    let valorLimpo = parseFloat(valorInput.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
    if (isNaN(valorLimpo)) { mostrarToast("Valor inválido!", "erro"); return; }

    if (despesaEditandoIndex > -1) {
        despesasCadastradas[despesaEditandoIndex] = { descricao: desc, valor: valorLimpo, data: dataInput };
        mostrarToast("Despesa atualizada!", "sucesso"); despesaEditandoIndex = -1; 
    } else {
        despesasCadastradas.push({ descricao: desc, valor: valorLimpo, data: dataInput });
        mostrarToast("Despesa adicionada!", "sucesso");
    }
    localStorage.setItem('despesasTreePrime', JSON.stringify(despesasCadastradas)); carregarLista('home'); 
}

function editarDespesa(indexOriginal) {
    let d = despesasCadastradas[indexOriginal];
    document.getElementById('nova-despesa-desc').value = d.descricao; document.getElementById('nova-despesa-valor').value = "R$ " + d.valor.toFixed(2).replace('.', ','); document.getElementById('nova-despesa-data').value = d.data;
    despesaEditandoIndex = indexOriginal;
    let btn = document.getElementById('btn-salvar-despesa'); btn.innerText = "Salvar Edição"; btn.style.background = "#f39c12"; 
}

function removerDespesa(indexOriginal) {
    if (confirm("Tem certeza que deseja excluir esta despesa permanentemente?")) {
        despesasCadastradas.splice(indexOriginal, 1); localStorage.setItem('despesasTreePrime', JSON.stringify(despesasCadastradas));
        mostrarToast("Despesa removida!", "sucesso"); despesaEditandoIndex = -1; carregarLista('home'); 
    }
}

// ==========================================
// GERAR RELATÓRIO PDF FINANCEIRO
// ==========================================
function gerarRelatorioFinanceiroPDF() {
    mostrarToast("Gerando relatório, aguarde...", "sucesso");
    let totalEntradas = 0;
    clientesCadastrados.forEach(c => {
        let statusPgto = c['status-pagamento'] || "DEVEDOR";
        let processoConcluido = c['status-processo'] === 'CONCLUIDO' || c['status-processo'] === 'CONCLUÍDO';
        if (processoConcluido && statusPgto === "PAGO" && c['mensal-valor']) {
            let valorLimpo = c['mensal-valor'].replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
            let valor = parseFloat(valorLimpo); if (!isNaN(valor)) { totalEntradas += valor; }
        }
    });

    let totalSaidas = 0; let htmlDespesasPDF = "";
    despesasCadastradas.forEach((d) => { 
        if (d.data && d.data.substring(0, 7) === mesSelecionadoFinanceiro) {
            totalSaidas += d.valor; 
            let dataFormatada = d.data.split('-').reverse().join('/');
            htmlDespesasPDF += `<tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 8px;">${dataFormatada}</td><td style="padding: 8px;">${d.descricao}</td><td style="padding: 8px; color: #c0392b; text-align: right;">R$ ${d.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td></tr>`;
        }
    });
    if(htmlDespesasPDF === "") htmlDespesasPDF = `<tr><td colspan="3" style="text-align:center; padding: 10px;">Nenhuma despesa no mês</td></tr>`;

    let saldoLiquido = totalEntradas - totalSaidas; let corSaldo = saldoLiquido >= 0 ? "#27ae60" : "#e74c3c"; 

    const divRelatorio = document.createElement('div');
    divRelatorio.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; background: #e2e8f0;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3498db; padding-bottom: 20px;">
                <h1 style="color: #1e293b; margin: 0;">TREE PRIME</h1><h3 style="color: #475569; margin: 5px 0 0 0;">Relatório Financeiro Gerencial</h3><p style="margin: 5px 0 0 0; font-weight: bold;">Competência: ${mesSelecionadoFinanceiro.split('-').reverse().join('/')}</p>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #cbd5e1; padding: 20px; border-radius: 8px; border: 1px solid #94a3b8;">
                <div style="text-align: center;"><span style="font-size: 0.9rem; color: #475569; font-weight: bold;">RECEITAS (PAGOS)</span><br><span style="font-size: 1.5rem; color: #16a085; font-weight: bold;">R$ ${totalEntradas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                <div style="text-align: center;"><span style="font-size: 0.9rem; color: #475569; font-weight: bold;">DESPESAS</span><br><span style="font-size: 1.5rem; color: #c0392b; font-weight: bold;">R$ ${totalSaidas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                <div style="text-align: center;"><span style="font-size: 0.9rem; color: #475569; font-weight: bold;">SALDO LÍQUIDO</span><br><span style="font-size: 1.5rem; color: ${corSaldo}; font-weight: bold;">R$ ${saldoLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
            </div>
            <h3 style="border-bottom: 1px solid #94a3b8; padding-bottom: 5px;">Detalhamento de Saídas</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.95rem;"><thead style="background: #cbd5e1; text-align: left;"><tr><th style="padding: 10px;">Data</th><th style="padding: 10px;">Descrição da Despesa</th><th style="padding: 10px; text-align: right;">Valor</th></tr></thead><tbody>${htmlDespesasPDF}</tbody></table>
            <div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #64748b;">Documento gerado automaticamente pelo Sistema Operacional Tree Prime.</div>
        </div>
    `;
    let opt = { margin: 10, filename: `TreePrime_Financeiro_${mesSelecionadoFinanceiro}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(divRelatorio).save();
}

function renderizarDashboard() {
    const dashboardArea = document.getElementById("dashboard-area");
    let totalClientes = clientesCadastrados.length;
    let emAndamento = clientesCadastrados.filter(c => c['status-processo'] !== 'CONCLUIDO' && c['status-processo'] !== 'CONCLUÍDO').length;
    let concluidos = clientesCadastrados.filter(c => c['status-processo'] === 'CONCLUIDO' || c['status-processo'] === 'CONCLUÍDO').length;
    let altaPrioridade = clientesCadastrados.filter(c => c.prioridade === 'PRIORIDADE-1' || c.prioridade === 'PRIORIDADE-2').length;

    let htmlDashboard = `
        <div class="dashboard-grid">
            <div class="dash-card" style="border-bottom-color: #3498db;"><i class="fas fa-users" style="font-size: 2rem; color: #3498db; margin-bottom: 10px;"></i><h3 style="color: #475569; font-size: 1rem; text-transform: uppercase;">Total na Base</h3><div class="number">${totalClientes}</div></div>
            <div class="dash-card" style="border-bottom-color: #f39c12;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #f39c12; margin-bottom: 10px;"></i><h3 style="color: #475569; font-size: 1rem; text-transform: uppercase;">Em Abertura</h3><div class="number">${emAndamento}</div></div>
            <div class="dash-card" style="border-bottom-color: #27ae60;"><i class="fas fa-check-circle" style="font-size: 2rem; color: #27ae60; margin-bottom: 10px;"></i><h3 style="color: #475569; font-size: 1rem; text-transform: uppercase;">Ativos (Concluídos)</h3><div class="number">${concluidos}</div></div>
            <div class="dash-card" style="border-bottom-color: #e74c3c;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #e74c3c; margin-bottom: 10px;"></i><h3 style="color: #475569; font-size: 1rem; text-transform: uppercase;">Alta Prioridade</h3><div class="number">${altaPrioridade}</div></div>
        </div>
    `;

    if (USUARIO_LOGADO === "admin_mestre") {
        let totalEntradas = 0;
        clientesCadastrados.forEach(c => {
            let statusPgto = c['status-pagamento'] || "DEVEDOR";
            let processoConcluido = c['status-processo'] === 'CONCLUIDO' || c['status-processo'] === 'CONCLUÍDO';
            if (processoConcluido && statusPgto === "PAGO" && c['mensal-valor']) {
                let valorLimpo = c['mensal-valor'].replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
                let valor = parseFloat(valorLimpo); if (!isNaN(valor)) { totalEntradas += valor; }
            }
        });

        let totalSaidas = 0; let htmlListaDespesas = ""; let qtdeDespesasMes = 0;
        despesasCadastradas.forEach((d, indexOriginal) => { 
            let mesDespesa = d.data ? d.data.substring(0, 7) : "";
            if (mesDespesa === mesSelecionadoFinanceiro) {
                totalSaidas += d.valor; qtdeDespesasMes++; let dataFormatada = d.data.split('-').reverse().join('/');
                htmlListaDespesas += `
                    <div style="display: flex; justify-content: space-between; padding: 12px; background: #cbd5e1; border: 1px solid #94a3b8; border-radius: 6px; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <div style="display: flex; flex-direction: column;"><span style="color: #1e293b; font-weight: bold; font-size: 0.95rem;">${d.descricao}</span><span style="color: #475569; font-size: 0.75rem;">Data: ${dataFormatada}</span></div>
                        <div style="display: flex; align-items: center; gap: 10px;"><span style="color: #c0392b; font-weight: bold; font-size: 0.95rem; margin-right: 5px;">R$ ${d.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            <button onclick="editarDespesa(${indexOriginal})" style="background: transparent; border: none; color: #3b82f6; cursor: pointer; transition: 0.2s;" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                            <button onclick="removerDespesa(${indexOriginal})" style="background: transparent; border: none; color: #64748b; cursor: pointer; transition: 0.2s;" title="Excluir" onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#64748b'"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
            }
        });
        if (qtdeDespesasMes === 0) { htmlListaDespesas = '<p style="color: #64748b; font-size: 0.9rem; text-align: center; margin-top: 10px;">Nenhuma despesa lançada para este mês.</p>'; }

        let saldoLiquido = totalEntradas - totalSaidas; let corSaldo = saldoLiquido >= 0 ? "#27ae60" : "#e74c3c"; 
        let textoBotaoSalvar = despesaEditandoIndex > -1 ? "Salvar Edição" : "Registrar Saída"; let corBotaoSalvar = despesaEditandoIndex > -1 ? "#f39c12" : "#e74c3c";

        htmlDashboard += `
            <div style="margin-top: 30px; background: #e2e8f0; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 5px solid #8e44ad;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
                    <h2 style="color: #1e293b; margin: 0;"><i class="fas fa-lock" style="color: #8e44ad;"></i> Painel Financeiro Restrito</h2>
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <button onclick="gerarRelatorioFinanceiroPDF()" style="background: #1e293b; color: white; border: none; padding: 10px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s;"><i class="fas fa-file-pdf"></i> Baixar Relatório PDF</button>
                        <div style="display: flex; align-items: center; gap: 10px; background: #cbd5e1; padding: 10px 15px; border-radius: 8px; border: 1px solid #94a3b8;"><label style="font-weight: bold; color: #475569; font-size: 0.9rem; text-transform: uppercase;">Mês de Referência:</label><input type="month" id="filtro-mes-financeiro" value="${mesSelecionadoFinanceiro}" onchange="atualizarMesFinanceiro(this.value)" style="padding: 8px; border: 2px solid #8e44ad; border-radius: 6px; font-weight: bold; color: #1e293b; background: #e2e8f0; outline: none; cursor: pointer;"></div>
                    </div>
                </div>
                <div style="display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px; background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;"><span style="color: #475569; font-weight: bold; font-size: 0.85rem;">RECEITAS (PAGOS NO MÊS)</span><br><span style="font-size: 1.8rem; color: #059669; font-weight: bold;">R$ ${totalEntradas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                    <div style="flex: 1; min-width: 200px; background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;"><span style="color: #475569; font-weight: bold; font-size: 0.85rem;">DESPESAS TOTAIS DO MÊS</span><br><span style="font-size: 1.8rem; color: #dc2626; font-weight: bold;">R$ ${totalSaidas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                    <div style="flex: 1; min-width: 200px; background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;"><span style="color: #475569; font-weight: bold; font-size: 0.85rem;">SALDO LÍQUIDO DO MÊS</span><br><span style="font-size: 1.8rem; color: ${corSaldo}; font-weight: bold;">R$ ${saldoLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                </div>
                <div style="display: flex; gap: 30px; flex-wrap: wrap; align-items: flex-start;">
                    <div style="flex: 1; min-width: 300px; max-width: 400px; margin: 0 auto;"><canvas id="graficoFinanceiro"></canvas></div>
                    <div style="flex: 1; min-width: 300px; border: 1px solid #94a3b8; padding: 20px; border-radius: 8px; background: #e2e8f0;">
                        <h3 style="color: #1e293b; margin-bottom: 15px; font-size: 1.1rem;"><i class="fas fa-file-invoice-dollar" style="color: #e74c3c;"></i> Lançar / Editar Despesa</h3>
                        <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                            <input type="text" id="nova-despesa-desc" placeholder="Descrição (Ex: Luz)" style="flex: 2; min-width: 120px; padding: 10px; border: 1px solid #94a3b8; background: #f8fafc; border-radius: 6px; font-size: 0.9rem;">
                            <input type="text" id="nova-despesa-valor" placeholder="R$ 0,00" oninput="aplicarMascaraMoeda(this)" style="flex: 1; min-width: 80px; padding: 10px; border: 1px solid #94a3b8; background: #f8fafc; border-radius: 6px; font-size: 0.9rem;">
                            <input type="date" id="nova-despesa-data" value="${getDataAtualStr()}" style="flex: 1; min-width: 120px; padding: 10px; border: 1px solid #94a3b8; background: #f8fafc; border-radius: 6px; font-size: 0.9rem;">
                            <button id="btn-salvar-despesa" onclick="salvarDespesaBtn()" style="background: ${corBotaoSalvar}; color: white; border: none; padding: 10px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s; min-width: 100%;">${textoBotaoSalvar}</button>
                        </div>
                        <h4 style="color: #475569; margin-bottom: 10px; font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Saídas do Mês de Referência</h4>
                        <div id="lista-despesas" style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px;">${htmlListaDespesas}</div>
                    </div>
                </div>
            </div>`;
        dashboardArea.innerHTML = htmlDashboard;

        setTimeout(() => {
            Object.keys(Chart.instances).forEach(key => { if (Chart.instances[key].canvas.id === 'graficoFinanceiro') { Chart.instances[key].destroy(); } });
            const canvasCtx = document.getElementById('graficoFinanceiro');
            if (canvasCtx) {
                new Chart(canvasCtx.getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: ['Entradas (Mensalidades)', 'Saídas (Despesas)'], datasets: [{ data: [totalEntradas, totalSaidas], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }] },
                    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#1e293b' } } } }
                });
            }
        }, 150);

    } else {
        htmlDashboard += `<div style="background: #e2e8f0; padding: 40px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: center; margin-top: 20px;"><h2 style="color: #1e293b; margin-bottom: 15px;">Bem-vindo ao Sistema Operacional</h2><p style="color: #475569; font-size: 1.1rem; line-height: 1.6;">Utilize o menu lateral para navegar entre os cadastros, verificar a lista de clientes ativos e gerenciar suas rotinas diárias.</p></div>`;
        dashboardArea.innerHTML = htmlDashboard;
    }
}

// ==========================================
// SISTEMA DE ROTINAS CONTÁBEIS (AS 4 ABAS)
// ==========================================
const dadosRotinas = {
    'mensal': { titulo: "Mensal Contábil", cor: "#3b82f6", icone: "fas fa-calculator", tarefas: ["Importação de Notas Fiscais (XML)", "Conciliação Bancária e Extratos", "Fechamento do Balancete Mensal", "Emissão de DRE e Relatórios", "Cálculo de Impostos (Lucro Presumido/Real)"] },
    'fiscal': { titulo: "Checklist Fiscal", cor: "#f97316", icone: "fas fa-file-invoice-dollar", tarefas: ["Auditoria de NF-e e NFC-e", "Apuração do Simples Nacional (PGDAS)", "Apuração de ICMS e ICMS-ST", "Apuração de PIS e COFINS", "Envio de Guias de Pagamento ao Cliente"] },
    'pessoal': { titulo: "Departamento Pessoal", cor: "#8b5cf6", icone: "fas fa-users-cog", tarefas: ["Fechamento da Folha de Pagamento", "Cálculo de Férias e Rescisões", "Apuração de INSS e FGTS", "Transmissão do eSocial", "Envio de Holerites e Recibos"] },
    'obrigacoes': { titulo: "Obrigações Acessórias", cor: "#ef4444", icone: "fas fa-file-signature", tarefas: ["Entrega da DCTF Mensal", "Transmissão do SPED Fiscal (ICMS/IPI)", "Transmissão do SPED Contribuições", "EFD-Reinf e DCTFWeb", "Consulta Mensal de Pendências (e-CAC)"] }
};

function renderizarRotinas(container, categoria) {
    const setor = dadosRotinas[categoria]; if (!checklistRotinas[categoria]) checklistRotinas[categoria] = []; 
    const total = setor.tarefas.length; const concluidas = checklistRotinas[categoria].length; const porcentagem = Math.round((concluidas / total) * 100);

    let htmlRotina = `
        <div style="background: #e2e8f0; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 800px; margin: 0 auto;">
            <div style="display: flex; align-items: center; gap: 15px; border-bottom: 3px solid ${setor.cor}; padding-bottom: 15px; margin-bottom: 25px;"><i class="${setor.icone}" style="font-size: 2.5rem; color: ${setor.cor};"></i><h2 style="color: #1e293b; font-size: 1.8rem;">${setor.titulo}</h2></div>
            <div style="margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #475569; font-weight: bold; font-size: 0.9rem;"><span>Progresso do Setor</span><span>${porcentagem}%</span></div>
                <div style="width: 100%; background: #cbd5e1; border-radius: 10px; height: 12px; overflow: hidden;"><div style="width: ${porcentagem}%; background: ${setor.cor}; height: 100%; transition: width 0.4s ease-in-out;"></div></div>
            </div>
            <p style="color: #475569; margin-bottom: 20px; font-style: italic;">Marque as tarefas concluídas da rotina operacional padrão do escritório:</p><div style="display: flex; flex-direction: column; gap: 12px;">
    `;
    setor.tarefas.forEach((tarefa, index) => {
        const isChecked = checklistRotinas[categoria].includes(index); const estiloTexto = isChecked ? "text-decoration: line-through; color: #64748b;" : "color: #1e293b; font-weight: bold;";
        const iconeCheck = isChecked ? `<i class="fas fa-check-square" style="color: ${setor.cor}; font-size: 1.5rem;"></i>` : `<i class="far fa-square" style="color: #94a3b8; font-size: 1.5rem;"></i>`;
        htmlRotina += `<div onclick="toggleRotina('${categoria}', ${index})" style="display: flex; align-items: center; gap: 15px; background: #cbd5e1; padding: 15px 20px; border-radius: 8px; cursor: pointer; transition: 0.2s; border: 1px solid #94a3b8;">${iconeCheck}<span style="${estiloTexto} font-size: 1.1rem; transition: 0.2s;">${tarefa}</span></div>`;
    });
    htmlRotina += `</div><div style="margin-top: 30px; text-align: right;"><button onclick="limparRotina('${categoria}')" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">🔄 Zerar Mês</button></div></div>`;
    container.innerHTML = htmlRotina;
}

function toggleRotina(categoria, index) {
    if (!checklistRotinas[categoria]) checklistRotinas[categoria] = [];
    const pos = checklistRotinas[categoria].indexOf(index);
    if (pos === -1) { checklistRotinas[categoria].push(index); } else { checklistRotinas[categoria].splice(pos, 1); }
    localStorage.setItem('checklistRotinasTreePrime', JSON.stringify(checklistRotinas)); renderizarRotinas(document.getElementById("lista-tarefas"), categoria); 
}

function limparRotina(categoria) {
    if (confirm("Deseja zerar todas as tarefas deste setor para começar um novo mês?")) {
        checklistRotinas[categoria] = []; localStorage.setItem('checklistRotinasTreePrime', JSON.stringify(checklistRotinas)); renderizarRotinas(document.getElementById("lista-tarefas"), categoria);
    }
}

// UTILITÁRIOS
async function buscarCEP(cep) { const r = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`); const d = await r.json(); if (d.erro) return; document.getElementById('reg-endereco').value = d.logradouro; document.getElementById('reg-bairro').value = d.bairro; document.getElementById('reg-mun').value = d.localidade; document.getElementById('reg-uf').value = d.uf; }
function aplicarMascaraMoeda(i) { i.value = "R$ " + (i.value.replace(/\D/g, "")/100).toFixed(2).replace(".", ","); }
function mascaraCpfCnpj(v) { return v.replace(/\D/g, "").length <= 11 ? v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"); }
function mostrarToast(m, t='sucesso') { const c=document.getElementById('toast-container'); if(!c) return; const e=document.createElement('div'); e.className=`toast ${t}`; e.innerText=m; c.appendChild(e); setTimeout(()=>{e.style.opacity='0'; setTimeout(()=>e.remove(),500)},3000); }
function gerarPDF() { const el = document.getElementById('area-pdf'); html2pdf().from(el).set({ margin: 10, filename: `TreePrime_${document.getElementById('reg-nome').value}.pdf` }).save(); }
function exportarDados() { const d = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clientesCadastrados)); const a = document.createElement('a'); a.href = d; a.download = "backup.json"; a.click(); }
function triggerImport() { document.getElementById('file-import').click(); }
function importarDados(e) { const r = new FileReader(); r.onload = (ev) => { clientesCadastrados = JSON.parse(ev.target.result); localStorage.setItem('clientesTreePrime', JSON.stringify(clientesCadastrados)); autorizarEntrada(); }; r.readAsText(e.target.files[0]); }
function excluirCliente() { if (confirm("Excluir cliente?")) { clientesCadastrados = clientesCadastrados.filter(x => x.nome !== document.getElementById('reg-nome').value); localStorage.setItem('clientesTreePrime', JSON.stringify(clientesCadastrados)); document.getElementById("area-pdf").style.display = "none"; document.getElementById("acoes-sistema").style.display = "none"; carregarLista(categoriaAtual); } }

function editarClienteFinanceiro(nome) { carregarLista('abertura'); setTimeout(() => { carregarCliente(nome); }, 100); }

// ========================================================
// NOVO VISUAL - CLIENTES ATIVOS (TEMA CINZA SÓBRIO)
// ========================================================
function renderizarPainelAtivosImagem(container) {
    container.innerHTML = `
    <div class="tpf-container">
        <div class="tpf-header">
            <img src="Logo Tree Prime.jpg" onerror="this.src='https://via.placeholder.com/50'">
            <div><h2>TreePrime Finance</h2><p>Controle completo de pagamentos e clientes</p></div>
        </div>
        <div class="tpf-cards">
            <div class="tpf-card tpf-card-green"><i class="fas fa-arrow-trend-up top-icon"></i><i class="fas fa-dollar-sign top-right"></i><p>Recebido no Mês</p><h3 id="card-recebido-val">R$ 0,00</h3></div>
            <div class="tpf-card tpf-card-red"><i class="fas fa-arrow-trend-down top-icon"></i><i class="far fa-times-circle top-right"></i><p>Débitos no Mês</p><h3 id="card-debitos-val">R$ 0,00</h3></div>
            <div class="tpf-card tpf-card-blue"><i class="fas fa-users top-icon"></i><p>Total de Clientes</p><h3 id="card-total-val">0</h3></div>
            <div class="tpf-card tpf-card-orange"><i class="far fa-file-alt top-icon"></i><p>Devedores no Mês</p><h3 id="card-devedores-val">0</h3></div>
        </div>
        <div class="tpf-toolbar">
            <div style="display:flex; gap:10px; align-items:center; border: 1px solid #94a3b8; padding:5px 15px; border-radius:8px; background: #cbd5e1;"><i class="far fa-calendar-alt" style="color: #475569;"></i><select class="tpf-select"><option>2026</option></select><select class="tpf-select"><option>Março</option></select></div>
            <button class="tpf-btn tpf-btn-dark"><i class="fas fa-cog"></i></button>
            <button class="tpf-btn tpf-btn-yellow" onclick="exportarDados()"><i class="fas fa-download"></i> Exportar</button>
            <button class="tpf-btn tpf-btn-purple" onclick="triggerImport()"><i class="fas fa-upload"></i> Importar</button>
            <button class="tpf-btn tpf-btn-red"><i class="fas fa-trash"></i> Excluir Tudo</button>
            <button class="tpf-btn tpf-btn-purple"><i class="fas fa-download"></i> Relatório Mês</button>
            <button class="tpf-btn tpf-btn-purple"><i class="far fa-file-alt"></i> Relatório Geral</button>
            <button class="tpf-btn tpf-btn-blue" onclick="carregarLista('abertura'); novoCliente();"><i class="fas fa-plus"></i> Novo Cliente</button>
        </div>
        <div class="tpf-toolbar" style="background:transparent; padding:0; margin-bottom:15px; border:none; box-shadow:none;">
            <div style="flex:1; position:relative;"><i class="fas fa-search" style="position:absolute; left:15px; top:12px; color:#64748b;"></i><input type="text" id="filtro-busca-ativos" value="${filtroBuscaAtual}" class="tpf-input" placeholder="Buscar cliente pelo nome..." style="width:100%; padding-left:45px; background: #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.02);" oninput="aplicarFiltrosTabelaAtivos()"></div>
            <select id="filtro-status-ativos" class="tpf-input" style="background: #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.02);" onchange="aplicarFiltrosTabelaAtivos()"><option value="TODOS" ${filtroStatusAtual === "TODOS" ? "selected" : ""}>Todos os Status</option><option value="PAGO" ${filtroStatusAtual === "PAGO" ? "selected" : ""}>Pagos</option><option value="DEVEDOR" ${filtroStatusAtual === "DEVEDOR" ? "selected" : ""}>Devedores</option></select>
            <select class="tpf-input" style="background: #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.02);"><option>Todos os Boletos</option></select><input type="text" class="tpf-input" placeholder="Filtrar por valor (R$)" style="background: #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
            <label style="font-size:0.85rem; color: #334155; font-weight: 500;"><input type="checkbox" id="filtro-ordem-alfabetica" checked style="margin-right: 5px;" onchange="aplicarFiltrosTabelaAtivos()"> Ordem Alfabética</label>
            <span id="contador-tabela" style="font-size:0.85rem; color:#475569; margin-left:auto; font-weight: 500;">Calculando...</span>
        </div>
        <div class="tpf-table-container">
            <table class="tpf-table">
                <thead><tr><th>CLIENTE</th><th>CNPJ</th><th>MENSALIDADE</th><th>VENCIMENTO</th><th>ENTRADA</th><th>STATUS</th><th>BOLETO</th><th>COMENTÁRIOS</th><th>CERTIFICADO</th><th>AÇÕES</th></tr></thead>
                <tbody id="tbody-ativos"></tbody>
            </table>
        </div>
        <div style="margin-top: 30px; background-color: #e2e8f0; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid #cbd5e1;">
            <h3 style="color: #1e293b; margin-bottom: 25px; border-bottom: 1px solid #cbd5e1; padding-bottom: 15px; font-size: 1.2rem; font-weight: 700;"><i class="fas fa-chart-bar" style="color: #10b981; margin-right: 10px;"></i>Resumo e Análise do Painel (Filtro Atual)</h3>
            <div style="display: flex; gap: 30px; flex-wrap: wrap; justify-content: space-around; align-items: center;">
                <div style="flex: 1; min-width: 300px; max-width: 450px; text-align: center;"><h4 style="color: #334155; margin-bottom: 20px; font-size: 1.1rem; font-weight: 600;">Status dos Clientes</h4><canvas id="graficoStatusClientes"></canvas></div>
                <div style="flex: 1; min-width: 300px; max-width: 450px; text-align: center;"><h4 style="color: #334155; margin-bottom: 20px; font-size: 1.1rem; font-weight: 600;">Fluxo de Caixa</h4><canvas id="graficoFluxoCaixa"></canvas></div>
            </div>
        </div>
    </div>
    `;
    setTimeout(() => { aplicarFiltrosTabelaAtivos(); }, 100);
}

function aplicarFiltrosTabelaAtivos() {
    const inputBusca = document.getElementById('filtro-busca-ativos'); 
    const inputStatus = document.getElementById('filtro-status-ativos');
    const tbody = document.getElementById('tbody-ativos'); 
    const contador = document.getElementById('contador-tabela');
    if (!tbody) return;

    filtroBuscaAtual = inputBusca ? inputBusca.value.toLowerCase() : ""; 
    filtroStatusAtual = inputStatus ? inputStatus.value : "TODOS";
    
    let isOrdemAlfa = document.getElementById('filtro-ordem-alfabetica') ? document.getElementById('filtro-ordem-alfabetica').checked : true;

    let ativos = clientesCadastrados.filter(c => c['status-processo'] === 'CONCLUIDO' || c['status-processo'] === 'CONCLUÍDO');
    
    if (isOrdemAlfa) {
        ativos.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    }

    let linhasTabela = ""; let qtdeMostrada = 0; let recebido = 0; let debitos = 0; let qtdDevedores = 0; let clientesEmDia = 0; 
    
    let dataAtual = new Date();
    let diaHoje = dataAtual.getDate(); 
    let mesHoje = dataAtual.getMonth() + 1;
    let anoHoje = dataAtual.getFullYear();
    let mesAnoHojeNum = anoHoje * 100 + mesHoje; 

    ativos.forEach(c => {
        let status = c['status-pagamento'] || "DEVEDOR"; 
        if (filtroStatusAtual !== "TODOS" && status !== filtroStatusAtual) return;
        if (filtroBuscaAtual && !c.nome.toLowerCase().includes(filtroBuscaAtual)) return;
        qtdeMostrada++;

        let val = 0; if (c['mensal-valor']) { val = parseFloat(c['mensal-valor'].replace("R$", "").replace(/\./g, "").replace(",", ".").trim()); if (isNaN(val)) val = 0; }
        if (status === "PAGO") { recebido += val; clientesEmDia++; } else { debitos += val; qtdDevedores++; }

        let badgeClass = status === "PAGO" ? "tpf-badge-pago" : "tpf-badge-devedor"; let strVal = c['mensal-valor'] || "R$ 0,00"; let cnaeCpf = c['cpf'] || c['cnae'] || "-";
        
        let dataSplit = c['mensal-data'] ? c['mensal-data'].split('-') : ["2023", "09", "25"]; 
        let anoEntrada = parseInt(dataSplit[0]);
        let mesEntrada = parseInt(dataSplit[1]);
        let diaVencimentoNum = parseInt(dataSplit[2]) || 25;
        let mesAnoEntradaNum = anoEntrada * 100 + mesEntrada;

        let meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]; 
        let entrada = `${meses[mesEntrada - 1] || "Set"}/${anoEntrada}`;

        let textoVencimento = `Dia ${diaVencimentoNum}`;
        let corDeFundoLinha = "border-left: 3px solid transparent;";

        if (mesAnoEntradaNum > mesAnoHojeNum) {
            textoVencimento = `<span style="color:#8b5cf6; font-weight:700; font-size:0.85rem;"><i class="fas fa-calendar-plus"></i> Inicia em ${entrada}</span>`;
        } else {
            if (status === "DEVEDOR" && diaVencimentoNum < diaHoje) {
                corDeFundoLinha = "background-color: #fee2e2; border-left: 3px solid #ef4444;";
                textoVencimento = `<span style="color:#ef4444; font-weight:700;">⚠️ Atrasado (Dia ${diaVencimentoNum})</span>`;
            }
        }

        linhasTabela += `
            <tr style="${corDeFundoLinha} transition: background-color 0.2s;">
                <td style="font-weight: 700; color: #1e293b;">${c.nome.toUpperCase()}</td><td>${cnaeCpf}</td><td style="font-weight: 500; color: #334155;">${strVal}</td><td>${textoVencimento}</td><td>${entrada}</td>
                <td><button onclick="alternarStatusPagamento('${c.nome}')" class="tpf-badge ${badgeClass}" style="cursor: pointer; font-family: inherit;">${status}</button></td>
                <td class="tpf-actions"><i class="far fa-file"></i> <i class="fas fa-download"></i> <i class="far fa-clock"></i></td><td style="font-style: italic;">${c.obs ? c.obs.substring(0, 15) + '...' : '-'}</td><td>${c['pagou-cert'] || 'Não informado'}</td>
                <td class="tpf-actions"><i class="fas fa-edit" onclick="editarClienteFinanceiro('${c.nome}')" title="Editar Cliente" style="color:#0ea5e9;"></i><i class="fas fa-undo" onclick="voltarParaAbertura('${c.nome}')" title="Retornar para Cadastro de Abertura" style="margin-left:5px; color:#f59e0b;"></i></td>
            </tr>`;
    });

    tbody.innerHTML = linhasTabela || `<tr><td colspan="10" style="text-align:center; padding: 25px; color: #475569; font-weight: 500;">Nenhum cliente encontrado na sua pesquisa.</td></tr>`;
    if (contador) contador.innerText = `Mostrando ${qtdeMostrada} clientes filtrados`;

    const cardRec = document.getElementById("card-recebido-val"); if (cardRec) cardRec.innerText = `R$ ${recebido.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    const cardDeb = document.getElementById("card-debitos-val"); if (cardDeb) cardDeb.innerText = `R$ ${debitos.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    const cardTot = document.getElementById("card-total-val"); if (cardTot) cardTot.innerText = qtdeMostrada;
    const cardDev = document.getElementById("card-devedores-val"); if (cardDev) cardDev.innerText = qtdDevedores;

    atualizarGraficosAtivos(clientesEmDia, qtdDevedores, recebido, debitos);
}

function atualizarGraficosAtivos(clientesEmDia, qtdDevedores, recebido, debitos) {
    Object.keys(Chart.instances).forEach(key => {
        let canvasId = Chart.instances[key].canvas.id;
        if (canvasId === 'graficoStatusClientes' || canvasId === 'graficoFluxoCaixa') { Chart.instances[key].destroy(); }
    });

    const canvasStatus = document.getElementById('graficoStatusClientes');
    if (canvasStatus) { new Chart(canvasStatus.getContext('2d'), { type: 'doughnut', data: { labels: ['Em Dia (Pagos)', 'Devedores'], datasets: [{ data: [clientesEmDia, qtdDevedores], backgroundColor: ['#3b82f6', '#f97316'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, plugins: { legend: { position: 'right', labels: { color: '#1e293b', font: { size: 13, weight: '500' } } } }, animation: { duration: 500 } } }); }

    const canvasFluxo = document.getElementById('graficoFluxoCaixa');
    if (canvasFluxo) { new Chart(canvasFluxo.getContext('2d'), { type: 'doughnut', data: { labels: ['Recebido', 'Débitos'], datasets: [{ data: [recebido, debitos], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, plugins: { legend: { position: 'right', labels: { color: '#1e293b', font: { size: 13, weight: '500' } } } }, animation: { duration: 500 } } }); }
}

function voltarParaAbertura(nomeCliente) {
    if (confirm(`Tem certeza que deseja rebaixar o cliente ${nomeCliente} para a Abertura e retirá-lo dos Ativos?`)) {
        let index = clientesCadastrados.findIndex(c => c.nome === nomeCliente);
        if (index !== -1) {
            clientesCadastrados[index]['status-processo'] = 'INICIAR';
            localStorage.setItem('clientesTreePrime', JSON.stringify(clientesCadastrados));
            mostrarToast(`Cliente retornado para abertura!`, "sucesso"); carregarLista('ativos'); 
        }
    }
}

function alternarStatusPagamento(nomeCliente) {
    let index = clientesCadastrados.findIndex(c => c.nome === nomeCliente);
    if (index !== -1) {
        let statusAtual = clientesCadastrados[index]['status-pagamento'] || "DEVEDOR";
        clientesCadastrados[index]['status-pagamento'] = statusAtual === "PAGO" ? "DEVEDOR" : "PAGO";
        localStorage.setItem('clientesTreePrime', JSON.stringify(clientesCadastrados)); carregarLista('ativos'); 
    }
}

function concluirProcesso() { 
    const isAlt = document.getElementById('reg-nome').dataset.isAlteracao === 'true';
    if (isAlt) { document.getElementById('reg-status-processo').value = 'CONCLUIDO'; } 
    else { document.getElementById('reg-status-processo').value = 'CONCLUIDO'; }
    
    const btnSalvar = document.getElementById('btn-salvar');
    if (btnSalvar.style.display !== 'none') { salvarChecklist(); } else { atualizarCliente(); }
    carregarLista(isAlt ? 'abertura' : 'ativos'); 
}

function reabrirProcesso() { 
    document.getElementById('reg-status-processo').value = 'INICIAR'; 
    const btnSalvar = document.getElementById('btn-salvar');
    if (btnSalvar.style.display !== 'none') { salvarChecklist(); } else { atualizarCliente(); }
    carregarLista('abertura'); 
}