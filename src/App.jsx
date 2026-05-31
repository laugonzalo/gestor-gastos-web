import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
// BORRÁ ESTO: import 'jspdf-autotable';
// PONÉ ESTO:
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
function App() {
  const [saldos, setSaldos] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState({ GastoActual: 0, GastoAnterior: 0, CategoriaMasGastada: '-', MontoCategoriaTop: 0 });
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [datosEvolucion, setDatosEvolucion] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  // NUEVO ESTADO: Guarda los datos de los presupuestos
  const [presupuestos, setPresupuestos] = useState([]);

  const [pestaña, setPestaña] = useState('cartera'); 

  const [monto, setMonto] = useState('');
  const [idCategoria, setIdCategoria] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaCatTipo, setNuevaCatTipo] = useState('Gasto');
  // NUEVO ESTADO: El límite de plata para la categoría
  const [nuevaCatPresupuesto, setNuevaCatPresupuesto] = useState(''); 
  
  const [idEdicion, setIdEdicion] = useState(null);

  const COLORES = ['#8d4ef7', '#12a454', '#e6374a', '#ffcd39', '#17a2b8', '#aab7c4'];

const traerTransacciones = () => {
    let url = 'http://localhost:3000/api/transacciones?';
    if (textoBusqueda) url += `busqueda=${textoBusqueda}&`;
    if (filtroCategoria) url += `id_categoria=${filtroCategoria}&`;
    if (fechaInicio) url += `fechaInicio=${fechaInicio}&`;
    if (fechaFin) url += `fechaFin=${fechaFin}`;
    
    axios.get(url).then(res => setTransacciones(res.data)).catch(error => console.error(error));
  };

  // Le avisamos a React que vuelva a buscar datos si cambian las fechas
  useEffect(() => {
    cargarDatosPrincipales();
    cargarCategorias();
  }, [textoBusqueda, filtroCategoria, fechaInicio, fechaFin]);

  const cargarDatosPrincipales = () => {
    axios.get('http://localhost:3000/api/saldos').then(res => setSaldos(res.data));
    axios.get('http://localhost:3000/api/resumen').then(res => setResumen(res.data));
    axios.get('http://localhost:3000/api/graficos/distribucion').then(res => setDatosGrafico(res.data));
    axios.get('http://localhost:3000/api/graficos/evolucion').then(res => setDatosEvolucion(res.data));
    // Llamamos al nuevo endpoint de presupuestos
    axios.get('http://localhost:3000/api/presupuestos/progreso').then(res => setPresupuestos(res.data));
    traerTransacciones();
  };

  const cargarCategorias = () => {
    axios.get('http://localhost:3000/api/categorias').then(res => setCategorias(res.data));
  };

  useEffect(() => {
    cargarDatosPrincipales();
    cargarCategorias();
  }, [textoBusqueda, filtroCategoria]);

  const guardarTransaccion = (e) => {
    e.preventDefault();
    const datosMovimiento = { id_cuenta: 1, id_categoria: idCategoria, monto: parseFloat(monto), fecha_transaccion: fecha, descripcion: descripcion };
    if (idEdicion) {
      axios.put(`http://localhost:3000/api/transacciones/${idEdicion}`, datosMovimiento)
        .then(() => { cargarDatosPrincipales(); limpiarFormularioMovimiento(); }).catch(error => console.error(error));
    } else {
      axios.post('http://localhost:3000/api/transacciones', datosMovimiento)
        .then(() => { cargarDatosPrincipales(); limpiarFormularioMovimiento(); }).catch(error => console.error(error));
    }
  };
const exportarPDF = () => {
  // Creamos un documento nuevo
  const doc = new jsPDF();

  // Título del documento
  doc.setFontSize(18);
  doc.setTextColor(122, 55, 245); // Violeta Fintech
  doc.text("Extracto de Movimientos - Gestor Pro", 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22);

  // Preparamos las columnas y los datos
  const columnas = ["Fecha", "Categoría", "Tipo", "Detalle", "Monto"];
  const filas = [];

  transacciones.forEach(t => {
    const datos = [
      t.fecha_transaccion.split('T')[0],
      t.nombre_categoria,
      t.tipo === 'Ingreso' ? 'Ingreso (+)' : 'Gasto (-)',
      t.descripcion,
      `$${t.monto}`
    ];
    filas.push(datos);
  });

  // Dibujamos la tabla
 // Dibujamos la tabla (¡Versión corregida para Vite!)
     autoTable(doc, {
       head: [columnas],
       body: filas,
       startY: 30,
       theme: 'grid',
       styles: { fontSize: 9, cellPadding: 3 },
       headStyles: { fillColor: [122, 55, 245], textColor: 255 }, // Encabezado violeta
       alternateRowStyles: { fillColor: [245, 245, 245] }
     });

  // Descargamos el archivo
  doc.save("extracto_movimientos.pdf");
};
  function limpiarFormularioMovimiento() {
    setMonto(''); setIdCategoria(''); setFecha(''); setDescripcion(''); setIdEdicion(null);
  }

  const iniciarEdicion = (t) => {
    setIdEdicion(t.id_transaccion); setMonto(t.monto); setIdCategoria(t.id_categoria);
    setFecha(t.fecha_transaccion.split('T')[0]); setDescripcion(t.descripcion);
    setPestaña('movimientos'); 
  };

  const eliminarTransaccion = (id) => {
    if (window.confirm('¿Estás seguro?')) {
      axios.delete(`http://localhost:3000/api/transacciones/${id}`)
        .then(() => cargarDatosPrincipales()).catch(error => console.error(error));
    }
  };

  const guardarCategoria = (e) => {
    e.preventDefault();
    
    // Armamos el paquete de datos asegurándonos de que el nombre coincida EXACTO con el backend
    const datosCat = { 
      nombre_categoria: nuevaCatNombre, 
      tipo: nuevaCatTipo, 
      presupuesto_mensual: nuevaCatTipo === 'Gasto' ? (parseFloat(nuevaCatPresupuesto) || 0) : 0 
    };

    console.log("📦 Paquete saliendo de React:", datosCat);

    axios.post('http://localhost:3000/api/categorias', datosCat)
      .then(() => { 
        cargarCategorias(); 
        setNuevaCatNombre(''); 
        setNuevaCatPresupuesto(''); // Limpiamos el campito
      })
      .catch(error => console.error("Error al guardar:", error));
  };

  const eliminarCategoria = (id) => {
    if (window.confirm('¿Estás seguro?')) {
      axios.delete(`http://localhost:3000/api/categorias/${id}`)
        .then(() => cargarCategorias()).catch(error => alert(error.response?.data?.error));
    }
  };

  let variacionPorcentaje = 0;
  if (resumen.GastoAnterior > 0) variacionPorcentaje = (((resumen.GastoActual - resumen.GastoAnterior) / resumen.GastoAnterior) * 100).toFixed(1);
  const colorVariacion = variacionPorcentaje > 0 ? 'text-danger' : 'text-success';

  return (
    <div className="container-fluid px-4 py-3">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0">📊 Gestor Pro</h4>
        {saldos.map((cuenta) => (
          <div className="badge bg-primary fs-5 px-3 py-2 rounded-pill shadow" key={cuenta.id_cuenta}>
            {cuenta.nombre_cuenta}: ${cuenta.saldo_actual}
          </div>
        ))}
      </div>

      <ul className="nav nav-pills nav-fill bg-dark border p-1 rounded-4 mb-4 shadow-sm">
        <li className="nav-item">
          <button className={`nav-link rounded-4 fw-bold ${pestaña === 'cartera' ? 'active' : ''}`} onClick={() => setPestaña('cartera')}>💰 Mi Cartera</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link rounded-4 fw-bold ${pestaña === 'movimientos' ? 'active' : ''}`} onClick={() => setPestaña('movimientos')}>📝 Movimientos</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link rounded-4 fw-bold ${pestaña === 'config' ? 'active' : ''}`} onClick={() => setPestaña('config')}>⚙️ Configuración</button>
        </li>
      </ul>

      {/* 1. PESTAÑA: CARTERA */}
      {pestaña === 'cartera' && (
        <div className="animate__animated animate__fadeIn">
          <div className="row g-4 mb-4">
            
            {/* KPI Principal */}
            <div className="col-lg-4">
              <div className="card border-0 shadow rounded-4 h-100 p-3">
                <h6 className="fw-bold text-muted mb-4 text-uppercase" style={{fontSize: '0.8rem'}}>Resumen Analítico</h6>
                <div className="d-flex flex-column gap-4">
                  <div>
                    <h3 className="fw-bold mb-0">${resumen.GastoActual}</h3>
                    <p className="text-muted small">Gastos acumulados este mes</p>
                    <span className={`badge bg-dark ${colorVariacion} border`}>
                      {variacionPorcentaje > 0 ? '📈 +' : '📉 '}{variacionPorcentaje}% vs mes anterior
                    </span>
                  </div>
                  <hr className="my-0 opacity-5" />
                  <div>
                    <h4 className="fw-bold text-danger mb-0 text-truncate">{resumen.CategoriaMasGastada}</h4>
                    <p className="text-muted small mb-0">Mayor fuga de dinero registrada</p>
                    <small className="fw-bold">Total: ${resumen.MontoCategoriaTop}</small>
                  </div>
                </div>
              </div>
            </div>

            {/* NUEVO PANEL: Metas y Presupuestos */}
            <div className="col-lg-4">
              <div className="card border-0 shadow rounded-4 h-100 p-3">
                <h6 className="fw-bold text-muted mb-3 text-uppercase" style={{fontSize: '0.8rem'}}>Tus Metas Mensuales</h6>
                <div className="overflow-auto pe-2" style={{maxHeight: '250px'}}>
                  {presupuestos.length === 0 ? (
                    <p className="text-muted small text-center mt-4">No tenés categorías con presupuesto definido.</p>
                  ) : (
                    presupuestos.map(p => {
                      const porcentaje = Math.min((p.gastado / p.presupuesto_mensual) * 100, 100).toFixed(0);
                      let colorBarra = 'bg-success';
                      if (porcentaje >= 75) colorBarra = 'bg-warning';
                      if (porcentaje >= 95) colorBarra = 'bg-danger';

                      return (
                        <div key={p.id_categoria} className="mb-3">
                          <div className="d-flex justify-content-between align-items-end mb-1">
                            <span className="small fw-semibold">{p.nombre_categoria}</span>
                            <span className="small text-muted">${p.gastado} / <span className="fw-bold text-white">${p.presupuesto_mensual}</span></span>
                          </div>
                          <div className="progress bg-dark border" style={{height: '12px'}}>
                            <div className={`progress-bar progress-bar-striped progress-bar-animated ${colorBarra}`} style={{width: `${porcentaje}%`}}></div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Gráfico de Torta */}
            <div className="col-lg-4">
              <div className="card border-0 shadow rounded-4 h-100 p-3">
                <h6 className="fw-bold text-muted mb-4 text-uppercase text-center" style={{fontSize: '0.8rem'}}>Distribución</h6>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={datosGrafico} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {datosGrafico.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} stroke="none"/>)}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#333', border: 'none', color: '#fff'}} formatter={(value) => `$${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico Evolutivo */}
          {datosEvolucion.length > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow rounded-4 p-4">
                  <h6 className="fw-bold text-muted mb-4 text-uppercase text-center" style={{fontSize: '0.8rem'}}>Evolución Mensual (Ingresos vs Gastos)</h6>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <BarChart data={datosEvolucion} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" opacity={0.5} />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#adb5bd'}} axisLine={{stroke: '#555'}} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#adb5bd'}} axisLine={{stroke: '#555'}} tickLine={false} tickFormatter={(value) => `$${value}`} width={80} />
                        <Tooltip contentStyle={{backgroundColor: '#333', border: 'none', color: '#fff'}} formatter={(value) => `$${value}`} cursor={{fill: 'transparent'}} />
                        <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px', color: '#adb5bd'}} />
                        <Bar dataKey="Ingresos" fill="#12a454" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="Gastos" fill="#e6374a" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PESTAÑA: MOVIMIENTOS */}
      {pestaña === 'movimientos' && (
        <div className="row g-4 animate__animated animate__fadeIn">
          <div className="col-lg-4">
            <div className="card border-0 shadow rounded-4 p-3">
              <h6 className={`fw-bold mb-3 ${idEdicion ? 'text-warning' : ''}`}>{idEdicion ? '✏️ Editando...' : '➕ Nuevo Movimiento'}</h6>
              <form onSubmit={guardarTransaccion}>
                <div className="mb-2">
                  <label className="small fw-bold">Monto</label>
                  <input type="number" step="0.01" className="form-control form-control-sm" required value={monto} onChange={(e) => setMonto(e.target.value)} />
                </div>
                <div className="mb-2">
                  <label className="small fw-bold">Categoría</label>
                  <select className="form-select form-select-sm" required value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)}>
                    <option value="">Seleccioná...</option>
                    {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.tipo === 'Ingreso' ? '🟢' : '🔴'} {cat.nombre_categoria}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="small fw-bold">Fecha</label>
                  <input type="date" className="form-control form-control-sm" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="small fw-bold">Descripción</label>
                  <input type="text" className="form-control form-control-sm" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                </div>
                <button type="submit" className={`btn btn-sm w-100 fw-bold shadow-sm ${idEdicion ? 'btn-warning' : 'btn-primary'}`}>
                  {idEdicion ? 'Actualizar' : 'Guardar'}
                </button>
                {idEdicion && <button type="button" className="btn btn-link btn-sm w-100 text-muted mt-2" onClick={limpiarFormularioMovimiento}>Cancelar</button>}
              </form>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card border-0 shadow rounded-4 p-3">
             {/* FILA DE FILTROS ACTUALIZADA */}
              {/* FILA DE FILTROS Y EXPORTACIÓN */}
              <div className="d-flex flex-column flex-md-row gap-2 mb-3 bg-dark border p-2 rounded-3 align-items-center">
                <input type="text" className="form-control form-control-sm" placeholder="🔍 Buscar..." value={textoBusqueda} onChange={(e) => setTextoBusqueda(e.target.value)} />
                <select className="form-select form-select-sm" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                </select>
                <div className="d-flex gap-2 align-items-center w-100">
                  <span className="small text-muted fw-bold ms-1">Desde:</span>
                  <input type="date" className="form-control form-control-sm text-muted bg-dark border-secondary" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                  <span className="small text-muted fw-bold">Hasta:</span>
                  <input type="date" className="form-control form-control-sm text-muted bg-dark border-secondary" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                  
                  {/* BOTÓN NUEVO DE PDF */}
                  <button className="btn btn-danger btn-sm fw-bold ms-auto px-3 d-flex align-items-center gap-1" onClick={exportarPDF} title="Descargar Extracto en PDF">
                    📄 PDF
                  </button>
                </div>
              </div>
              <div className="table-responsive" style={{maxHeight: '400px'}}>
                <table className="table table-sm table-hover">
                  <thead className="table-dark sticky-top">
                    <tr><th className="small">Fecha</th><th className="small">Categoría</th><th className="small">Detalle</th><th className="text-end small">Monto</th><th className="text-center small">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {transacciones.map(t => (
                      <tr key={t.id_transaccion}>
                        <td className="small">{t.fecha_transaccion.split('T')[0]}</td>
                        <td><span className={`badge ${t.tipo === 'Ingreso' ? 'bg-success' : 'bg-secondary'}`} style={{fontSize: '0.7rem'}}>{t.nombre_categoria}</span></td>
                        <td className="small text-truncate" style={{maxWidth: '150px'}}>{t.descripcion}</td>
                        <td className={`text-end fw-bold small ${t.tipo === 'Ingreso' ? 'text-success' : 'text-danger'}`}>{t.tipo === 'Ingreso' ? '+' : '-'}${t.monto}</td>
                        <td className="text-center">
                          <button className="btn btn-link btn-sm p-0 me-2" onClick={() => iniciarEdicion(t)}>✏️</button>
                          <button className="btn btn-link btn-sm p-0" onClick={() => eliminarTransaccion(t.id_transaccion)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PESTAÑA: CONFIGURACIÓN ACTUALIZADA CON PRESUPUESTO */}
      {pestaña === 'config' && (
        <div className="row g-4 animate__animated animate__fadeIn">
          <div className="col-lg-6 col-md-12">
            <div className="card border-0 shadow rounded-4 p-3">
              <h6 className="fw-bold mb-3 text-secondary">⚙️ Crear Categoría y Meta</h6>
              
              <form onSubmit={guardarCategoria} className="d-flex flex-column gap-2 mb-3">
                <div className="d-flex gap-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Ej: Salidas" required value={nuevaCatNombre} onChange={(e) => setNuevaCatNombre(e.target.value)} />
                  <select className="form-select form-select-sm w-50" value={nuevaCatTipo} onChange={(e) => setNuevaCatTipo(e.target.value)}>
                    <option value="Gasto">🔴 Gasto</option>
                    <option value="Ingreso">🟢 Ingreso</option>
                  </select>
                </div>
                
                {/* Mostramos el input de presupuesto solo si es un gasto */}
                {nuevaCatTipo === 'Gasto' && (
                  <input type="number" step="0.01" className="form-control form-control-sm border-primary" placeholder="Presupuesto Mensual MÁXIMO ($)" value={nuevaCatPresupuesto} onChange={(e) => setNuevaCatPresupuesto(e.target.value)} />
                )}
                
                <button type="submit" className="btn btn-primary btn-sm fw-bold w-100 mt-1">Guardar Categoría</button>
              </form>
              
              <div className="list-group list-group-flush border-top mt-2" style={{maxHeight: '250px', overflowY: 'auto'}}>
                {categorias.map(cat => (
                  <div key={cat.id_categoria} className="list-group-item d-flex justify-content-between align-items-center py-2 px-1 bg-transparent border-bottom">
                    <small className="fw-semibold text-truncate">{cat.tipo === 'Ingreso' ? '🟢' : '🔴'} {cat.nombre_categoria}</small>
                    <button className="btn btn-outline-danger btn-sm p-0 px-2 rounded-pill" style={{fontSize: '0.75rem'}} onClick={() => eliminarCategoria(cat.id_categoria)}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="col-lg-6 col-md-12">
             <div className="card border-0 shadow rounded-4 p-3 h-100" style={{border: '2px dashed #444'}}>
                <div className="d-flex flex-column align-items-center justify-content-center h-100 opacity-50">
                  <h1 className="display-4 mb-2">💡</h1>
                  <h6 className="fw-bold text-muted">Metas Inteligentes</h6>
                  <small className="text-muted text-center px-4">Cuando crees una categoría de Gasto con un presupuesto mayor a 0, aparecerá automáticamente en tu tablero principal con una barra de progreso que cambiará a amarillo y rojo según te acerques al límite.</small>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;