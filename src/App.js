import React, { useState } from 'react';
import { AnimatedLoginScreen } from './components/auth/AnimatedLoginScreen';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(true);

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'products', name: 'Produkty', icon: '🛍️' },
    { id: 'customers', name: 'Klienci', icon: '👥' },
    { id: 'orders', name: 'Zamówienia', icon: '📦' },
    { id: 'invoices', name: 'Faktury', icon: '🧾' },
    { id: 'inventory', name: 'Magazyn', icon: '📦' },
    { id: 'finance', name: 'Finanse', icon: '💰' },
    { id: 'investments', name: 'Inwestycje', icon: '📈' },
    { id: 'marketing', name: 'Marketing', icon: '📢' },
    { id: 'settings', name: 'Ustawienia', icon: '⚙️' }
  ];

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    setShowLogin(true);
  };

  const renderModule = () => {
    switch(activeModule) {
      case 'dashboard':
        return (
          <div className="module-content">
            <div className="user-welcome">
              <h2>Witaj, {user?.fullName}!</h2>
              <p>Zarządzaj swoim przedsiębiorstwem perfumeryjnym z systemem Sanguivia</p>
            </div>
            <h1>Dashboard Sanguivia</h1>
            <p>Witaj w systemie ERP/CRM dla przedsiębiorstwa perfumeryjnego!</p>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Zamówienia</h3>
                <p className="stat-number">24</p>
                <p className="stat-label">w produkcji</p>
              </div>
              <div className="stat-card">
                <h3>Produkty</h3>
                <p className="stat-number">156</p>
                <p className="stat-label">aktywne</p>
              </div>
              <div className="stat-card">
                <h3>Klienci</h3>
                <p className="stat-number">89</p>
                <p className="stat-label">zarejestrowani</p>
              </div>
              <div className="stat-card">
                <h3>Przychód</h3>
                <p className="stat-number">45,230 zł</p>
                <p className="stat-label">ten miesiąc</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="module-content">
            <h1>{modules.find(m => m.id === activeModule)?.name}</h1>
            <p>Moduł {modules.find(m => m.id === activeModule)?.name} jest w trakcie rozwoju.</p>
            <div className="coming-soon">
              <h2>🚀 Wkrótce dostępne!</h2>
              <p>Pracujemy nad tym modułem. Będzie dostępny w najbliższej aktualizacji.</p>
            </div>
          </div>
        );
    }
  };

  // Ekran logowania
  if (showLogin) {
    return <AnimatedLoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>🧴 Sanguivia</h1>
          <p>ERP/CRM System</p>
        </div>
        <nav className="sidebar-nav">
          {modules.map(module => (
            <button
              key={module.id}
              className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => setActiveModule(module.id)}
            >
              <span className="nav-icon">{module.icon}</span>
              <span className="nav-text">{module.name}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="main-content">
        <header className="header">
          <h2>{modules.find(m => m.id === activeModule)?.name}</h2>
          <div className="header-actions">
            <div className="user-info">
              <span className="user-avatar">{user?.avatar}</span>
              <span className="user-name">{user?.fullName}</span>
            </div>
            <button className="btn-primary">+ Nowy</button>
            <button className="btn-secondary" onClick={handleLogout}>Wyloguj</button>
          </div>
        </header>
        
        <main className="content">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}

export default App;
