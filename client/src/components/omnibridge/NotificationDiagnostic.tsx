import React, { useState, useEffect } from 'react';
import { apiRequest } from './api'; // Assuming apiRequest is defined in './api'

export function NotificationDiagnostic() {
  const [usersStatus, setUsersStatus] = useState('⏳ Verificando...');
  const [groupsStatus, setGroupsStatus] = useState('⏳ Verificando...');
  const [testNotificationStatus, setTestNotificationStatus] = useState('');

  const checkUsers = async () => {
    try {
      const response = await apiRequest('/api/users');
      const data = await response.json();

      if (response.ok && data.success) {
        setUsersStatus(`✓ ${data.data?.length || 0} usuários encontrados`);
        console.log('👥 Users API response:', data);
      } else {
        setUsersStatus(`✗ Erro: ${data.message || 'Falha na API'}`);
        console.error('❌ Users API error:', data);
      }
    } catch (error) {
      setUsersStatus(`✗ Erro: ${error.message}`);
      console.error('❌ Users API error:', error);
    }
  };

  const checkGroups = async () => {
    try {
      const response = await apiRequest('/api/user-groups');
      const data = await response.json();

      if (response.ok && data.success) {
        setGroupsStatus(`✓ ${data.data?.length || 0} grupos encontrados`);
        console.log('👥 Groups API response:', data);
      } else {
        setGroupsStatus(`✗ Erro: ${data.message || 'Falha na API'}`);
        console.error('❌ Groups API error:', data);
      }
    } catch (error) {
      setGroupsStatus(`✗ Erro: ${error.message}`);
      console.error('❌ Groups API error:', error);
    }
  };

  const testNotification = async () => {
    setTestNotificationStatus('⏳ Enviando notificação de teste...');

    try {
      const response = await apiRequest('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'f8990921-62bd-42f1-921f-09477baef86e',
          type: 'custom',
          title: 'Teste de Notificação',
          message: 'Esta é uma notificação de teste enviada através do sistema',
          priority: 'medium',
          channels: ['in_app'],
          data: {
            testType: 'ui_test',
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestNotificationStatus('✓ Notificação enviada com sucesso!');
        console.log('📧 Test notification result:', data);
      } else {
        setTestNotificationStatus(`✗ Erro: ${data.message || 'Falha ao enviar'}`);
        console.error('❌ Test notification error:', data);
      }
    } catch (error) {
      setTestNotificationStatus(`✗ Erro: ${error.message}`);
      console.error('❌ Test notification error:', error);
    }
  };

  useEffect(() => {
    checkUsers();
    checkGroups();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">🔍 Diagnóstico de Notificação</h3>
      <div className="space-y-2">
        <div>Usuários: {usersStatus}</div>
        <div>Grupos: {groupsStatus}</div>
        {testNotificationStatus && (
          <div>Teste: {testNotificationStatus}</div>
        )}
      </div>
      <div className="mt-4">
        <button
          onClick={testNotification}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          🧪 Testar Notificação
        </button>
      </div>
    </div>
  );
}