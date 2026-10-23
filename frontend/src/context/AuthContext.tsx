import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';
import type { UserRole } from '../layouts/navItems';

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  full_name: string;
  language: string;
  avatar_url?: string;
  status: string;
  theme?: 'lake';
  reduce_effects?: boolean;
  created_at: string;
  tourist_profile?: {
    id: string;
    home_city?: string;
    nationality?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  };
  business_profile?: {
    id: string;
    business_name: string;
    primary_type: string;
    accommodation_type?: string;
    registration_no?: string;
    contact_phone: string;
    whatsapp_number?: string;
    address_text?: string;
    verification_status: string;
    rejection_reason?: string;
  };
  community_profile?: {
    id: string;
    member_type: string;
    bio?: string;
    is_host_approved: boolean;
  };
  authority_profile?: {
    id: string;
    department: string;
    designation?: string;
    can_verify_businesses: boolean;
    can_publish_advisories: boolean;
  };
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserProfile;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<UserProfile>;
  demoLogin: (role: string) => Promise<UserProfile>;
  register: (data: Record<string, unknown>) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('swat_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const role: UserRole = user?.role || 'tourist';

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('swat_token');

    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await apiRequest<UserProfile>('/auth/me');
      setUser(data);
      localStorage.setItem('swat_theme', 'lake');
      document.documentElement.setAttribute('data-theme', 'lake');
      window.dispatchEvent(new CustomEvent('swat_theme_change', { detail: { theme: 'lake' } }));

      if (data.reduce_effects !== undefined) {
        localStorage.setItem('swat_reduce_effects', String(data.reduce_effects));
        if (data.reduce_effects) {
          document.documentElement.setAttribute('data-reduce-effects', 'true');
        } else {
          document.documentElement.removeAttribute('data-reduce-effects');
        }
      }
    } catch {
      localStorage.removeItem('swat_token');
      localStorage.removeItem('swat_refresh_token');
      localStorage.removeItem('swat_demo_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleAuthSuccess = (data: AuthResponse): UserProfile => {
    localStorage.setItem('swat_token', data.access_token);
    localStorage.setItem('swat_refresh_token', data.refresh_token);
    setToken(data.access_token);
    setUser(data.user);

    localStorage.setItem('swat_theme', 'lake');
    document.documentElement.setAttribute('data-theme', 'lake');
    window.dispatchEvent(new CustomEvent('swat_theme_change', { detail: { theme: 'lake' } }));

    if (data.user?.reduce_effects !== undefined) {
      localStorage.setItem('swat_reduce_effects', String(data.user.reduce_effects));
      if (data.user.reduce_effects) {
        document.documentElement.setAttribute('data-reduce-effects', 'true');
      } else {
        document.documentElement.removeAttribute('data-reduce-effects');
      }
    }
    return data.user;
  };

  const login = async (username: string, password: string): Promise<UserProfile> => {
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return handleAuthSuccess(data);
  };

  const demoLogin = async (demoRole: string): Promise<UserProfile> => {
    const data = await apiRequest<AuthResponse>(`/auth/demo-login/${demoRole}`, {
      method: 'POST',
    });
    return handleAuthSuccess(data);
  };

  const register = async (regData: Record<string, unknown>): Promise<UserProfile> => {
    const data = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(regData),
    });
    return handleAuthSuccess(data);
  };

  const logout = () => {
    localStorage.removeItem('swat_token');
    localStorage.removeItem('swat_refresh_token');
    localStorage.removeItem('swat_demo_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const mockDefaultUser: UserProfile = {
  id: 'mock-user-1',
  role: 'tourist',
  full_name: 'Sara Ahmed',
  language: 'en',
  status: 'active',
  created_at: new Date().toISOString(),
  tourist_profile: {
    id: 'tp-1',
    home_city: 'Islamabad',
    nationality: 'Pakistani',
    emergency_contact_name: 'Ali Ahmed',
    emergency_contact_phone: '+923001234567',
  },
  business_profile: {
    id: 'bp-1',
    business_name: 'Swat Serena Hotel',
    primary_type: 'hotel',
    registration_no: 'KP-HOTEL-SERENA-001',
    contact_phone: '+923001234567',
    verification_status: 'unsubmitted',
  },
  community_profile: {
    id: 'cp-1',
    member_type: 'host',
    bio: 'Local trekking guide and host in Swat Valley.',
    is_host_approved: true,
  },
  authority_profile: {
    id: 'ap-1',
    department: 'KP Tourism Department',
    designation: 'Tourism Officer',
    can_verify_businesses: true,
    can_publish_advisories: true,
  },
};

const defaultTestContext: AuthContextType = {
  user: mockDefaultUser,
  role: 'tourist',
  token: 'mock_jwt_token',
  isAuthenticated: true,
  isLoading: false,
  login: async () => mockDefaultUser,
  demoLogin: async () => mockDefaultUser,
  register: async () => mockDefaultUser,
  logout: () => {},
  refreshUser: async () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultTestContext;
  }
  return context;
};

