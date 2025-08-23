// ✅ TESTE SIMPLES - CommonJS format para garantir compatibilidade

const express = require('express');
const router = express.Router();

console.log('🔥🔥🔥 [CUSTOM-FIELDS-TEST] ROUTER CARREGANDO COM SUCESSO! 🔥🔥🔥');

// Rota simples de teste
router.get('/fields/:moduleType', (req, res) => {
  console.log('🔥🔥🔥 [CUSTOM-FIELDS-TEST] GET /fields/:moduleType FUNCIONANDO!', req.params.moduleType);
  res.json({
    success: true,
    message: `Custom fields for ${req.params.moduleType} - ROUTER WORKING!`,
    data: []
  });
});

router.post('/fields', (req, res) => {
  console.log('🔥🔥🔥 [CUSTOM-FIELDS-TEST] POST /fields FUNCIONANDO! - FIELD CREATION WORKING!');
  res.json({
    success: true,
    message: 'Field created successfully - ROUTER TEST!',
    data: { id: 'test-field' }
  });
});

console.log('🔥🔥🔥 [CUSTOM-FIELDS-TEST] TODAS AS ROTAS REGISTRADAS! 🔥🔥🔥');

module.exports = router;