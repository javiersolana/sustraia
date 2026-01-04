import { Request, Response } from 'express';
import { emailService } from '../services/emailService';

interface ContactFormData {
  nombre: string;
  correo: string;
  telefono?: string;
  localidad: string;
  expectativas: string;
}

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const { nombre, correo, telefono, localidad, expectativas }: ContactFormData = req.body;

    // Validación básica
    if (!nombre || !correo || !localidad || !expectativas) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios',
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo no es válido',
      });
    }

    // Enviar email
    const emailSent = await emailService.sendContactFormEmail({
      nombre,
      correo,
      telefono,
      localidad,
      expectativas,
    });

    if (emailSent) {
      console.log(`📧 Contact form submitted: ${nombre} (${correo}) from ${localidad}`);
      return res.status(200).json({
        success: true,
        message: 'Formulario enviado correctamente',
      });
    } else {
      // Si el email no se pudo enviar, igual damos respuesta positiva al usuario
      // pero logueamos el error internamente
      console.warn(`⚠️ Contact form received but email failed: ${nombre} (${correo})`);
      return res.status(200).json({
        success: true,
        message: 'Formulario recibido correctamente',
      });
    }
  } catch (error) {
    console.error('Error processing contact form:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el formulario',
    });
  }
};
