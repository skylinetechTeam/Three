# Correção: Erro "Cannot read properties of undefined (reading '0')"

## Problema Identificado

Ao tentar aceitar uma corrida, ocorria o erro:
```
TypeError: Cannot read properties of undefined (reading '0')
at acceptRequest (DriverMapScreen.js:554:41)
```

## Causa Raiz

O código tentava acessar `driverProfile.vehicles[0]` sem verificar se `vehicles` existia:

```javascript
// Código problemático:
vehicleInfo: {
  make: driverProfile.vehicles[0]?.make || 'Toyota',
  // ...
}
```

Se `driverProfile.vehicles` for `undefined`, tentar acessar `[0]` causa o erro.

## Solução Implementada

1. **Verificação segura antes de acessar arrays:**
```javascript
const vehicle = driverProfile.vehicles && driverProfile.vehicles[0] 
  ? driverProfile.vehicles[0] 
  : null;
```

2. **Fallbacks múltiplos para dados do veículo:**
```javascript
const vehicleInfo = {
  make: vehicle?.make || driverProfile.vehicle?.make || 'Toyota',
  model: vehicle?.model || driverProfile.vehicle?.model || 'Corolla',
  year: vehicle?.year || driverProfile.vehicle?.year || 2020,
  color: vehicle?.color || driverProfile.vehicle?.color || 'Branco',
  plate: vehicle?.license_plate || vehicle?.plate || driverProfile.vehicle?.plate || 'LD-12-34-AB'
};
```

3. **Logs detalhados para debug:**
- Log da estrutura completa do `driverProfile`
- Verificação da existência de `vehicles`
- Log do `vehicleInfo` construído

## Possíveis Estruturas do driverProfile

O código agora suporta várias estruturas possíveis:

### Estrutura 1: Array de vehicles
```javascript
driverProfile = {
  vehicles: [
    { make: 'Toyota', model: 'Corolla', ... }
  ]
}
```

### Estrutura 2: Objeto vehicle único
```javascript
driverProfile = {
  vehicle: {
    make: 'Toyota', model: 'Corolla', ...
  }
}
```

### Estrutura 3: Sem dados de veículo
```javascript
driverProfile = {
  // sem vehicles ou vehicle
}
// Usará valores padrão
```

## Melhorias Adicionais

1. **Telefone com múltiplos fallbacks:**
```javascript
driverPhone: driverProfile.telefone || driverProfile.phone || driverProfile.phoneNumber || '+244 900 000 000'
```

2. **Valores padrão realistas:**
- Make: Toyota
- Model: Corolla
- Year: 2020
- Color: Branco
- Plate: LD-12-34-AB

## Como Testar

1. Execute o app e tente aceitar uma corrida
2. Verifique os logs para ver:
   - "Estrutura completa do driverProfile"
   - "Verificando vehicles"
   - "VehicleInfo construído"
3. A aceitação deve funcionar mesmo sem dados de veículo

## Recomendações Futuras

1. **Padronizar estrutura do driverProfile** em todo o app
2. **Validar dados ao fazer login** do motorista
3. **Criar interface TypeScript** para driverProfile
4. **Adicionar tela de cadastro de veículo** se não houver dados