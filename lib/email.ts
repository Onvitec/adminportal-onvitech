import emailjs from '@emailjs/browser'

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  try {
    const templateParams = {
      to_email: email,
      reset_link: resetLink,
      company_name: 'Onvitec'
    }

    const result = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
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