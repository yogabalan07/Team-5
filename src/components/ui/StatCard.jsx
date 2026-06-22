// Reusable stat card component for dashboard metrics.
function StatCard({ label = 'Metric', value = '0' }) {
  return (
    <section className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

export default StatCard;
