import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from './Api';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsDashboard = () => {
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [salesRes, inventoryRes] = await Promise.all([
        api.get(`/products/analytics/sales/?period=${period}`),
        api.get('/products/analytics/inventory/'),
      ]);
      setSalesData(salesRes.data);
      setInventoryData(inventoryRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!salesData) return;

    // Crear CSV con datos de ventas
    const headers = ['Fecha', 'Ventas'];
    const rows = salesData.sales_by_day.map(item => [
      item.date,
      item.total.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventas_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div style={styles.loading}>Cargando analíticas...</div>;
  }

  // Configuración del gráfico de líneas (ventas por día)
  const lineChartData = {
    labels: salesData?.sales_by_day.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Ventas ($)',
        data: salesData?.sales_by_day.map(d => d.total) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tendencia de Ventas',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Configuración del gráfico de barras (productos más vendidos)
  const barChartData = {
    labels: salesData?.top_products.slice(0, 5).map(p => p.product__name) || [],
    datasets: [
      {
        label: 'Cantidad Vendida',
        data: salesData?.top_products.slice(0, 5).map(p => p.total_quantity) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top 5 Productos Más Vendidos',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Configuración del gráfico de dona (distribución de stock)
  const doughnutChartData = {
    labels: ['Sin Stock', 'Stock Bajo (1-10)', 'Stock Medio (11-50)', 'Stock Alto (50+)'],
    datasets: [
      {
        data: [
          inventoryData?.stock_distribution.out_of_stock || 0,
          inventoryData?.stock_distribution.low_stock || 0,
          inventoryData?.stock_distribution.medium_stock || 0,
          inventoryData?.stock_distribution.high_stock || 0,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Distribución de Stock',
      },
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Analíticas y Reportes</h2>
        <div style={styles.headerActions}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={styles.periodSelect}
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
            <option value="all">Todo el tiempo</option>
          </select>
          <button onClick={handleExportCSV} style={styles.exportButton}>
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>💰</div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>Ventas Totales</div>
            <div style={styles.metricValue}>
              ${salesData?.total_sales.toFixed(2)}
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>🛒</div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>Órdenes</div>
            <div style={styles.metricValue}>{salesData?.total_orders}</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>📦</div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>Items Vendidos</div>
            <div style={styles.metricValue}>{salesData?.total_items_sold}</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>💳</div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>Valor Promedio</div>
            <div style={styles.metricValue}>
              ${salesData?.avg_order_value.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={{ height: '300px' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Inventario y productos más vendidos */}
      <div style={styles.bottomGrid}>
        <div style={styles.inventoryCard}>
          <h3 style={styles.sectionTitle}>📦 Resumen de Inventario</h3>
          <div style={styles.inventoryStats}>
            <div style={styles.inventoryStat}>
              <span style={styles.inventoryLabel}>Total Productos:</span>
              <span style={styles.inventoryValue}>
                {inventoryData?.total_products}
              </span>
            </div>
            <div style={styles.inventoryStat}>
              <span style={styles.inventoryLabel}>Activos:</span>
              <span style={{ ...styles.inventoryValue, color: '#22c55e' }}>
                {inventoryData?.active_products}
              </span>
            </div>
            <div style={styles.inventoryStat}>
              <span style={styles.inventoryLabel}>Inactivos:</span>
              <span style={{ ...styles.inventoryValue, color: '#ef4444' }}>
                {inventoryData?.inactive_products}
              </span>
            </div>
            <div style={styles.inventoryStat}>
              <span style={styles.inventoryLabel}>Valor Total Stock:</span>
              <span style={styles.inventoryValue}>
                ${inventoryData?.total_stock_value.toFixed(2)}
              </span>
            </div>
            <div style={styles.inventoryStat}>
              <span style={styles.inventoryLabel}>Precio Promedio:</span>
              <span style={styles.inventoryValue}>
                ${inventoryData?.avg_price.toFixed(2)}
              </span>
            </div>
          </div>
          <div style={{ height: '250px', marginTop: '20px' }}>
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          </div>
        </div>

        <div style={styles.topProductsCard}>
          <h3 style={styles.sectionTitle}>🏆 Productos Más Vendidos</h3>
          <div style={styles.topProductsList}>
            {salesData?.top_products.slice(0, 10).map((product, index) => (
              <div key={index} style={styles.topProductItem}>
                <div style={styles.topProductRank}>{index + 1}</div>
                <div style={styles.topProductInfo}>
                  <div style={styles.topProductName}>{product.product__name}</div>
                  <div style={styles.topProductShop}>{product.product__shop__name}</div>
                </div>
                <div style={styles.topProductStats}>
                  <div style={styles.topProductQuantity}>
                    {product.total_quantity} vendidos
                  </div>
                  <div style={styles.topProductRevenue}>
                    ${product.total_revenue.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#6b7280',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  periodSelect: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  exportButton: {
    background: '#22c55e',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  metricCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  metricIcon: {
    fontSize: '36px',
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  chartCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '16px',
  },
  inventoryCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
  },
  topProductsCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: '16px',
  },
  inventoryStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inventoryStat: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  inventoryLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  inventoryValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
  },
  topProductsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  topProductItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  topProductRank: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    flexShrink: 0,
  },
  topProductInfo: {
    flex: 1,
    minWidth: 0,
  },
  topProductName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  topProductShop: {
    fontSize: '12px',
    color: '#6b7280',
  },
  topProductStats: {
    textAlign: 'right',
    flexShrink: 0,
  },
  topProductQuantity: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '2px',
  },
  topProductRevenue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#22c55e',
  },
};

export default AnalyticsDashboard;
