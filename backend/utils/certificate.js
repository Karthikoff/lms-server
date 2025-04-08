const PDFDocument = require("pdfkit");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.generateCertificateAndUpload = async ({ studentName, courseName, percentage }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape" });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const publicId = `certificates/${uuidv4()}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "raw", public_id: publicId, format: "pdf" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );

      streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
    });

    // 🟣 Design the certificate
    const themeColor = "#9f48f2";

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#ffffff");

    // Border
    doc
      .lineWidth(10)
      .strokeColor(themeColor)
      .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .stroke();

    // Title
    doc
      .fillColor(themeColor)
      .fontSize(40)
      .font("Helvetica-Bold")
      .text("Certificate of Completion", {
        align: "center",
        valign: "center",
      });

    doc.moveDown(2);

    // Presented to
    doc
      .fontSize(20)
      .fillColor("#333333")
      .font("Helvetica")
      .text("This certificate is proudly presented to", {
        align: "center",
      });

    doc.moveDown(1);

    // Student name
    doc
      .fontSize(32)
      .fillColor(themeColor)
      .font("Helvetica-Bold")
      .text(studentName, { align: "center" });

    doc.moveDown(1);

    // Course name
    doc
      .fontSize(18)
      .fillColor("#333333")
      .font("Helvetica")
      .text(`For successfully completing the course`, {
        align: "center",
      });

    doc
      .fontSize(24)
      .fillColor(themeColor)
      .font("Helvetica-Bold")
      .text(courseName, { align: "center" });

    doc.moveDown(1.5);

    // Percentage
    doc
      .fontSize(18)
      .fillColor("#333333")
      .font("Helvetica")
      .text(`with a score of ${percentage}%`, { align: "center" });

    doc.end();
  });
};
