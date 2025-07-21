// api/send-order-confirmation.js
const { Resend } = require("resend");

// Initiera Resend med din API-nyckel från miljövariablerna
const resend = new Resend(process.env.RESEND_API_KEY);

// Exportera funktionen så att server.js kan importera och använda den
module.exports = async (req, res) => {
  // 1. Säkerhetskontroll: Verifiera att anropet kommer från din Sanity webhook
  // Detta är en extra säkerhetsåtgärd om du vill lägga till en hemlighet i framtiden
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;
  const authorizationHeader = req.headers["authorization"];

  if (webhookSecret && authorizationHeader !== `Bearer ${webhookSecret}`) {
    console.warn("Unauthorized webhook attempt blocked.");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // 2. Hämta orderdatan från anropets body
    const order = req.body;

    // Kontrollera att nödvändig data finns
    if (!order || !order.user?.email || !order.items) {
      return res
        .status(400)
        .json({ message: "Missing order data or user email." });
    }

    // 3. Bygg innehållet för e-postmeddelandet
    const subject = `Orderbekräftelse #${order._id.slice(-6)}`;
    const customerName = order.shippingAddress.fullName || order.user.username;

    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${
          item.title
        } (x${item.quantity})</td>
        <td style="padding: 10px; border-bottom: 1px solid #eaeaea; text-align: right;">${Math.round(
          item.priceAtPurchase * item.quantity
        )} kr</td>
      </tr>
    `
      )
      .join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <img src="https://cdn.sanity.io/images/2toaqqka/production/fe195e2982641e4d117dd66c4c92768480c7aaaa-600x564.png" alt="AK-Tuning Logo" style="width: 150px; margin-bottom: 20px;">
        <h2 style="color: #111;">Tack för din order, ${customerName}!</h2>
        <p>Vi har tagit emot din beställning och kommer att börja behandla den omgående. Nedan följer en sammanfattning av ditt köp:</p>
        <p><strong>Order ID:</strong> #${order._id.slice(-6)}</p>
        <p><strong>Orderdatum:</strong> ${new Date(
          order.createdAt
        ).toLocaleString("sv-SE")}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 25px; margin-bottom: 25px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #333;">Produkt</th>
              <th style="text-align: right; padding: 8px; border-bottom: 2px solid #333;">Totalt</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding-top: 15px; text-align: right; font-weight: bold; font-size: 1.1em;">Totalbelopp:</td>
              <td style="padding-top: 15px; text-align: right; font-weight: bold; font-size: 1.1em;">${Math.round(
                order.totalAmount
              )} kr</td>
            </tr>
          </tfoot>
        </table>

        <h3 style="margin-top: 30px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">Leveransadress</h3>
        <p style="line-height: 1.5;">
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.addressLine1}<br>
          ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
          ${order.shippingAddress.country}
        </p>
        <p style="margin-top: 30px; font-size: 0.9em; color: #888; text-align: center;">
          Om du har några frågor, vänligen svara på detta mail.
        </p>
      </div>
    `;

    // 4. Skicka e-postmeddelandet med Resend
    await resend.emails.send({
      from: "AK-Tuning <info@aktuning.se>", // Se till att detta är en verifierad domän hos Resend
      to: [order.user.email],
      subject: subject,
      html: emailHtml,
    });

    // 5. Skicka ett framgångsrikt svar
    res.status(200).json({ message: "Order confirmation sent successfully!" });
  } catch (error) {
    console.error("Error in send-order-confirmation:", error);
    res.status(500).json({ message: "Failed to send order confirmation." });
  }
};
