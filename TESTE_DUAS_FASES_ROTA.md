# Como Testar a Funcionalidade de Rotas em Duas Fases

## Problema Identificado

Pelos logs, vejo que a funcionalidade ainda não está sendo ativada. Implementei várias melhorias para garantir que funcione:

## Melhorias Implementadas

### 1. Logs Detalhados
- Adicionado logs completos no DriverMapScreen quando motorista inicia corrida
- Logs no apiService para rastrear eventos WebSocket
- Função de debug no HomeScreen

### 2. Emissor Manual de Eventos
- DriverMapScreen agora emite evento `ride_started_manual` via WebSocket
- Executa callbacks localmente como backup
- Handler no apiService para processar eventos manuais

### 3. Botões de Teste Melhorados
- Botão "Testar Iniciar" (laranja) - simula o evento ride_started
- Botão "Debug" (roxo) - mostra estado completo da aplicação

## Como Testar

### Passo 1: Preparação
1. Abra o app como **CLIENTE** (HomeScreen)
2. Faça uma solicitação de corrida
3. Aguarde um motorista aceitar

### Passo 2: Verificar Estado
1. Quando motorista aceitar, você deve ver:
   - Status "Motorista a caminho"
   - Rota verde do motorista até você
   - Botões de teste aparecem (desenvolvimento)

### Passo 3: Testar a Funcionalidade

#### Opção A - Teste Manual (Recomendado)
1. Clique no botão **"Debug"** (roxo) primeiro
2. Verifique os logs no console:
   ```
   🔍 DEBUG Estado completo: {
     requestStatus: "accepted",
     driverInfo: {...},
     selectedDestination: {...},
     callbacksRegistered: true,
     socketConnected: true
   }
   ```
3. Clique no botão **"Testar Iniciar"** (laranja)
4. Verifique os logs:
   ```
   🧪 TESTE: Simulando evento ride_started
   📊 Estado atual: ...
   🎯 Dados do teste: ...
   ✅ Executando callbacks ride_started...
   ```

#### Opção B - Teste Real com Motorista
1. Abra o app como **MOTORISTA** (DriverMapScreen)
2. Aceite a corrida do cliente
3. Navegue até o local do cliente
4. Clique em "Chegou ao Local"
5. Clique em "Passageiro Embarcou"
6. Verifique logs:
   ```
   🚗 Iniciando corrida via API: ...
   ✅ Corrida iniciada com sucesso via API
   📡 Emitindo evento ride_started via WebSocket manual...
   ```

### Passo 4: Verificar Resultado
Após ativar a funcionalidade, no cliente deve acontecer:

1. **Estado muda**: `driverArrived` vira `true`
2. **Mapa atualiza**: 
   - Remove marcador do motorista (linha verde desaparece)
   - Mostra nova rota do cliente ao destino (linha azul)
3. **Toast aparece**: "Corrida Iniciada - Motorista chegou! Seguindo para o destino."
4. **Status muda**: "Motorista chegou - Indo ao destino"

### Logs Esperados

```bash
# No Cliente (HomeScreen):
🚗 Corrida iniciada: {...}
🎯 Corrida iniciada! Mudando para rota cliente->destino
🗺️ Atualizando mapa para mostrar rota ao destino após início da corrida

# No Motorista (DriverMapScreen):
🚗 Iniciando corrida via API: {...}
✅ Corrida iniciada com sucesso via API
📡 Emitindo evento ride_started via WebSocket manual...

# No ApiService:
🚗 [ApiService] ride_started_manual recebido: {...}
🔔 [ApiService] Tentando executar callbacks para: ride_started
▶️ [ApiService] Executando 1 callbacks para ride_started
```

## Solução de Problemas

### Problema: Botões de teste não aparecem
- **Causa**: App não está em modo desenvolvimento
- **Solução**: Certifique-se que `__DEV__` está ativo

### Problema: Callback não encontrado
- **Logs**: `⚠️ Callback ride_started não encontrado!`
- **Causa**: Eventos não foram registrados
- **Solução**: Reinicie o app ou verifique conexão WebSocket

### Problema: WebSocket não conectado
- **Logs**: `socketConnected: false`
- **Causa**: Problema de rede ou backend
- **Solução**: Use o teste manual que não depende do WebSocket

### Problema: Mapa não atualiza
- **Causa**: `selectedDestination` não está definido
- **Solução**: A função agora usa dados da corrida como fallback

## Verificação Final

Para confirmar que está funcionando:

1. **Antes**: Mapa mostra motorista → cliente (linha verde)
2. **Depois**: Mapa mostra cliente → destino (linha azul)
3. **Status**: Muda de "a caminho" para "indo ao destino"
4. **Toast**: Aparece confirmação de corrida iniciada

## Próximos Passos

Se ainda não funcionar:
1. Use os botões de debug para verificar estado
2. Verifique logs detalhados
3. Teste com WebSocket desconectado (função deve funcionar local)
4. Verifique se backend está enviando evento `ride_started` corretamente