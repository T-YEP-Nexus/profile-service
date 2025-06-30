// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3005';

// Augmenter le timeout pour les tests d'intégration
jest.setTimeout(10000);

// Configuration globale pour les tests
global.console = {
  ...console,
  // Réduire le bruit des logs pendant les tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 