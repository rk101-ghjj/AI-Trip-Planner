const express = require('express');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', auth, (req, res) => {
  // Return clean user profile without sensitive data
  res.json({ 
    message: 'Profile loaded successfully', 
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      accountStatus: 'Active',
      memberSince: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }
  });
});

module.exports = router;


