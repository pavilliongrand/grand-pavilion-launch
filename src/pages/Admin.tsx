import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLogin from "@/components/AdminLogin";
import { 
  ArrowLeft, 
  Calendar, 
  IndianRupee, 
  Clock, 
  TrendingUp, 
  Settings,
  Save,
  Trash2,
  Loader2,
  Edit,
  Lock,
  Unlock,
  LogOut,
  Ban,
  Plus
} from "lucide-react";

interface Booking {
  id: string;
  name: string;
  sport: string;
  date: string;
  slots: string[];
  slotTimes: string[];
  phone: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface TimeSlot {
  id: string;
  time: string;
  startHour: number;
  endHour: number;
  price: number;
  available: boolean;
}

interface BlockedSlot {
  id: string;
  sport: string;
  date: string;
  slotIds: string[];
  slotTimes: string[];
  reason: string;
  createdAt: string;
}

interface PricingRule {
  hour: number;
  cricketPrice: number;
  footballPrice: number;
}

interface WorkingHours {
  start: number;
  end: number;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      const { authenticated, timestamp } = JSON.parse(session);
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      return authenticated && (new Date().getTime() - timestamp < ONE_WEEK);
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState<"bookings" | "pricing" | "slots" | "analytics">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Slot Management
  const [blockSport, setBlockSport] = useState<"cricket" | "football">("cricket");
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [selectedBlockSlots, setSelectedBlockSlots] = useState<string[]>([]);
  const [availableSlotsForBlock, setAvailableSlotsForBlock] = useState<TimeSlot[]>([]);
  
  // Hourly pricing (24 hours)
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(
    Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      cricketPrice: i >= 18 && i < 22 ? 1950 : 1500,
      footballPrice: i >= 18 && i < 22 ? 1300 : 1000
    }))
  );
  const [workingHours, setWorkingHours] = useState<WorkingHours>({ start: 6, end: 24 });
  const [sportAvailability, setSportAvailability] = useState({ cricket: true, football: true });

  useEffect(() => {
    if (isAuthenticated && activeTab === "bookings") {
      fetchBookings();
    }
    if (isAuthenticated && activeTab === "pricing") {
      fetchPricing();
    }
    if (isAuthenticated && activeTab === "slots") {
      fetchBlockedSlots();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (blockDate && blockSport) {
      fetchSlotsForBlocking();
    }
  }, [blockDate, blockSport]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/bookings');
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pricing');
      const data = await response.json();
      if (data.hourlyPricing) {
        setPricingRules(data.hourlyPricing);
      }
      if (data.workingHours) {
        setWorkingHours(data.workingHours);
      }
      if (data.sportAvailability) {
        setSportAvailability(data.sportAvailability);
      }
    } catch (err) {
      console.error('Failed to fetch pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/blocked-slots');
      const data = await response.json();
      setBlockedSlots(data.blockedSlots || []);
    } catch (err) {
      console.error('Failed to fetch blocked slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlotsForBlocking = async () => {
    try {
      const response = await fetch(`/api/slots?date=${blockDate}&sport=${blockSport}`);
      const data = await response.json();
      setAvailableSlotsForBlock(data.slots || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    }
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourlyPricing: pricingRules, workingHours, sportAvailability })
      });
      
      if (response.ok) {
        alert('✅ Pricing and working hours updated successfully!');
        await fetchPricing();
      } else {
        alert('❌ Failed to save pricing');
      }
    } catch (err) {
      alert('❌ Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  const blockSlots = async () => {
    if (selectedBlockSlots.length === 0) {
      alert('Please select at least one slot to block');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/block-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: blockSport,
          date: blockDate,
          slotIds: selectedBlockSlots,
          reason: blockReason || 'Manually blocked by admin'
        })
      });
      
      if (response.ok) {
        alert('Slots blocked successfully!');
        setSelectedBlockSlots([]);
        setBlockReason('');
        fetchBlockedSlots();
        fetchSlotsForBlocking();
      }
    } catch (err) {
      alert('Failed to block slots');
    } finally {
      setSaving(false);
    }
  };

  const unblockSlots = async (blockId: string) => {
    if (!confirm('Are you sure you want to unblock these slots?')) return;

    try {
      const response = await fetch('/api/admin/unblock-slots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: blockId })
      });
      
      if (response.ok) {
        alert('Slot unblocked successfully!');
        fetchBlockedSlots();
        if (blockDate) fetchSlotsForBlocking();
      } else {
        alert('Failed to unblock slot');
      }
    } catch (err) {
      alert('Failed to unblock slots');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      fetchBookings();
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  const updateHourlyPrice = (hour: number, sport: 'cricket' | 'football', price: number) => {
    setPricingRules(prev => prev.map(rule => 
      rule.hour === hour 
        ? { ...rule, [sport === 'cricket' ? 'cricketPrice' : 'footballPrice']: price }
        : rule
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAuthenticated(false);
  };

  const getTotalRevenue = () => {
    return bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const getBookingsByDate = () => {
    const grouped: { [key: string]: number } = {};
    bookings.forEach(b => {
      grouped[b.date] = (grouped[b.date] || 0) + 1;
    });
    return grouped;
  };

  const getPopularHours = () => {
    const hourCounts: { [hour: string]: number } = {};
    bookings.forEach(b => {
      b.slotTimes.forEach(slot => {
        const hour = slot.split(' - ')[0];
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
    });
    return Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/50 backdrop-blur-xl bg-black/40 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-amber-500 transition-colors">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-base hidden sm:inline">Back</span>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-1.5 sm:gap-2">
              <Settings className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500" />
              Admin
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 transition-all text-xs sm:text-sm"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/50 sm:border-2 rounded-xl sm:rounded-2xl p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-amber-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <IndianRupee className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-[10px] sm:text-sm text-gray-400 mb-0.5">Revenue</div>
                <div className="text-sm sm:text-2xl font-bold">₹{getTotalRevenue().toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/50 sm:border-2 rounded-xl sm:rounded-2xl p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-[10px] sm:text-sm text-gray-400 mb-0.5">Bookings</div>
                <div className="text-sm sm:text-2xl font-bold">{bookings.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 sm:border-2 rounded-xl sm:rounded-2xl p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div>
                <div className="text-[10px] sm:text-sm text-gray-400 mb-0.5">Confirmed</div>
                <div className="text-sm sm:text-2xl font-bold">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-8 bg-zinc-900/50 p-1.5 sm:p-2 rounded-xl border border-zinc-800 overflow-x-auto w-full">
          {[
            { id: "bookings", label: "Bookings", icon: Calendar },
            { id: "pricing", label: "Pricing", icon: IndianRupee },
            { id: "slots", label: "Slots", icon: Lock },
            { id: "analytics", label: "Stats", icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 sm:flex-none px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold">All Bookings</h2>
              <button
                onClick={fetchBookings}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No bookings found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(booking => (
                  <div key={booking.id} className="p-3 sm:p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm sm:text-base">{booking.name || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{booking.phone}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                          booking.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-2">
                      <div><span className="text-gray-500">Sport:</span> <span className="capitalize font-medium">{booking.sport}</span></div>
                      <div><span className="text-gray-500">Date:</span> <span className="font-medium">{booking.date}</span></div>
                      <div><span className="text-gray-500">Slots:</span> <span className="font-medium">{booking.slots.length}</span></div>
                      <div><span className="text-gray-500">Amount:</span> <span className="font-semibold text-amber-500">₹{booking.amount}</span></div>
                    </div>
                    {booking.slotTimes && booking.slotTimes.length > 0 && (
                      <div className="text-[10px] sm:text-xs text-gray-500 mb-2">{booking.slotTimes.join(', ')}</div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-zinc-700/50">
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-5 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">Pricing & Hours</h2>
                <p className="text-gray-400 text-xs sm:text-base">Set rates and operating hours</p>
              </div>
              <button
                onClick={savePricing}
                disabled={saving}
                className="w-full sm:w-auto px-5 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-zinc-700 disabled:to-zinc-700 text-black disabled:text-gray-500 font-bold rounded-xl transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-lg shadow-amber-500/20 text-sm sm:text-base"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>

            {/* Sport Availability Section */}
            <div className="mb-8 p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-400" />
                Sport Availability
              </h3>
              <p className="text-sm text-gray-400 mb-4">Enable or disable bookings for specific sports</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-1">Cricket</h4>
                      <p className="text-xs text-gray-500">Allow cricket bookings</p>
                    </div>
                    <button
                      onClick={() => setSportAvailability(prev => ({ ...prev, cricket: !prev.cricket }))}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        sportAvailability.cricket ? 'bg-green-500' : 'bg-zinc-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          sportAvailability.cricket ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3 text-xs">
                    <span className={`font-semibold ${
                      sportAvailability.cricket ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {sportAvailability.cricket ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-1">Football</h4>
                      <p className="text-xs text-gray-500">Allow football bookings</p>
                    </div>
                    <button
                      onClick={() => setSportAvailability(prev => ({ ...prev, football: !prev.football }))}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        sportAvailability.football ? 'bg-green-500' : 'bg-zinc-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          sportAvailability.football ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3 text-xs">
                    <span className={`font-semibold ${
                      sportAvailability.football ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {sportAvailability.football ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours Section */}
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Operating Hours
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Opening Time</label>
                  <select
                    value={workingHours.start}
                    onChange={(e) => setWorkingHours(prev => ({ ...prev, start: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-800/80 border-2 border-zinc-700 rounded-xl text-white font-semibold focus:border-blue-400 focus:outline-none transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00 {i < 12 ? 'AM' : 'PM'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Closing Time</label>
                  <select
                    value={workingHours.end}
                    onChange={(e) => setWorkingHours(prev => ({ ...prev, end: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-800/80 border-2 border-zinc-700 rounded-xl text-white font-semibold focus:border-blue-400 focus:outline-none transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(i => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00 {i < 12 ? 'AM' : i === 24 ? 'Midnight' : 'PM'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-500/5 rounded-lg">
                <p className="text-sm text-blue-300">
                  Slots will only be available between <strong>{workingHours.start.toString().padStart(2, '0')}:00</strong> and <strong>{workingHours.end.toString().padStart(2, '0')}:00</strong>
                </p>
              </div>
            </div>

            {/* Hourly Pricing Section */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-amber-400" />
                Hourly Rates
              </h3>
              
              <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-300">
                  Set custom prices for each hour. Only hours within operating hours will accept bookings.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-zinc-700">
                      <th className="pb-4 text-left font-bold text-gray-300 uppercase text-xs tracking-wider">Time Slot</th>
                      <th className="pb-4 text-center font-bold text-gray-300 uppercase text-xs tracking-wider">Cricket Price</th>
                      <th className="pb-4 text-center font-bold text-gray-300 uppercase text-xs tracking-wider">Football Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingRules.map(rule => {
                      const isWithinWorkingHours = rule.hour >= workingHours.start && rule.hour < workingHours.end;
                      return (
                        <tr 
                          key={rule.hour} 
                          className={`border-b border-zinc-800/50 transition-all ${
                            isWithinWorkingHours 
                              ? 'bg-zinc-800/30 hover:bg-zinc-800/50' 
                              : 'opacity-40 bg-zinc-900/50'
                          }`}
                        >
                          <td className="py-4 font-semibold text-gray-200">
                            <div className="flex items-center gap-2">
                              {!isWithinWorkingHours && <Lock className="w-4 h-4 text-gray-600" />}
                              <span className="text-base">
                                {rule.hour.toString().padStart(2, '0')}:00 - {(rule.hour + 1).toString().padStart(2, '0')}:00
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex justify-center">
                              <div className="relative w-32">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                  type="number"
                                  value={rule.cricketPrice}
                                  onChange={(e) => updateHourlyPrice(rule.hour, 'cricket', Number(e.target.value))}
                                  disabled={!isWithinWorkingHours}
                                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/80 border-2 border-zinc-700 rounded-lg text-white font-bold text-center focus:border-amber-500 focus:outline-none focus:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex justify-center">
                              <div className="relative w-32">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                  type="number"
                                  value={rule.footballPrice}
                                  onChange={(e) => updateHourlyPrice(rule.hour, 'football', Number(e.target.value))}
                                  disabled={!isWithinWorkingHours}
                                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/80 border-2 border-zinc-700 rounded-lg text-white font-bold text-center focus:border-amber-500 focus:outline-none focus:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Manage Slots Tab */}
        {activeTab === "slots" && (
          <div className="space-y-6">
            {/* Block New Slots */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Ban className="w-6 h-6 text-red-500" />
                Block Slots
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Sport</label>
                  <select
                    value={blockSport}
                    onChange={(e) => setBlockSport(e.target.value as any)}
                    className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="cricket">Cricket</option>
                    <option value="football">Football</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Date</label>
                  <input
                    type="date"
                    value={blockDate}
                    min={getTodayDate()}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {blockDate && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Reason (Optional)</label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="e.g., Maintenance, Private event"
                      className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Select Slots to Block</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableSlotsForBlock.map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => {
                            if (slot.available) {
                              setSelectedBlockSlots(prev =>
                                prev.includes(slot.id)
                                  ? prev.filter(id => id !== slot.id)
                                  : [...prev, slot.id]
                              );
                            }
                          }}
                          disabled={!slot.available}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            selectedBlockSlots.includes(slot.id)
                              ? 'border-red-500 bg-red-500/20'
                              : slot.available
                              ? 'border-zinc-700 hover:border-red-500/50 bg-zinc-800/50'
                              : 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-semibold text-sm mb-1">{slot.time}</div>
                          <div className="text-xs text-gray-400">
                            {slot.available ? 'Available' : 'Blocked'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={blockSlots}
                    disabled={saving || selectedBlockSlots.length === 0}
                    className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ban className="w-5 h-5" />}
                    Block {selectedBlockSlots.length} Slot{selectedBlockSlots.length !== 1 ? 's' : ''}
                  </button>
                </>
              )}
            </div>

            {/* Currently Blocked Slots */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Currently Blocked Slots</h2>
                <button
                  onClick={fetchBlockedSlots}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : blockedSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No blocked slots</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedSlots.map(block => (
                    <div key={block.id} className="p-4 bg-zinc-800/50 border border-red-500/30 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold capitalize">
                              {block.sport}
                            </span>
                            <span className="text-gray-400">{block.date}</span>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">
                            <strong>Blocked Slots:</strong> {block.slotTimes?.join(', ') || `${block.slotIds.length} slots`}
                          </div>
                          {block.reason && (
                            <div className="text-sm text-gray-500">
                              <strong>Reason:</strong> {block.reason}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => unblockSlots(block.id)}
                          className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 transition-all flex items-center gap-2"
                        >
                          <Unlock className="w-4 h-4" />
                          Unblock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Booking Analytics</h2>
            
            <div className="space-y-6">
              {/* Revenue & Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <IndianRupee className="w-4 h-4" />
                    Total Revenue
                  </div>
                  <div className="text-3xl font-bold">₹{getTotalRevenue().toLocaleString()}</div>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    Total Bookings
                  </div>
                  <div className="text-3xl font-bold">{bookings.length}</div>
                </div>

                <div className="p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Avg Booking Value
                  </div>
                  <div className="text-3xl font-bold">
                    ₹{bookings.length > 0 ? Math.round(getTotalRevenue() / bookings.length).toLocaleString() : 0}
                  </div>
                </div>
              </div>

              {/* Sport Distribution */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl">
                  <div className="text-sm text-gray-400 mb-2">Cricket Bookings</div>
                  <div className="text-3xl font-bold">
                    {bookings.filter(b => b.sport === 'cricket').length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ₹{bookings.filter(b => b.sport === 'cricket').reduce((sum, b) => sum + b.amount, 0).toLocaleString()} revenue
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-xl">
                  <div className="text-sm text-gray-400 mb-2">Football Bookings</div>
                  <div className="text-3xl font-bold">
                    {bookings.filter(b => b.sport === 'football').length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ₹{bookings.filter(b => b.sport === 'football').reduce((sum, b) => sum + b.amount, 0).toLocaleString()} revenue
                  </div>
                </div>
              </div>

              {/* Popular Hours */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Most Popular Time Slots</h3>
                <div className="space-y-2">
                  {getPopularHours().length === 0 ? (
                    <p className="text-gray-500">No booking data available</p>
                  ) : (
                    getPopularHours().map(([hour, count], index) => (
                      <div key={hour} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-amber-500 font-bold">#{index + 1}</span>
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{hour}</span>
                        </div>
                        <span className="text-amber-500 font-bold">{count} bookings</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bookings by Date */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Bookings by Date</h3>
                <div className="space-y-2">
                  {Object.entries(getBookingsByDate()).length === 0 ? (
                    <p className="text-gray-500">No booking data available</p>
                  ) : (
                    Object.entries(getBookingsByDate())
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .slice(0, 7)
                      .map(([date, count]) => (
                        <div key={date} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                          <span className="font-medium">{new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-amber-500 font-bold">{count} bookings</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
