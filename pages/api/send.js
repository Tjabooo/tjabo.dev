const rateLimitStore = {};

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
}

export default async function handler(req, res) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxRequests = 3;

  if (!rateLimitStore[ip] || rateLimitStore[ip].expires < now) {
      rateLimitStore[ip] = { count: 1, expires: now + windowMs };
  } else {
      rateLimitStore[ip].count += 1;
  }

  if (rateLimitStore[ip].count > maxRequests) {
      const retryAfter = Math.ceil((rateLimitStore[ip].expires - now) / 1000);
      return res.status(429).json({
          error: "Too many requests. Please try again later.",
          retryAfterSeconds: retryAfter
      });
  }

  if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

  if (message.length > 1500 || (name.length > 100 || email.length > 100 || subject.length > 300)) {
    return res.status(400).json({ error: "stop pls" });
  }

  const discordPayload = {
    content: `## New Contact Form Submission\n**Name:** ${name}\n**Email:** ${email}\n**Subject:** ${subject}\n**Message:** ${message}\n\n<@901698944629891073>`,
  };

  try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
          throw new Error("Webhook URL not configured.");
      }
      console.log(webhookUrl);
      const discordRes = await fetch(webhookUrl, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(discordPayload),
      });
      if (!discordRes.ok) {
          throw new Error("Failed to send data.");
      }
      res.status(200).json({ success: true });
  } catch (error) {
      console.error("Form Error", error);
      res.status(500).json({ error: error.message });
  }
}
