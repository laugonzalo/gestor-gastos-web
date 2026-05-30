import { useState, useEffect } from 'react';
import axios from 'axios';
// Importamos los componentes mágicos para el gráfico
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function App() {
  const [saldos, setSaldos] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState({ GastoActual: 0, GastoAnterior: 0, CategoriaMasGastada: '-', MontoCategoriaTop: 0 });
  
  // Nuevo estado para el gráfico
  const [datosGrafico, setDatosGrafico] = useState([]);

  const [monto, setMonto] = useState('');
  const [idCategoria, setIdCategoria] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Paleta de colores bancarios/modernos para las porciones de la torta
  const COLORES = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0', '#6c757d'];

  const cargarDatos = () => {
    axios.get('http://localhost:3000/api/saldos').then(res => setSaldos(res.data));
    axios.get('http://localhost:3000/api/transacciones').then(res => setTransacciones(res.data));
    axios.get('http://localhost:3000/api/resumen').then(res => setResumen(res.data));
    // Llamamos al nuevo endpoint del gráfico
    axios.get('http://localhost:3000/api/graficos/distribucion').then(res => setDatosGrafico(res.data));
  };

  useEffect(() => {
    cargarDatos();
    axios.get('http://localhost:3000/api/categorias').then(res => setCategorias(res.data));
  }, []);

  const guardarTransaccion = (e) => {
    e.preventDefault();
    const nuevaTransaccion = {
      id_cuenta: 1,
      id_categoria: idCategoria,
      monto: parseFloat(monto),
      fecha_transaccion: fecha,
      descripcion: descripcion
    };

    axios.post('http://localhost:3000/api/transacciones', nuevaTransaccion)
      .then(() => {
        cargarDatos(); 
        setMonto('');
        setIdCategoria('');
        setFecha('');
        setDescripcion('');
      })
      .catch(error => console.error("Error al guardar:", error));
  };

  let variacionPorcentaje = 0;
  if (resumen.GastoAnterior > 0) {
    variacionPorcentaje = (((resumen.GastoActual - resumen.GastoAnterior) / resumen.GastoAnterior) * 100).toFixed(1);
  } else if (resumen.GastoActual > 0) {
    variacionPorcentaje = 100;
  }

  const colorVariacion = variacionPorcentaje > 0 ? 'text-danger' : 'text-success';
  const flechaVariacion = variacionPorcentaje > 0 ? '📈 +' : '📉 ';

  return (
    <div className="container mt-5 mb-5">
      <h1 className="text-center mb-5 fw-bold text-dark">📊 Mi Gestor de Gastos</h1>
      
      {/* SALDO PRINCIPAL */}
      <div className="row justify-content-center mb-4">
        {saldos.map((cuenta) => (
          <div className="col-md-8 col-lg-6" key={cuenta.id_cuenta}>
            <div className="card text-white bg-primary shadow border-0 rounded-4">
              <div className="card-body text-center py-4">
                <p className="fs-5 mb-1 opacity-75">{cuenta.nombre_cuenta}</p>
                <h1 className="display-4 fw-bold mb-0">${cuenta.saldo_actual}</h1>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* KPIs ANALÍTICOS */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm border-0 rounded-4 h-100 bg-light">
            <div className="card-body text-center">
              <h6 className="text-muted text-uppercase fw-bold mb-3">Gastos de este Mes</h6>
              <h2 className="fw-bold text-dark mb-2">${resumen.GastoActual}</h2>
              <span className={`badge bg-white shadow-sm fs-6 ${colorVariacion}`}>
                {flechaVariacion}{variacionPorcentaje}% vs mes anterior
              </span>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm border-0 rounded-4 h-100 bg-light">
            <div className="card-body text-center">
              <h6 className="text-muted text-uppercase fw-bold mb-3">Mayor Fuga de Dinero</h6>
              <h2 className="fw-bold text-danger mb-2">{resumen.CategoriaMasGastada}</h2>
              <span className="text-muted fw-semibold">
                Total acumulado: ${resumen.MontoCategoriaTop}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NUEVO: GRÁFICO DE DISTRIBUCIÓN */}
      {datosGrafico.length > 0 && (
        <div className="row mb-5">
          <div className="col-12">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4 text-center">Distribución de Gastos</h5>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={datosGrafico}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {datosGrafico.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO Y TABLA */}
      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card shadow border-0 rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Nuevo Movimiento</h5>
              <form onSubmit={guardarTransaccion}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Monto ($)</label>
                  <input type="number" step="0.01" className="form-control" required 
                         value={monto} onChange={(e) => setMonto(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Categoría</label>
                  <select className="form-select" required 
                          value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)}>
                    <option value="">Seleccioná una opción...</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.tipo === 'Ingreso' ? '🟢' : '🔴'} {cat.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Fecha</label>
                  <input type="date" className="form-control" required 
                         value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold">Descripción</label>
                  <input type="text" className="form-control" placeholder="Ej: Supermercado..." required 
                         value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-dark w-100 fw-bold py-2">
                  Guardar Movimiento
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow border-0 rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Últimos Movimientos</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Categoría</th>
                      <th>Descripción</th>
                      <th className="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacciones.map((t) => (
                      <tr key={t.id_transaccion}>
                        <td>{t.fecha_transaccion.split('T')[0]}</td>
                        <td>
                          <span className={`badge ${t.tipo === 'Ingreso' ? 'bg-success' : 'bg-secondary'}`}>
                            {t.nombre_categoria}
                          </span>
                        </td>
                        <td>{t.descripcion}</td>
                        <td className={`text-end fw-bold ${t.tipo === 'Ingreso' ? 'text-success' : 'text-danger'}`}>
                          {t.tipo === 'Ingreso' ? '+' : '-'}${t.monto}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;