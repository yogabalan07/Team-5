// Dashboard page placeholder for future inventory overview metrics.
import Header from '../components/layout/Header.jsx';
import StatCard from '../components/ui/StatCard.jsx';

function Dashboard() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="stat-grid">
        <StatCard label="Products" value="0" />
        <StatCard label="Low Stock Items" value="0" />
        <StatCard label="Pending Orders" value="0" />
      </div>
    </>
  );
}

export default Dashboard;
