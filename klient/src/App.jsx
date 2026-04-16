import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [hry, setHry] = useState([]);
  const [novaHra, setNovaHra] = useState({
    nazev: '',
    datum_dohrani: '',
    hodnoceni: 5,
    poznamky: ''
  });
  const [hledanyText, setHledanyText] = useState('');
  const [idUpravovaneho, setIdUpravovaneho] = useState(null);
  const [chybaFormulare, setChybaFormulare] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/hry')
        .then(res => res.json())
        .then(data => setHry(data));
  }, []);

  const zmenaVstupu = (e) => {
    const { name, value } = e.target;
    setNovaHra({ ...novaHra, [name]: value });
  };

  const odeslatFomular = (e) => {
    e.preventDefault();

    // 1. VALIDACE NÁZVU: Nesmí být prázdný a nesmí obsahovat jen mezery
    if (!novaHra.nazev.trim()) {
      setChybaFormulare('Název hry musí být vyplněn (nesmí obsahovat jen mezery).');
      return; // Zastaví odeslání
    }

    // 2. VALIDACE HODNOCENÍ: Musí to být číslo od 1 do 10
    const hodnoceniCislo = Number(novaHra.hodnoceni);
    if (hodnoceniCislo < 1 || hodnoceniCislo > 10) {
      setChybaFormulare('Hodnocení musí být v rozmezí od 1 do 10.');
      return;
    }

    // 3. VALIDACE DATA: Datum dohrání nesmí být v budoucnosti
    if (novaHra.datum_dohrani) {
      const vybraneDatum = new Date(novaHra.datum_dohrani);
      const dnesniDatum = new Date();

      // Vynulujeme čas, abychom porovnávali jen čisté dny
      dnesniDatum.setHours(0, 0, 0, 0);
      vybraneDatum.setHours(0, 0, 0, 0);

      if (vybraneDatum > dnesniDatum) {
        setChybaFormulare('Kámo, datum dohrání nemůže být v budoucnosti! 😅');
        return;
      }
    }

    // Pokud vše projde, vymažeme předchozí chybové hlášky
    setChybaFormulare('');

    // Zbytek funkce zůstává stejný - odeslání na server
    const metoda = idUpravovaneho ? 'PUT' : 'POST';
    const url = idUpravovaneho
        ? `http://localhost:3000/api/hry/${idUpravovaneho}`
        : 'http://localhost:3000/api/hry';

    fetch(url, {
      method: metoda,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaHra),
    })
        .then(res => res.json())
        .then(data => {
          if (idUpravovaneho) {
            setHry(hry.map(h => h.id === idUpravovaneho ? data : h));
          } else {
            setHry([...hry, data]);
          }
          setNovaHra({ nazev: '', datum_dohrani: '', hodnoceni: 5, poznamky: '' });
          setIdUpravovaneho(null);
        });
  };

  const smazatHru = (id) => {
    // Zeptáme se uživatele a výsledek uložíme do proměnné
    const potvrzeni = window.confirm('Opravdu chceš tento záznam smazat? Akce je nevratná.');

    // Pokud uživatel kliknul na "OK" (potvrzeni je true), provedeme smazání
    if (potvrzeni) {
      fetch(`http://localhost:3000/api/hry/${id}`, {
        method: 'DELETE'
      })
          .then(() => {
            setHry(hry.filter(h => h.id !== id));
          })
          .catch(chyba => console.error('Chyba při mazání:', chyba));
    }
    // Pokud kliknul na "Zrušit", funkce prostě skončí a nic se nestane
  };

  const klikNaUpravit = (hra) => {
    setNovaHra({ ...hra });
    setIdUpravovaneho(hra.id);
  };

  return (
      <div className="container">
        <h1>Můj herní deník</h1>

        <div className="form-sekce">
          <h3>{idUpravovaneho ? 'Upravit záznam' : 'Zapsat dohranou hru'}</h3>
          {chybaFormulare && <p style={{color: '#ef4444', fontWeight: '500'}}>{chybaFormulare}</p>}

          <form onSubmit={odeslatFomular}>
            <input type="text" name="nazev" placeholder="Název hry" value={novaHra.nazev} onChange={zmenaVstupu} required />

            <div className="form-radka">
              <div className="input-skupina">
                <label>Datum dohrání</label>
                <input type="date" name="datum_dohrani" value={novaHra.datum_dohrani} onChange={zmenaVstupu} />
              </div>
              <div className="input-skupina">
                <label>Hodnocení (1-10)</label>
                <input type="number" name="hodnoceni" min="1" max="10" value={novaHra.hodnoceni} onChange={zmenaVstupu} />
              </div>
            </div>

            <textarea name="poznamky" placeholder="Tvoje poznámky ke hře..." value={novaHra.poznamky} onChange={zmenaVstupu}></textarea>

            <div className="form-tlacitka">
              <button type="submit" className="btn-primarni">{idUpravovaneho ? 'Uložit změny' : 'Přidat do deníku'}</button>
              {idUpravovaneho && <button type="button" className="btn-zrusit" onClick={() => {setIdUpravovaneho(null); setChybaFormulare('');}}>Zrušit</button>}
            </div>
          </form>
        </div>

        <input
            type="text"
            className="search-bar"
            placeholder="🔍 Hledat v deníku..."
            value={hledanyText}
            onChange={(e) => setHledanyText(e.target.value)}
        />

        <div className="seznam-her">
          {hry.filter(h => h.nazev.toLowerCase().includes(hledanyText.toLowerCase())).map(hra => (
              <div key={hra.id} className="herni-karta">
                <h2>{hra.nazev}</h2>

                <div className="karta-info">
                  <span className="odznak datum">📅 {hra.datum_dohrani ? new Date(hra.datum_dohrani).toLocaleDateString('cs-CZ') : 'Neuvedeno'}</span>
                  <span className="odznak hodnoceni">⭐ {hra.hodnoceni}/10</span>
                </div>

                <p className="text-poznamky">{hra.poznamky}</p>

                <div className="akce">
                  <button onClick={() => klikNaUpravit(hra)}>Upravit</button>
                  <button onClick={() => smazatHru(hra.id)} className="btn-smazat">Smazat</button>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}

export default App;