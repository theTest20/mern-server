const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');
const ejs = require('ejs');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.firstName;

    this.url = url;
    this.from = `Blog App Admin <${process.env.EMAIL_FROM}>`;
  }

  newTransporter() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //Send the actual email
  async send(template, subject) {
    const htmlV = `<p>Hello, ${this.firstName}</p>
    <p>We are glad to have you here! Please verify your account by clicking on the link below</p>
      <a href="${this.url}">Verify</a>`;
    const htmlR = `<p>Hello, ${this.firstName}</p>
     <p>A request to reset password was sent, if this wasn't you, ignore this email.</p>
      <p>Otherwise, please reset your account by clicking on the link below</p>
      <a href="${this.url}">Verify</a>`;
    const html = template === 'welcome' ? htmlV : htmlR;
    //1. Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    //2. Create transport and send email
    await this.newTransporter().sendMail(mailOptions);
  }

  async sendWelcomeVerify() {
    await this.send('welcome', `Welcome to the Blog App Family!`);
  }

  async sendPasswordReset() {
    await this.send(
      'resetPassword',
      'Your password reset token (valid only for 10 min)'
    );
  }
};
