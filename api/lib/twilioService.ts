// Twilio OTP Service
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// Send OTP via Twilio Verify
export async function sendOTP(phone: string) {
  try {
    // Clean phone number
    const cleanPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    
    if (!cleanPhone.match(/^\+\d{10,15}$/)) {
      throw new Error('Invalid phone number format');
    }

    // Twilio Verify API
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_SERVICE_SID}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
        },
        body: new URLSearchParams({
          To: cleanPhone,
          Channel: 'sms'
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio API Error:', response.status, errorText);
      throw new Error(`Twilio error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'pending') {
      return { success: true, message: 'OTP sent successfully' };
    } else {
      throw new Error(data.message || 'Failed to send OTP');
    }
  } catch (error: any) {
    console.error('Twilio Send OTP Error:', error);
    return { success: false, error: error.message };
  }
}

// Verify OTP via Twilio Verify
export async function verifyOTP(phone: string, otp: string) {
  try {
    const cleanPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    
    // Twilio Verify API
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_SERVICE_SID}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
        },
        body: new URLSearchParams({
          To: cleanPhone,
          Code: otp
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio Verify Error:', response.status, errorText);
      throw new Error(`Twilio error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'approved') {
      return { success: true, message: 'OTP verified successfully', phone: cleanPhone };
    } else {
      return { success: false, error: 'Invalid OTP' };
    }
  } catch (error: any) {
    console.error('Twilio Verify OTP Error:', error);
    return { success: false, error: error.message };
  }
}
