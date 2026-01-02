import React, { useState } from 'react';
import { Menu, X, Trophy, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'predictions', label: 'Predictions' },
    { id: 'expert', label: 'The Expert' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'blog', label: 'Blog' },
  ];

  // Add Admin link if user is admin
  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel' });
  }

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => handleNavClick('home')}>
              <Trophy className="h-8 w-8 text-naija-green" />
              <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">Hepta<span className="text-naija-green">bet</span></span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`${
                    currentPage === item.id
                      ? 'text-naija-green font-semibold border-b-2 border-naija-green'
                      : 'text-gray-500 hover:text-gray-900'
                  } px-1 py-2 text-sm transition-colors flex items-center`}
                >
                  {item.id === 'admin' && <ShieldAlert size={16} className="mr-1" />}
                  {item.label}
                </button>
              ))}
            </div>

            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => handleNavClick('dashboard')}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-naija-light flex items-center justify-center text-naija-green font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <button onClick={onLogout} className="text-gray-500 hover:text-red-600">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('login')}
                  className="bg-naija-green text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-naija-dark transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-500 hover:text-gray-900 p-2"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in-down">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`${
                    currentPage === item.id ? 'bg-naija-light text-naija-green' : 'text-gray-600'
                  } block px-3 py-2 rounded-md text-base font-medium w-full text-left`}
                >
                  {item.label}
                </button>
              ))}
              <div className="border-t border-gray-100 my-2 pt-2">
                 {user ? (
                    <>
                      <button
                        onClick={() => handleNavClick('dashboard')}
                        className="block px-3 py-2 rounded-md text-base font-medium w-full text-left text-gray-600"
                      >
                        My Dashboard
                      </button>
                      <button
                        onClick={onLogout}
                        className="block px-3 py-2 rounded-md text-base font-medium w-full text-left text-red-600"
                      >
                        Sign Out
                      </button>
                    </>
                 ) : (
                   <button
                    onClick={() => handleNavClick('login')}
                    className="block px-3 py-2 rounded-md text-base font-medium w-full text-left text-naija-green"
                  >
                    Sign In / Register
                  </button>
                 )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Trophy className="h-6 w-6 text-naija-green" />
                <span className="ml-2 text-xl font-bold">Heptabet</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                The most trusted source for football predictions online. 
                We combine expert analysis with advanced AI to help you win.
                Bet responsibly. 18+ only.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="hover:text-white cursor-pointer" onClick={() => handleNavClick('predictions')}>Today's Tips</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleNavClick('expert')}>Meet the Expert</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleNavClick('pricing')}>VIP Plans</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleNavClick('blog')}>Blog</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="hover:text-white cursor-pointer" onClick={() => handleNavClick('contact')}>Contact Us</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleNavClick('terms')}>Terms of Service</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleNavClick('privacy')}>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Heptabet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;