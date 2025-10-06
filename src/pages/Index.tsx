import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';
import Landing from './Landing';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLanding, setShowLanding] = useState(false);

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleLogout = async () => {
    await signOut();
    setShowLanding(false);
  };

  const handleBackToLanding = () => {
    setShowLanding(true);
  };

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show landing page if not authenticated or user wants to see landing
  if (!user || showLanding) {
    return <Landing onLogin={handleLogin} />;
  }

  // Show dashboard for authenticated users
  return (
    <Dashboard 
      onLogout={handleLogout} 
      onBackToLanding={handleBackToLanding}
    />
  );
};

export default Index;
