function DashboardPage() {
  return(
    <main className="dashboard-page">
      <section className="dashboard-panel" aria-labelledby="dashboard-title">
        <h1 className="dashboard-title" id="dashboard-title">Dashboard</h1>
        <p className="dashboard-description">
          Welcome to your secure vault dashboard. Here you can manage your credentials, view your saved passwords, and update your account settings.
        </p>
      </section>
    </main>
  )
}

export default DashboardPage;
