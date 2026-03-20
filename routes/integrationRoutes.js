import express from 'express';
import { pushToAsana, pushToJira } from '../controllers/integrationController.js';

const router = express.Router();

router.post('/asana', pushToAsana);
router.post('/jira', pushToJira);

export default router;
