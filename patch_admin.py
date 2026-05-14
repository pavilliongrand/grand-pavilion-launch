import sys, re

with open('src/pages/Admin.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = re.sub(
    r'  Plus\r?\n\} from \"lucide-react\";', 
    '  Plus,\n  CheckCircle2,\n  XCircle\n} from "lucide-react";', 
    content
)

# 2. State Variables
old_state = r'  // Hourly pricing.*?const \[sportAvailability.*?\];'
new_state = '''  // Pricing Buckets
  const [rates, setRates] = useState({
    cricketDay: 1000,
    cricketNight: 1600,
    football7sDay: 1000,
    football7sNight: 1600,
    football11sDay: 2200,
    football11sNight: 2200,
  });
  const [workingHours, setWorkingHours] = useState<WorkingHours>({ start: 0, end: 24 });
  const [sportAvailability, setSportAvailability] = useState({ cricket: true, football: true });

  const [blockReason, setBlockReason] = useState('Admin blocked');
  const [blockCustomerName, setBlockCustomerName] = useState('');
  const [blockPhone, setBlockPhone] = useState('');'''
content = re.sub(old_state, new_state, content, flags=re.DOTALL)

# 3. fetchPricing
content = re.sub(
    r'if \(data\.hourlyPricing\) \{\s*setPricingRules\(data\.hourlyPricing\);\s*\}', 
    'if (data.rates) { setRates(data.rates); }', 
    content, flags=re.DOTALL
)

# 4. savePricing
content = re.sub(
    r'body: JSON\.stringify\(\{ hourlyPricing: pricingRules, workingHours, sportAvailability \}\)', 
    'body: JSON.stringify({ rates, workingHours, sportAvailability })', 
    content
)

# 5. toggleSlotBlock
content = re.sub(
    r'reason: \'Admin blocked\'', 
    'reason: blockReason, customerName: blockCustomerName, phoneNumber: blockPhone', 
    content
)

# 6. blockFullDay
block_full_day = '''
  const blockFullDay = async (sport: 'cricket' | 'football') => {
    if (!blockDate) return alert("Select a date first");
    if (!confirm(`Block entire day for ${sport}?`)) return;
    
    setSaving(true);
    try {
      const slotIds = Array.from({ length: 24 }, (_, i) => `${i}-${i+1}`);
      await fetch('/api/admin/block-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ sport, date: blockDate, slotIds, reason: blockReason, customerName: blockCustomerName, phoneNumber: blockPhone })
      });
      await fetchBlockedSlots();
      alert("Day blocked successfully!");
    } catch (err) {
      alert('Failed to block day');
    } finally {
      setSaving(false);
    }
  };
'''
content = re.sub(
    r'  const unblockSlots =', 
    block_full_day.replace('\\', '\\\\') + '\n  const unblockSlots =', 
    content
)

# 7. Pricing UI update
pricing_ui_pattern = r'\{\/\* Hourly Pricing Section \*\/.*?<\/div>\r?\n            <\/div>'
new_pricing_ui = '''{/* Pricing Section */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <IndianRupee className="w-5 h-5 text-[#84cc16]" />
                Day & Night Rates
              </h3>
              
              <div className="mb-4 p-4 bg-[#F7FEE7] border border-[#A3E635]/30 rounded-xl">
                <p className="text-sm text-[#65a30d]">
                  Set Day (Before 6 PM) and Night (6 PM onwards) rates for each sport.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cricket */}
                <div className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <h4 className="font-bold text-lg mb-4 text-center border-b pb-2">Cricket</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-600">Day (Before 6 PM)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" step="50" value={rates.cricketDay} onChange={e => setRates(prev => ({...prev, cricketDay: Number(e.target.value)}))} className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#A3E635] outline-none font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-600">Night (From 6 PM)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" step="50" value={rates.cricketNight} onChange={e => setRates(prev => ({...prev, cricketNight: Number(e.target.value)}))} className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#A3E635] outline-none font-bold" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Football 7s */}
                <div className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <h4 className="font-bold text-lg mb-4 text-center border-b pb-2">Football (7s)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-600">Day (Before 6 PM)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" step="50" value={rates.football7sDay} onChange={e => setRates(prev => ({...prev, football7sDay: Number(e.target.value)}))} className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#A3E635] outline-none font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-600">Night (From 6 PM)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" step="50" value={rates.football7sNight} onChange={e => setRates(prev => ({...prev, football7sNight: Number(e.target.value)}))} className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#A3E635] outline-none font-bold" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Football 11s */}
                <div className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <h4 className="font-bold text-lg mb-4 text-center border-b pb-2">Football (11s)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-600">Day (Before 6 PM)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" step="50" value={rates.football11sDay} onChange={e => setRates(prev => ({...prev, football11sDay: Number(e.target.value)}))} className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#A3E635] outline-none font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-600">Night (From 6 PM)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" step="50" value={rates.football11sNight} onChange={e => setRates(prev => ({...prev, football11sNight: Number(e.target.value)}))} className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#A3E635] outline-none font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>'''
content = re.sub(pricing_ui_pattern, new_pricing_ui, content, flags=re.DOTALL)

# 8. Slot management UI
slots_ui_pattern = r'<div className="mb-6">\r?\n\s*<label className="block text-sm font-semibold mb-2 text-gray-700">Select Date.*?\{blockDate && \('
new_slots_ui = '''<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                    <option value="Admin blocked">Admin Blocked</option>
                    <option value="Tournament">Tournament</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Phone Booking">Phone Booking</option>
                  </select>
                </div>
              </div>

              {blockReason === 'Phone Booking' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Customer Name</label>
                    <input type="text" value={blockCustomerName} onChange={e => setBlockCustomerName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-[#A3E635]" placeholder="Enter name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Phone Number</label>
                    <input type="tel" value={blockPhone} onChange={e => setBlockPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-[#A3E635]" placeholder="Enter phone" />
                  </div>
                </div>
              )}

              {blockDate && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => blockFullDay('cricket')} className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-200">
                      Block Full Day (Cricket)
                    </button>
                    <button onClick={() => blockFullDay('football')} className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-200">
                      Block Full Day (Football)
                    </button>
                  </div>'''
content = re.sub(slots_ui_pattern, new_slots_ui, content, flags=re.DOTALL)

# 9. Icons
content = content.replace('{isCricketBlocked ? \'❌\' : \'✅\'}', '{isCricketBlocked ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}')
content = content.replace('{isFootballBlocked ? \'❌\' : \'✅\'}', '{isFootballBlocked ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}')
content = content.replace('className="w-8 h-8 flex items-center justify-center rounded-full text-lg hover:scale-110 transition-transform active:scale-95"', 'className={`w-8 h-8 flex items-center justify-center rounded-full hover:scale-110 transition-transform active:scale-95 ${isCricketBlocked ? \'text-red-500 bg-red-50\' : \'text-green-500 bg-green-50\'}`}')
content = content.replace('className="w-8 h-8 flex items-center justify-center rounded-full text-lg hover:scale-110 transition-transform active:scale-95"', 'className={`w-8 h-8 flex items-center justify-center rounded-full hover:scale-110 transition-transform active:scale-95 ${isFootballBlocked ? \'text-red-500 bg-red-50\' : \'text-green-500 bg-green-50\'}`}')

with open('src/pages/Admin.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patching successful.")
