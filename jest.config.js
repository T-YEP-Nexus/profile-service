module.exports = {
  // Environnement de test
  testEnvironment: 'node',
  
  // Dossiers à ignorer
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Fichiers de test à inclure
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Collecte de couverture de code
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  
  // Répertoire de sortie pour les rapports de couverture
  coverageDirectory: 'coverage',
  
  // Seuil de couverture minimum
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Timeout pour les tests
  testTimeout: 10000,
  
  // Affichage détaillé des erreurs
  verbose: true,
  
  // Configuration pour les variables d'environnement
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}; 