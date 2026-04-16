const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ZMĚNA: Nyní čteme data z nového souboru hry.json
const SOUBOR_S_DATY = './hry.json';

const nactiHry = () => {
    const data = fs.readFileSync(SOUBOR_S_DATY, 'utf8');
    return JSON.parse(data);
};

const ulozHry = (hry) => {
    // Teď už to bude server ukládat všechno kompaktně za sebe
    fs.writeFileSync(SOUBOR_S_DATY, JSON.stringify(hry), 'utf8');
};

// ---------------------------------------------------------
// NAŠE 4 ENDPOINTY (Nyní pro hry)
// ---------------------------------------------------------

// 1. ENDPOINT: Načtení všech her (Metoda GET)
app.get('/api/hry', (req, res) => {
    const hry = nactiHry();
    res.json(hry);
});

// 2. ENDPOINT: Přidání nové hry (Metoda POST)
app.post('/api/hry', (req, res) => {
    const hry = nactiHry();
    const novaHra = req.body;
    novaHra.id = Date.now();

    hry.push(novaHra);
    ulozHry(hry);

    res.status(201).json(novaHra);
});

// 3. ENDPOINT: Úprava existující hry (Metoda PUT)
app.put('/api/hry/:id', (req, res) => {
    const hry = nactiHry();
    const idHry = parseInt(req.params.id);
    const index = hry.findIndex(h => h.id === idHry);

    if (index !== -1) {
        hry[index] = { ...req.body, id: idHry };
        ulozHry(hry);
        res.json(hry[index]);
    } else {
        res.status(404).send('Hra nebyla nalezena');
    }
});

// 4. ENDPOINT: Smazání hry (Metoda DELETE)
app.delete('/api/hry/:id', (req, res) => {
    let hry = nactiHry();
    const idHry = parseInt(req.params.id);

    hry = hry.filter(h => h.id !== idHry);
    ulozHry(hry);

    res.json({ zprava: 'Hra byla úspěšně smazána' });
});

// ---------------------------------------------------------

app.listen(PORT, () => {
    console.log(`Server běží na adrese http://localhost:${PORT}`);
});