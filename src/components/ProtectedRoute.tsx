import React from 'react';
import {Link, Navigate} from 'react-router-dom';
import {useApp} from '../context/AppContext';

export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRoles?: Array<'farmer' | 'expert' | 'admin'>;
}> = ({children, requiredRoles}) => {
  const {user, loadingAuth} = useApp();

  if (loadingAuth) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-sm text-[#183B2B]/70">
        Checking account session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.some((r) => user.roles.includes(r))) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="rounded-3xl bg-white border border-[#183B2B]/10 p-8 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-[#183B2B]">Access Restricted</h1>
          <p className="text-sm text-[#183B2B]/80">
            Your account does not have permission to open this workspace.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-[#16803C] text-white text-sm font-semibold"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
