import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <header className="header">
        <h1 className="logo">Trivia App</h1>
        <nav className="nav">
          <Link to="/">Inicio</Link>
          <Link to="/categorias">Categorías</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/categoria/:idCategoria" element={<ElegirDificultad />} />
          <Route path="/trivia/:idCategoria/:dificultad" element={<Juego />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

function Inicio() {
  return (
    <div className="pagina">
      <div className="card-centro">
        <h2>Bienvenido</h2>
        <p>Elegí una categoría para comenzar.</p>
        <Link className="btn" to="/categorias">Ver categorías</Link>
      </div>
    </div>
  );
}

function Categorias() {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetch("https://opentdb.com/api_category.php")
      .then(r => r.json())
      .then(data => {
        if (data.trivia_categories) {
          setCategorias(data.trivia_categories);
        }
      });
  }, []);

  return (
    <div className="pagina">
      <h2>Categorías</h2>

      <div className="lista-categorias">
        {categorias.map(cat => (
          <Link key={cat.id} className="cat-card" to={`/categoria/${cat.id}`}>
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ElegirDificultad() {
  const { idCategoria } = useParams();

  return (
    <div className="pagina">
      <h2>Elegí dificultad</h2>

      <div className="lista-categorias">
        <Link className="cat-card" to={`/trivia/${idCategoria}/easy`}>Fácil</Link>
        <Link className="cat-card" to={`/trivia/${idCategoria}/medium`}>Medio</Link>
        <Link className="cat-card" to={`/trivia/${idCategoria}/hard`}>Difícil</Link>
      </div>
    </div>
  );
}

function Juego() {
  const { idCategoria, dificultad } = useParams();
  const navigate = useNavigate();
  const [pregunta, setPregunta] = useState("");
  const [respuestaCorrecta, setRespuestaCorrecta] = useState("");
  const [respuestaUsuario, setRespuestaUsuario] = useState("");
  const [resultado, setResultado] = useState("");
  const [puntaje, setPuntaje] = useState(0);
  const [vidas, setVidas] = useState(3);
  const [tiempo, setTiempo] = useState(20);
  const [cargando, setCargando] = useState(true);

  async function traducir(texto) {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|es`
      );
      const data = await res.json();
      return data.responseData.translatedText || texto;
    } catch {
      return texto;
    }
  }

  async function cargarPregunta() {
    setResultado("");
    setRespuestaUsuario("");
    setCargando(true);
    setTiempo(20);

    const res = await fetch(
      `https://opentdb.com/api.php?amount=1&category=${idCategoria}&difficulty=${dificultad}&encode=url3986`
    );

    const data = await res.json();
    const p = data.results[0];

    const preguntaTxt = decodeURIComponent(p.question);
    const correctaTxt = decodeURIComponent(p.correct_answer);

    setPregunta(await traducir(preguntaTxt));
    setRespuestaCorrecta(await traducir(correctaTxt));
    setCargando(false);
  }

  useEffect(() => {
    if (tiempo <= 0) {
      setResultado("incorrecto");
      setVidas(vidas - 1);
      return;
    }
    const timer = setTimeout(() => setTiempo(tiempo - 1), 1000);
    return () => clearTimeout(timer);
  }, [tiempo]);

  useEffect(() => {
    cargarPregunta();
  }, [idCategoria, dificultad]);

  function verificar() {
    if (respuestaUsuario.trim().toLowerCase() === respuestaCorrecta.trim().toLowerCase()) {
      setResultado("correcto");
      setPuntaje(puntaje + 100);
    } else {
      setResultado("incorrecto");
      setVidas(vidas - 1);
    }
  }

  if (vidas <= 0) {
    return (
      <div className="pagina">
        <h2>Juego terminado </h2>
        <p>Puntaje final: {puntaje}</p>
        <button className="btn" onClick={() => navigate("/")}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="pagina">
      <button className="btn volver" onClick={() => navigate(-1)}>← Volver</button>

      <h2>Pregunta</h2>

      <div className="info-bar">
        <p>Puntaje: {puntaje}</p>
        <p>Vidas: {vidas}</p>
        <p>Tiempo: {tiempo}s</p>
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <div className="card">
          <p className="pregunta">{pregunta}</p>

          <input
            className="input"
            value={respuestaUsuario}
            onChange={e => setRespuestaUsuario(e.target.value)}
            placeholder="Escribí tu respuesta..."
          />

          <button className="btn" onClick={verificar}>Verificar</button>

          {resultado === "correcto" && <p className="correcto">¡Correcto!</p>}
          {resultado === "incorrecto" && (
            <p className="incorrecto">Incorrecto. Era: <strong>{respuestaCorrecta}</strong></p>
          )}

          {resultado !== "" && (
            <button className="btn" onClick={cargarPregunta}>Nueva pregunta</button>
          )}
        </div>
      )}
    </div>
  );
}
