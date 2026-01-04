import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASSWORD,
      EMAIL_FROM,
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) {
      console.warn('⚠️  Email service not configured. Set EMAIL_* env variables.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: parseInt(EMAIL_PORT || '587'),
        secure: EMAIL_PORT === '465',
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not available, skipping email to:', to);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'SUSTRAIA <noreply@sustraia.com>',
        to,
        subject,
        html,
      });

      console.log(`📧 Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Email de bienvenida al registrarse
   */
  async sendWelcomeEmail(userName: string, userEmail: string, role: 'ATLETA' | 'COACH') {
    const roleText = role === 'ATLETA' ? 'atleta' : 'coach';
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard/${roleText}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #111111;
      background-color: #F5F5F7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0033FF 0%, #0022CC 100%);
      padding: 48px 32px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }
    .content {
      padding: 48px 32px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #111111;
      margin: 0 0 16px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 16px;
      color: #666666;
      margin: 0 0 24px;
    }
    .cta-button {
      display: inline-block;
      background: #0033FF;
      color: #FFFFFF;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      transition: all 0.2s;
    }
    .cta-button:hover {
      background: #0022CC;
      transform: translateY(-2px);
    }
    .features {
      background: #F5F5F7;
      border-radius: 16px;
      padding: 24px;
      margin: 32px 0;
    }
    .feature {
      margin: 16px 0;
      display: flex;
      align-items: flex-start;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 12px;
    }
    .feature-text {
      font-size: 14px;
      color: #666666;
      margin: 0;
    }
    .footer {
      background: #F5F5F7;
      padding: 32px;
      text-align: center;
      font-size: 14px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SUSTRAIA</div>
    </div>

    <div class="content">
      <h1>¡Bienvenido/a, ${userName}! 👋</h1>

      <p>
        Gracias por unirte a SUSTRAIA, la plataforma de coaching híbrido que combina
        lo mejor del entrenamiento personalizado con tecnología inteligente.
      </p>

      <p>
        Tu cuenta como <strong>${roleText}</strong> ya está activa y lista para usar.
      </p>

      <a href="${dashboardUrl}" class="cta-button">
        Ir a mi Dashboard
      </a>

      <div class="features">
        ${role === 'ATLETA' ? `
          <div class="feature">
            <div class="feature-icon">📊</div>
            <div class="feature-text">Visualiza tus entrenamientos planificados y progreso</div>
          </div>
          <div class="feature">
            <div class="feature-icon">⌚</div>
            <div class="feature-text">Sincroniza tu cuenta de Strava automáticamente</div>
          </div>
          <div class="feature">
            <div class="feature-icon">💬</div>
            <div class="feature-text">Comunícate directamente con tu coach</div>
          </div>
          <div class="feature">
            <div class="feature-icon">📈</div>
            <div class="feature-text">Sigue tus métricas y objetivos semanales</div>
          </div>
        ` : `
          <div class="feature">
            <div class="feature-icon">📋</div>
            <div class="feature-text">Planifica y asigna entrenamientos a tus atletas</div>
          </div>
          <div class="feature">
            <div class="feature-icon">👥</div>
            <div class="feature-text">Monitoriza el rendimiento de todo tu equipo</div>
          </div>
          <div class="feature">
            <div class="feature-icon">🚨</div>
            <div class="feature-text">Recibe alertas de compliance y actividad</div>
          </div>
          <div class="feature">
            <div class="feature-icon">💬</div>
            <div class="feature-text">Mantén comunicación fluida con tus atletas</div>
          </div>
        `}
      </div>

      <p style="font-size: 14px; color: #999999; margin-top: 32px;">
        Si tienes alguna pregunta, no dudes en contactarnos.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">
        SUSTRAIA - Coaching Híbrido Inteligente<br>
        <a href="${process.env.FRONTEND_URL}" style="color: #0033FF; text-decoration: none;">sustraia.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '¡Bienvenido/a a SUSTRAIA! 🚀',
      html,
    });
  }

  /**
   * Email cuando un coach asigna un entreno
   */
  async sendWorkoutAssignedEmail(
    athleteName: string,
    athleteEmail: string,
    coachName: string,
    workout: {
      title: string;
      date: Date;
      type: string;
      description?: string;
      distance?: number;
      duration?: number;
    }
  ) {
    const workoutUrl = `${process.env.FRONTEND_URL}/dashboard/atleta`;
    const formattedDate = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(workout.date));

    const typeEmojis: Record<string, string> = {
      RUN: '🏃',
      RIDE: '🚴',
      SWIM: '🏊',
      STRENGTH: '💪',
      YOGA: '🧘',
      OTHER: '⚡',
    };

    const emoji = typeEmojis[workout.type] || '⚡';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #111111;
      background-color: #F5F5F7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0033FF 0%, #0022CC 100%);
      padding: 48px 32px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }
    .content {
      padding: 48px 32px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #111111;
      margin: 0 0 16px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 16px;
      color: #666666;
      margin: 0 0 24px;
    }
    .workout-card {
      background: #F5F5F7;
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      border-left: 4px solid #0033FF;
    }
    .workout-emoji {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .workout-title {
      font-size: 24px;
      font-weight: 700;
      color: #111111;
      margin: 0 0 8px;
    }
    .workout-date {
      font-size: 14px;
      color: #0033FF;
      font-weight: 600;
      margin: 0 0 16px;
    }
    .workout-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 16px;
    }
    .detail-item {
      font-size: 14px;
      color: #666666;
    }
    .detail-label {
      font-weight: 600;
      color: #111111;
    }
    .cta-button {
      display: inline-block;
      background: #0033FF;
      color: #FFFFFF;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      transition: all 0.2s;
    }
    .cta-button:hover {
      background: #0022CC;
      transform: translateY(-2px);
    }
    .footer {
      background: #F5F5F7;
      padding: 32px;
      text-align: center;
      font-size: 14px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SUSTRAIA</div>
    </div>

    <div class="content">
      <h1>Nuevo entreno asignado ${emoji}</h1>

      <p>
        Hola <strong>${athleteName}</strong>,<br>
        <strong>${coachName}</strong> te ha planificado un nuevo entreno:
      </p>

      <div class="workout-card">
        <div class="workout-emoji">${emoji}</div>
        <div class="workout-title">${workout.title}</div>
        <div class="workout-date">📅 ${formattedDate}</div>

        ${workout.description ? `<p style="color: #666666; font-size: 14px; margin: 16px 0;">${workout.description}</p>` : ''}

        <div class="workout-details">
          ${workout.distance ? `
            <div class="detail-item">
              <span class="detail-label">Distancia:</span> ${(workout.distance / 1000).toFixed(1)} km
            </div>
          ` : ''}
          ${workout.duration ? `
            <div class="detail-item">
              <span class="detail-label">Duración:</span> ${Math.floor(workout.duration / 60)} min
            </div>
          ` : ''}
          <div class="detail-item">
            <span class="detail-label">Tipo:</span> ${workout.type}
          </div>
        </div>
      </div>

      <a href="${workoutUrl}" class="cta-button">
        Ver en mi calendario
      </a>

      <p style="font-size: 14px; color: #999999; margin-top: 32px;">
        Recuerda sincronizar tu actividad de Strava cuando completes el entreno.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">
        SUSTRAIA - Coaching Híbrido Inteligente<br>
        <a href="${process.env.FRONTEND_URL}" style="color: #0033FF; text-decoration: none;">sustraia.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: athleteEmail,
      subject: `${emoji} Nuevo entreno: ${workout.title}`,
      html,
    });
  }

  /**
   * Email de reset de contraseña
   */
  async sendPasswordResetEmail(userName: string, userEmail: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #111111;
      background-color: #F5F5F7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0033FF 0%, #0022CC 100%);
      padding: 48px 32px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }
    .content {
      padding: 48px 32px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #111111;
      margin: 0 0 16px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 16px;
      color: #666666;
      margin: 0 0 24px;
    }
    .warning-box {
      background: #FFF3CD;
      border-left: 4px solid #FFC107;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .warning-text {
      font-size: 14px;
      color: #856404;
      margin: 0;
    }
    .cta-button {
      display: inline-block;
      background: #0033FF;
      color: #FFFFFF;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      transition: all 0.2s;
    }
    .cta-button:hover {
      background: #0022CC;
      transform: translateY(-2px);
    }
    .footer {
      background: #F5F5F7;
      padding: 32px;
      text-align: center;
      font-size: 14px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SUSTRAIA</div>
    </div>

    <div class="content">
      <h1>Restablecer contraseña 🔐</h1>

      <p>
        Hola <strong>${userName}</strong>,
      </p>

      <p>
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en SUSTRAIA.
      </p>

      <a href="${resetUrl}" class="cta-button">
        Restablecer mi contraseña
      </a>

      <div class="warning-box">
        <p class="warning-text">
          ⏰ Este enlace es válido por <strong>1 hora</strong>. Si expira, tendrás que solicitar uno nuevo.
        </p>
      </div>

      <p style="font-size: 14px; color: #999999;">
        Si no solicitaste este cambio, puedes ignorar este email de forma segura.
        Tu contraseña no será cambiada.
      </p>

      <p style="font-size: 12px; color: #CCCCCC; margin-top: 32px;">
        Por seguridad, nunca compartas este enlace con nadie.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">
        SUSTRAIA - Coaching Híbrido Inteligente<br>
        <a href="${process.env.FRONTEND_URL}" style="color: #0033FF; text-decoration: none;">sustraia.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🔐 Restablecer tu contraseña - SUSTRAIA',
      html,
    });
  }
}

  /**
   * Email de formulario de contacto (landing page)
   */
  async sendContactFormEmail(data: {
    nombre: string;
    correo: string;
    localidad: string;
    expectativas: string;
  }) {
    // Email que recibes tú como admin
    const adminEmail = process.env.ADMIN_CONTACT_EMAIL || 'lauretajon@gmail.com';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #111111;
      background-color: #F5F5F7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #8B5CF6 0%, #14B8A6 100%);
      padding: 48px 32px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 12px;
    }
    .content {
      padding: 48px 32px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #111111;
      margin: 0 0 24px;
      letter-spacing: -0.02em;
    }
    .info-card {
      background: #F5F5F7;
      border-radius: 16px;
      padding: 24px;
      margin: 24px 0;
    }
    .info-row {
      margin: 16px 0;
      padding-bottom: 16px;
      border-bottom: 1px solid #E5E5E5;
    }
    .info-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #8B5CF6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      color: #111111;
      font-weight: 500;
    }
    .expectativas {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
      border-left: 4px solid #14B8A6;
    }
    .expectativas-label {
      font-size: 12px;
      font-weight: 600;
      color: #14B8A6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .expectativas-text {
      font-size: 15px;
      color: #444;
      line-height: 1.7;
      white-space: pre-wrap;
    }
    .cta-button {
      display: inline-block;
      background: #25D366;
      color: #FFFFFF;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .footer {
      background: #F5F5F7;
      padding: 32px;
      text-align: center;
      font-size: 14px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SUSTRAIN</div>
      <div class="badge">🎯 Nuevo Lead</div>
    </div>

    <div class="content">
      <h1>¡Nuevo interesado! 🚀</h1>

      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Nombre</div>
          <div class="info-value">${data.nombre}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email</div>
          <div class="info-value"><a href="mailto:${data.correo}" style="color: #8B5CF6; text-decoration: none;">${data.correo}</a></div>
        </div>
        <div class="info-row">
          <div class="info-label">Localidad</div>
          <div class="info-value">${data.localidad}</div>
        </div>
      </div>

      <div class="expectativas">
        <div class="expectativas-label">¿Qué espera de nosotros?</div>
        <div class="expectativas-text">${data.expectativas}</div>
      </div>

      <a href="mailto:${data.correo}?subject=¡Hola ${data.nombre}! - SUSTRAIN&body=Hola ${data.nombre},%0A%0AGracias por contactar con SUSTRAIN..." class="cta-button">
        📧 Responder por Email
      </a>
    </div>

    <div class="footer">
      <p style="margin: 0;">
        Este email fue generado automáticamente desde el formulario de contacto de SUSTRAIN
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `🎯 Nuevo lead: ${data.nombre} - ${data.localidad}`,
      html,
    });
  }
}

export const emailService = new EmailService();
