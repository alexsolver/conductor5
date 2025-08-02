
import express from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { ActivityTrackingService } from '../services/ActivityTrackingService';
import { createSuccessResponse, createErrorResponse } from '../utils/standardResponse';

const router = express.Router();

// Get productivity summary for current user
router.get('/my-productivity', jwtAuth, async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const end = endDate ? new Date(endDate as string) : new Date();

    console.log('🔍 Productivity API Debug:', {
      userId: req.user.id,
      tenantId: req.user.tenantId,
      startDate: start,
      endDate: end,
      queryParams: req.query
    });

    const data = await ActivityTrackingService.getProductivityReport(
      req.user.tenantId,
      req.user.id,
      start,
      end
    );

    console.log('🔍 Raw data from service:', {
      dataLength: data.length,
      sampleData: data.slice(0, 3)
    });

    // Process data for frontend
    const summary = {
      totalActivities: data.reduce((sum, item) => sum + parseInt(item.total_activities), 0),
      totalTimeSeconds: data.reduce((sum, item) => sum + parseInt(item.total_duration_seconds || '0'), 0),
      averageSessionTime: 0,
      activitiesByType: {},
      dailyBreakdown: {}
    };

    console.log('🔍 Summary initialization:', {
      totalActivities: summary.totalActivities,
      totalTimeSeconds: summary.totalTimeSeconds
    });

    // Group by activity type
    data.forEach(item => {
      const type = item.activity_type;
      if (!summary.activitiesByType[type]) {
        summary.activitiesByType[type] = {
          count: 0,
          totalTime: 0,
          avgTime: 0
        };
      }
      
      summary.activitiesByType[type].count += parseInt(item.total_activities);
      summary.activitiesByType[type].totalTime += parseInt(item.total_duration_seconds || '0');
    });

    // Daily breakdown
    data.forEach(item => {
      const date = item.activity_date;
      if (!summary.dailyBreakdown[date]) {
        summary.dailyBreakdown[date] = {
          totalActivities: 0,
          totalTime: 0,
          activities: {}
        };
      }
      
      summary.dailyBreakdown[date].totalActivities += parseInt(item.total_activities);
      summary.dailyBreakdown[date].totalTime += parseInt(item.total_duration_seconds || '0');
      summary.dailyBreakdown[date].activities[item.activity_type] = {
        count: parseInt(item.total_activities),
        time: parseInt(item.total_duration_seconds || '0')
      };
    });

    // Calculate averages
    Object.keys(summary.activitiesByType).forEach(type => {
      const typeData = summary.activitiesByType[type];
      typeData.avgTime = typeData.count > 0 ? Math.floor(typeData.totalTime / typeData.count) : 0;
    });

    summary.averageSessionTime = summary.totalActivities > 0 ? 
      Math.floor(summary.totalTimeSeconds / summary.totalActivities) : 0;

    console.log('🔍 Final summary before response:', {
      summary,
      activitiesByTypeKeys: Object.keys(summary.activitiesByType),
      dailyBreakdownKeys: Object.keys(summary.dailyBreakdown)
    });

    res.json(createSuccessResponse({
      summary,
      rawData: data,
      period: { startDate: start, endDate: end }
    }, 'Productivity data retrieved successfully'));
  } catch (error) {
    console.error('Error getting productivity data:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve productivity data'));
  }
});

// Get team productivity (for managers)
router.get('/team-productivity', jwtAuth, async (req: any, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const data = await ActivityTrackingService.getProductivityReport(
      req.user.tenantId,
      userId,
      start,
      end
    );

    // Group by user
    const userSummaries = {};
    data.forEach(item => {
      const userId = item.user_id;
      if (!userSummaries[userId]) {
        userSummaries[userId] = {
          userId,
          totalActivities: 0,
          totalTime: 0,
          activitiesByType: {}
        };
      }
      
      userSummaries[userId].totalActivities += parseInt(item.total_activities);
      userSummaries[userId].totalTime += parseInt(item.total_duration_seconds || '0');
      
      const type = item.activity_type;
      if (!userSummaries[userId].activitiesByType[type]) {
        userSummaries[userId].activitiesByType[type] = { count: 0, time: 0 };
      }
      
      userSummaries[userId].activitiesByType[type].count += parseInt(item.total_activities);
      userSummaries[userId].activitiesByType[type].time += parseInt(item.total_duration_seconds || '0');
    });

    res.json(createSuccessResponse({
      userSummaries: Object.values(userSummaries),
      rawData: data,
      period: { startDate: start, endDate: end }
    }, 'Team productivity data retrieved successfully'));
  } catch (error) {
    console.error('Error getting team productivity data:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve team productivity data'));
  }
});

export default router;
