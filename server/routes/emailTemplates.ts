import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../middleware/jwtAuth";

const emailTemplatesRouter = Router();

// Get email templates
emailTemplatesRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Sample templates - in a real implementation, these would come from the database
    const sampleTemplates = [
      {
        id: "1",
        name: "Confirmação de Recebimento",
        subject: "Confirmação - Ticket #{{ticket_number}}",
        content: "Olá,\n\nRecebemos seu ticket e nossa equipe está analisando. Retornaremos em breve.\n\nAtenciosamente,\nEquipe de Suporte"
      },
      {
        id: "2",
        name: "Solicitação de Informações",
        subject: "Informações Adicionais - Ticket #{{ticket_number}}",
        content: "Olá,\n\nPara dar continuidade ao seu atendimento, precisamos de algumas informações adicionais.\n\nPoderia nos fornecer:\n- [Detalhe solicitado]\n\nAguardamos seu retorno.\n\nAtenciosamente,\nEquipe de Suporte"
      },
      {
        id: "3",
        name: "Ticket Resolvido",
        subject: "Ticket Resolvido - #{{ticket_number}}",
        content: "Olá,\n\nInformamos que seu ticket foi resolvido com sucesso.\n\nSolução aplicada:\n{{solution_details}}\n\nCaso tenha alguma dúvida, não hesite em nos contatar.\n\nAtenciosamente,\nEquipe de Suporte"
      }
    ];

    res.json(sampleTemplates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ message: "Failed to fetch email templates" });
  }
});

export { emailTemplatesRouter };