import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import config from "../config";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password, // The 16-character App Password
  },
});

export const sendVerificationEmail = async (
  email: string,
  name: string,
  otp: string,
) => {
  const templatePath = path.join(
    process.cwd(),
    "src/templates/email-verification.ejs",
  );
  const html = await ejs.renderFile(templatePath, { otp, name });

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Verification",
    html,
  });
};
