const API = "http://localhost:3000/api";

// --- LOGIN ---
const formLogin = document.getElementById("formLogin");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rol = document.getElementById("rol").value;
    const usuario = document.getElementById("usuario").value.trim();
    const contraseña = document.getElementById("contraseña").value;

    // Validar que todos los campos estén completos
    if (!rol || !usuario || !contraseña) {
      alert("Por favor complete todos los campos");
      return;
    }

    // Deshabilitar botón durante la petición
    const btnSubmit = formLogin.querySelector("button[type='submit']");
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Ingresando...";

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contraseña, rol })
      });

      const data = await res.json();

      if (!data.ok) {
        alert(`Error: ${data.msg}`);
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Ingresar";
        return;
      }

      // Guardar datos del usuario en localStorage
      localStorage.setItem("usuarioActual", JSON.stringify(data.usuario));
      localStorage.setItem("tokenLogin", new Date().getTime());

      // Redirigir a panel.html
      setTimeout(() => {
        window.location.href = "panel.html";
      }, 500);
    } catch (err) {
      console.error("Error:", err);
      alert("Error de conexión con el servidor. Verifique que esté disponible.");
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Ingresar";
    }
  });
}

// --- PANEL ---
const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
const cerrarSesion = document.getElementById("cerrarSesion");

if (usuarioActual && document.getElementById("tituloPanel")) {
  document.getElementById("tituloPanel").textContent =
    `Panel del ${usuarioActual.rol.toUpperCase()} (${usuarioActual.usuario})`;
}

if (cerrarSesion) {
  cerrarSesion.addEventListener("click", () => {
    localStorage.removeItem("usuarioActual");
    window.location.href = "index.html";
  });
}

// --- Salas ---
const listaSalas = document.getElementById("listaSalas");
const salaSeleccionada = document.getElementById("salaSeleccionada");
const tablaAvances = document.querySelector("#tablaAvances tbody");
const formAvance = document.getElementById("formAvance");

async function cargarSalas() {
  const res = await fetch(`${API}/salas`);
  const salas = await res.json();

  // Filtrar salas donde participa el usuario
  const visibles = salas.filter(s => s.participantes.some(p => p.rol === usuarioActual.rol && p._id === usuarioActual.id));

  listaSalas.innerHTML = "";
  salaSeleccionada.innerHTML = "";

  visibles.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s.nombre;
    listaSalas.appendChild(li);

    const opt = document.createElement("option");
    opt.value = s._id;
    opt.textContent = s.nombre;
    salaSeleccionada.appendChild(opt);
  });

  if (visibles.length > 0) cargarAvances(visibles[0]._id);
}

// --- Avances ---
async function cargarAvances(salaId) {
  const res = await fetch(`${API}/avances/${salaId}`);
  const avances = await res.json();

  tablaAvances.innerHTML = "";
  avances.forEach((a, i) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${i + 1}</td>
      <td>${salaId}</td>
      <td>${a.parte}</td>
      <td>${a.descripcion}</td>
      <td>${new Date(a.fecha).toLocaleString()}</td>
    `;
    tablaAvances.appendChild(fila);
  });
}

if (formAvance) {
  formAvance.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sala = salaSeleccionada.value;
    const descripcion = document.getElementById("descripcionAvance").value.trim();
    const parte = usuarioActual.rol;

    if (!descripcion) return alert("Ingrese descripción");

    try {
      const res = await fetch(`${API}/avances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sala, parte, descripcion })
      });
      const data = await res.json();
      if (!data.ok) return alert("Error al registrar avance");

      cargarAvances(sala);
      formAvance.reset();
    } catch (err) {
      alert("Error de conexión con el servidor");
      console.error(err);
    }
  });
}

// Cambiar sala para ver avances
if (salaSeleccionada) {
  salaSeleccionada.addEventListener("change", (e) => cargarAvances(e.target.value));
}

if (usuarioActual) cargarSalas();
