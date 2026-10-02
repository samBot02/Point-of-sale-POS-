import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  KeyRound, 
  User, 
  Wifi, 
  ShoppingBag, 
  Delete, 
  ArrowRight,
  Info
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithPin, loginWithPassword, lanInfo } = useAuth();

  const [mode, setMode] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle Numpad click for PIN
  const handleDigit = (digit: string) => {
    setErrorMsg(null);
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      // Auto-submit if PIN is 4 digits
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setErrorMsg(null);
    setPin('');
  };

  const submitPin = async (pinToSubmit: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await loginWithPin(pinToSubmit);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid PIN entered.');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await loginWithPassword(username.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-slate-100 select-none">
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-col">
        {/* Brand Banner Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-center text-white relative">
          <div className="w-14 h-14 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner backdrop-blur-xs">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Grocery POS &amp; Inventory</h1>
          <p className="text-emerald-100 text-xs mt-1">Multi-Terminal LAN System</p>
        </div>

        {/* Tab Switcher: Quick PIN vs Username & Password */}
        <div className="p-3 bg-slate-850 border-b border-slate-700/80 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('pin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'pin'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Fast PIN Sign-In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('password');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'password'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4 text-blue-400" />
            <span>Username &amp; Password</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs text-center font-medium animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6">
          {mode === 'pin' ? (
            /* PIN Mode */
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium">Enter 4-digit Cashier / Manager PIN</p>
                {/* Visual PIN Dots */}
                <div className="flex items-center justify-center gap-3 mt-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        pin.length > idx
                          ? 'bg-emerald-400 scale-110 shadow-[0_0_8px_#34d399]'
                          : 'bg-slate-700 border border-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Touch Numpad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigit(digit)}
                    disabled={isSubmitting}
                    className="h-14 rounded-2xl bg-slate-700/80 hover:bg-slate-600 active:bg-emerald-600 font-bold text-xl text-slate-100 shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClearPin}
                  disabled={isSubmitting || pin.length === 0}
                  className="h-14 rounded-2xl bg-slate-750 hover:bg-slate-700 font-semibold text-xs text-slate-400 hover:text-slate-200 transition active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  disabled={isSubmitting}
                  className="h-14 rounded-2xl bg-slate-700/80 hover:bg-slate-600 active:bg-emerald-600 font-bold text-xl text-slate-100 shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isSubmitting || pin.length === 0}
                  className="h-14 rounded-2xl bg-slate-750 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Username + Password Mode */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or cashier"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-700/80 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-700/80 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>{isSubmitting ? 'Verifying...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Default Credentials Note */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-1 bg-slate-850/50 p-3 rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
              <Info className="w-3.5 h-3.5 text-emerald-400" /> Default Credentials:
            </div>
            <div className="flex justify-between">
              <span>👑 Manager (Admin):</span>
              <span className="font-mono text-slate-300">user: <strong>admin</strong> | PIN: <strong>1234</strong></span>
            </div>
            <div className="flex justify-between">
              <span>🛒 Cashier:</span>
              <span className="font-mono text-slate-300">user: <strong>cashier</strong> | PIN: <strong>0000</strong></span>
            </div>
          </div>
        </div>

        {/* Footer: LAN Connection URL for Other Devices */}
        {lanInfo && lanInfo.urls.length > 0 && (
          <div className="p-4 bg-slate-900 border-t border-slate-700/80 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <Wifi className="w-4 h-4 animate-pulse" />
              <span>LAN Multi-Device Access Enabled</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              Open this URL on any phone, tablet, or PC on your shop&apos;s Wi-Fi network:
            </p>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
              <span className="text-emerald-300 select-all font-semibold">
                {lanInfo.recommendedUrl}
              </span>
              <span className="text-[10px] text-slate-500 uppercase font-sans font-bold px-1.5 py-0.5 rounded bg-slate-800">
                Wi-Fi
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
