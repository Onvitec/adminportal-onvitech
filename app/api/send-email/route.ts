import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, title, message_html } = await req.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NEXT_PUBLIC_NODEMAILER_EMAIL_USER,
        pass: process.env.NEXT_PUBLIC_NODEMAILER_EMAIL_PASS, // Gmail App Password
      },
    });

    await transporter.sendMail({
      from: `"Onvitec"`,
      to: email,
      subject: title,
      html: message_html, // ✅ raw HTML works here
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Email send failed:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
