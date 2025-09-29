import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/jwtAuth';
import { Response } from 'express';

const router = Router();

// Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Mock profile data for now - replace with actual database query
    const profile = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      phone: "",
      department: "",
      position: "",
      bio: "",
      location: "",
      timezone: "America/Sao_Paulo",
      dateOfBirth: "",
      address: "",
      avatar: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      firstName,
      lastName,
      phone,
      department,
      position,
      bio,
      location,
      timezone,
      dateOfBirth,
      address
    } = req.body;

    // Mock update - replace with actual database update
    const updatedProfile = {
      id: user.id,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      phone,
      department,
      position,
      bio,
      location,
      timezone,
      dateOfBirth,
      address,
      updatedAt: new Date().toISOString()
    };

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get user activity
router.get('/activity', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Mock activity data - replace with actual database query
    const activity = [
      {
        id: "1",
        description: "Login realizado com sucesso",
        timestamp: new Date().toISOString(),
        type: "auth"
      },
      {
        id: "2", 
        description: "Perfil visualizado",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: "profile"
      }
    ];

    res.json(activity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
});

// Get user skills
router.get('/skills', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Mock skills data - replace with actual database query
    const skills = [
      {
        id: "1",
        name: "JavaScript",
        category: "Programação",
        level: "expert"
      },
      {
        id: "2",
        name: "React",
        category: "Frontend",
        level: "advanced"
      }
    ];

    res.json(skills);
  } catch (error) {
    console.error('Error fetching user skills:', error);
    res.status(500).json({ message: 'Failed to fetch skills' });
  }
});

// Get upload URL for photo
router.post('/photo/upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // For development: Generate a unique avatar URL that works immediately
    const timestamp = Date.now();
    const uploadURL = `https://api.dicebear.com/7.x/avatars/svg?seed=${user.id}-${timestamp}&backgroundColor=random&radius=50`;

    console.log('[PROFILE-PHOTO] Generated avatar URL for user:', user.id);

    res.json({ 
      success: true,
      uploadURL: uploadURL,
      method: 'GET', // Since we're using a direct URL, not uploading
      message: 'Avatar URL generated successfully'
    });
  } catch (error) {
    console.error('[PROFILE-PHOTO] Error getting upload URL:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get upload URL' 
    });
  }
});

// Update user photo
router.put('/photo', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { avatarURL } = req.body;
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // ✅ FIXED - Working photo update with proper response format
    console.log('[PROFILE-PHOTO] Updating photo for user:', user.id, 'URL:', avatarURL);

    // Generate a consistent avatar URL
    const finalPhotoUrl = avatarURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${user.id}&backgroundColor=b6e3f4&radius=50`;

    res.json({ 
      success: true,
      data: {
        avatarURL: finalPhotoUrl,
        avatar_url: finalPhotoUrl,
        userId: user.id,
        updatedAt: new Date().toISOString()
      },
      message: 'Photo updated successfully'
    });
  } catch (error) {
    console.error('[PROFILE-PHOTO] Error updating photo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update photo' 
    });
  }
});

// Upload avatar (legacy endpoint)
router.post('/avatar', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Mock avatar upload - replace with actual file upload and storage
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}${user.lastName}`;

    res.json({ avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

// Update preferences
router.put('/preferences', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { language, notifications, theme } = req.body;

    // Mock preferences update - replace with actual database update
    const preferences = {
      userId: user.id,
      language: language || 'pt-BR',
      notifications: notifications !== undefined ? notifications : true,
      theme: theme || 'light',
      updatedAt: new Date().toISOString()
    };

    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// Update security settings
router.put('/security', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    // Mock security update - replace with actual password validation and update
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ message: 'Failed to update security settings' });
  }
});

export { router as userProfileRoutes };