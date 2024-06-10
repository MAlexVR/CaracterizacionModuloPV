function runSimulation() {
  // Obtener los valores de los parámetros desde la interfaz gráfica
  const marca = document.getElementById("marca").value;
  const referencia = document.getElementById("referencia").value;
  const I_sc = parseFloat(document.getElementById("isc").value);
  const V_oc = parseFloat(document.getElementById("voc").value);
  const G_op = parseFloat(document.getElementById("gop").value);
  const T_op_C = parseFloat(document.getElementById("top").value);
  const K_i_percent = parseFloat(document.getElementById("ki").value);
  const K_i = (K_i_percent / 100) * I_sc;
  const A_celda = parseFloat(document.getElementById("acelda").value);
  const N_s = parseInt(document.getElementById("ns").value);
  const N_p = parseInt(document.getElementById("np").value);
  const n = parseFloat(document.getElementById("n").value);
  const R_s = parseFloat(document.getElementById("rs").value);
  const R_sh = parseFloat(document.getElementById("rsh").value);
  const P_max_fabricante = parseFloat(document.getElementById("pmax").value);

  // Constantes físicas
  const q = 1.602e-19; // Carga del electrón (C)
  const k = 1.381e-23; // Constante de Boltzmann (J/K)

  // Conversión de temperatura de grados Celsius a Kelvin
  const T_op = T_op_C + 273.15; // Temperatura de operación (K)
  const T_stc = 25 + 273.15; // Temperatura en condiciones estándar (K)

  // Voltaje térmico
  const V_t = (k * T_op) / q;

  // Corriente de saturación inversa en condiciones estándar
  const I_rs = I_sc / (Math.exp((q * V_oc) / (N_s * n * k * T_stc)) - 1);

  // Corriente de saturación del diodo
  const I_0 =
    I_rs *
    Math.pow(T_op / T_stc, 3) *
    Math.exp(((1.1 * q) / (n * k)) * (1 / T_stc - 1 / T_op));

  // Fotocorriente
  const I_ph = I_sc * (G_op / 1000) + K_i * (T_op - T_stc);

  // Área total efectiva del panel
  const A_total = A_celda * N_s * N_p;

  // Método de Newton-Raphson para resolver la ecuación del panel solar
  const V = math.range(0, V_oc, V_oc / 1000)._data;
  const I = [];
  const P = [];

  V.forEach((V_j) => {
    let I_j = I_ph; // Suposición inicial para la corriente
    for (let i = 0; i < 100; i++) {
      // Iteraciones del método de Newton-Raphson
      const f =
        N_p * I_ph -
        I_j -
        N_p *
          I_0 *
          (Math.exp((V_j + (I_j * R_s) / N_p) / (N_s * n * V_t)) - 1) -
        (V_j + (I_j * R_s) / N_p) / (R_sh / N_p);
      const f_prime =
        -1 -
        ((N_p * I_0 * R_s) / (N_s * n * V_t * N_p)) *
          Math.exp((V_j + (I_j * R_s) / N_p) / (N_s * n * V_t)) -
        R_s / N_p / (R_sh / N_p);

      I_j = I_j - f / f_prime; // Actualización de la corriente

      if (Math.abs(f) < 1e-6) {
        break;
      }
    }
    I.push(I_j);
    P.push(V_j * I_j); // Potencia
  });

  // Encontrar el punto de máxima potencia (MPP)
  const P_max_calc = Math.max(...P);
  const idx_max = P.indexOf(P_max_calc);
  const V_mpp = V[idx_max];
  const I_mpp = I[idx_max];

  // Factor de forma (FF)
  const FF = (V_mpp * I_mpp) / (V_oc * I_sc);

  // Eficiencia (n)
  const n_eff = (P_max_calc / (G_op * A_total)) * 100; // Eficiencia en porcentaje

  // Calcular el porcentaje de error del modelo
  const porcentaje_error =
    Math.abs((P_max_calc - P_max_fabricante) / P_max_fabricante) * 100;

  // Graficar la curva I-V
  const trace1 = {
    x: V,
    y: I,
    mode: "lines",
    name: "Curva I-V",
    line: { color: "blue" },
  };

  const trace3 = {
    x: [V_mpp],
    y: [I_mpp],
    mode: "markers",
    name: "MPP",
    marker: { color: "blue", size: 10 },
  };

  const trace5 = {
    x: [0],
    y: [I_sc],
    mode: "markers",
    name: "Isc",
    marker: { color: "blue", size: 10 },
  };

  const trace6 = {
    x: [V_oc],
    y: [0],
    mode: "markers",
    name: "Voc",
    marker: { color: "red", size: 10 },
  };

  const dataIV = [trace1, trace3, trace5, trace6];

  const layoutIV = {
    title: {
      text: "Curva I-V de un módulo fotovoltaico",
      font: {
        weight: "bold",
      },
    },
    xaxis: { title: "Voltaje (V)" },
    yaxis: { title: "Corriente (A)" },
    annotations: [
      {
        x: V_mpp,
        y: I_mpp,
        xref: "x",
        yref: "y",
        text: `MPP (${V_mpp.toFixed(2)} V, ${I_mpp.toFixed(2)} A)`,
        showarrow: true,
        arrowhead: 7,
        ax: -40,
        ay: -40,
      },
      {
        x: 0,
        y: I_sc,
        xref: "x",
        yref: "y",
        text: `Isc (${I_sc.toFixed(2)} A)`,
        showarrow: true,
        arrowhead: 7,
        ax: -40,
        ay: -40,
      },
      {
        x: V_oc,
        y: 0,
        xref: "x",
        yref: "y",
        text: `Voc (${V_oc.toFixed(2)} V)`,
        showarrow: true,
        arrowhead: 7,
        ax: -40,
        ay: -40,
      },
    ],
  };

  Plotly.newPlot("plotIV", dataIV, layoutIV);

  // Graficar la curva P-V
  const trace2 = {
    x: V,
    y: P,
    mode: "lines",
    name: "Curva P-V",
    line: { color: "red" },
  };

  const trace4 = {
    x: [V_mpp],
    y: [P_max_calc],
    mode: "markers",
    name: "Pmax",
    marker: { color: "red", size: 10 },
  };

  const trace7 = {
    x: [V_oc],
    y: [0],
    mode: "markers",
    name: "Voc",
    marker: { color: "red", size: 10 },
  };

  const dataPV = [trace2, trace4, trace7];

  const layoutPV = {
    title: {
      text: "Curva P-V de un módulo fotovoltaico",
      font: {
        weight: "bold",
      },
    },
    xaxis: { title: "Voltaje (V)" },
    yaxis: { title: "Potencia (W)" },
    annotations: [
      {
        x: V_mpp,
        y: P_max_calc,
        xref: "x",
        yref: "y",
        text: `Pmax (${V_mpp.toFixed(2)} V, ${P_max_calc.toFixed(2)} W)`,
        showarrow: true,
        arrowhead: 7,
        ax: -40,
        ay: -40,
      },
      {
        x: V_oc,
        y: 0,
        xref: "x",
        yref: "y",
        text: `Voc (${V_oc.toFixed(2)} V)`,
        showarrow: true,
        arrowhead: 7,
        ax: -40,
        ay: -40,
      },
    ],
  };

  Plotly.newPlot("plotPV", dataPV, layoutPV);

  // Mostrar valores importantes en la sección de información
  document.getElementById("info").innerHTML = `
      <h2>Resultados de la Simulación</h2>
              <p><strong>Marca:</strong> ${marca}</p>
        <p><strong>Referencia:</strong> ${referencia}</p>
        <p><strong>Isc:</strong> ${I_sc.toFixed(2)} A</p>
        <p><strong>Voc:</strong> ${V_oc.toFixed(2)} V</p>
        <p><strong>Pmax (calculada):</strong> ${P_max_calc.toFixed(2)} W</p>
        <p><strong>FF:</strong> ${(FF * 100).toFixed(2)}%</p>
        <p><strong>Eff:</strong> ${n_eff.toFixed(2)}%</p>
        <h2>Parámetros del Modelo</h2>
        <p><strong>Gop:</strong> ${G_op.toFixed(0)} W/m²</p>
        <p><strong>Gstc:</strong> 1000 W/m²</p>
        <p><strong>Top:</strong> ${T_op.toFixed(2)} K</p>
        <p><strong>Tstc:</strong> ${T_stc.toFixed(2)} K</p>
        <p><strong>Ki:</strong> ${K_i.toFixed(4)} A/K</p>
        <p><strong>Acelda:</strong> ${A_celda.toFixed(4)} m²</p>
        <p><strong>Atotal:</strong> ${A_total.toFixed(4)} m²</p>
        <p><strong>Ns:</strong> ${N_s}</p>
        <p><strong>Np:</strong> ${N_p}</p>
        <p><strong>n:</strong> ${n.toFixed(1)}</p>
        <p><strong>Rs:</strong> ${R_s.toFixed(4)} Ω</p>
        <p><strong>Rsh:</strong> ${R_sh.toFixed(1)} Ω</p>
        <p><strong>Eg:</strong> 1.1 eV</p>
        <p><strong>q:</strong> 1.602e-19 C</p>
        <p><strong>k:</strong> 1.381e-23 J/K</p>
        <p><strong>Pmax (fabricante):</strong> ${P_max_fabricante.toFixed(
          2
        )} W</p>
        <p><strong>Error:</strong> ${porcentaje_error.toFixed(2)}%</p>
    `;
}
