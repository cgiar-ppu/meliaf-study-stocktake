// Redirect file - keeping for compatibility
// The main dashboard is now at Dashboard.tsx
import { Navigate } from 'react-router-dom';

const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
