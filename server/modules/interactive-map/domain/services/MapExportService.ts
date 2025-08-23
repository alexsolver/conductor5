// ===========================================================================================
// MAP EXPORT SERVICE - CSV/GeoJSON/PDF Export for Field Agents Data
// ===========================================================================================

import { EnhancedFieldAgent } from '../entities/EnhancedFieldAgent';
// Note: jsPDF import handled in implementation

export interface ExportFilters {
  status?: string[];
  teams?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  includeTrajectory?: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: string | Buffer;
  filename: string;
  mimeType: string;
  error?: string;
}

export class MapExportService {
  
  // ===========================================================================================
  // CSV Export
  // ===========================================================================================
  
  static exportToCSV(agents: EnhancedFieldAgent[], filters?: ExportFilters): ExportResult {
    try {
      const headers = [
        'Agent ID',
        'Name', 
        'Team',
        'Status',
        'Latitude',
        'Longitude',
        'Accuracy (m)',
        'Speed (km/h)',
        'Battery (%)',
        'Last Update',
        'Assigned Ticket',
        'SLA Deadline',
        'ETA (min)'
      ];

      const rows = agents.map(agent => [
        agent.agent_id,
        agent.name,
        agent.team || '',
        agent.status,
        agent.lat?.toString() || '',
        agent.lng?.toString() || '',
        agent.accuracy?.toString() || '',
        agent.speed?.toString() || '',
        agent.device_battery?.toString() || '',
        agent.last_ping_at || '',
        agent.assigned_ticket_id || '',
        agent.sla_deadline_at || '',
        agent.eta_seconds ? Math.round(agent.eta_seconds / 60).toString() : ''
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const timestamp = new Date().toISOString().split('T')[0];
      
      return {
        success: true,
        data: csvContent,
        filename: `field-agents-${timestamp}.csv`,
        mimeType: 'text/csv'
      };
      
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: `CSV export failed: ${error.message}`
      };
    }
  }

  // ===========================================================================================
  // GeoJSON Export
  // ===========================================================================================
  
  static exportToGeoJSON(agents: EnhancedFieldAgent[], filters?: ExportFilters): ExportResult {
    try {
      const features = agents
        .filter(agent => agent.lat && agent.lng)
        .map(agent => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(agent.lng), Number(agent.lat)]
          },
          properties: {
            agent_id: agent.agent_id,
            name: agent.name,
            team: agent.team,
            status: agent.status,
            accuracy: agent.accuracy,
            speed: agent.speed,
            heading: agent.heading,
            battery: agent.device_battery,
            signal: agent.signal_strength,
            last_update: agent.last_ping_at,
            assigned_ticket: agent.assigned_ticket_id,
            sla_deadline: agent.sla_deadline_at,
            eta_seconds: agent.eta_seconds,
            is_on_duty: agent.is_on_duty,
            sla_risk: agent.sla_risk
          }
        }));

      const geoJson = {
        type: 'FeatureCollection',
        features,
        metadata: {
          exported_at: new Date().toISOString(),
          total_agents: agents.length,
          online_agents: agents.filter(a => a.is_online).length,
          filters: filters || {}
        }
      };

      const timestamp = new Date().toISOString().split('T')[0];
      
      return {
        success: true,
        data: JSON.stringify(geoJson, null, 2),
        filename: `field-agents-${timestamp}.geojson`,
        mimeType: 'application/geo+json'
      };
      
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: `GeoJSON export failed: ${error.message}`
      };
    }
  }

  // ===========================================================================================
  // PDF Report Export
  // ===========================================================================================
  
  static exportToPDF(agents: EnhancedFieldAgent[], filters?: ExportFilters): ExportResult {
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString('pt-BR');
      
      // Header
      doc.setFontSize(16);
      doc.text('Relatório de Agentes de Campo', 20, 20);
      
      doc.setFontSize(10);
      doc.text(`Gerado em: ${timestamp}`, 20, 30);
      doc.text(`Total de agentes: ${agents.length}`, 20, 35);
      
      // Statistics
      const onlineCount = agents.filter(a => a.is_online).length;
      const slaRiskCount = agents.filter(a => a.sla_risk).length;
      const avgBattery = agents.reduce((sum, a) => sum + (a.device_battery || 0), 0) / agents.length;
      
      doc.text(`Agentes online: ${onlineCount}`, 20, 45);
      doc.text(`Em risco de SLA: ${slaRiskCount}`, 20, 50);
      doc.text(`Bateria média: ${avgBattery.toFixed(1)}%`, 20, 55);
      
      // Agent list
      let yPosition = 70;
      doc.setFontSize(12);
      doc.text('Lista de Agentes:', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(8);
      agents.slice(0, 30).forEach((agent, index) => { // Limit to 30 agents for PDF
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        const status = agent.status === 'available' ? 'Disponível' :
                      agent.status === 'in_transit' ? 'Em trânsito' :
                      agent.status === 'in_service' ? 'Em atendimento' :
                      agent.status === 'sla_risk' ? 'Risco SLA' : agent.status;
        
        doc.text(`${index + 1}. ${agent.name} - ${agent.team} - ${status}`, 20, yPosition);
        doc.text(`   Localização: ${agent.lat?.toFixed(6) || 'N/A'}, ${agent.lng?.toFixed(6) || 'N/A'}`, 25, yPosition + 4);
        doc.text(`   Bateria: ${agent.device_battery || 'N/A'}% | Última atualização: ${agent.last_ping_at || 'N/A'}`, 25, yPosition + 8);
        
        yPosition += 15;
      });
      
      if (agents.length > 30) {
        doc.text(`... e mais ${agents.length - 30} agentes`, 20, yPosition);
      }
      
      const timestamp_file = new Date().toISOString().split('T')[0];
      
      return {
        success: true,
        data: doc.output(),
        filename: `field-agents-report-${timestamp_file}.pdf`,
        mimeType: 'application/pdf'
      };
      
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: `PDF export failed: ${error.message}`
      };
    }
  }

  // ===========================================================================================
  // Trajectory Export (GeoJSON with LineString)
  // ===========================================================================================
  
  static exportTrajectoryGeoJSON(agentId: string, positions: any[]): ExportResult {
    try {
      const coordinates = positions
        .filter(pos => pos.lat && pos.lng)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(pos => [Number(pos.lng), Number(pos.lat)]);

      const trajectory = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates
            },
            properties: {
              agent_id: agentId,
              start_time: positions[0]?.timestamp,
              end_time: positions[positions.length - 1]?.timestamp,
              total_points: positions.length,
              distance_km: this.calculateTrajectoryDistance(coordinates)
            }
          },
          // Add individual points
          ...positions.map(pos => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [Number(pos.lng), Number(pos.lat)]
            },
            properties: {
              timestamp: pos.timestamp,
              speed: pos.speed,
              heading: pos.heading,
              accuracy: pos.accuracy
            }
          }))
        ]
      };

      const timestamp = new Date().toISOString().split('T')[0];
      
      return {
        success: true,
        data: JSON.stringify(trajectory, null, 2),
        filename: `trajectory-${agentId}-${timestamp}.geojson`,
        mimeType: 'application/geo+json'
      };
      
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: `Trajectory export failed: ${error.message}`
      };
    }
  }

  // ===========================================================================================
  // Helper Methods
  // ===========================================================================================
  
  private static calculateTrajectoryDistance(coordinates: number[][]): number {
    if (coordinates.length < 2) return 0;
    
    let distance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const [lng1, lat1] = coordinates[i - 1];
      const [lng2, lat2] = coordinates[i];
      distance += this.haversineDistance(lat1, lng1, lat2, lng2);
    }
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }
  
  private static haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}