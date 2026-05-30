import { useState, useEffect } from 'react';
import axios from 'axios';
// Importamos los componentes para los gráficos (Torta y Barras)
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

function App() {
  const [saldos, setSaldos] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState({ GastoActual: 0, GastoAnterior: 0, CategoriaMasGastada: '-', MontoCategoriaTop: 0 });
  
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [datosEvolucion, setDatosEvolucion] = useState([]); // NUEVO ESTADO PARA EL GRÁFICO DE BARRAS

  const [pestaña, setPestaña] = useState('cartera'); 

  const [monto, setMonto] = useState('');
  const [idCategoria, setIdCategoria] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaCatTipo, setNuevaCatTipo] = useState('Gasto');
  const [idEdicion, setIdEdicion] = useState(null);

  const COLORES = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0', '#6c757d'];

  const traerTransacciones = () => {
    let url = 'http://localhost:3000/api/transacciones?';
    if (textoBusqueda) url += `busqueda=${textoBusqueda}&`;
    if (filtroCategoria) url += `id_categoria=${filtroCategoria}`;
    axios.get(url).then(res => setTransacciones(res.data)).catch(error => console.error(error));
  };

  const cargarDatosPrincipales = () => {
    axios.get('http://localhost:3000/api/saldos').then(res => setSaldos(res.data));
    axios.get('http://localhost:3000/api/resumen').then(res => setResumen(res.data));
    axios.get('http://localhost:3000/api/graficos/distribucion').then(res => setDatosGrafico(res.data));
    // Llamamos al nuevo endpoint de evolución
    axios.get('http://localhost:3000/api/graficos/evolucion').then(res => setDatosEvolucion(res.data));
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

  const limpiarFormularioMovimiento = () => {
    setMonto(''); setIdCategoria(''); setFecha(''); setDescripcion(''); setIdEdicion(null);
  };

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
    axios.post('http://localhost:3000/api/categorias', { nombre_categoria: nuevaCatNombre, tipo: nuevaCatTipo })
      .then(() => { cargarCategorias(); setNuevaCatNombre(''); }).catch(error => console.error(error));
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
    <div className="container-fluid px-4 py-3 bg-white min-vh-100">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0">📊 Gestor Pro</h4>
        {saldos.map((cuenta) => (
          <div className="badge bg-primary fs-5 px-3 py-2 rounded-pill shadow-sm" key={cuenta.id_cuenta}>
            {cuenta.nombre_cuenta}: ${cuenta.saldo_actual}
          </div>
        ))}
      </div>

      <ul className="nav nav-pills nav-fill bg-light p-1 rounded-4 mb-4 shadow-sm">
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

      {/* 1. PESTAÑA: CARTERA (Actualizada con gráfico de barras) */}
      {pestaña === 'cartera' && (
        <div className="animate__animated animate__fadeIn">
          
          {/* Fila Superior: KPIs y Torta */}
          <div className="row g-4 mb-4">
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
                <h6 className="fw-bold text-muted mb-4 text-uppercase" style={{fontSize: '0.8rem'}}>Resumen Analítico</h6>
                <div className="d-flex flex-column gap-4">
                  <div>
                    <h3 className="fw-bold mb-0">${resumen.GastoActual}</h3>
                    <p className="text-muted small">Gastos acumulados este mes</p>
                    <span className={`badge bg-light ${colorVariacion} border`}>
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
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
                <h6 className="fw-bold text-muted mb-4 text-uppercase text-center" style={{fontSize: '0.8rem'}}>Distribución de Gastos</h6>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={datosGrafico} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {datosGrafico.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '12px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

{/* NUEVA Fila Inferior: Gráfico de Evolución de Barras */}
{datosEvolucion.length > 0 && (
  <div className="row">
    <div className="col-12">
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h6 className="fw-bold text-muted mb-4 text-uppercase text-center" style={{fontSize: '0.8rem'}}>Evolución Mensual (Ingresos vs Gastos)</h6>
        <div style={{ width: '100%', height: 220 }}> {/* 1. Altura reducida a 220 */}
          <ResponsiveContainer>
            <BarChart data={datosEvolucion} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
              <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} width={80} /> {/* 3. Ancho del eje Y ajustado */}
              <Tooltip formatter={(value) => `$${value}`} cursor={{fill: 'transparent'}} />
              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
              <Bar dataKey="Ingresos" fill="#198754" radius={[4, 4, 0, 0]} barSize={20} /> {/* 2. Barras más finitas */}
              <Bar dataKey="Gastos" fill="#dc3545" radius={[4, 4, 0, 0]} barSize={20} />
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
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <h6 className="fw-bold mb-3">{idEdicion ? '✏️ Editando...' : '➕ Nuevo Movimiento'}</h6>
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
                <button type="submit" className={`btn btn-sm w-100 fw-bold ${idEdicion ? 'btn-warning' : 'btn-dark'}`}>{idEdicion ? 'Actualizar' : 'Guardar'}</button>
                {idEdicion && <button type="button" className="btn btn-link btn-sm w-100 text-muted mt-2" onClick={limpiarFormularioMovimiento}>Cancelar</button>}
              </form>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="d-flex flex-column flex-md-row gap-2 mb-3">
                <input type="text" className="form-control form-control-sm" placeholder="🔍 Buscar descripción..." value={textoBusqueda} onChange={(e) => setTextoBusqueda(e.target.value)} />
                <select className="form-select form-select-sm" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                </select>
              </div>
              <div className="table-responsive" style={{maxHeight: '400px'}}>
                <table className="table table-sm table-hover">
                  <thead className="table-light sticky-top">
                    <tr><th className="small">Fecha</th><th className="small">Categoría</th><th className="small">Detalle</th><th className="text-end small">Monto</th><th className="text-center small">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {transacciones.map(t => (
                      <tr key={t.id_transaccion}>
                        <td className="small">{t.fecha_transaccion.split('T')[0]}</td>
                        <td><span className={`badge bg-opacity-10 text-dark border ${t.tipo === 'Ingreso' ? 'bg-success' : 'bg-secondary'}`} style={{fontSize: '0.7rem'}}>{t.nombre_categoria}</span></td>
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

      {/* 3. PESTAÑA: CONFIGURACIÓN */}
      {pestaña === 'config' && (
        <div className="row g-4 animate__animated animate__fadeIn">
          <div className="col-lg-5 col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <h6 className="fw-bold mb-3 text-secondary">⚙️ Categorías</h6>
              <form onSubmit={guardarCategoria} className="d-flex gap-2 mb-3">
                <input type="text" className="form-control form-control-sm" placeholder="Nueva..." required value={nuevaCatNombre} onChange={(e) => setNuevaCatNombre(e.target.value)} />
                <select className="form-select form-select-sm w-50" value={nuevaCatTipo} onChange={(e) => setNuevaCatTipo(e.target.value)}>
                  <option value="Gasto">🔴 Gasto</option>
                  <option value="Ingreso">🟢 Ingreso</option>
                </select>
                <button type="submit" className="btn btn-primary btn-sm fw-bold px-3">Crear</button>
              </form>
              <div className="list-group list-group-flush border-top" style={{maxHeight: '280px', overflowY: 'auto'}}>
                {categorias.map(cat => (
                  <div key={cat.id_categoria} className="list-group-item d-flex justify-content-between align-items-center py-2 px-1 bg-transparent border-bottom border-light">
                    <small className="fw-semibold text-truncate">{cat.tipo === 'Ingreso' ? '🟢' : '🔴'} {cat.nombre_categoria}</small>
                    <button className="btn btn-outline-danger btn-sm p-0 px-2 rounded-pill" style={{fontSize: '0.75rem'}} onClick={() => eliminarCategoria(cat.id_categoria)}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-7 col-md-6">
             <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6'}}>
                <div className="d-flex flex-column align-items-center justify-content-center h-100 opacity-50">
                  <h1 className="display-4 mb-2">🛠️</h1>
                  <h6 className="fw-bold text-muted">Próximamente</h6>
                  <small className="text-muted text-center px-4">Este espacio está reservado para futuras opciones como presupuestos mensuales, modo oscuro, exportación a Excel y gestión de perfil.</small>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;