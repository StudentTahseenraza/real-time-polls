import { body, param, validationResult } from 'express-validator';

// Validation rules for poll creation
export const validatePollCreation = [
  body('question')
    .notEmpty()
    .withMessage('Question is required')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Question must be between 3 and 500 characters'),
  
  body('options')
    .isArray()
    .withMessage('Options must be an array')
    .custom((options) => {
      if (options.length < 2) {
        throw new Error('At least 2 options are required');
      }
      if (options.length > 10) {
        throw new Error('Maximum 10 options allowed');
      }
      
      const validOptions = options.filter(opt => 
        opt && typeof opt === 'string' && opt.trim().length > 0
      );
      
      if (validOptions.length < 2) {
        throw new Error('At least 2 valid options are required');
      }
      
      if (validOptions.some(opt => opt.length > 200)) {
        throw new Error('Each option must be less than 200 characters');
      }
      
      // Check for duplicate options
      const uniqueOptions = new Set(validOptions.map(opt => opt.toLowerCase().trim()));
      if (uniqueOptions.size !== validOptions.length) {
        throw new Error('Duplicate options are not allowed');
      }
      
      return true;
    }),
  
  // Custom validation middleware to check results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];

// Validation for poll ID parameter
export const validatePollId = [
  param('pollId')
    .isString()
    .isLength({ min: 8, max: 8 })
    .withMessage('Invalid poll ID format')
    .matches(/^[a-f0-9]+$/i)
    .withMessage('Poll ID must be alphanumeric'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];