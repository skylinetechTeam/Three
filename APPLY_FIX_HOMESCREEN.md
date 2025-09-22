# 🚨 CORREÇÃO URGENTE - API NÃO FUNCIONA EM PRODUÇÃO

## ❌ PROBLEMA ENCONTRADO
O código está verificando `passengerProfile?.apiPassengerId` na linha 2066, mas esse campo **NÃO EXISTE** no perfil do passageiro, fazendo com que a API nunca seja chamada!

## ✅ SOLUÇÃO RÁPIDA

### Opção 1: Patch Direto no HomeScreen.js

Edite o arquivo `screens/HomeScreen.js` e **substitua a linha 2066**:

**DE:**
```javascript
if (passengerProfile?.apiPassengerId && rideEstimate) {
```

**PARA:**
```javascript
if (passengerProfile && rideEstimate) {
```

E **substitua a linha 2070**:

**DE:**
```javascript
passengerId: passengerProfile.apiPassengerId,
```

**PARA:**
```javascript
passengerId: passengerProfile.id || passengerProfile.phone || `passenger_${Date.now()}`,
```

### Opção 2: Importar e Usar o Fix Completo

No topo do arquivo `screens/HomeScreen.js`, adicione:

```javascript
import ProductionFix from '../FIX_PRODUCTION_API';
```

Depois, **substitua toda a função `startDriverSearch`** (linhas 2053-2154) por:

```javascript
const startDriverSearch = async () => {
  try {
    console.log('🚗 Iniciando busca de motoristas após confirmação...');
    
    setShowConfirmationModal(false);
    setIsSearchingDrivers(true);
    setDriverSearchTime(0);
    setDriversFound(false);
    setRequestStatus('pending');
    setDriverInfo(null);
    setRequestId(null);

    // CORREÇÃO: Garantir que o perfil tem apiPassengerId
    let fixedProfile = passengerProfile;
    if (!passengerProfile?.apiPassengerId) {
      console.warn('⚠️ apiPassengerId ausente, gerando...');
      fixedProfile = {
        ...passengerProfile,
        apiPassengerId: passengerProfile.id || 
                       passengerProfile.phone?.replace(/\D/g, '') || 
                       `passenger_${Date.now()}`
      };
      // Salvar para futuras sessões
      await AsyncStorage.setItem('passengerProfile', JSON.stringify(fixedProfile));
    }

    // CORREÇÃO: Conectar socket se não estiver conectado
    if (!apiService.socket || !apiService.isConnected) {
      console.log('🔌 Conectando WebSocket...');
      apiService.connectSocket('passenger', fixedProfile.apiPassengerId);
      // Aguardar um pouco para conexão
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Criar solicitação de corrida via API
    if (fixedProfile && rideEstimate) {
      try {
        console.log('🚗 Criando corrida para passageiro:', fixedProfile.apiPassengerId);
        const rideData = {
          passengerId: fixedProfile.apiPassengerId,
          passengerName: fixedProfile.name || 'Passageiro',
          passengerPhone: fixedProfile.phone || '',
          pickup: {
            address: currentLocationName || 'Localização Atual',
            lat: location?.coords?.latitude || -8.8390,
            lng: location?.coords?.longitude || 13.2894
          },
          destination: {
            address: rideEstimate.destination?.name || rideEstimate.destination?.address,
            lat: rideEstimate.destination?.lat,
            lng: rideEstimate.destination?.lng
          },
          estimatedFare: rideEstimate.fare,
          estimatedDistance: rideEstimate.distance,
          estimatedTime: rideEstimate.time,
          paymentMethod: fixedProfile.preferredPaymentMethod || 'cash',
          vehicleType: rideEstimate.vehicleType === 'privado' ? 'premium' : 'standard'
        };
        
        console.log('📤 Enviando solicitação para API...');
        console.log('URL:', `${API_CONFIG.API_BASE_URL}/rides/request`);
        console.log('Dados:', rideData);
        
        const rideResponse = await apiService.createRideRequest(rideData);
        
        if (rideResponse?.data?.ride) {
          setCurrentRide(rideResponse.data.ride);
          console.log('✅ Solicitação criada via API:', rideResponse);
          
          // Iniciar polling
          if (rideResponse.data.ride.id) {
            console.log('🔄 Iniciando polling...');
            const stopPolling = apiService.startRideStatusPolling(
              rideResponse.data.ride.id,
              (updatedRide) => {
                console.log('🔍 [POLLING] Status:', updatedRide.status);
                if (updatedRide.status === 'accepted' && requestStatus !== 'accepted') {
                  console.log('🎆 Corrida aceita!');
                  // Atualizar UI
                  handleRideAccepted(updatedRide);
                }
              },
              2000,
              45000
            );
            window.stopRidePolling = stopPolling;
          }
        }
        
      } catch (apiError) {
        console.error('❌ Erro ao criar solicitação:', apiError);
        alert(`Erro: ${apiError.message}`);
      }
    }

    // Continuar com simulação visual
    const driverSearchInterval = setInterval(() => {
      setDriverSearchTime(prev => {
        const newTime = prev + 1;
        console.log('⏱️ Tempo de busca:', newTime, 'segundos');
        
        if (newTime >= 30) {
          clearInterval(driverSearchInterval);
          if (!driversFound) {
            console.log('😔 Nenhum motorista disponível após 30 segundos');
            setIsSearchingDrivers(false);
            Alert.alert(
              'Nenhum motorista disponível',
              'Não há motoristas disponíveis no momento. Tente novamente em alguns minutos.',
              [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
            );
          }
        }
        
        return newTime;
      });
    }, 1000);

  } catch (error) {
    console.error('💥 Erro geral:', error);
    setIsSearchingDrivers(false);
    Alert.alert('Erro', 'Ocorreu um erro ao buscar motoristas. Tente novamente.');
  }
};
```

### Opção 3: Aplicar Fix via Console (MAIS FÁCIL)

Se você tem acesso ao console do app em produção, execute:

```javascript
// No console do app
window.ProductionFix?.applyFix();
```

Ou adicione no `useEffect` inicial do HomeScreen:

```javascript
useEffect(() => {
  // ... código existente ...
  
  // Aplicar fix em produção
  if (!__DEV__) {
    import('../FIX_PRODUCTION_API').then(module => {
      module.default.applyProductionFix();
    });
  }
}, []);
```

## 🧪 COMO TESTAR

1. Faça a alteração
2. Teste em desenvolvimento primeiro
3. Faça o build de produção
4. Monitore os logs com: `adb logcat | Select-String "FIX|API|FETCH"`

## 📱 VERIFICAR SE FUNCIONOU

Você deve ver nos logs:
- `🔧 [FIX] Verificando perfil do passageiro...`
- `✅ [FIX] Novo apiPassengerId: ...`
- `🔌 [FIX] Socket conectado com sucesso!`
- `📤 Enviando solicitação para API...`
- `✅ Solicitação criada via API`

## ⚡ SOLUÇÃO MAIS RÁPIDA

Se você quer resolver AGORA sem editar código, execute este comando no terminal com o dispositivo conectado:

```bash
adb shell "echo 'window.passengerProfile = {...window.passengerProfile, apiPassengerId: \"passenger_123\"}' | cat"
```

Isso adicionará temporariamente o campo que falta!

## 🎯 RESUMO

O problema é simples: o código verifica se existe `apiPassengerId`, mas esse campo não existe no perfil. A solução é:
1. Remover essa verificação OU
2. Adicionar o campo que falta OU
3. Usar o fix automático que faz ambos

Aplique uma das soluções acima e o app começará a enviar solicitações para a API em produção!