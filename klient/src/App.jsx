import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [hry, setHry] = useState([]);
  const [novaHra, setNovaHra] = useState({
    nazev: '',
    dohrani: [{ ending: '', datum: '' }],
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

    // 1. VALIDACE NÁZVU
    if (!novaHra.nazev.trim()) {
      setChybaFormulare('Název hry musí být vyplněn.');
      return;
    }

    // 2. VALIDACE HODNOCENÍ
    const hodnoceniCislo = Number(novaHra.hodnoceni);
    if (hodnoceniCislo < 1 || hodnoceniCislo > 10) {
      setChybaFormulare('Hodnocení musí být v rozmezí od 1 do 10.');
      return;
    }

    // 3. VALIDACE DATA (Nová validace pro více endingů)
    const dnesniDatum = new Date();
    dnesniDatum.setHours(0, 0, 0, 0); // Vynulujeme čas pro dnešek

    // Projdeme všechny endingy, které uživatel přidal
    for (const polozka of novaHra.dohrani) {
      if (polozka.datum) {
        const vybraneDatum = new Date(polozka.datum);
        vybraneDatum.setHours(0, 0, 0, 0);

        if (vybraneDatum > dnesniDatum) {
          setChybaFormulare('Žádné datum dohrání nemůže být v budoucnosti!');
          return;
        }
      }
    }

    // Pokud vše projde v pořádku, vymažeme předchozí chyby
    setChybaFormulare('');

    // Zbytek funkce - odeslání na server
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
          // RESET FORMULÁŘE (včetně prázdného řádku pro ending)
          setNovaHra({ nazev: '', dohrani: [{ ending: '', datum: '' }], hodnoceni: 5, poznamky: '' });
          setIdUpravovaneho(null);
        });
  };

  const smazatHru = (id) => {
    const potvrzeni = window.confirm('Opravdu chceš tento záznam smazat?');
    if (potvrzeni) {
      fetch(`http://localhost:3000/api/hry/${id}`, { method: 'DELETE' })
          .then(() => setHry(hry.filter(h => h.id !== id)));
    }
  };

  const klikNaUpravit = (hra) => {
    // Zajistíme, aby i starší hry bez pole 'dohrani' měly aspoň prázdné pole
    setNovaHra({
      ...hra,
      dohrani: hra.dohrani || [{ ending: '', datum: '' }]
    });
    setIdUpravovaneho(hra.id);
    setChybaFormulare('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pridatRadekDohrani = () => {
    setNovaHra({
      ...novaHra,
      dohrani: [...novaHra.dohrani, { ending: '', datum: '' }]
    });
  };

  const zmenaDohrani = (index, e) => {
    const { name, value } = e.target;
    const noveDohrani = [...novaHra.dohrani];
    noveDohrani[index][name] = value;
    setNovaHra({ ...novaHra, dohrani: noveDohrani });
  };

  return (
      <div className="container">
        <h1>Můj herní deník</h1>

        <div className="form-sekce">
          <h3>{idUpravovaneho ? 'Upravit záznam' : 'Zapsat dohranou hru'}</h3>
          {chybaFormulare && <p style={{color: '#ef4444', fontWeight: '500'}}>{chybaFormulare}</p>}

          <form onSubmit={odeslatFomular}>
            <input type="text" name="nazev" placeholder="Název hry" value={novaHra.nazev} onChange={zmenaVstupu} required />

            <div className="input-skupina">
              <label>Dohrání (Endingy a data)</label>
              {novaHra.dohrani.map((d, index) => (
                  <div key={index} className="form-radka-dohrani">
                    <input
                        type="text"
                        name="ending"
                        placeholder="Název endingu"
                        value={d.ending}
                        onChange={(e) => zmenaDohrani(index, e)}
                    />
                    <input
                        type="date"
                        name="datum"
                        value={d.datum}
                        onChange={(e) => zmenaDohrani(index, e)}
                    />
                  </div>
              ))}
              <button type="button" onClick={pridatRadekDohrani} className="btn-maly">
                + Přidat další ending
              </button>
            </div>

            <div className="input-skupina">
              <label>Hodnocení (1-10)</label>
              <input type="number" name="hodnoceni" min="1" max="10" value={novaHra.hodnoceni} onChange={zmenaVstupu} />
            </div>

            <textarea name="poznamky" placeholder="Poznámky..." value={novaHra.poznamky} onChange={zmenaVstupu}></textarea>

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

                <div className="karta-info-seznam">
                  {hra.dohrani && hra.dohrani.map((d, i) => (
                      <div key={i} className="odznak-container">
                        <span className="odznak ending">🏆 {d.ending || 'Dohráno'}</span>
                        <span className="odznak datum">📅 {d.datum ? new Date(d.datum).toLocaleDateString('cs-CZ') : '---'}</span>
                      </div>
                  ))}
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