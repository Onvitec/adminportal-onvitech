import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const solutionCategories = [
  { id: 1, name: "Form" },
  { id: 2, name: "Confirmation Email" },
  { id: 3, name: "Link" },
  { id: 4, name: "Video Solution" },
];

export const buildEmailTemplate = (
  title: string,
  formatted: Record<string, any>
): string => {
  let fieldsHtml = "";

  Object.entries(formatted).forEach(([label, value]) => {
    const displayValue = value ?? ""; // fallback if empty
    fieldsHtml += `
      <div class="field">
        <span class="label">${label}:</span>
        <div class="value">${displayValue}</div>
      </div>
    `;
  });

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Form Submission</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8f9fb; margin: 0; padding: 0; }
        .container { max-width: 600px; background: #ffffff; margin: 30px auto; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background-color: #4a90e2; color: white; text-align: center; padding: 20px 30px; }
        .header h2 { margin: 0; }
        .content { padding: 30px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: 600; color: #333; margin-bottom: 4px; display: block; }
        .value { color: #555; background: #f3f6fa; padding: 10px 14px; border-radius: 6px; }
        .footer { background-color: #f0f3f7; text-align: center; padding: 15px; font-size: 13px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📩 ${title}</h2>
        </div>
        <div class="content">
          <p style="margin-top:0;">A new user has filled out your website form. Here are the details:</p>
          ${fieldsHtml}
        </div>
        <div class="footer">
          This email was automatically generated from your website form.
        </div>
      </div>
    </body>
  </html>
  `;
};
