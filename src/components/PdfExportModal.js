import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useTranslation } from "react-i18next";

function PdfExportModal({ order, onClose }) {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    const convertImageToBase64 = async () => {
      try {
        const response = await fetch(
          "https://cdn.sanity.io/images/2toaqqka/production/fe195e2982641e4d117dd66c4c92768480c7aaaa-600x564.png"
        );
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Failed to load logo for PDF:", error);
      }
    };
    convertImageToBase64();
  }, []);

  const generatePdf = () => {
    if (!order || !logoBase64) {
      alert(t("pdfExport.alertNotReady"));
      return;
    }
    setIsGenerating(true);

    const doc = new jsPDF();
    
    const displayId = order._id.slice(-8).toUpperCase();

    // --- HEADER och Adressinfo (Oförändrat) ---
    const logoWidth = 50;
    const logoOriginalWidth = 600; 
    const logoOriginalHeight = 564;
    const logoHeight = (logoOriginalHeight * logoWidth) / logoOriginalWidth;
    doc.addImage(logoBase64, "PNG", 14, 15, logoWidth, logoHeight);
    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    doc.text(t("pdfExport.invoiceTitle"), 200, 25, { align: "right" });
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(t("pdfExport.orderId", { id: displayId }), 200, 32, { align: "right" });
    const lineY = 15 + logoHeight + 5;
    doc.line(14, lineY, 200, lineY);
    const textY = lineY + 8;
    doc.setFontSize(10);
    doc.text(t("pdfExport.billedTo"), 14, textY);
    doc.setFont(undefined, "bold");
    doc.text(order.shippingAddress?.fullName || order.user?.username, 14, textY + 6);
    doc.setFont(undefined, "normal");
    doc.text(order.shippingAddress?.addressLine1 || "", 14, textY + 11);
    doc.text(`${order.shippingAddress?.postalCode || ""} ${order.shippingAddress?.city || ""}`, 14, textY + 16);
    doc.text(order.shippingAddress?.country || "", 14, textY + 21);
    doc.text(t("pdfExport.orderDate", { date: new Date(order.createdAt).toLocaleString('sv-SE') }), 200, textY, { align: "right" });
    const translatedStatus = t(`orderStatus.${order.orderStatus}`);
    doc.text(t("pdfExport.status", { status: translatedStatus }), 200, textY + 6, { align: "right" });

    // --- UPPDATERAD PRODUKTTABELL ---
    const tableColumn = [
        t("pdfExport.tableHeader.product"), 
        t("pdfExport.tableHeader.sku"), 
        t("pdfExport.tableHeader.quantity"), 
        t("pdfExport.tableHeader.priceExclVat"), // NY ÖVERSÄTTNING BEHÖVS
        t("pdfExport.tableHeader.priceInclVat"), // NY ÖVERSÄTTNING BEHÖVS
        t("pdfExport.tableHeader.total")
    ];
    const tableRows = [];

    order.items.forEach((item) => {
      const priceInclVat = Math.round(item.priceAtPurchase);
      const priceExclVat = Math.round(priceInclVat / 1.25);
      const totalForRow = Math.round(item.quantity * priceInclVat);

      const itemData = [
        doc.splitTextToSize(item.product?.title || item.title, 60),
        item.product?.sku || item.sku,
        item.quantity,
        `${priceExclVat} kr`,
        `${priceInclVat} kr`,
        `${totalForRow} kr`,
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: textY + 30,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    // --- UPPDATERADE TOTALBELOPP ---
    const finalY = doc.lastAutoTable.finalY || 120;
    const totalAmountInclVat = Math.round(order.totalAmount || 0);
    const totalAmountExclVat = Math.round(totalAmountInclVat / 1.25);

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(t("pdfExport.totalAmountExclVat"), 140, finalY + 15, { align: "right" }); // NY ÖVERSÄTTNING BEHÖVS
    doc.text(`${totalAmountExclVat} kr`, 200, finalY + 15, { align: "right" });

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(t("pdfExport.totalAmountInclVat"), 140, finalY + 22, { align: "right" }); // NY ÖVERSÄTTNING BEHÖVS
    doc.text(`${totalAmountInclVat} kr`, 200, finalY + 22, { align: "right" });

    // --- FOOTER (Oförändrad) ---
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(t("pdfExport.footerThanks"), 105, 280, { align: "center" });
    doc.text(t("pdfExport.footerCompany"), 105, 285, { align: "center" });

    doc.save(`Order_${displayId}.pdf`);

    setIsGenerating(false);
    onClose();
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      {/* ... (Modalens innehåll är oförändrat) ... */}
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("pdfExport.modalTitle")}</h2>
        <p className="text-gray-600 mb-6">
          {t("pdfExport.modalDescription", { id: order._id.slice(-8).toUpperCase() })}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            disabled={isGenerating}
          >
            {t("pdfExport.buttonCancel")}
          </button>
          <button
            onClick={generatePdf}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isGenerating || !logoBase64}
          >
            {isGenerating
              ? t("pdfExport.buttonGenerating")
              : logoBase64
              ? t("pdfExport.buttonDownload")
              : t("pdfExport.buttonLoadingAssets")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PdfExportModal;