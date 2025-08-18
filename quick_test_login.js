// Quick test for login functionality
const express = require('express');
const { DependencyContainer } = require('./server/application/services/DependencyContainer');

// Create a simple test server
const app = express();
app.use(express.json());

app.post('/quick-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Get user from database
    const userRepository = DependencyContainer.getInstance().userRepository;
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const { tokenManager } = require('./server/utils/tokenManager');
    const accessToken = tokenManager.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId
        },
        tokens: { accessToken }
      }
    });
  } catch (error) {
    console.error('Quick login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

app.listen(5001, () => {
  console.log('Quick test login server running on port 5001');
});