/**
 * Create Entity Dialog - Dialog de criação rápida de entidades
 * 
 * Permite criar cliente/beneficiário/local rapidamente
 * durante preenchimento de formulário
 * 
 * @version 1.0.0
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Save } from 'lucide-react';
import { CPFField, CNPJField, CEPField, PhoneField } from './BrazilianField';

interface CreateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'client' | 'location' | 'beneficiary';
  onEntityCreated?: (entity: any) => void;
  initialData?: {
    cpf?: string;
    cnpj?: string;
    email?: string;
    name?: string;
  };
}

export function CreateEntityDialog({
  open,
  onOpenChange,
  entityType,
  onEntityCreated,
  initialData = {}
}: CreateEntityDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: initialData.name?.split(' ')[0] || '',
    lastName: initialData.name?.split(' ').slice(1).join(' ') || '',
    email: initialData.email || '',
    cpf: initialData.cpf || '',
    cnpj: initialData.cnpj || '',
    phone: '',
    mobilePhone: '',
    addressStreet: '',
    addressNumber: '',
    addressNeighborhood: '',
    addressCity: '',
    addressState: '',
    addressZipCode: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = entityType === 'client' ? '/api/customers' : `/api/${entityType}s`;
      
      return await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Sucesso',
        description: `${entityType === 'client' ? 'Cliente' : 'Entidade'} criado com sucesso!`
      });

      queryClient.invalidateQueries({ 
        queryKey: entityType === 'client' ? ['/api/customers/search'] : [`/api/${entityType}s/search`] 
      });

      if (onEntityCreated) {
        onEntityCreated(data);
      }

      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar entidade',
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      cpf: '',
      cnpj: '',
      phone: '',
      mobilePhone: '',
      addressStreet: '',
      addressNumber: '',
      addressNeighborhood: '',
      addressCity: '',
      addressState: '',
      addressZipCode: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: 'Erro de validação',
        description: 'Nome e email são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Criar Novo {entityType === 'client' ? 'Cliente' : 'Entidade'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados básicos para criar rapidamente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="João"
                required
                data-testid="input-firstName"
              />
            </div>
            <div>
              <Label htmlFor="lastName">
                Sobrenome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Silva"
                required
                data-testid="input-lastName"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joao@example.com"
              required
              data-testid="input-email"
            />
          </div>

          {/* Documentos */}
          <div className="grid grid-cols-2 gap-4">
            <CPFField
              label="CPF"
              value={formData.cpf}
              onChange={(value) => setFormData({ ...formData, cpf: value })}
              placeholder="000.000.000-00"
              data-testid="input-cpf"
            />
            <CNPJField
              label="CNPJ"
              value={formData.cnpj}
              onChange={(value) => setFormData({ ...formData, cnpj: value })}
              placeholder="00.000.000/0000-00"
              data-testid="input-cnpj"
            />
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-4">
            <PhoneField
              label="Telefone Fixo"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              placeholder="(11) 1234-5678"
              data-testid="input-phone"
            />
            <PhoneField
              label="Celular"
              value={formData.mobilePhone}
              onChange={(value) => setFormData({ ...formData, mobilePhone: value })}
              placeholder="(11) 98765-4321"
              data-testid="input-mobilePhone"
            />
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="addressStreet">Rua</Label>
              <Input
                id="addressStreet"
                value={formData.addressStreet}
                onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                placeholder="Rua das Flores"
                data-testid="input-addressStreet"
              />
            </div>
            <div>
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                value={formData.addressNumber}
                onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                placeholder="123"
                data-testid="input-addressNumber"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="addressNeighborhood">Bairro</Label>
              <Input
                id="addressNeighborhood"
                value={formData.addressNeighborhood}
                onChange={(e) => setFormData({ ...formData, addressNeighborhood: e.target.value })}
                placeholder="Centro"
                data-testid="input-addressNeighborhood"
              />
            </div>
            <div>
              <Label htmlFor="addressCity">Cidade</Label>
              <Input
                id="addressCity"
                value={formData.addressCity}
                onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                placeholder="São Paulo"
                data-testid="input-addressCity"
              />
            </div>
            <div>
              <Label htmlFor="addressState">UF</Label>
              <Input
                id="addressState"
                value={formData.addressState}
                onChange={(e) => setFormData({ ...formData, addressState: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="SP"
                maxLength={2}
                data-testid="input-addressState"
              />
            </div>
          </div>

          <CEPField
            label="CEP"
            value={formData.addressZipCode}
            onChange={(value) => setFormData({ ...formData, addressZipCode: value })}
            placeholder="00000-000"
            data-testid="input-addressZipCode"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={createMutation.isPending}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-save"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Criar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
