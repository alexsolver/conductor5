import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../middleware/jwtAuth";
import { storage } from "../storage-simple";

const emailTemplatesRouter = Router();

// Get email templates from database
emailTemplatesRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Fetch real email templates from database
    const templates = await storage.getEmailTemplates(req.user.tenantId);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ message: "Failed to fetch email templates" });
  }
});

// Create email template
emailTemplatesRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { name, subject, content } = req.body;
    
    if (!name || !subject || !content) {
      return res.status(400).json({ message: "Name, subject and content are required" });
    }

    const template = await storage.createEmailTemplate(req.user.tenantId, {
      name,
      subject,
      content
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating email template:", error);
    res.status(500).json({ message: "Failed to create email template" });
  }
});

// Update email template
emailTemplatesRouter.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const { name, subject, content } = req.body;
    
    const template = await storage.updateEmailTemplate(req.user.tenantId, id, {
      name,
      subject,
      content
    });
    
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    res.json(template);
  } catch (error) {
    console.error("Error updating email template:", error);
    res.status(500).json({ message: "Failed to update email template" });
  }
});

// Delete email template
emailTemplatesRouter.delete('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    
    const deleted = await storage.deleteEmailTemplate(req.user.tenantId, id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template:", error);
    res.status(500).json({ message: "Failed to delete email template" });
  }
});

export { emailTemplatesRouter };
export default emailTemplatesRouter;