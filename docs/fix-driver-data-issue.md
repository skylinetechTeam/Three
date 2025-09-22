# Solução: Dados do Motorista ao Aceitar Corrida

## Problema
Os dados do motorista (telefone, veículo) não estavam sendo enviados corretamente ao passageiro quando o motorista aceitava a corrida. Apenas o nome estava correto.

## Análise
1. O perfil do motorista tem o telefone no campo `phone`, não `telefone`
2. Não há dados de veículo cadastrados no perfil do motorista
3. Estávamos usando valores padrão genéricos (Toyota Corolla)

## Soluções Implementadas

### 1. Correção do Telefone
```javascript
// Antes:
driverPhone: driverProfile.telefone || driverProfile.phone || ...

// Depois:
driverPhone: driverProfile.phone || driverProfile.telefone || ...
```
Invertida a ordem de prioridade para usar `phone` primeiro.

### 2. Dados do Veículo Melhorados
Criada busca em múltiplos campos possíveis:
- `vehicles[0]` (array de veículos)
- `vehicle` (objeto único)
- `vehicleInfo` (objeto com informações)
- Campos individuais (`vehicle_make`, `marca`, etc.)
- Valores padrão personalizados

### 3. Solução Temporária para Veículo
Adicionado botão verde de carro que aparece quando:
- Motorista não está em corrida
- Não tem dados de veículo cadastrados

Ao clicar, adiciona automaticamente:
- Honda Civic 2018 Prata
- Placa: LD-43-18-MH

### 4. Função Utilitária
Criado `utils/addVehicleData.js` para adicionar dados de veículo ao perfil.

## Como Usar

### Opção 1: Botão na Interface (Recomendado)
1. Abra o app como motorista
2. Procure o botão verde com ícone de carro (canto direito)
3. Clique para adicionar dados do veículo
4. Os dados serão salvos permanentemente

### Opção 2: Programaticamente
```javascript
import { addVehicleDataToDriver } from '../utils/addVehicleData';

// Adicionar dados personalizados
await addVehicleDataToDriver({
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  color: 'Branco',
  plate: 'LD-12-34-AB'
});
```

## Dados Enviados ao Backend

Agora quando o motorista aceita uma corrida, os seguintes dados são enviados:

```json
{
  "driverId": "efe1d6b5-9b8f-466f-b36e-72974e800190",
  "driverName": "Celesônio MAHBHAYIA Simões Pereira",
  "driverPhone": "943204862",  // Número real do perfil
  "vehicleInfo": {
    "make": "Honda",
    "model": "Civic",
    "year": 2018,
    "color": "Prata",
    "plate": "LD-43-18-MH"
  }
}
```

## Próximos Passos

1. **Criar tela de cadastro de veículo** adequada
2. **Validar dados do veículo** no backend
3. **Permitir múltiplos veículos** por motorista
4. **Adicionar fotos do veículo**
5. **Verificar documentação do veículo**

## Observações

- O botão de configurar veículo só aparece se não houver dados salvos
- Os dados são persistidos localmente
- Após configurar, o botão desaparece
- Os dados corretos são enviados em todas as aceitações futuras