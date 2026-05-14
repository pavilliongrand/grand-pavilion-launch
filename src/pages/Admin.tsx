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
  Plus,
  XCircle,
  CheckCircle
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

interface Rates {
  cricketDay: number;
  cricketNight: number;
  football7sDay: number;
  football7sNight: number;
  football11sDay: number;
  football11sNight: number;
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
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("Tournament");
  const [blockCustomerName, setBlockCustomerName] = useState("");
  const [blockCustomerPhone, setBlockCustomerPhone] = useState("");
  
  // Day/Night Pricing
  const [rates, setRates] = useState<Rates>({
    cricketDay: 1600, cricketNight: 1950,
    football7sDay: 1600, football7sNight: 1950,
    football11sDay: 2200, football11sNight: 2600
  });
  const [dayNightCutoffHour, setDayNightCutoffHour] = useState(18);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({ start: 0, end: 24 });
  const [sportAvailability, setSportAvailability] = useState({ cricket: true, football: true });

  // Get signed admin token from session for API authentication
  const getAdminToken = () => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token || '';
    }
    return '';
  };

  const adminHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAdminToken()}`
  });

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
    if (blockDate) {
      fetchBlockedSlots();
    }
  }, [blockDate]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings?t=${Date.now()}`, { headers: adminHeaders() });
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookingStatus = async (bookingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'confirmed' ? 'pending' : 'confirmed';
    try {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      const res = await fetch(`/api/admin/bookings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders()
        },
        body: JSON.stringify({ id: bookingId, status: newStatus })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update booking status');
      }
      console.log('Booking status updated:', newStatus);
    } catch (err: any) {
      console.error('Status update error:', err);
      alert(`Failed to update status: ${err.message}`);
      await fetchBookings();
    }
  };

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pricing');
      const data = await response.json();
      if (data.rates) {
        setRates(data.rates);
      }
      if (data.dayNightCutoffHour) {
        setDayNightCutoffHour(data.dayNightCutoffHour);
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
      const response = await fetch('/api/admin/blocked-slots', { headers: adminHeaders() });
      const data = await response.json();
      setBlockedSlots(data.blockedSlots || []);
    } catch (err) {
      console.error('Failed to fetch blocked slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      const payload = { rates, dayNightCutoffHour, workingHours, sportAvailability };
      console.log('Saving pricing:', payload);
      
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      if (response.ok && responseData.success) {
        alert('✅ Pricing and working hours updated successfully!');
        await fetchPricing();
      } else {
        console.error('Pricing save failed:', responseData);
        alert(`❌ Failed to save pricing: ${responseData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Pricing save error:', err);
      alert(`❌ Failed to save pricing: ${err.message || 'Network error'}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleSlotBlock = async (hour: number, sport: 'cricket' | 'football', currentlyBlocked: boolean) => {
    const slotId = `${hour}-${hour+1}`;
    setSaving(true);
    try {
      if (currentlyBlocked) {
        const blockEvent = blockedSlots.find(b => b.date === blockDate && b.sport === sport && b.slotIds.includes(slotId));
        if (blockEvent) {
          setBlockedSlots(prev => prev.filter(b => b.id !== blockEvent.id));
          const response = await fetch('/api/admin/unblock-slots', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', ...adminHeaders() },
            body: JSON.stringify({ eventId: blockEvent.id })
          });
          if (!response.ok) throw new Error('Failed to unblock slot');
        }
      } else {
        const response = await fetch('/api/admin/block-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...adminHeaders() },
          body: JSON.stringify({ sport, date: blockDate, slotIds: [slotId], reason: blockReason, customerName: blockCustomerName, customerPhone: blockCustomerPhone })
        });
        if (!response.ok) throw new Error('Failed to block slot');
        await fetchBlockedSlots();
      }
    } catch (err: any) {
      console.error('Slot block error:', err);
      alert(`Failed to update slot: ${err.message}`);
      await fetchBlockedSlots();
    } finally {
      setSaving(false);
    }
  };

  const blockFullDay = async (sport: 'cricket' | 'football') => {
    if (!blockDate) return;
    setSaving(true);
    try {
      const allSlots = Array.from({ length: 24 }, (_, i) => `${i}-${i+1}`);
      const response = await fetch('/api/admin/block-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ sport, date: blockDate, slotIds: allSlots, reason: blockReason, customerName: blockCustomerName, customerPhone: blockCustomerPhone })
      });
      if (!response.ok) throw new Error('Failed to block full day');
      alert(`✅ Full day blocked successfully for ${sport}`);
      await fetchBlockedSlots();
    } catch (err: any) {
      console.error('Full day block error:', err);
      alert(`Failed to block full day: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const unblockSlots = async (eventId: string) => {
    if (!confirm('Are you sure you want to unblock these slots?')) return;

    try {
      const response = await fetch('/api/admin/unblock-slots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ eventId })
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.success) {
        alert('✅ Slot unblocked successfully!');
        await fetchBlockedSlots();
      } else {
        console.error('Unblock failed:', data);
        alert(`Failed to unblock slot: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Unblock error:', err);
      alert(`Failed to unblock slots: ${err.message}`);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const response = await fetch(`/api/admin/bookings?id=${bookingId}`, {
        method: 'DELETE',
        headers: adminHeaders()
      });
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.success) {
        alert('✅ Booking cancelled successfully!');
        await fetchBookings();
      } else {
        console.error('Cancel failed:', data);
        alert(`Failed to cancel booking: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Cancel error:', err);
      alert(`Failed to cancel booking: ${err.message}`);
    }
  };

  const updateRate = (key: keyof Rates, value: number) => {
    setRates(prev => ({ ...prev, [key]: value }));
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
    <div className="min-h-screen bg-[#F5F7FA] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#84cc16] transition-colors">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-base hidden sm:inline">Back</span>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-1.5 sm:gap-2">
              <Settings className="w-5 h-5 sm:w-7 sm:h-7 text-[#84cc16]" />
              Admin
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition-all text-xs sm:text-sm"
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
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#84cc16]/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <IndianRupee className="w-4 h-4 sm:w-6 sm:h-6 text-[#65a30d]" />
              </div>
              <div>
                <div className="text-[10px] sm:text-sm text-gray-500 mb-0.5">Revenue</div>
                <div className="text-sm sm:text-2xl font-bold text-gray-900">₹{getTotalRevenue().toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] sm:text-sm text-gray-500 mb-0.5">Bookings</div>
                <div className="text-sm sm:text-2xl font-bold text-gray-900">{bookings.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <div className="text-[10px] sm:text-sm text-gray-500 mb-0.5">Confirmed</div>
                <div className="text-sm sm:text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-8 bg-white shadow-sm p-1.5 sm:p-2 rounded-xl border border-gray-200 overflow-x-auto w-full">
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
                  ? 'bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">All Bookings</h2>
              <button
                onClick={fetchBookings}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-900"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#84cc16]" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="mx-auto mb-4 w-24 h-24 flex items-center justify-center rounded-full bg-gray-50">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base font-medium">No bookings found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(booking => (
                  <div key={booking.id} className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm sm:text-base text-gray-900">{booking.name || 'N/A'}</div>
                        <a href={`tel:${booking.phone}`} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                          {booking.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none bg-white border border-gray-200 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={booking.status === 'confirmed'} 
                            onChange={() => toggleBookingStatus(booking.id, booking.status)}
                            className="w-3.5 h-3.5 rounded text-[#84cc16] focus:ring-[#84cc16] cursor-pointer"
                          />
                          <span className="text-gray-700 font-medium">Confirmed</span>
                        </label>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-2 text-gray-900">
                      <div><span className="text-gray-500">Sport:</span> <span className="capitalize font-medium">{booking.sport}</span></div>
                      <div><span className="text-gray-500">Date:</span> <span className="font-medium">{booking.date}</span></div>
                      <div><span className="text-gray-500">Slots:</span> <span className="font-medium">{booking.slots.length}</span></div>
                      <div><span className="text-gray-500">Amount:</span> <span className="font-semibold text-[#65a30d]">₹{booking.amount}</span></div>
                    </div>
                    {booking.slotTimes && booking.slotTimes.length > 0 && (
                      <div className="text-[10px] sm:text-xs text-gray-500 mb-2">{booking.slotTimes.join(', ')}</div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-all flex items-center gap-1"
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
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-5 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 text-gray-900">Pricing & Hours</h2>
                <p className="text-gray-500 text-xs sm:text-base">Set rates and operating hours</p>
              </div>
              <button
                onClick={savePricing}
                disabled={saving}
                className="w-full sm:w-auto px-5 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#84cc16] to-[#65a30d] disabled:from-gray-200 disabled:to-gray-200 text-white disabled:text-gray-400 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#84cc16]/30 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>

            {/* Sport Availability Section */}
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <Settings className="w-5 h-5 text-green-600" />
                Sport Availability
              </h3>
              <p className="text-sm text-gray-600 mb-4">Enable or disable bookings for specific sports</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-1 text-gray-900">Cricket</h4>
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
                      sportAvailability.cricket ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sportAvailability.cricket ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-1 text-gray-900">Football</h4>
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
                      sportAvailability.football ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sportAvailability.football ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours Section */}
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <Clock className="w-5 h-5 text-blue-600" />
                Operating Hours
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Opening Time</label>
                  <select
                    value={workingHours.start}
                    onChange={(e) => setWorkingHours(prev => ({ ...prev, start: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-blue-500 focus:outline-none transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00 {i < 12 ? 'AM' : 'PM'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Closing Time</label>
                  <select
                    value={workingHours.end}
                    onChange={(e) => setWorkingHours(prev => ({ ...prev, end: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-blue-500 focus:outline-none transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(i => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00 {i < 12 ? 'AM' : i === 24 ? 'Midnight' : 'PM'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  Slots will only be available between <strong>{workingHours.start.toString().padStart(2, '0')}:00</strong> and <strong>{workingHours.end.toString().padStart(2, '0')}:00</strong>
                </p>
              </div>
            </div>

            {/* Hourly Pricing Section */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <IndianRupee className="w-5 h-5 text-[#84cc16]" />
                Hourly Rates
              </h3>
              
              <div className="mb-4 p-4 bg-[#F7FEE7] border border-[#A3E635]/30 rounded-xl">
                <p className="text-sm text-[#65a30d]">
                  Set custom prices for each hour. Only hours within operating hours will accept bookings.
                </p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Night Rate Start Hour</h4>
                    <p className="text-sm text-gray-500">What time do night rates begin?</p>
                  </div>
                  <select
                    value={dayNightCutoffHour}
                    onChange={(e) => setDayNightCutoffHour(Number(e.target.value))}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-[#A3E635] focus:outline-none transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00 {i < 12 ? 'AM' : 'PM'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Cricket */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Cricket</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Day Rate</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="50"
                          value={rates.cricketDay}
                          onChange={(e) => updateRate('cricketDay', Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#A3E635] focus:ring-1 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Night Rate</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="50"
                          value={rates.cricketNight}
                          onChange={(e) => updateRate('cricketNight', Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#A3E635] focus:ring-1 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Football 7s */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Football (7-a-side)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Day Rate</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="50"
                          value={rates.football7sDay}
                          onChange={(e) => updateRate('football7sDay', Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#A3E635] focus:ring-1 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Night Rate</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="50"
                          value={rates.football7sNight}
                          onChange={(e) => updateRate('football7sNight', Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#A3E635] focus:ring-1 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Football 11s */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Football (11-a-side)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Day Rate</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="50"
                          value={rates.football11sDay}
                          onChange={(e) => updateRate('football11sDay', Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#A3E635] focus:ring-1 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Night Rate</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="50"
                          value={rates.football11sNight}
                          onChange={(e) => updateRate('football11sNight', Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#A3E635] focus:ring-1 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Slots Tab */}
        {activeTab === "slots" && (
          <div className="space-y-6">
            {/* Block New Slots */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <Ban className="w-6 h-6 text-red-500" />
                Block Slots
              </h2>

              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Select Date</label>
                  <input
                    type="date"
                    value={blockDate}
                    min={getTodayDate()}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Reason</label>
                  <select
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] focus:outline-none"
                  >
                    <option value="Tournament">Tournament</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Admin Blocked">Admin Blocked</option>
                    <option value="Phone Booking">Phone Booking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Customer Name (Optional)</label>
                  <input
                    type="text"
                    value={blockCustomerName}
                    onChange={(e) => setBlockCustomerName(e.target.value)}
                    placeholder="E.g. John Doe"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Customer Phone (Optional)</label>
                  <input
                    type="tel"
                    value={blockCustomerPhone}
                    onChange={(e) => setBlockCustomerPhone(e.target.value)}
                    placeholder="E.g. 9876543210"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] focus:outline-none"
                  />
                </div>
              </div>

              {blockDate && (
                <div className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => blockFullDay('cricket')}
                      disabled={saving}
                      className="flex-1 py-3 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      Block Full Day (Cricket)
                    </button>
                    <button
                      onClick={() => blockFullDay('football')}
                      disabled={saving}
                      className="flex-1 py-3 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      Block Full Day (Football)
                    </button>
                  </div>
                  <div className="flex text-sm font-bold text-gray-500 px-3 mb-2">
                    <div className="w-1/3">Time Slot</div>
                    <div className="w-1/3 text-center">Cricket</div>
                    <div className="w-1/3 text-center">Football</div>
                  </div>
                  {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                    const slotId = `${hour}-${hour+1}`;
                    const format = (h: number) => {
                      const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
                      let h12 = h % 12;
                      h12 = h12 ? h12 : 12;
                      return `${String(h12).padStart(2, '0')}:00 ${ampm}`;
                    };
                    const time = `${format(hour)} - ${format(hour+1)}`;
                    
                    const isCricketBlocked = blockedSlots.some(b => b.date === blockDate && b.sport === 'cricket' && b.slotIds.includes(slotId));
                    const isFootballBlocked = blockedSlots.some(b => b.date === blockDate && b.sport === 'football' && b.slotIds.includes(slotId));

                    return (
                      <div key={hour} className={`flex items-center p-3 rounded-xl border transition-colors ${saving ? 'opacity-50 pointer-events-none' : ''} ${isCricketBlocked && isFootballBlocked ? 'bg-red-50/50 border-red-100' : 'bg-white border-gray-200'}`}>
                        <div className="w-1/3 font-semibold text-xs sm:text-sm text-gray-900">{time}</div>
                        
                        <div className="w-1/3 flex justify-center">
                          <button 
                            onClick={() => toggleSlotBlock(hour, 'cricket', isCricketBlocked)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-transform active:scale-95 ${isCricketBlocked ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-100'}`}
                            title={isCricketBlocked ? "Unblock Cricket" : "Block Cricket"}
                          >
                            {isCricketBlocked ? <XCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-gray-400 hover:text-green-500" />}
                          </button>
                        </div>

                        <div className="w-1/3 flex justify-center">
                          <button 
                            onClick={() => toggleSlotBlock(hour, 'football', isFootballBlocked)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-transform active:scale-95 ${isFootballBlocked ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-100'}`}
                            title={isFootballBlocked ? "Unblock Football" : "Block Football"}
                          >
                            {isFootballBlocked ? <XCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-gray-400 hover:text-green-500" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Currently Blocked Slots */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Currently Blocked Slots</h2>
                <button
                  onClick={fetchBlockedSlots}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#84cc16]" />
                </div>
              ) : blockedSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="mx-auto mb-4 w-24 h-24 flex items-center justify-center rounded-full bg-gray-50">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="font-medium">No blocked slots</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedSlots.map(block => (
                    <div key={block.id} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold capitalize">
                              {block.sport}
                            </span>
                            <span className="text-gray-500 font-medium">{block.date}</span>
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
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
                          className="px-4 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-700 transition-all flex items-center gap-2"
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
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Booking Analytics</h2>
            
            <div className="space-y-6">
              {/* Revenue & Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <IndianRupee className="w-4 h-4 text-green-600" />
                    Total Revenue
                  </div>
                  <div className="text-3xl font-bold text-gray-900">₹{getTotalRevenue().toLocaleString()}</div>
                </div>

                <div className="p-6 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    Total Bookings
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{bookings.length}</div>
                </div>

                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Avg Booking Value
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{bookings.length > 0 ? Math.round(getTotalRevenue() / bookings.length).toLocaleString() : 0}
                  </div>
                </div>
              </div>

              {/* Sport Distribution */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="text-sm text-gray-500 mb-2">Cricket Bookings</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {bookings.filter(b => b.sport === 'cricket').length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ₹{bookings.filter(b => b.sport === 'cricket').reduce((sum, b) => sum + b.amount, 0).toLocaleString()} revenue
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="text-sm text-gray-500 mb-2">Football Bookings</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {bookings.filter(b => b.sport.startsWith('football')).length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ₹{bookings.filter(b => b.sport.startsWith('football')).reduce((sum, b) => sum + b.amount, 0).toLocaleString()} revenue
                  </div>
                </div>
              </div>

              {/* Popular Hours */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Most Popular Time Slots</h3>
                <div className="space-y-2">
                  {getPopularHours().length === 0 ? (
                    <p className="text-gray-500">No booking data available</p>
                  ) : (
                    getPopularHours().map(([hour, count], index) => (
                      <div key={hour} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-[#84cc16] font-bold">#{index + 1}</span>
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{hour}</span>
                        </div>
                        <span className="text-[#65a30d] font-bold">{count} bookings</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bookings by Date */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Bookings by Date</h3>
                <div className="space-y-2">
                  {Object.entries(getBookingsByDate()).length === 0 ? (
                    <p className="text-gray-500">No booking data available</p>
                  ) : (
                    Object.entries(getBookingsByDate())
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .slice(0, 7)
                      .map(([date, count]) => (
                        <div key={date} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                          <span className="font-medium text-gray-900">{new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[#65a30d] font-bold">{count} bookings</span>
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
