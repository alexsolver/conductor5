
import axios from 'axios';

/**
 * Interface para requisição de criação de tarefa no Aria
 */
export interface ICriarTarefaRequest {
  formId?: string;
  formCodIntegracao?: string;
  camposAdicionais?: any;
  codIntegracao?: string;
  infos?: string;
  img?: string;
  tecId?: string;
  tecCodIntegracao?: string;
  grupoTecnicosId?: string[];
  grupoTecnicosCodIntegracao?: string[];
  itens?: object[];
  itensFilhos?: object[];
  lpu?: object[];
  dataAgendamento?: string;
  agendado?: boolean;
  atividadeAceite?: object;
  notificarEncerramento?: boolean;
  textoPadrao?: string;
}

/**
 * Serviço de integração com API Aria
 */
class AriaService {
  private readonly baseUrl = 'https://aria-demo.lansolver.com';

  async criarTarefa(data: ICriarTarefaRequest): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/tarefas/form?ambiente=demo`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || 'Erro ao criar tarefa no Aria'
      );
    }
  }
}

export const ariaService = new AriaService();
