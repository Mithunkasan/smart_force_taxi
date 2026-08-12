import nodemailer from "nodemailer";
import twilio from "twilio";

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends driver credentials to their email address
 */
export async function sendDriverRegistrationEmail(email: string, name: string, employeeId: string, passwordText: string) {
  const from = process.env.SMTP_FROM || `"Smart Force Taxi" <noreply@smartforcetaxi.com>`;
  const subject = "Welcome to Smart Force Taxi - Your Driver Account Details";
  const text = `Hello ${name},

Welcome to Smart Force Taxi! Your driver account has been registered successfully.

Here are your account credentials to log in to the Driver Portal:
- Portal URL: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login
- Username (Email): ${email}
- Password: ${passwordText}
- Employee ID: ${employeeId}

Please keep these credentials safe and change your password after logging in.

Best regards,
Smart Force Taxi Operations Team`;

  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
    <h2 style="color: #f59e0b;">Welcome to Smart Force Taxi, ${name}!</h2>
    <p>Your driver account has been created successfully. You can now access your control portal.</p>
    <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #27272a;">Your Credentials</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #71717a;">Username (Email):</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 14px;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #71717a;">Password:</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 14px; font-weight: bold;">${passwordText}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #71717a;">Employee ID:</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 14px;">${employeeId}</td>
        </tr>
      </table>
    </div>
    <p>Please log in at <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login" style="color: #d97706; text-decoration: none; font-weight: bold;">Driver Portal Login</a>.</p>
    <p style="font-size: 12px; color: #a1a1aa; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 15px;">
      This is an automated operational message. Please do not reply directly to this email.
    </p>
  </div>`;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      html,
    });
    console.log(`Driver registration email sent successfully to: ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send driver registration email:", error);
    return { error };
  }
}

/**
 * Triggers a WhatsApp message to the driver's phone containing their credentials
 */
export async function sendDriverRegistrationWhatsApp(phone: string, name: string, email: string, passwordText: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_FROM_WHATSAPP || "whatsapp:+14155238886";

  if (!accountSid || !authToken || accountSid.includes("ACXX") || authToken.includes("your_auth_")) {
    console.warn("Twilio credentials are not configured or are placeholder values. Skipping WhatsApp message.");
    return { error: "Twilio credentials not configured" };
  }

  try {
    const client = twilio(accountSid, authToken);

    // Format phone number to follow the 'whatsapp:+[country_code][number]' syntax
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("whatsapp:")) {
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = `+${formattedPhone}`;
      }
      formattedPhone = `whatsapp:${formattedPhone}`;
    }

    const messageText = `Hello ${name}, welcome to Smart Force Taxi!

Your driver account has been created.
Username (Email): ${email}
Password: ${passwordText}

Log in at: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;

    const res = await client.messages.create({
      body: messageText,
      from: fromWhatsApp,
      to: formattedPhone,
    });

    console.log(`Driver registration WhatsApp sent successfully to: ${formattedPhone}, SID: ${res.sid}`);
    return { success: true, sid: res.sid };
  } catch (error) {
    console.error("Failed to send driver registration WhatsApp:", error);
    return { error };
  }
}

/**
 * Sends a booking cancellation email to the affected driver
 */
export async function sendBookingCancellationEmail(
  email: string,
  name: string,
  tripNumber: string,
  vehicleName: string,
  startTime: Date,
  endTime: Date
) {
  const from = process.env.SMTP_FROM || `"Smart Force Taxi" <noreply@smartforcetaxi.com>`;
  const subject = `Booking Cancelled: ${tripNumber}`;
  const text = `Hello ${name},

We would like to inform you that your booking for vehicle ${vehicleName} (Trip Reference: ${tripNumber}) scheduled from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()} has been cancelled by the admin.

The vehicle is now released and available for booking by other drivers.

If you have any questions, please contact the administrator.

Best regards,
Smart Force Taxi Operations Team`;

  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
    <h2 style="color: #dc2626;">Booking Cancellation Notice</h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your scheduled vehicle booking has been cancelled by the administrator. Please find the details below:</p>
    <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #7f1d1d;">Trip Reference:</td>
          <td style="padding: 6px 0; font-family: monospace;">${tripNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #7f1d1d;">Vehicle:</td>
          <td>${vehicleName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #7f1d1d;">Start Time:</td>
          <td>${new Date(startTime).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #7f1d1d;">End Time:</td>
          <td>${new Date(endTime).toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <p>The vehicle has been released and is now available for other bookings.</p>
    <p style="font-size: 12px; color: #a1a1aa; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 15px;">
      This is an automated operational message. Please do not reply directly to this email.
    </p>
  </div>`;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      html,
    });
    console.log(`Booking cancellation email sent successfully to: ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send booking cancellation email:", error);
    return { error };
  }
}

