import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, Users, Building, Paperclip, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ItemLinksModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
}

export function ItemLinksModal({ isOpen, onOpenChange, itemId, itemTitle }: ItemLinksModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries para buscar vínculos existentes
  const { data: itemLinks = [], isLoading: loadingItemLinks } = useQuery({
    queryKey: [`/api/parts-services/items/${itemId}/item-links`],
    enabled: isOpen && !!itemId
  });

  const { data: customerLinks = [], isLoading: loadingCustomerLinks } = useQuery({
    queryKey: [`/api/parts-services/items/${itemId}/customer-links`],
    enabled: isOpen && !!itemId
  });

  const { data: supplierLinks = [], isLoading: loadingSupplierLinks } = useQuery({
    queryKey: [`/api/parts-services/items/${itemId}/supplier-links`],
    enabled: isOpen && !!itemId
  });

  const { data: attachments = [], isLoading: loadingAttachments } = useQuery({
    queryKey: [`/api/parts-services/items/${itemId}/attachments`],
    enabled: isOpen && !!itemId
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Vínculos e Relacionamentos - {itemTitle}
          </DialogTitle>
          <DialogDescription>
            Gerencie vínculos entre itens, clientes, fornecedores e anexos
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="item-links" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="item-links" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Vínculos Item-Item
            </TabsTrigger>
            <TabsTrigger value="customer-links" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vínculos Clientes
            </TabsTrigger>
            <TabsTrigger value="supplier-links" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Vínculos Fornecedores
            </TabsTrigger>
            <TabsTrigger value="attachments" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos
            </TabsTrigger>
          </TabsList>

          {/* Vínculos Item-Item */}
          <TabsContent value="item-links" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Vínculos com Outros Itens</h3>
                <p className="text-sm text-muted-foreground">
                  Componentes, alternativas, substitutos e acessórios
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Vínculo
              </Button>
            </div>

            {loadingItemLinks ? (
              <div className="text-center py-8">Carregando vínculos...</div>
            ) : itemLinks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Link className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Nenhum vínculo encontrado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Este item ainda não possui vínculos com outros itens
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {itemLinks.map((link: any) => (
                  <Card key={link.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={link.linkType === 'component' ? 'default' : 'secondary'}>
                            {link.linkType === 'component' && 'Componente'}
                            {link.linkType === 'alternative' && 'Alternativa'}
                            {link.linkType === 'substitute' && 'Substituto'}
                            {link.linkType === 'accessory' && 'Acessório'}
                          </Badge>
                          <div>
                            <p className="font-medium">Item Vinculado</p>
                            <p className="text-sm text-muted-foreground">
                              Qtd: {link.quantity || 1} • {link.description}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Vínculos Cliente */}
          <TabsContent value="customer-links" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Vínculos com Clientes</h3>
                <p className="text-sm text-muted-foreground">
                  Dados específicos por cliente: SKU, códigos, apelidos
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Vínculo Cliente
              </Button>
            </div>

            {loadingCustomerLinks ? (
              <div className="text-center py-8">Carregando vínculos com clientes...</div>
            ) : customerLinks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Nenhum vínculo com cliente
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure dados específicos por cliente
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {customerLinks.map((link: any) => (
                  <Card key={link.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Cliente</Badge>
                            {link.isAsset && <Badge variant="destructive">Asset</Badge>}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Apelido:</span> {link.apelido || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">SKU:</span> {link.sku || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Código de Barras:</span> {link.codigoBarras || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Código QR:</span> {link.codigoQr || 'N/A'}
                            </div>
                          </div>
                          {link.notes && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Observações:</span> {link.notes}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Vínculos Fornecedor */}
          <TabsContent value="supplier-links" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Vínculos com Fornecedores</h3>
                <p className="text-sm text-muted-foreground">
                  Part numbers, preços, prazos e condições comerciais
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Vínculo Fornecedor
              </Button>
            </div>

            {loadingSupplierLinks ? (
              <div className="text-center py-8">Carregando vínculos com fornecedores...</div>
            ) : supplierLinks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Nenhum vínculo com fornecedor
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure dados específicos por fornecedor
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {supplierLinks.map((link: any) => (
                  <Card key={link.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Fornecedor</Badge>
                            {link.isPreferred && <Badge variant="default">Preferencial</Badge>}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Part Number:</span> {link.partNumber || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Descrição:</span> {link.supplierDescription || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Anexos */}
          <TabsContent value="attachments" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Anexos</h3>
                <p className="text-sm text-muted-foreground">
                  Manuais, imagens, certificados e documentos
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Anexo
              </Button>
            </div>

            {loadingAttachments ? (
              <div className="text-center py-8">Carregando anexos...</div>
            ) : attachments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Paperclip className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Nenhum anexo encontrado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Faça upload de documentos, imagens ou manuais
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {attachments.map((attachment: any) => (
                  <Card key={attachment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{attachment.originalName}</p>
                            <p className="text-sm text-muted-foreground">
                              {attachment.attachmentType} • {(attachment.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                          <Button variant="outline" size="sm">
                            Remover
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}