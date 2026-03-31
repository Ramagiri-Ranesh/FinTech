import {
  sanitizeInput,
  validateEmail,
  validateAmount,
  validateDate,
  isValidObjectId,
  sanitizeQuery,
  generateSecureToken,
} from '@/lib/security';

describe('Security Functions', () => {
  describe('sanitizeInput', () => {
    it('should remove XSS attempts', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<script>');
      expect(sanitizeInput('javascript:alert(1)')).not.toContain('javascript:');
      expect(sanitizeInput('onclick=alert(1)')).not.toContain('onclick=');
    });

    it('should handle normal input', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
      expect(sanitizeInput('test@example.com')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount('500')).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount(-100)).toBe(false);
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount('abc')).toBe(false);
      expect(validateAmount(1000000000)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate correct dates', () => {
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('2025-12-31')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('2024-13-01')).toBe(false);
      expect(validateDate('2024-01-32')).toBe(false);
      expect(validateDate('invalid')).toBe(false);
    });
  });

  describe('isValidObjectId', () => {
    it('should validate MongoDB ObjectIds', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });

    it('should reject invalid ObjectIds', () => {
      expect(isValidObjectId('invalid')).toBe(false);
      expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false);
    });
  });

  describe('sanitizeQuery', () => {
    it('should sanitize string queries', () => {
      const result = sanitizeQuery('<script>alert(1)</script>');
      expect(result).not.toContain('<script>');
    });

    it('should sanitize object queries', () => {
      const query = { name: '<script>test</script>', amount: 100 };
      const result = sanitizeQuery(query);
      expect(result.name).not.toContain('<script>');
      expect(result.amount).toBe(100);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate random tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens of correct length', () => {
      const token = generateSecureToken(32);
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });
});
