//Variaveis globais:
let nomeUser;
let alvoMsg= "Todos";
let tipoTraduzido= "Público";
let tipoMsg="message";
let msgs=[];
let nomeContatos=[];
let ultimaMsg=""

//Mapeia o uso do Enter na janela inicial
document.querySelector(".janela-inicial").addEventListener("keydown",function(e){
    if (e.key==="Enter"){
        inicio();
    }
});

//Mapeia o uso do Enter na janela principal
document.querySelector(".janela-principal").addEventListener("keydown",function(e){
    if (e.key==="Enter"){
        enviaMsg();
    }
});

//Responsavel pelas ações da tela de inicio do aplicativo
function inicio(){
    nomeUser=document.querySelector(".nome-user").value;
    document.querySelector(".login").classList.add("escondido");
    document.querySelector(".carregando").classList.remove("escondido");
    cadastraNome();
}

//Cadastra usuário na API
function cadastraNome(){
    const promise = axios.post("https://mock-api.driven.com.br/api/v6/uol/participants", {name: nomeUser});
    promise.then(iniciaChat);
    promise.catch(tratarErroNome);
}

//Renova o status online na API
function renovaStatus(){
    axios.post("https://mock-api.driven.com.br/api/v6/uol/status", {name: nomeUser});
}

//Inicia as ações periodicas para o funcionamento do aplicativo 
function iniciaChat(){
    carregaContatos();
    setInterval(renovaStatus,5000);
    setInterval(carregaChat,3000);
    setInterval(carregaContatos,10000);
}

//Pede os contatos disponiveis para a API
function carregaContatos(){
    const promise=axios.get("https://mock-api.driven.com.br/api/v6/uol/participants");
    promise.then(carregaNomes);
}

//Carrega os nomes que a API retornou
function carregaNomes(response){
    nomeContatos= response.data;
    renderizarNomes();
}

//Mostra os nomes que foram carregados
function renderizarNomes(){
    const divContatos=document.querySelector(".lista-contatos");
    let opcao="";
    if(alvoMsg==="Todos"){
        opcao="marcado";
    }
    divContatos.innerHTML=`
    <div class="opcoes ${opcao}" onclick="escolheAlvoMsg(this)">
        <div>
            <ion-icon name="people"></ion-icon><span>Todos</span>
        </div>
        <ion-icon name="checkmark-sharp" class="check"></ion-icon>
    </div>`;
    
    for(i=0; nomeContatos.length>i; i++){
        if(nomeContatos[i].name!==nomeUser){
            opcao="";
            if(nomeContatos[i].name===alvoMsg){
                opcao="marcado";
            }
            divContatos.innerHTML+=`
            <div class="opcoes ${opcao}" onclick="escolheAlvoMsg(this)">
                <div>
                    <ion-icon name="person-circle"></ion-icon><span>${nomeContatos[i].name}</span>
                </div>
                <ion-icon name="checkmark-sharp" class="check"></ion-icon>
            </div>`;
        }
    } 
}

//Atualiza o tipo de mensagem que sera enviado para API
function atualizaTipoMsg(){
    if(tipoTraduzido==="Público"){
        tipoMsg="message";
    }
    else if(tipoTraduzido==="Reservadamente"){
        tipoMsg="private_message";
    }
}

//Responsavel por definir para quem a mensagem vai ser enviada
function escolheAlvoMsg(elemento){
    if(document.querySelector(".lista-contatos .marcado")!== null){
        document.querySelector(".lista-contatos .marcado").classList.remove("marcado");
    }
    elemento.classList.add("marcado");
    alvoMsg=elemento.querySelector("span").innerHTML;
    document.querySelector(".barra-inferior h2").innerHTML=`Enviando para ${alvoMsg} (${tipoTraduzido})`;
}

//Responsavel por definir o tipo de mensagem a ser enviada
function escolheVisibilidade(elemento){
    if(document.querySelector(".visibilidade .marcado")!== null){
        document.querySelector(".visibilidade .marcado").classList.remove("marcado");
    }
    elemento.classList.add("marcado");
    tipoTraduzido=elemento.querySelector("span").innerHTML;
    document.querySelector(".barra-inferior h2").innerHTML=`Enviando para ${alvoMsg} (${tipoTraduzido})`;
    atualizaTipoMsg();
}

//Pede as mensagens para a API
function carregaChat(){
    const promise=axios.get("https://mock-api.driven.com.br/api/v6/uol/messages");
    promise.then(carregaMsgs);
}

//Carrega as mensagens que a API retornou
function carregaMsgs(response){
    document.querySelector(".janela-inicial").classList.add("escondido");
    document.querySelector(".janela-principal").classList.remove("escondido");
    msgs= response.data;
    renderizarMsgs();
}

//Converte a hora da API
function converteHora(hora){
    let horaAtual=Number(hora.slice(0,2))-3;
    if (horaAtual<0){
        horaAtual+=12;
    }
    if(String(horaAtual).length<2){
        horaAtual="0"+horaAtual;
    }
    return horaAtual+hora.slice(2,hora.length);
}

//Mostra as mensagens que foram carregadas
function renderizarMsgs(){
    const divChat=document.querySelector(".conteiner-chat");
    divChat.innerHTML="";

    for(i=0; msgs.length>i; i++){
        if (msgs[i].type==="status"){
            divChat.innerHTML+=`
            <div class="mensagem alerta">
                <span>(${converteHora(msgs[i].time)})</span> <strong>${msgs[i].from}</strong> ${msgs[i].text}
            </div>`;
        }
        if (msgs[i].type==="message"){
            divChat.innerHTML+=`
            <div class="mensagem">
                <span>(${converteHora(msgs[i].time)})</span> <strong>${msgs[i].from}</strong> para <strong>${msgs[i].to}</strong>: ${msgs[i].text}
            </div>`;
        }
        if (msgParaMim()){
            divChat.innerHTML+=`
            <div class="mensagem reservada">
                <span>(${converteHora(msgs[i].time)})</span> <strong>${msgs[i].from}</strong> reservadamente para <strong>${msgs[i].to}</strong>: ${msgs[i].text}
            </div>`;
        }

        if(ultimaMsg!==document.querySelector(".conteiner-chat").lastElementChild){
            ultimaMsg=document.querySelector(".conteiner-chat").lastElementChild;
            ultimaMsg.scrollIntoView();
        }
    }
}

//Verifica se o usuário deve ou não ter acesso a uma mensagem privada
function msgParaMim(){
    if (msgs[i].type==="private_message" && (msgs[i].from===nomeUser|| msgs[i].to===nomeUser || msgs[i].to==="Todos")){
        return true;
    }
    return false;
}

//Responsavel pelas ações caso o nome de usuário escolhido esteja indisponivel
function tratarErroNome(){
    document.querySelector(".carregando").classList.add("escondido");
    document.querySelector(".login").classList.remove("escondido");
    const caixaNomeUser=document.querySelector(".nome-user");
    caixaNomeUser.classList.add("existente");
    caixaNomeUser.setAttribute("placeholder", "Nome de usuário indisponível");
    caixaNomeUser.value="";
}

//Faz a janela de usuário se mostrar
function janelaUsers(){
    document.querySelector(".janela-users").classList.toggle("mostrar");
}

//Envia mensagens para a API
function enviaMsg(){
    const textoMsg= document.querySelector(".caixa-msg").value;
    const promise=axios.post("https://mock-api.driven.com.br/api/v6/uol/messages",{
        from: nomeUser,
        to: alvoMsg,
        text: textoMsg,
        type: tipoMsg
    });
    document.querySelector(".caixa-msg").value="";
    promise.then(carregaChat);
    promise.catch(window.location.reload);
}
