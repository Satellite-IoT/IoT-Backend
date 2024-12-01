import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  describe('generateKeyPair', () => {
    it('should generate valid key pair', () => {
      const keyPair = service.generateKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.privateKey).toBe('string');

      // 檢查是否為有效的 base64
      expect(() => Buffer.from(keyPair.publicKey, 'base64')).not.toThrow();
      expect(() => Buffer.from(keyPair.privateKey, 'base64')).not.toThrow();
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = service.generateKeyPair();
      const keyPair2 = service.generateKeyPair();

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('sign and verify', () => {
    it('should successfully sign and verify a message', () => {
      const message = 'test message';
      const keyPair = service.generateKeyPair();

      const signature = service.sign(keyPair.privateKey, message);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');

      const isValid = service.verify(keyPair.publicKey, signature, message);
      expect(isValid).toBe(true);
    });

    it('should fail verification with incorrect message', () => {
      const message = 'test message';
      const wrongMessage = 'wrong message';
      const keyPair = service.generateKeyPair();

      const signature = service.sign(keyPair.privateKey, message);
      const isValid = service.verify(keyPair.publicKey, signature, wrongMessage);

      expect(isValid).toBe(false);
    });

    it('should fail verification with incorrect signature', () => {
      const message = 'test message';
      const keyPair = service.generateKeyPair();
      const wrongSignature = 'wrongSignature';

      const isValid = service.verify(keyPair.publicKey, wrongSignature, message);
      expect(isValid).toBe(false);
    });

    it('should fail verification with incorrect public key', () => {
      const message = 'test message';
      const keyPair1 = service.generateKeyPair();
      const keyPair2 = service.generateKeyPair();

      const signature = service.sign(keyPair1.privateKey, message);
      const isValid = service.verify(keyPair2.publicKey, signature, message);

      expect(isValid).toBe(false);
    });

    it('should handle invalid base64 inputs gracefully', () => {
      const message = 'test message';
      const invalidBase64 = 'invalid-base64!@#$';

      expect(() => service.sign(invalidBase64, message)).toThrow();
      expect(service.verify(invalidBase64, invalidBase64, message)).toBe(false);
    });
  });
});
