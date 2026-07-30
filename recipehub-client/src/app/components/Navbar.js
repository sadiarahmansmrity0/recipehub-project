'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Menu, X, Sun, Moon, LogOut, User, LayoutDashboard, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, theme, toggleTheme, logout } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  const isActive = (path) => pathname === path;

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Browse Recipes', href: '/recipes' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border-custom transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent tracking-tight">
                RecipeHub
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-brand'
                    : 'text-foreground-custom/80 hover:text-brand'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Section: Theme Toggle & User Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-foreground-custom/10 transition-colors text-foreground-custom/80"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user ? (
              /* User Dropdown */
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-foreground-custom/5 transition-colors focus:outline-none"
                >
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover border border-brand/20"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-sm font-medium text-foreground-custom hidden lg:inline">
                    {user.name}
                  </span>
                  {user.isPremium && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Pro
                    </span>
                  )}
                  <ChevronDown size={14} className="text-foreground-custom/60" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-xl bg-card-custom border border-border-custom py-2 z-50 transform origin-top-right transition-all">
                    <div className="px-4 py-2 border-b border-border-custom">
                      <p className="text-xs text-foreground-custom/60">Signed in as</p>
                      <p className="text-sm font-semibold truncate text-foreground-custom">{user.email}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-foreground-custom/85 hover:bg-brand/10 hover:text-brand transition-colors"
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      href="/dashboard/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-foreground-custom/85 hover:bg-brand/10 hover:text-brand transition-colors"
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>

                    <button
                      onClick={logout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Auth Links */
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground-custom/80 hover:text-brand transition-colors px-3 py-2"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-full transition-all hover:scale-105 shadow-md shadow-brand/10"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-foreground-custom/10 transition-colors text-foreground-custom/80"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-xl text-foreground-custom/80 hover:bg-foreground-custom/10 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-b border-border-custom px-4 pt-2 pb-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-brand/10 text-brand'
                  : 'text-foreground-custom/80 hover:bg-foreground-custom/5 hover:text-brand'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {user ? (
            <div className="border-t border-border-custom pt-4 mt-2">
              <div className="flex items-center space-x-3 px-3 mb-3">
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover border border-brand/20"
                />
                <div>
                  <div className="text-base font-semibold text-foreground-custom flex items-center space-x-2">
                    <span>{user.name}</span>
                    {user.isPremium && (
                      <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                        Pro
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-foreground-custom/60 truncate max-w-[200px]">{user.email}</div>
                </div>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 w-full px-3 py-2 rounded-xl text-base font-medium text-foreground-custom/80 hover:bg-foreground-custom/5"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 w-full px-3 py-2 rounded-xl text-base font-medium text-foreground-custom/80 hover:bg-foreground-custom/5"
              >
                <User size={18} />
                <span>My Profile</span>
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 rounded-xl text-base font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-border-custom pt-4 mt-2 flex flex-col space-y-2 px-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-center block text-base font-medium text-foreground-custom/80 hover:text-brand py-2 border border-border-custom rounded-xl"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="text-center block text-base font-medium bg-brand text-white py-2 rounded-xl shadow-md"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
