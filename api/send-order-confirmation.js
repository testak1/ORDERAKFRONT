// api/send-order-confirmation.js
const { Resend } = require('resend');

// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Main function that handles the request
export default async function handler(req, res) {
  // 1. Check for POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Security: Verify the webhook signature (optional but recommended)
  // You would need to implement signature verification if Sanity provides it
  // For now, we'll rely on a simple secret, but signature is better.

  try {
    // 3. Parse the order data from the request body
    const order = req.body;

    // Check if we have the necessary data
    if (!order || !order.user?.email || !order.items) {
      return res.status(400).json({ message: 'Missing order data or user email.' });
    }

    // 4. Construct the email content
    const subject = `Order Confirmation #${order._id.slice(-6)}`;
    const customerName = order.shippingAddress.fullName || order.user.username;
    
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title} (x${item.quantity})</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${Math.round(item.priceAtPurchase * item.quantity)} kr</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <img src="https://cdn.sanity.io/images/2toaqqka/production/fe195e2982641e4d117dd66c4c92768480c7aaaa-600x564.png" alt="AK-Tuning Logo" style="width: 150px; margin-bottom: 20px;">
        <h2 style="color: #333;">Thank you for your order, ${customerName}!</h2>
        <p>We've received your order and will start working on it right away. Here is a summary of your purchase:</p>
        <p><strong>Order ID:</strong> #${order._id.slice(-6)}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('sv-SE')}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #333;">Product</th>
              <th style="text-align: right; padding: 8px; border-bottom: 2px solid #333;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding-top: 15px; text-align: right; font-weight: bold;">Total Amount:</td>
              <td style="padding-top: 15px; text-align: right; font-weight: bold;">${Math.round(order.totalAmount)} kr</td>
            </tr>
          </tfoot>
        </table>

        <h3 style="margin-top: 30px; color: #333;">Shipping Address</h3>
        <p>
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.addressLine1}<br>
          ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
          ${order.shippingAddress.country}
        </p>
        <p style="margin-top: 30px; font-size: 0.9em; color: #888;">
          If you have any questions, please reply to this email.
        </p>
      </div>
    `;

    // 5. Send the email using Resend
    await resend.emails.send({
      from: 'AK-Tuning <noreply@aktuning.se>', // Replace with your verified Resend domain
      to: [order.user.email],
      subject: subject,
      html: emailHtml,
    });

    // 6. Send a success response
    res.status(200).json({ message: 'Order confirmation sent successfully!' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send order confirmation.' });
  }
}
