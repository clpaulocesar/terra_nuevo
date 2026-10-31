import { Router } from 'express';
import {
  cancelarPagoQr,
  consultarPagoQr,
  generarPagoQr,
} from '../controllers/pagoQrController.js';

const router = Router();

router.post('/qr', generarPagoQr);
router.get('/qr/:qrId', consultarPagoQr);
router.delete('/qr/:qrId', cancelarPagoQr);

export default router;
