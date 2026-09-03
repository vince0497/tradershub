import * as React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/userAuthContext';

interface IProtectedRoutesProps {
}

const ProtectedRoutes: React.FunctionComponent<IProtectedRoutesProps> = () => {
    const location = useLocation();
    const { user, loading } = useAuth();

if (loading) {
    return <div>Loading...</div>;
}
  
    return user ? (
        <Outlet />
    ) : (
        <Navigate to="/login" state={{ from: location }} replace />
    );
};

export default ProtectedRoutes;
