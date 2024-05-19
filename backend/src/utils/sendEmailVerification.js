import transporter from "./emailConfig.js"
import Mailgen from "mailgen"

 const sendEmailVerification = async ({req,email,subject, user,mailgenContent}) => {
    
const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        // Appears in header & footer of e-mails
        name: 'nikhil',
        link: 'http://localhost:5173/'
        // Optional product logo
        // logo: 'https://mailgen.js/img/logo.png'
    }
});
    console.log(mailgenContent)
let emailBody = mailGenerator.generate(mailgenContent);

let emailText = mailGenerator.generatePlaintext(mailgenContent);

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: emailText,
        html: emailBody
    })
}

 const verifyemail = (name,verifyotp) => {
    return  {
    body: {
        name: name,
        intro: 'Welcome to Mailgen! We\'re very excited to have you on board.',
        dictionary: {
        OTP: verifyotp
      },
        outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
    }
};
}

const resetPassword = (name, resetPasswordUrl) => {
    return {
         body: {
        name: name,
        intro: 'You are receving this email because we are received a password request from your account.',
        action: {
            instructions: 'Click the button below to reset your password',
            button: {
                color: '#22BC66', // Optional action button color
                text: 'Confirm your account',
                link: resetPasswordUrl
            }
        },
        outro: 'If you did not request a password request, too tum chuyita ho '
    }
    }
}

export {
    sendEmailVerification,
    verifyemail,
    resetPassword
}