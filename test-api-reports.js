// Test Reports/Dashboards API directly without auth issues
const express = require('express');
const crypto = require('crypto');

console.log('Testing Reports/Dashboards API without JWT...');

// Simple test without authentication
const testRoutes = async () => {
  const baseUrl = 'http://localhost:5000';
  
  // Try to access without auth to see actual error
  try {
    const response = await fetch(`${baseUrl}/api/reports-dashboards/reports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response data:', data);
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Test the basic health of the route
testRoutes();