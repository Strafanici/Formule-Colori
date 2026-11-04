let datasetCorrente = [];
let ultimaRicerca = "";
let coloreAttualeSelezionato = null; // Variabile globale per ricordare il colore aperto nel dettaglio

// Caricamento iniziale predefinito su Cartone
document.addEventListener("DOMContentLoaded", () => {
    caricaDataset('cartone');
});

// Cambia il dataset attivo in base al pulsante scelto (mantenendo la ricerca attiva)
function caricaDataset(tipo) {
    const btnCartone = document.getElementById("btn-cartone");
    const btnPvc = document.getElementById("btn-pvc");
    const searchInput = document.getElementById("search-input");

    if (tipo === 'cartone') {
        if (btnCartone) btnCartone.classList.add("active");
        if (btnPvc) btnPvc.classList.remove("active");

        datasetCorrente = (typeof FORMULE_CARTONE !== "undefined") ? FORMULE_CARTONE : [];
    } else {
        if (btnPvc) btnPvc.classList.add("active");
        if (btnCartone) btnCartone.classList.remove("active");

        datasetCorrente = (typeof FORMULE_PVC !== "undefined") ? FORMULE_PVC : [];
    }

    // Se c'è del testo scritto nella barra, riesegue la ricerca sul nuovo dataset scelto
    if (searchInput && searchInput.value.trim() !== "") {
        ultimaRicerca = searchInput.value; // Aggiorna la memoria dell'ultima ricerca
        eseguiRicerca(searchInput.value);
    } else {
        chiudiDropdown();
    }
}

// Evento di ricerca in tempo reale (supporta sia testo che ricerca per numero)
const searchInput = document.getElementById("search-input");
const dropdown = document.getElementById("dropdown-results");

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        eseguiRicerca(e.target.value);
    });
}

// Funzione centrale di ricerca (filtra e mostra i risultati nel dropdown)
function eseguiRicerca(testoQuery) {
    const query = testoQuery.toLowerCase().trim();
    if (!dropdown) return;
    dropdown.innerHTML = "";

    if (query.length === 0) {
        chiudiDropdown();
        return;
    }

    // Filtra sul dataset attivo (Cartone o PVC)
    const risultati = datasetCorrente.filter(item => {
        const nomeLower = item.nome.toLowerCase();
        const matchTesto = nomeLower.includes(query);
        const numeriNelNome = nomeLower.match(/\d+/g) || [];
        const matchNumero = numeriNelNome.some(num => num.includes(query));

        return matchTesto || matchNumero;
    });

    if (risultati.length > 0) {
        risultati.forEach(colore => {
            const li = document.createElement("li");
            li.textContent = colore.nome;
            li.addEventListener("click", () => {
                // Salva subito il testo della ricerca prima di pulire o cambiare schermata
                if (searchInput) {
                    ultimaRicerca = searchInput.value;
                    searchInput.blur(); // Toglie il focus e chiude la tastiera sul telefono
                }

                chiudiDropdown();
                mostraDettaglio(colore);
            });
            dropdown.appendChild(li);
        });
        dropdown.classList.remove("hidden");
    } else {
        chiudiDropdown();
    }
}

function chiudiDropdown() {
    if (dropdown) {
        dropdown.innerHTML = "";
        dropdown.classList.add("hidden");
    }
}

// Funzione per mostrare i dettagli di un colore selezionato
function mostraDettaglio(coloreObj) {
    if (!coloreObj) return;
    coloreAttualeSelezionato = coloreObj; // Memorizza il colore corrente per i pulsanti di scala

    // Ripristina sempre il primo pulsante ("Formula" originale) come attivo all'apertura
    const bottoniScala = document.querySelectorAll(".btn-scale");
    bottoniScala.forEach((btn, index) => {
        if (index === 0) btn.classList.add("active");
        else btn.classList.remove("active");
    });

    // 1. Imposta il titolo con il nome del colore
    const titleEl = document.getElementById("color-title");
    if (titleEl) titleEl.innerText = coloreObj.nome;

    // Renderizza la tabella con i valori originali
    renderizzaTabellaFormula('originale');

    // 4. Passa alla schermata di dettaglio
    const screenSearch = document.getElementById("screen-search");
    const screenDetail = document.getElementById("screen-detail");

    if (screenSearch) screenSearch.classList.remove("active");
    if (screenDetail) screenDetail.classList.add("active");
}

// Funzione che gestisce il rendering e il calcolo proporzionale dei grammi
function renderizzaTabellaFormula(pesoTarget) {
    if (!coloreAttualeSelezionato) return;

    const tbody = document.getElementById("formula-body");
    const tdTotal = document.getElementById("formula-total");

    if (!tbody) return;
    tbody.innerHTML = "";

    const listaComponenti = coloreAttualeSelezionato.componenti || [];

    // 1. Calcola prima il peso totale originale della formula sommando i componenti
    let pesoOriginaleTotale = 0;
    listaComponenti.forEach(item => {
        const qta = item.quantita !== undefined ? item.quantita : (item.grammi || 0);
        pesoOriginaleTotale += Number(qta);
    });

    let sommaTotaleCalcolata = 0;

    // 2. Cicla e inserisce i valori (originali o proporzionali)
    listaComponenti.forEach(item => {
        const tr = document.createElement("tr");

        const tdComp = document.createElement("td");
        tdComp.innerText = item.nome || item.componente || "";

        const tdGrammi = document.createElement("td");
        const qtaOriginale = item.quantita !== undefined ? item.quantita : (item.grammi || 0);

        let qtaFinale = qtaOriginale;

        // Se è stato scelto un peso target (1000g, 2000g, 3000g), calcola la proporzione
        if (pesoTarget !== 'originale' && pesoOriginaleTotale > 0) {
            qtaFinale = (Number(qtaOriginale) * Number(pesoTarget)) / pesoOriginaleTotale;
            qtaFinale = Math.round(qtaFinale); // Arrotonda ai grammi interi puliti
        }

        tdGrammi.innerText = qtaFinale + " gr.";

        tr.appendChild(tdComp);
        tr.appendChild(tdGrammi);
        tbody.appendChild(tr);

        sommaTotaleCalcolata += Number(qtaFinale);
    });

    // 3. Scrive il totale complessivo in basso
    if (tdTotal) {
        tdTotal.innerHTML = `<em><strong>${sommaTotaleCalcolata} gr.</strong></em>`;
    }
}

// Funzione richiamata dai pulsanti di scala (Formula, 1 KG, 2 KG, 3 KG)
function cambiaScala(peso, bottoneCliccato) {
    const bottoni = document.querySelectorAll(".btn-scale");
    bottoni.forEach(btn => btn.classList.remove("active"));
    if (bottoneCliccato) {
        bottoneCliccato.classList.add("active");
    }

    renderizzaTabellaFormula(peso);
}

// Funzione per tornare alla schermata di ricerca mantenendo ricerca e tendina
function mostraRicerca() {
    const screenSearch = document.getElementById("screen-search");
    const screenDetail = document.getElementById("screen-detail");

    if (screenDetail) screenDetail.classList.remove("active");
    if (screenSearch) screenSearch.classList.add("active");

    // Ripristina il testo salvato nella barra di ricerca e riapre la tendina dei risultati
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.value = ultimaRicerca;
        if (ultimaRicerca.trim() !== "") {
            eseguiRicerca(ultimaRicerca);
        }
    }
}

// Funzione per nascondere la tastiera del cellulare tramite il pulsante lente
function chiudiTastiera() {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.blur();
    }
}