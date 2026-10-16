/* Grün gegen Rot – PWA-Prototyp.
   PeerJS/WebRTC verbindet Geräte direkt; PeerJS vermittelt die Verbindungsdaten.
   Der Prototyp ist nicht gegen Cheating abgesichert und speichert keine Cloud-Partien. */
const $ = id => document.getElementById(id);
const sections = ["home","lobby","game"];
function show(which){sections.forEach(s=>$(s).classList.toggle("hidden",s!==which))}
let peer=null, conn=null, myPeerId="", roomId="", name="Spieler", role=null, otherRole=null;
let ready=false, otherReady=false, phase="lobby", tool="green", board=Array(25).fill("white"), revealed=Array(25).fill(false);
let timerHandle=null, seconds=60, giverPeerId=null, searcherPeerId=null, host=false;
const send = msg => { if(conn && conn.open) conn.send(msg); };
const setStatus = t => $("lobbyStatus").textContent=t;
const mkCode = () => Math.random().toString(36).slice(2,8).toUpperCase();

function initPeer(id){
  return new Promise((resolve,reject)=>{
    peer=new Peer(id || undefined);
    peer.on("open",pid=>{myPeerId=pid;resolve(pid)});
    peer.on("error",e=>reject(e));
    peer.on("connection", c=>{
      if(conn && conn.open){c.close();return;}
      conn=c; bindConnection();
    });
  });
}
function bindConnection(){
  conn.on("open",()=>{
    $("lobbyStatus").textContent="Mitspieler verbunden.";
    send({type:"hello",name,role});
    if(host) send({type:"lobby",roomId,role,ready});
  });
  conn.on("data",onMessage);
  conn.on("close",()=>{setStatus("Verbindung verloren. Lobby-Link erneut öffnen, um neu zu verbinden.");});
}
function onMessage(m){
  if(!m || !m.type)return;
  if(m.type==="hello"){ $("lobbyStatus").textContent=`Verbunden mit ${m.name||"Mitspieler"}.`; otherRole=m.role||null; }
  if(m.type==="lobby"){
    roomId=m.roomId||roomId; otherRole=m.role||otherRole; otherReady=!!m.ready; updateRoleText();
  }
  if(m.type==="role"){
    otherRole=m.role; updateRoleText(); send({type:"lobby",roomId,role,ready});
  }
  if(m.type==="ready"){otherReady=!!m.ready;updateStart();}
  if(m.type==="start"){
    phase=m.phase; board=m.board; revealed=m.revealed||Array(25).fill(false); seconds=m.seconds||60;
    renderGame(); if(phase==="setup") startClock();
  }
  if(m.type==="board"){
    board=m.board;revealed=m.revealed||revealed;renderBoard();
    updateCounts();
  }
  if(m.type==="phase"){
    phase=m.phase;board=m.board;revealed=m.revealed||Array(25).fill(false);
    if(phase==="search")clearInterval(timerHandle);
    renderGame();
  }
  if(m.type==="reveal"){
    board=m.board;revealed=m.revealed;renderBoard();
  }
  if(m.type==="randomized"){
    board=m.board;phase="search";revealed=Array(25).fill(false);clearInterval(timerHandle);renderGame();
  }
}
function updateRoleText(){
  $("roleStatus").textContent=`Deine Rolle: ${role==="giver"?"Spielgeber":role==="seeker"?"Sucher":"noch nicht gewählt"} · Mitspieler: ${otherRole==="giver"?"Spielgeber":otherRole==="seeker"?"Sucher":"noch nicht gewählt"}`;
  updateStart();
}
function updateStart(){
  $("startBtn").disabled=!(conn&&conn.open&&ready&&otherReady&&role&&otherRole&&role!==otherRole);
}
function shareUrl(){
  const u=new URL(location.href);u.searchParams.set("join",myPeerId);return u.toString();
}
$("createBtn").onclick=async()=>{
  name=$("playerName").value.trim()||"Spieler";host=true;
  try{await initPeer();roomId=myPeerId;show("lobby");$("roomCode").textContent=roomId;$("lobbyStatus").textContent="Lobby erstellt. Teile den Einladungslink oder diese Peer-ID."; }
  catch(e){alert("Peer-Verbindung konnte nicht gestartet werden: "+e.message)}
};
async function joinPeer(id){
  name=$("playerName").value.trim()||"Spieler";host=false;roomId=id;
  try{
    await initPeer();
    conn=peer.connect(id,{reliable:true});
    bindConnection();
    show("lobby");$("roomCode").textContent=id;
    $("lobbyStatus").textContent="Verbinde mit Lobby …";
  }catch(e){alert("Beitreten fehlgeschlagen: "+e.message)}
}
$("joinBtn").onclick=()=>{const id=$("joinCode").value.trim();if(id)joinPeer(id);else alert("Bitte Link-ID oder Code eingeben.")};
$("copyLinkBtn").onclick=async()=>{try{await navigator.clipboard.writeText(shareUrl());setStatus("Einladungslink kopiert.");}catch{prompt("Link kopieren:",shareUrl())}};
$("shareBtn").onclick=()=>{const text="Komm zum Wunsch-Duell: "+shareUrl();if(navigator.share)navigator.share({title:"Grün gegen Rot",text});else prompt("Einladung kopieren:",text)};
$("giverBtn").onclick=()=>chooseRole("giver");$("seekerBtn").onclick=()=>chooseRole("seeker");
function chooseRole(r){
  role=r;
  if(conn&&conn.open)send({type:"role",role});
  updateRoleText();
}
$("readyBtn").onclick=()=>{ready=true;send({type:"ready",ready:true});updateStart();$("lobbyStatus").textContent="Du bist bereit. Warte auf den Mitspieler."};
$("startBtn").onclick=()=>{
  if(role==="giver")beginSetup();else alert("Der Spielgeber muss die Platzierungsphase starten.");
};
$("leaveBtn").onclick=()=>{if(conn)conn.close();if(peer)peer.destroy();conn=null;peer=null;show("home")};
$("greenTool").onclick=()=>{tool="green";toolUi()};
$("redTool").onclick=()=>{tool="red";toolUi()};
$("eraseTool").onclick=()=>{tool="erase";toolUi()};
$("finishSetup").onclick=()=>{if(role!=="giver"){alert("Nur der Spielgeber kann beenden.");return}if(board.filter(x=>x==="green").length!==3||board.filter(x=>x==="red").length!==3){alert("Bitte drei grüne und drei rote Felder setzen.");return}beginSearch()};
$("backLobby").onclick=()=>{clearInterval(timerHandle);phase="lobby";show("lobby")};

function beginSetup(){
  phase="setup";board=Array(25).fill("white");revealed=Array(25).fill(false);seconds=60;
  send({type:"start",phase,board,revealed,seconds});renderGame();startClock();
}
function startClock(){
  clearInterval(timerHandle);seconds=60;$("timer").textContent=seconds;
  timerHandle=setInterval(()=>{
    seconds--; $("timer").textContent=seconds;
    if(seconds<=0){
      clearInterval(timerHandle);
      const greens=board.filter(x=>x==="green").length, reds=board.filter(x=>x==="red").length;
      if(greens!==3||reds!==3){
        // Bei unvollständiger Wahl wird das gesamte Muster neu zufällig gesetzt.
        board=Array(25).fill("white");
        const slots=[...Array(25).keys()].sort(()=>Math.random()-.5).slice(0,6);
        slots.slice(0,3).forEach(i=>board[i]="green");slots.slice(3).forEach(i=>board[i]="red");
        send({type:"randomized",board});beginSearch();
      }else beginSearch();
    }
  },1000);
}
function beginSearch(){
  clearInterval(timerHandle);phase="search";revealed=Array(25).fill(false);
  send({type:"phase",phase,board,revealed});renderGame();
}
function renderGame(){
  show("game");$("phaseTitle").textContent=phase==="setup"?"Spielgeber platziert":"Suchphase";
  $("gameStatus").textContent=phase==="setup"?"Setze drei grüne und drei rote Felder. Nach 60 Sekunden wird ein unvollständiges Muster zufällig ersetzt.":"Sucher: Tippe Felder an, um sie aufzudecken.";
  $("tools").classList.toggle("hidden",phase!=="setup");
  $("finishSetup").classList.toggle("hidden",phase!=="setup");
  $("timer").textContent=phase==="setup"?seconds:"—";
  renderBoard();updateCounts();toolUi();
}
function renderBoard(){
  const b=$("board");b.innerHTML="";
  board.forEach((v,i)=>{
    const btn=document.createElement("button");btn.className="cell";
    if(phase==="setup"){
      btn.classList.add(v==="green"?"green":v==="red"?"red":"");
      btn.textContent=v==="white"?"":v==="green"?"●":"●";
      btn.onclick=()=>place(i);
    }else{
      if(v==="black")btn.classList.add("black");
      else if(revealed[i]&&v==="green")btn.classList.add("hitgreen");
      else if(revealed[i]&&v==="red")btn.classList.add("hitred");
      btn.textContent=v==="black"?"":revealed[i]?(v==="green"?"✓":"✓"):"?";
      btn.onclick=()=>searchCell(i);
    }
    b.appendChild(btn);
  });
}
function place(i){
  if(role!=="giver"||phase!=="setup")return;
  if(tool==="erase"){
    if(board[i]==="green"||board[i]==="red")board[i]="white";
  }else{
    if(board[i]!=="white")return;
    const n=board.filter(v=>v===tool).length;if(n>=3){alert("Maximal drei Felder dieser Farbe.");return}
    board[i]=tool;
  }
  renderBoard();updateCounts();send({type:"board",board,revealed});
}
function searchCell(i){
  if(role!=="seeker"||phase!=="search"||revealed[i]||board[i]==="black")return;
  if(board[i]==="white")board[i]="black";else revealed[i]=true;
  renderBoard();send({type:"reveal",board,revealed});
}
function updateCounts(){
  $("greenCount").textContent=board.filter(v=>v==="green").length+"/3";
  $("redCount").textContent=board.filter(v=>v==="red").length+"/3";
}
function toolUi(){
  $("greenTool").classList.toggle("secondary",tool!=="green");
  $("redTool").classList.toggle("secondary",tool!=="red");
  $("eraseTool").classList.toggle("secondary",tool!=="erase");
}
const joinParam=new URLSearchParams(location.search).get("join");
if(joinParam){$("joinCode").value=joinParam;setTimeout(()=>joinPeer(joinParam),250)}
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
