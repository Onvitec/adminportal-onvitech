import emailjs from '@emailjs/browser'

interface EmailResult {
  success?: boolean
  error?: string
  details?: string
}

export const sendPasswordResetEmail = async (email: string, resetLink: string): Promise<EmailResult> => {
  try {
    if (!process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      throw new Error('EmailJS public key is not configured')
    }
    
    // Initialize EmailJS
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY)

    const templateParams = {
      to_email: email,
      reset_link: resetLink,
      company_name: 'Onvitec',
      support_email: 'support@onvitec.com',
      expiry_hours: 24
    }

    if (!process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID) {
      throw new Error('EmailJS service ID or template ID is not configured')
    }

    const result = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      templateParams
    )

    if (result.status !== 200) {
      throw new Error('Failed to send email')
    }

    return { success: true }  
  } catch (error) {
    console.error('Error sending email:', error)
    return { 
      error: 'Failed to send reset email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}