import React from 'react';
import {
  Compass,
  Home,
  ShieldAlert,
  CalendarDays,
  Store,
  Star,
  User,
  BookOpen,
  FileWarning,
  LayoutDashboard,
  BellRing,
  CheckSquare,
  Briefcase,
  Calendar,
  Car,
  UtensilsCrossed,
  Users,
} from 'lucide-react';

export type UserRole = 'tourist' | 'business' | 'community' | 'authority' | 'admin';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ReactElement;
}

export const getBusinessNavItems = (primaryType?: string): NavItemConfig[] => {
  switch (primaryType) {
    case 'transport':
      return [
        { id: 'today', label: 'Ride Orders', icon: React.createElement(Car, { size: 20 }) },
        { id: 'listings', label: 'Fleet & Vehicles', icon: React.createElement(Car, { size: 20 }) },
        { id: 'reviews', label: 'Passenger Reviews', icon: React.createElement(Star, { size: 20 }) },
        { id: 'profile', label: 'Fleet Profile', icon: React.createElement(User, { size: 20 }) },
      ];
    case 'restaurant':
      return [
        { id: 'listings', label: 'Menu & Dishes', icon: React.createElement(UtensilsCrossed, { size: 20 }) },
        { id: 'reviews', label: 'Diner Reviews', icon: React.createElement(Star, { size: 20 }) },
        { id: 'profile', label: 'Kitchen Profile', icon: React.createElement(User, { size: 20 }) },
      ];
    case 'activity':
      return [
        { id: 'today', label: 'Events & Bookings', icon: React.createElement(Compass, { size: 20 }) },
        { id: 'listings', label: 'Activities & Passes', icon: React.createElement(Compass, { size: 20 }) },
        { id: 'availability', label: 'Season Calendar', icon: React.createElement(Calendar, { size: 20 }) },
        { id: 'reviews', label: 'Reviews', icon: React.createElement(Star, { size: 20 }) },
        { id: 'profile', label: 'Organizer Profile', icon: React.createElement(User, { size: 20 }) },
      ];
    case 'hotel':
    default:
      return [
        { id: 'today', label: 'Today', icon: React.createElement(CalendarDays, { size: 20 }) },
        { id: 'listings', label: 'Listings', icon: React.createElement(Store, { size: 20 }) },
        { id: 'availability', label: 'Availability', icon: React.createElement(Calendar, { size: 20 }) },
        { id: 'reviews', label: 'Reviews', icon: React.createElement(Star, { size: 20 }) },
        { id: 'profile', label: 'Profile', icon: React.createElement(User, { size: 20 }) },
      ];
  }
};

export const ROLE_NAV_ITEMS: Record<UserRole, NavItemConfig[]> = {
  tourist: [
    { id: 'home', label: 'Explore', icon: React.createElement(Home, { size: 20 }) },
    { id: 'explore', label: 'Explore', icon: React.createElement(Compass, { size: 20 }) },
    { id: 'trips', label: 'Trips', icon: React.createElement(CalendarDays, { size: 20 }) },
    { id: 'safety', label: 'Safety', icon: React.createElement(ShieldAlert, { size: 20 }) },
    { id: 'profile', label: 'Profile', icon: React.createElement(User, { size: 20 }) },
  ],
  business: [
    { id: 'today', label: 'Today', icon: React.createElement(CalendarDays, { size: 20 }) },
    { id: 'listings', label: 'Listings', icon: React.createElement(Store, { size: 20 }) },
    { id: 'availability', label: 'Availability', icon: React.createElement(Calendar, { size: 20 }) },
    { id: 'reviews', label: 'Reviews', icon: React.createElement(Star, { size: 20 }) },
    { id: 'profile', label: 'Profile', icon: React.createElement(User, { size: 20 }) },
  ],
  community: [
    { id: 'stories', label: 'Stories', icon: React.createElement(BookOpen, { size: 20 }) },
    { id: 'report', label: 'Report', icon: React.createElement(FileWarning, { size: 20 }) },
    { id: 'hosts', label: 'Services', icon: React.createElement(Briefcase, { size: 20 }) },
    { id: 'profile', label: 'Profile', icon: React.createElement(User, { size: 20 }) },
  ],
  authority: [
    { id: 'overview', label: 'Overview', icon: React.createElement(LayoutDashboard, { size: 20 }) },
    { id: 'users', label: 'User Management', icon: React.createElement(Users, { size: 20 }) },
    { id: 'directory', label: 'Directory', icon: React.createElement(Store, { size: 20 }) },
    { id: 'advisories', label: 'Advisories', icon: React.createElement(BellRing, { size: 20 }) },
    { id: 'approvals', label: 'Approvals', icon: React.createElement(CheckSquare, { size: 20 }) },
    { id: 'cases', label: 'Cases', icon: React.createElement(Briefcase, { size: 20 }) },
  ],
  admin: [
    { id: 'overview', label: 'Overview', icon: React.createElement(LayoutDashboard, { size: 20 }) },
    { id: 'users', label: 'User Management', icon: React.createElement(Users, { size: 20 }) },
    { id: 'directory', label: 'Directory', icon: React.createElement(Store, { size: 20 }) },
    { id: 'approvals', label: 'Approvals', icon: React.createElement(CheckSquare, { size: 20 }) },
    { id: 'cases', label: 'Cases & SOS', icon: React.createElement(Briefcase, { size: 20 }) },
    { id: 'advisories', label: 'Advisories', icon: React.createElement(BellRing, { size: 20 }) },
  ],
};
