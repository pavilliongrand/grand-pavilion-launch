import { useState } from "react";
import { Loader2, Shield, Lock } from "lucide-react";

interface AdminLoginProps {
  onAuthenticated: () => void;
}

const AdminLogin = ({ onAuthenticated }: AdminLoginProps) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Server-side password verification (password never exposed in client JS)
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store session in localStorage
        localStorage.setItem('admin_session', JSON.stringify({
          authenticated: true,
          timestamp: new Date().getTime()
        }));
        onAuthenticated();
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 sm:p-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Admin Login</h1>
          <p className="text-gray-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">Secure access required</p>

          {error && (
            <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white text-sm sm:text-base focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full px-6 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
