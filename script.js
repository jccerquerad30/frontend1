// Detectar si está en producción o desarrollo
const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API = isDevelopment ? "http://localhost:3000/api" : "https://backend1-y43e.onrender.com/api";

console.log("🌐 Entorno:", isDevelopment ? "Desarrollo" : "Producción");
console.log("📡 API URL:", API);

// --- TABS ---
const tabLogin = document.getElementById("tabLogin");
const tabRegistro = document.getElementById("tabRegistro");
const formLogin = document.getElementById("formLogin");
const formRegistro = document.getElementById("formRegistro");

if (tabLogin && tabRegistro) {
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegistro.classList.remove("active");
    formLogin.classList.add("active");
    formRegistro.classList.remove("active");
  });

  tabRegistro.addEventListener("click", () => {
    tabRegistro.classList.add("active");
    tabLogin.classList.remove("active");
    formRegistro.classList.add("active");
    formLogin.classList.remove("active");
  });
}

// --- LOGIN ---
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

// --- REGISTRO ---
if (formRegistro) {
  formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rol = document.getElementById("rolRegistro").value;
    const usuario = document.getElementById("usuarioRegistro").value.trim();
    const contraseña = document.getElementById("contraseñaRegistro").value;
    const contraseñaConfirm = document.getElementById("contraseñaConfirm").value;

    // Validaciones
    if (!rol || !usuario || !contraseña || !contraseñaConfirm) {
      alert("Por favor complete todos los campos");
      return;
    }

    if (contraseña !== contraseñaConfirm) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (contraseña.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (usuario.length < 3) {
      alert("El usuario debe tener al menos 3 caracteres");
      return;
    }

    // Deshabilitar botón
    const btnSubmit = formRegistro.querySelector("button[type='submit']");
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Registrando...";

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contraseña, rol })
      });

      const data = await res.json();

      if (!data.ok) {
        alert(`Error: ${data.msg}`);
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Registrarse";
        return;
      }

      alert("✓ Registro exitoso! Ahora puedes ingresar con tus credenciales.");
      
      // Limpiar formulario
      formRegistro.reset();
      
      // Volver a tab de login
      tabLogin.click();
      
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Registrarse";
    } catch (err) {
      console.error("Error:", err);
      alert("Error al registrarse. Intenta nuevamente.");
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Registrarse";
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
