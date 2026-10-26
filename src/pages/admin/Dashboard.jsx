import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  ArrowUpRight,
  Eye,
  Package,
  Plus,
  ShoppingBasket,
  Users,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Truck,
  Lock
} from 'lucide-react';
import { Badge, Button, StatusBadge, money } from '../../components/ui';
import { adminService } from '../../services/admin.service';
import { hasPermission } from '../../utils/permissions';

function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('r2cart-admin-user')) || null;
  } catch {
    return null;
  }
}

function adminName() {
  const u = getAdminUser();
  return u?.name?.trim().split(/\s+/)[0] || 'Admin';
}

function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
}

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getAdminUser();
  const isSuper = user?.role === 'SUPER_ADMIN' || user?.staffRole === 'SUPER_ADMIN';
  const basePath = isSuper ? '/super-admin' : '/admin';

  const canCreateProducts = isSuper || hasPermission(user, 'products.create');
  const canViewOrders = isSuper || hasPermission(user, 'orders.view');
  const canViewInventory = isSuper || hasPermission(user, 'inventory.view');
  const canViewCustomers = isSuper || hasPermission(user, 'customers.view_limited');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminService.dashboard());
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!active) return;
      adminService
        .dashboard()
        .then(value => {
          if (active) {
            setData(value);
            setError('');
          }
        })
        .catch(reason => {
          if (active) setError(reason.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    refresh();
    const timer = setInterval(refresh, 60000);
    
    window.addEventListener('r2cart:orders-updated', refresh);
    window.addEventListener('r2cart:products-updated', refresh);
    return () => {
      active = false;
      clearInterval(timer);
      
      window.removeEventListener('r2cart:orders-updated', refresh);
      window.removeEventListener('r2cart:products-updated', refresh);
    };
  }, []);

  const s = data?.stats;
  const hasFinancial = data?.hasFinancialAccess !== false && s?.totalRevenue !== null;

  const stats = s
    ? [
        ['Today’s orders', s.todayOrders, 'Placed today · India time', Package, 'green'],
        ['Pending orders', s.pending, 'New through out for delivery', AlertTriangle, 'amber'],
        ['Unassigned orders', s.unassignedOrders ?? 0, 'Awaiting delivery assignment', Truck, 'amber'],
        ...(hasFinancial
          ? [
              ['Total revenue', money(s.totalRevenue), 'Delivered orders · all time', Wallet, 'blue'],
              ['COD Collected', money(s.codCollected ?? 0), 'Doorstep cash collections', Wallet, 'green'],
              ['COD Pending Settlement', money(s.codPendingSettlement ?? 0), 'With delivery personnel', AlertTriangle, 'amber']
            ]
          : []),
        ['Delivery Staff', `${s.availableDeliveryStaff ?? 0} on duty / ${s.totalDeliveryStaff ?? 0} total`, 'Field staff availability', Users, 'teal'],
        ['POD Verification Queue', s.verificationQueueCount ?? 0, 'Proofs awaiting audit', Eye, 'purple'],
        ...(canViewCustomers ? [['Total customers', s.totalCustomers, 'Registered customer accounts', Users, 'purple']] : []),
        ['Low stock products', s.lowStock, 'At or below stock threshold', AlertTriangle, 'amber'],
        ['Out of stock', s.outOfStock, 'Packs with zero available stock', ShoppingBasket, 'purple']
      ]
    : [];

  const totalStatus = data?.orderStatus?.reduce((sum, row) => sum + row.value, 0) || 0;

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Welcome, {adminName()}</h1>
          <p>
            Live store overview · India time
            {data &&
              ` · Updated ${new Date(data.generatedAt).toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit'
              })}`}
          </p>
        </div>
        <div className="bulk-upload-actions">
          <Button variant="outline" disabled={loading} onClick={load}>
            <RefreshCw size={17} /> Refresh
          </Button>
          {canCreateProducts && (
            <Link className="btn btn-primary" to={`${basePath}/products/new`}>
              <Plus /> Add product
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="admin-card bulk-error" role="alert">
          <p>{error}</p>
          {data && <p>Showing the last loaded snapshot; refresh to get current data.</p>}
          <Button variant="outline" disabled={loading} onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {loading && !data && (
        <div className="stats-grid" role="status" aria-label="Loading dashboard">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="stat-card dashboard-skeleton" key={index}>
              <i />
              <span />
              <span />
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="stats-grid">
            {stats.map(row => (
              <Stat key={row[0]} data={row} />
            ))}
          </div>

          <div className="dashboard-grid">
            <section className="admin-card chart-card">
              <CardHead
                title="Sales overview"
                text={
                  hasFinancial
                    ? 'Last 7 days · delivered order value by order date'
                    : 'Revenue details restricted to authorized financial administrators'
                }
              />
              {hasFinancial ? (
                data.sales && data.sales.some(row => row.v > 0) ? (
                  <ResponsiveContainer width="100%" height={270}>
                    <AreaChart data={data.sales}>
                      <defs>
                        <linearGradient id="dashboard-sales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#168447" stopOpacity={0.25} />
                          <stop offset="1" stopColor="#168447" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#edf0ec" vertical={false} />
                      <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} width={55} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={value => [money(value), 'Delivered sales']} />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="#168447"
                        fill="url(#dashboard-sales)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <PanelEmpty text="No delivered sales for orders placed in the last 7 days." />
                )
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                  <Lock size={24} style={{ margin: '0 auto 8px', color: '#9ca3af' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    Financial revenue charts are hidden for this restricted staff account.
                  </p>
                </div>
              )}
            </section>

            <section className="admin-card status-chart">
              <CardHead title="Order status" text={`${totalStatus} orders placed this month`} />
              {totalStatus ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.orderStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={82}
                        paddingAngle={4}
                      >
                        {data.orderStatus.map(row => (
                          <Cell fill={row.color} key={row.name} />
                        ))}
                      </Pie>
                      <Tooltip formatter={value => [value, 'Orders']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="legend">
                    {data.orderStatus.map(row => (
                      <span key={row.name}>
                        <i style={{ background: row.color }} />
                        {row.name}
                        <b>{row.value}</b>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <PanelEmpty text="No orders have been placed this month." />
              )}
            </section>
          </div>

          <div className="dashboard-grid lower">
            <section className="admin-card">
              <CardHead
                title="Recent orders"
                text="Latest store activity"
                link={canViewOrders ? `${basePath}/orders` : null}
              />
              <OrderTable list={data.recentOrders} basePath={basePath} canViewOrders={canViewOrders} />
            </section>

            <section className="admin-card">
              <CardHead
                title="Stock alerts"
                text="Out-of-stock packs and products below their threshold"
                link={canViewInventory ? `${basePath}/inventory` : null}
              />
              {data.lowStockProducts.length ? (
                data.lowStockProducts.map(product => (
                  <Link
                    to={canViewInventory ? `${basePath}/inventory` : '#'}
                    className="stock-alert"
                    key={product.id}
                  >
                    {product.image && <img src={product.image} alt="" />}
                    <div>
                      <b>{product.name}</b>
                      <small>
                        {product.unit} · Alert threshold: {product.lowStockThreshold}
                      </small>
                    </div>
                    <span className={!product.stock ? 'danger' : ''}>
                      {product.stock ? `${product.stock} left` : 'Out of stock'}
                    </span>
                  </Link>
                ))
              ) : (
                <PanelEmpty text="Stock levels are healthy. No products need restocking." />
              )}
            </section>
          </div>

          <div className="dashboard-grid lower">
            <section className="admin-card">
              <CardHead
                title="Top selling products"
                text="Delivered orders placed this month"
                link={`${basePath}/products`}
              />
              {data.topProducts.length ? (
                data.topProducts.map((product, index) => (
                  <div className="rank-row" key={product.id}>
                    <b>{String(index + 1).padStart(2, '0')}</b>
                    {product.image && <img src={product.image} alt="" />}
                    <span>
                      {product.name}
                      <small>
                        {product.unit} · {product.unitsSold} units sold
                      </small>
                    </span>
                    {hasFinancial && product.revenue !== null && (
                      <strong>{money(product.revenue)}</strong>
                    )}
                  </div>
                ))
              ) : (
                <PanelEmpty text="Top sellers will appear once this month’s orders are delivered." />
              )}
            </section>

            {canViewCustomers && (
              <section className="admin-card">
                <CardHead
                  title="Recent customers"
                  text="Most recently registered shoppers"
                  link={`${basePath}/customers`}
                />
                {data.recentCustomers.length ? (
                  data.recentCustomers.map(customer => (
                    <Link to={`${basePath}/customers`} className="customer-row" key={customer.id}>
                      <div>
                        {customer.name
                          ?.split(' ')
                          .filter(Boolean)
                          .map(word => word[0])
                          .join('')
                          .slice(0, 2) || '?'}
                      </div>
                      <span>
                        <b>{customer.name}</b>
                        <small>
                          {customer.email} · Joined {dateLabel(customer.joinedAt)}
                        </small>
                      </span>
                      <Badge>{customer.orders} orders</Badge>
                    </Link>
                  ))
                ) : (
                  <PanelEmpty text="No customer accounts have been created yet." />
                )}
              </section>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Stat({ data: [title, value, note, Icon, tone] }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon />
      </div>
      <span>{title}</span>
      <h2>{value}</h2>
      <small>{note}</small>
    </div>
  );
}

function CardHead({ title, text, link }) {
  return (
    <div className="card-head">
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      {link && (
        <Link to={link}>
          View all <ArrowUpRight />
        </Link>
      )}
    </div>
  );
}

function PanelEmpty({ text }) {
  return <div className="dashboard-empty">{text}</div>}

function OrderTable({ list, basePath, canViewOrders }) {
  if (!list?.length) return <PanelEmpty text="No orders yet. New orders will appear here." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order & Schedule</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map(order => (
            <tr key={order.id}>
              <td>
                <b>#{order.orderNumber || order.id}</b>
                <small>{dateLabel(order.date)}</small>
                <div style={{ marginTop: '4px' }}>
                  {order.deliveryType === 'SCHEDULED' ? (
                    <span className="schedule-badge">
                      📅 {order.deliveryDate} · {order.deliverySlot}
                    </span>
                  ) : (
                    <span className="instant-badge">⚡ Instant</span>
                  )}
                </div>
              </td>
              <td>{order.customer || 'Customer unavailable'}</td>
              <td>{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</td>
              <td>
                <b>{money(order.total)}</b>
              </td>
              <td>
                <StatusBadge status={order.status} />
              </td>
              <td>
                {canViewOrders && (
                  <Link
                    className="icon-btn"
                    aria-label={`View order ${order.orderNumber || order.id}`}
                    to={`${basePath}/orders/${order.id}`}
                  >
                    <Eye />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
