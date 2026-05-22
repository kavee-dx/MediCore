const express = require('express');
const router = express.Router();
const proxy = require('express-http-proxy');

// Node 18+ has global fetch available by default

// ─────────────────────────────────────────────
// SERVICE URLS (Docker internal names)
// ─────────────────────────────────────────────
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
  patient: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3000',
  appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3000',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000',
  doctor: process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3000',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3000',
  telemedicine: process.env.TELEMEDICINE_SERVICE_URL || 'http://telemedicine-service:3000',
  ai: process.env.AI_SERVICE_URL || 'http://ai-symptom-service:3000',
  admin: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3000',
};

// ─────────────────────────────────────────────
// GENERIC PROXY
// ─────────────────────────────────────────────
const proxyRequest = async (req, res, serviceUrl, path) => {
  try {
    const url = `${serviceUrl}${path}`;

    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: req.method === 'GET' || req.method === 'HEAD'
        ? undefined
        : JSON.stringify(req.body),
    });

    const text = await response.text();
    
    // Try to parse JSON, but handle non-JSON responses
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Response text:', text);
      return res.status(response.status).json({ 
        error: 'Invalid response from service',
        detail: text.substring(0, 200) 
      });
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error(`Proxy error -> ${serviceUrl}${path}:`, error.message);
    res.status(502).json({
      error: 'Service unavailable',
      detail: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────
router.post('/auth/register', (req, res) => {
  proxyRequest(req, res, SERVICES.auth, '/api/auth/register');
});

router.post('/auth/login', (req, res) => {
  proxyRequest(req, res, SERVICES.auth, '/api/auth/login');
});

// ─────────────────────────────────────────────
// PATIENT SERVICE
// ─────────────────────────────────────────────
// Routes with /api prefix (from nginx proxy)
router.get('/api/patients/profile', (req, res) => {
  proxyRequest(req, res, SERVICES.patient, '/api/patients/profile');
});

router.post('/api/patients/profile', (req, res) => {
  proxyRequest(req, res, SERVICES.patient, '/api/patients/profile');
});

router.post('/api/patients/sync', (req, res) => {
  proxyRequest(req, res, SERVICES.patient, '/api/patients/sync');
});

// Patient reports (with file upload support)
router.post('/api/patients/reports', (req, res, next) => {
  console.log('[API Gateway] POST /api/patients/reports - Content-Type:', req.headers['content-type']);
  console.log('[API Gateway] Proxying to:', SERVICES.patient + '/api/patients/reports');
  next();
}, proxy(SERVICES.patient, {
  proxyReqPathResolver: () => '/api/patients/reports',
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization || '';
    proxyReqOpts.headers['Content-Type'] = srcReq.headers['content-type'];
    console.log('[API Gateway] Full proxy URL:', proxyReqOpts.hostname || SERVICES.patient, proxyReqOpts.path);
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    console.log('[API Gateway] Response status:', proxyRes.statusCode);
    console.log('[API Gateway] Response body:', proxyResData.toString().substring(0, 300));
    return proxyResData;
  },
  onError: (err, req, res) => {
    console.error('[API Gateway] Proxy error:', err.message);
    res.status(502).json({ error: 'Proxy error', detail: err.message });
  }
}));

router.get('/api/patients/reports', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.patient, `/api/patients/reports?${query}`);
});

router.delete('/api/patients/reports/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.patient, `/api/patients/reports/${req.params.id}`);
});

// Patient prescriptions - Get prescriptions for a patient
router.get('/api/patients/prescriptions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors/patients/${req.query.patient_id}/prescriptions?${query}`);
});

router.get('/patients/prescriptions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors/patients/${req.query.patient_id}/prescriptions?${query}`);
});

// Patient prescriptions by user_id (auto-lookup patient UUID)
router.get('/api/patients/me/prescriptions', (req, res) => {
  const userId = req.query.user_id;
  proxyRequest(req, res, SERVICES.doctor, `/doctors/patients/user/${userId}/prescriptions`);
});

router.get('/patients/me/prescriptions', (req, res) => {
  const userId = req.query.user_id;
  proxyRequest(req, res, SERVICES.doctor, `/doctors/patients/user/${userId}/prescriptions`);
});

// Routes without /api prefix (for direct calls)
router.get('/patients/profile', (req, res) => {
  proxyRequest(req, res, SERVICES.patient, '/api/patients/profile');
});

router.post('/patients/profile', (req, res) => {
  proxyRequest(req, res, SERVICES.patient, '/api/patients/profile');
});

router.post('/patients/sync', (req, res) => {
  proxyRequest(req, res, SERVICES.patient, '/api/patients/sync');
});

// Patient reports (with file upload support) - without /api prefix
router.post('/patients/reports', proxy(SERVICES.patient, {
  proxyReqPathResolver: () => '/api/patients/reports',
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization || '';
    proxyReqOpts.headers['Content-Type'] = srcReq.headers['content-type'];
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    return proxyResData;
  }
}));

router.get('/patients/reports', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.patient, `/api/patients/reports?${query}`);
});

router.delete('/patients/reports/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.patient, `/api/patients/reports/${req.params.id}`);
});

// Patient prescriptions - already defined above

// ─── DOCTOR SERVICE ROUTES ─────────────────────────────────────────────────────

// Doctor registration (public - includes file upload)
router.post('/doctors/register', async (req, res) => {
  const url = `${SERVICES.doctor}/api/doctors/register`;
  
  console.log('Proxying doctor registration to:', url);
  
  try {
    // Forward multipart/form-data request by piping the raw request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'],
      },
      body: req,
      duplex: 'half', // Required for streaming request body in Node.js
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      console.error('Non-JSON response from doctor service:', text);
      res.status(response.status).json({ error: 'Invalid response from service' });
    }
  } catch (error) {
    console.error(`Proxy error to ${url}:`, error.message);
    res.status(502).json({ error: 'Service unavailable', detail: error.message });
  }
});

// Get all doctors (public)
router.get('/api/doctors', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors?${query}`);
});

router.get('/doctors', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors?${query}`);
});

// Get all doctors - alternative path for patient service
router.get('/api/doctors', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors?${query}`);
});

// Doctor profile routes (authenticated) - MUST be before /doctors/:id
router.get('/api/doctors/me/profile', (req, res) => {
  console.log('API Gateway: Proxying GET /api/doctors/me/profile to', SERVICES.doctor);
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/profile');
});

router.put('/api/doctors/me/profile', (req, res) => {
  console.log('API Gateway: Proxying PUT /api/doctors/me/profile to', SERVICES.doctor);
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/profile');
});

router.get('/doctors/me/profile', (req, res) => {
  console.log('API Gateway: Proxying GET /doctors/me/profile to', SERVICES.doctor);
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/profile');
});

router.put('/doctors/me/profile', (req, res) => {
  console.log('API Gateway: Proxying PUT /doctors/me/profile to', SERVICES.doctor);
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/profile');
});

// Doctor availability routes (authenticated)
router.get('/api/doctors/me/availability', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/availability');
});

router.post('/api/doctors/me/availability', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/availability');
});

router.put('/api/doctors/me/availability/:slotId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/availability/${req.params.slotId}`);
});

router.delete('/api/doctors/me/availability/:slotId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/availability/${req.params.slotId}`);
});

router.get('/api/doctors/me/availability/exceptions', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/availability/exceptions');
});

router.post('/api/doctors/me/availability/block', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/availability/block');
});

router.put('/api/doctors/me/availability/exceptions/:exceptionId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/availability/exceptions/${req.params.exceptionId}`);
});

router.delete('/api/doctors/me/availability/exceptions/:exceptionId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/availability/exceptions/${req.params.exceptionId}`);
});

router.get('/doctors/me/availability', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/availability');
});

router.post('/doctors/me/availability', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/availability');
});

router.put('/doctors/me/availability/:slotId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/availability/${req.params.slotId}`);
});

router.delete('/doctors/me/availability/:slotId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/availability/${req.params.slotId}`);
});

router.get('/doctors/me/availability/exceptions', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/availability/exceptions');
});

router.post('/doctors/me/availability/block', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/availability/block');
});

router.put('/doctors/me/availability/exceptions/:exceptionId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/availability/exceptions/${req.params.exceptionId}`);
});

router.delete('/doctors/me/availability/exceptions/:exceptionId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/availability/exceptions/${req.params.exceptionId}`);
});

// Doctor appointments
router.get('/api/doctors/me/appointments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/appointments?${query}`);
});

router.get('/doctors/me/appointments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/appointments?${query}`);
});

// Doctor prescriptions
router.get('/api/doctors/me/prescriptions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions?${query}`);
});

router.post('/api/doctors/me/prescriptions', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/prescriptions');
});

router.get('/doctors/me/prescriptions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions?${query}`);
});

router.post('/doctors/me/prescriptions', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, '/doctors/me/prescriptions');
});

// Doctor prescriptions by appointment
router.get('/api/doctors/me/prescriptions/appointment/:appointmentId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions/appointment/${req.params.appointmentId}`);
});

router.get('/doctors/me/prescriptions/appointment/:appointmentId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions/appointment/${req.params.appointmentId}`);
});

// Doctor prescription update and delete
router.put('/api/doctors/me/prescriptions/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions/${req.params.id}`);
});

router.patch('/api/doctors/me/prescriptions/appointment/:appointmentId/finish', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions/appointment/${req.params.appointmentId}/finish`);
});

// Vite proxy route (without /api prefix)
router.patch('/doctors/me/prescriptions/appointment/:appointmentId/finish', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions/appointment/${req.params.appointmentId}/finish`);
});

router.delete('/api/doctors/me/prescriptions/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions/${req.params.id}`);
});

// Doctor prescription update and delete (without /api prefix - for Vite proxy)
router.put('/doctors/me/prescriptions/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions/${req.params.id}`);
});

router.delete('/doctors/me/prescriptions/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/prescriptions/${req.params.id}`);
});

// Doctor reports
router.get('/api/doctors/me/reports', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/reports?${query}`);
});

router.get('/doctors/me/reports', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/reports?${query}`);
});

// Doctor reports by appointment
router.get('/api/doctors/me/reports/appointment/:appointmentId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/reports/appointment/${req.params.appointmentId}`);
});

router.get('/doctors/me/reports/appointment/:appointmentId', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/reports/appointment/${req.params.appointmentId}`);
});

// Doctor patients (placeholder - returns empty array)
router.get('/api/doctors/me/patients', (req, res) => {
  res.json([]);
});

router.get('/doctors/me/patients', (req, res) => {
  res.json([]);
});

// Get doctor by ID (public) - MUST be after /doctors/me/* routes
router.get('/doctors/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/${req.params.id}`);
});

// Get doctor availability (public)
router.get('/doctors/:id/availability', (req, res) => {
  proxyRequest(req, res, SERVICES.doctor, `/doctors/${req.params.id}/availability`);
});

// ─────────────────────────────────────────────
// /api/* PREFIX ROUTES (from nginx proxy)
// ─────────────────────────────────────────────
router.get('/api/appointments/doctors/search', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/doctors/search?${query}`);
});

router.get('/api/appointments/doctors/:doctorId/availability', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/doctors/${req.params.doctorId}/availability?${query}`);
});

router.post('/api/appointments/book', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, '/api/appointments/book');
});

router.get('/api/appointments/patient/my-appointments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/patient/my-appointments?${query}`);
});

router.get('/api/appointments/doctor/my-appointments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/doctor/my-appointments?${query}`);
});

router.patch('/api/appointments/:appointmentId/status', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/status`);
});

router.patch('/api/appointments/:appointmentId/reschedule', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/reschedule`);
});

router.patch('/api/appointments/:appointmentId/reject', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/reject`);
});

router.delete('/api/appointments/:appointmentId/cancel', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/cancel`);
});

router.put('/api/appointments/:appointmentId/complete', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/complete`);
});

router.get('/api/appointments/:appointmentId/telemedicine-eligibility', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/telemedicine-eligibility`);
});

router.post('/api/appointments/:appointmentId/start', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/appointment/${req.params.appointmentId}/start`);
});

router.get('/api/telemedicine/doctor/sessions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/doctor/sessions?${query}`);
});

router.get('/api/telemedicine/patient/sessions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/patient/sessions?${query}`);
});

router.get('/api/telemedicine/appointment/:appointmentId', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/appointment/${req.params.appointmentId}`);
});

router.post('/api/telemedicine/sessions', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, '/telemedicine/sessions');
});

router.get('/api/telemedicine/sessions/:sessionId', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}`);
});

router.post('/api/telemedicine/sessions/:sessionId/token', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/token`);
});

router.post('/api/telemedicine/sessions/:sessionId/join', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/join`);
});

router.post('/api/telemedicine/sessions/:sessionId/end', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/end`);
});

router.get('/api/doctors/me/appointments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.doctor, `/doctors/me/appointments?${query}`);
});

router.get('/api/ai/symptoms/history', (req, res) => {
  proxyRequest(req, res, SERVICES.ai, '/api/symptoms/history');
});

router.post('/api/ai/symptoms/text', (req, res) => {
  proxyRequest(req, res, SERVICES.ai, '/api/symptoms/text');
});


// ─── APPOINTMENT SERVICE ROUTES ───────────────────────────────────────────────

// Search doctors by specialty
router.get('/appointments/doctors/search', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/doctors/search?${query}`);
});

router.get('/appointments/doctors/:doctorId/availability', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(
    req,
    res,
    SERVICES.appointment,
    `/api/appointments/doctors/${req.params.doctorId}/availability?${query}`
  );
});

router.post('/appointments/book', (req, res) => {
  console.log('\n[API Gateway] POST /appointments/book - Proxying to appointment service');
  console.log('[API Gateway] Target:', SERVICES.appointment + '/api/appointments/book');
  console.log('[API Gateway] Request body:', JSON.stringify(req.body).substring(0, 200));
  proxyRequest(req, res, SERVICES.appointment, '/api/appointments/book');
});

router.patch('/appointments/:appointmentId/status', (req, res) => {
  proxyRequest(
    req,
    res,
    SERVICES.appointment,
    `/api/appointments/${req.params.appointmentId}/status`
  );
});

router.get('/appointments/patient/my-appointments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/patient/my-appointments?${query}`);
});

router.get('/appointments/doctor/my-appointments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/doctor/my-appointments?${query}`);
});

router.patch('/appointments/:appointmentId/reschedule', (req, res) => {
  proxyRequest(
    req,
    res,
    SERVICES.appointment,
    `/api/appointments/${req.params.appointmentId}/reschedule`
  );
});

router.patch('/appointments/:appointmentId/reject', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/reject`);
});

router.delete('/appointments/:appointmentId/cancel', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/cancel`);
});

router.put('/appointments/:appointmentId/complete', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/complete`);
});

router.get('/api/appointments/:appointmentId', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}`);
});

router.get('/appointments/:appointmentId', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}`);
});

router.get('/appointments/:appointmentId/telemedicine-eligibility', (req, res) => {
  proxyRequest(req, res, SERVICES.appointment, `/api/appointments/${req.params.appointmentId}/telemedicine-eligibility`);
});

// ─────────────────────────────────────────────
// TELEMEDICINE START ROUTE FOR APPOINTMENTS
// ─────────────────────────────────────────────
router.post('/appointments/:appointmentId/start', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/appointment/${req.params.appointmentId}/start`);
});

// ─────────────────────────────────────────────
// PAYMENT SERVICE - ORDER MATTERS! Specific routes before parameterized routes
// ─────────────────────────────────────────────
// Payment routes with /api prefix
router.post('/api/payments/initiate', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, '/api/payments/initiate');
});

router.post('/api/payments/webhook/payhere', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, '/api/payments/webhook/payhere');
});

router.post('/api/payments/complete-manual', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, '/api/payments/complete-manual');
});

router.post('/api/payments/cancel-with-refund', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, '/api/payments/cancel-with-refund');
});

router.get('/api/payments/patient/my-payments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.payment, `/api/payments/patient/my-payments?${query}`);
});

router.get('/api/payments/doctor/my-earnings', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.payment, `/api/payments/doctor/my-earnings?${query}`);
});

router.get('/api/payments/order/:orderId', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, `/api/payments/order/${req.params.orderId}`);
});

router.get('/api/payments/:paymentId/status', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, `/api/payments/${req.params.paymentId}/status`);
});

router.get('/api/payments/:paymentId', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, `/api/payments/${req.params.paymentId}`);
});

router.post('/api/payments/:paymentId/refund', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, `/api/payments/${req.params.paymentId}/refund`);
});

router.post('/payments/initiate', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, '/api/payments/initiate');
});

router.post('/payments/webhook/payhere', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, '/api/payments/webhook/payhere');
});

router.post('/payments/complete-manual', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, '/api/payments/complete-manual');
});

router.post('/payments/cancel-with-refund', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, '/api/payments/cancel-with-refund');
});

router.get('/payments/patient/my-payments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.payment, `/api/payments/patient/my-payments?${query}`);
});

router.get('/payments/doctor/my-earnings', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.payment, `/api/payments/doctor/my-earnings?${query}`);
});

router.get('/payments/order/:orderId', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, `/api/payments/order/${req.params.orderId}`);
});

router.get('/payments/:paymentId/status', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, `/api/payments/${req.params.paymentId}/status`);
});

router.get('/payments/:paymentId', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, `/api/payments/${req.params.paymentId}`);
});

router.post('/payments/:paymentId/refund', (req, res) => {
  proxyRequest(req, res, SERVICES.payment, `/api/payments/${req.params.paymentId}/refund`);
});

// ─────────────────────────────────────────────
// AI SYMPTOM SERVICE
// ─────────────────────────────────────────────
router.post('/ai/symptoms/text', (req, res) => {
  proxyRequest(req, res, SERVICES.ai, '/api/symptoms/text');
});

router.post('/ai/symptoms/file', async (req, res) => {
  try {
    const url = `${SERVICES.ai}/api/symptoms/file`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: req.headers.authorization || '',
        'Content-Type': req.headers['content-type'] || '',
      },
      body: req,
      duplex: 'half',
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error(`Proxy error to AI symptom file upload:`, error.message);
    res.status(502).json({ error: 'Service unavailable', detail: error.message });
  }
});

router.post('/ai/symptoms/voice', async (req, res) => {
  try {
    const url = `${SERVICES.ai}/api/symptoms/voice`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: req.headers.authorization || '',
        'Content-Type': req.headers['content-type'] || '',
      },
      body: req,
      duplex: 'half',
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error(`Proxy error to AI symptom voice upload:`, error.message);
    res.status(502).json({ error: 'Service unavailable', detail: error.message });
  }
});

router.get('/ai/symptoms/history', (req, res) => {
  proxyRequest(req, res, SERVICES.ai, '/api/symptoms/history');
});

// Admin routes with /api prefix
router.get('/api/admin/stats', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/stats');
});

router.get('/api/admin/doctors', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors?${query}`);
});

router.get('/api/admin/doctors/active-status', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/doctors/active-status');
});

router.get('/api/admin/doctors/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}`);
});

router.patch('/api/admin/doctors/:id/verify', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}/verify`);
});

router.get('/api/admin/doctors/:id/availability', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}/availability`);
});

router.put('/api/admin/doctors/:id/suspend', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}/suspend`);
});

router.put('/api/admin/doctors/:id/reactivate', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}/reactivate`);
});

router.post('/api/admin/doctors/:id/ai-analyze', async (req, res) => {
  try {
    const url = `${SERVICES.admin}/admin/doctors/${req.params.id}/ai-analyze`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: req.headers.authorization || '',
        'Content-Type': req.headers['content-type'] || '',
      },
      body: req,
    });
    const data = await response.text();
    res.status(response.status).send(data ? JSON.parse(data) : {});
  } catch (error) {
    res.status(502).json({ error: 'Service unavailable', detail: error.message });
  }
});

router.get('/api/admin/users/stats', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/users/stats');
});

router.get('/api/admin/users', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/users?${query}`);
});

router.get('/api/admin/users/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/users/${req.params.id}`);
});

router.put('/api/admin/users/:id/suspend', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/users/${req.params.id}/suspend`);
});

router.put('/api/admin/users/:id/activate', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/users/${req.params.id}/activate`);
});

router.put('/api/admin/users/:id/ban', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/users/${req.params.id}/ban`);
});

router.get('/api/admin/appointments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/appointments?${query}`);
});

router.get('/api/admin/payments/stats', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/payments/stats');
});

router.get('/api/admin/payments/transactions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/payments/transactions?${query}`);
});

router.get('/api/admin/payments/analytics', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/payments/analytics');
});

router.get('/api/admin/payments/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/payments/${req.params.id}`);
});

router.get('/api/admin/payments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/payments?${query}`);
});

// ─────────────────────────────────────────────
// ADMIN SERVICE
// ─────────────────────────────────────────────
router.get('/admin/stats', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/stats');
});

router.get('/admin/doctors', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors?${query}`);
});

// Doctor availability and account management - MUST be before /:id route
router.get('/admin/doctors/active-status', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/doctors/active-status');
});

router.get('/admin/doctors/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}`);
});

router.patch('/admin/doctors/:id/verify', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}/verify`);
});

router.get('/admin/doctors/:id/availability', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}/availability`);
});

router.put('/admin/doctors/:id/suspend', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}/suspend`);
});

router.put('/admin/doctors/:id/reactivate', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/doctors/${req.params.id}/reactivate`);
});

// AI upload (stream-safe)
router.post('/admin/doctors/:id/ai-analyze', async (req, res) => {
  try {
    const url = `${SERVICES.admin}/admin/doctors/${req.params.id}/ai-analyze`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: req.headers.authorization || '',
        'Content-Type': req.headers['content-type'] || '',
      },
      body: req,
    });

    const data = await response.text();
    res.status(response.status).send(data ? JSON.parse(data) : {});
  } catch (error) {
    res.status(502).json({
      error: 'Service unavailable',
      detail: error.message,
    });
  }
});

// User management routes - MUST be before generic /admin/users route
router.get('/admin/users/stats', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/users/stats');
});

router.get('/admin/users', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/users?${query}`);
});

router.get('/admin/users/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/users/${req.params.id}`);
});

router.put('/admin/users/:id/suspend', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/users/${req.params.id}/suspend`);
});

router.put('/admin/users/:id/activate', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/users/${req.params.id}/activate`);
});

router.put('/admin/users/:id/ban', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/users/${req.params.id}/ban`);
});

router.get('/admin/appointments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/appointments?${query}`);
});

// Payment overview routes
router.get('/admin/payments/stats', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/payments/stats');
});

router.get('/admin/payments/transactions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/payments/transactions?${query}`);
});

router.get('/admin/payments/analytics', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, '/admin/payments/analytics');
});

router.get('/admin/payments/:id', (req, res) => {
  proxyRequest(req, res, SERVICES.admin, `/admin/payments/${req.params.id}`);
});

router.get('/admin/payments', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.admin, `/admin/payments?${query}`);
});

// ─────────────────────────────────────────────
// TELEMEDICINE SERVICE
// ─────────────────────────────────────────────
// Session management
router.post('/telemedicine/sessions', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, '/telemedicine/sessions');
});

router.get('/telemedicine/sessions/:sessionId', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}`);
});

router.get('/telemedicine/appointment/:appointmentId', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/appointment/${req.params.appointmentId}`);
});

router.post('/telemedicine/appointment/:appointmentId/start', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/appointment/${req.params.appointmentId}/start`);
});

// Token and join flow
router.post('/telemedicine/sessions/:sessionId/token', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/token`);
});

router.post('/telemedicine/sessions/:sessionId/join', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/join`);
});

router.post('/telemedicine/sessions/:sessionId/leave', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/leave`);
});

router.post('/telemedicine/sessions/:sessionId/end', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/end`);
});

// Chat
router.get('/telemedicine/sessions/:sessionId/chat', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/chat`);
});

router.post('/telemedicine/sessions/:sessionId/chat', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/chat`);
});

// Clinical notes
router.post('/telemedicine/sessions/:sessionId/notes', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/notes`);
});

router.get('/telemedicine/sessions/:sessionId/notes', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/sessions/${req.params.sessionId}/notes`);
});

// Session history
router.get('/telemedicine/doctor/sessions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/doctor/sessions?${query}`);
});

router.get('/telemedicine/patient/sessions', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, SERVICES.telemedicine, `/telemedicine/patient/sessions?${query}`);
});

// Health check
router.get('/telemedicine/health', (req, res) => {
  proxyRequest(req, res, SERVICES.telemedicine, '/telemedicine/health');
});

module.exports = router;