/**
 * GDPR Compliance Routes
 * Clean Architecture - Presentation Layer Routes
 * Following 1qa.md patterns for RESTful API design
 */

import { Router } from 'express';
import { GdprController } from '../application/controllers/GdprController';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const gdprController = new GdprController();

// ✅ Apply authentication middleware to all routes
router.use(jwtAuth);

// ✅ 1. Cookie Consent Management Routes
router.post('/cookie-consents', (req, res) => gdprController.createCookieConsent(req, res));
router.get('/cookie-consents', (req, res) => gdprController.getCookieConsents(req, res));

// ✅ 3-7. Data Subject Requests Routes (Direitos GDPR)
router.post('/data-subject-requests', (req, res) => gdprController.createDataSubjectRequest(req, res));
router.get('/data-subject-requests', (req, res) => gdprController.getDataSubjectRequests(req, res));
router.put('/data-subject-requests/:id', (req, res) => gdprController.updateDataSubjectRequest(req, res));

// ✅ 9. Privacy Policies Routes
router.post('/privacy-policies', (req, res) => gdprController.createPrivacyPolicy(req, res));
router.get('/privacy-policies', (req, res) => gdprController.getPrivacyPolicies(req, res));

// ✅ 10. Security Incidents Routes
router.post('/security-incidents', (req, res) => gdprController.createSecurityIncident(req, res));
router.get('/security-incidents', (req, res) => gdprController.getSecurityIncidents(req, res));

// ✅ 12. User Preferences Routes
router.get('/user-preferences', (req, res) => gdprController.getUserPreferences(req, res));
router.put('/user-preferences', (req, res) => gdprController.updateUserPreferences(req, res));

// ✅ Compliance Dashboard & Metrics Routes
router.get('/metrics', (req, res) => gdprController.getComplianceMetrics(req, res));

// ✅ GDPR Rights Implementation Routes
router.get('/export-user-data', (req, res) => gdprController.exportUserData(req, res));
router.delete('/delete-user-data', (req, res) => gdprController.deleteUserData(req, res));

export { router as gdprRoutes };