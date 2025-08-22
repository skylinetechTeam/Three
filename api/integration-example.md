# 🔗 Integração da API com React Native

## 1. Instalar Dependências no App

```bash
# No diretório raiz do projeto React Native
npm install socket.io-client axios
```

## 2. Configurar o Serviço da API

Já criamos o arquivo `services/apiService.js` com todas as funções necessárias.

## 3. Integrar na Tela do Motorista

### Atualizar DriverMapScreen.js

```javascript
// No início do arquivo, adicione:
import ApiService from '../services/apiService';

// No componente DriverMapScreen:
export default function DriverMapScreen({ navigation, route }) {
  // ... estados existentes ...
  const [socket, setSocket] = useState(null);
  const [driverId] = useState('driver_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    // Conectar ao WebSocket
    const socketConnection = ApiService.connectSocket('driver', driverId);
    setSocket(socketConnection);

    // Escutar novas solicitações
    if (socketConnection) {
      socketConnection.on('new_ride_request', (data) => {
        console.log('🚖 Nova solicitação recebida:', data.ride);
        
        // Mostrar modal com a solicitação real da API
        setCurrentRequest(data.ride);
        setShowRequestModal(true);
        
        Toast.show({
          type: "info",
          text1: "Nova solicitação!",
          text2: `Corrida para ${data.ride.destination.address}`,
        });
      });

      socketConnection.on('ride_unavailable', (data) => {
        console.log('❌ Corrida não disponível:', data);
        setShowRequestModal(false);
        Toast.show({
          type: "info",
          text1: "Corrida indisponível",
          text2: "Já foi aceita por outro motorista",
        });
      });
    }

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, []);

  // Atualizar função acceptRequest
  const acceptRequest = async () => {
    if (currentRequest) {
      try {
        const driverData = {
          driverId: driverId,
          driverName: driverProfile?.nome || 'Motorista',
          driverPhone: driverProfile?.telefone || '+244 900 000 000',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Corolla',
            year: 2020,
            color: 'Branco',
            plate: 'LD-123-AB'
          }
        };

        // Chamar API para aceitar corrida
        const result = await ApiService.acceptRide(currentRequest.id, driverData);
        
        setActiveRide(result.data);
        setNavigationMode(true);
        setRidePhase('pickup');
        
        Toast.show({
          type: "success",
          text1: "Corrida aceita!",
          text2: `Navegando até ${currentRequest.passengerName}`,
        });
        
        setShowRequestModal(false);
        setCurrentRequest(null);

      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: error.message,
        });
      }
    }
  };

  // Atualizar função simulateArrival
  const simulateArrival = async () => {
    if (ridePhase === 'pickup') {
      // Chegou ao passageiro - iniciar corrida
      try {
        await ApiService.startRide(activeRide.id, driverId, {
          lat: location?.coords.latitude,
          lng: location?.coords.longitude
        });

        Alert.alert(
          'Chegou ao local de embarque',
          'Confirme que o passageiro entrou no veículo.',
          [
            {
              text: 'Passageiro Embarcou',
              onPress: () => {
                setRidePhase('dropoff');
                Toast.show({
                  type: "success",
                  text1: "Corrida iniciada!",
                  text2: "Navegando para o destino",
                });
              }
            }
          ]
        );
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: error.message,
        });
      }
    } else {
      // Chegou ao destino - finalizar corrida
      try {
        await ApiService.completeRide(activeRide.id, driverId, {
          dropoffLocation: {
            lat: location?.coords.latitude,
            lng: location?.coords.longitude
          },
          actualFare: activeRide.estimatedFare,
          paymentConfirmed: true
        });

        Alert.alert(
          'Corrida finalizada',
          'Corrida concluída com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => {
                setActiveRide(null);
                setNavigationMode(false);
                setRidePhase('pickup');
                
                Toast.show({
                  type: "success",
                  text1: "Corrida concluída!",
                  text2: `Você ganhou ${activeRide.estimatedFare} AOA`,
                });
              }
            }
          ]
        );
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: error.message,
        });
      }
    }
  };

  // ... resto do código permanece igual
}
```

## 4. Integrar na Tela do Passageiro

### Criar/Atualizar HomeScreen.js

```javascript
import ApiService from '../services/apiService';

export default function HomeScreen({ navigation }) {
  const [socket, setSocket] = useState(null);
  const [passengerId] = useState('passenger_' + Math.random().toString(36).substr(2, 9));
  const [activeRide, setActiveRide] = useState(null);

  useEffect(() => {
    // Conectar ao WebSocket
    const socketConnection = ApiService.connectSocket('passenger', passengerId);
    setSocket(socketConnection);

    // Escutar eventos de corrida
    if (socketConnection) {
      socketConnection.on('ride_accepted', (data) => {
        console.log('✅ Corrida aceita:', data);
        
        Toast.show({
          type: "success",
          text1: "Motorista encontrado!",
          text2: `${data.driver.name} está a caminho`,
        });
        
        // Atualizar UI com dados do motorista
        setActiveRide(prev => ({
          ...prev,
          driver: data.driver,
          status: 'accepted'
        }));
      });

      socketConnection.on('ride_started', (data) => {
        console.log('🚀 Corrida iniciada:', data);
        
        Toast.show({
          type: "success",
          text1: "Corrida iniciada!",
          text2: "Você está a caminho do destino",
        });
        
        setActiveRide(prev => ({
          ...prev,
          status: 'in_progress'
        }));
      });

      socketConnection.on('ride_completed', (data) => {
        console.log('🏁 Corrida finalizada:', data);
        
        Toast.show({
          type: "success",
          text1: "Corrida finalizada!",
          text2: `Total: ${data.fare} AOA`,
        });
        
        setActiveRide(null);
      });

      socketConnection.on('driver_location_update', (data) => {
        console.log('📍 Localização do motorista:', data.driverLocation);
        // Atualizar mapa com localização do motorista
      });
    }

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, []);

  // Função para solicitar corrida
  const requestRide = async (pickup, destination) => {
    try {
      const distance = ApiService.calculateDistance(
        pickup.lat, pickup.lng, destination.lat, destination.lng
      );
      const estimatedTime = ApiService.estimateTravelTime(distance);
      const estimatedFare = ApiService.calculateEstimatedFare(distance, estimatedTime);

      const rideData = {
        passengerId: passengerId,
        passengerName: 'João Silva', // Pegar do perfil do usuário
        pickup: pickup,
        destination: destination,
        estimatedFare: estimatedFare,
        estimatedDistance: distance,
        estimatedTime: estimatedTime,
        paymentMethod: 'cash' // Pegar da preferência do usuário
      };

      const result = await ApiService.createRideRequest(rideData);
      
      setActiveRide(result.data.ride);
      
      Toast.show({
        type: "success",
        text1: "Corrida solicitada!",
        text2: "Procurando motorista próximo...",
      });

      return result;
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
      throw error;
    }
  };

  // ... resto do componente
}
```

## 5. Exemplo de Uso Completo

### Teste via Postman ou cURL

```bash
# 1. Criar solicitação
curl -X POST http://localhost:3000/api/rides/request \
  -H "Content-Type: application/json" \
  -d '{
    "passengerId": "passenger_123",
    "passengerName": "Maria Santos",
    "pickup": {
      "address": "Rua da Liberdade, 123, Luanda",
      "lat": -8.8390,
      "lng": 13.2894
    },
    "destination": {
      "address": "Shopping Belas, Talatona", 
      "lat": -8.8500,
      "lng": 13.3000
    },
    "estimatedFare": 750,
    "estimatedDistance": 12.5,
    "estimatedTime": 25,
    "paymentMethod": "cash"
  }'

# 2. Aceitar corrida (substitua RIDE_ID pelo ID retornado)
curl -X PUT http://localhost:3000/api/rides/RIDE_ID/accept \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver_456",
    "driverName": "Carlos Silva",
    "driverPhone": "+244 923 456 789"
  }'

# 3. Iniciar corrida
curl -X PUT http://localhost:3000/api/rides/RIDE_ID/start \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver_456",
    "pickupLocation": {"lat": -8.8390, "lng": 13.2894}
  }'

# 4. Finalizar corrida
curl -X PUT http://localhost:3000/api/rides/RIDE_ID/complete \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver_456",
    "dropoffLocation": {"lat": -8.8500, "lng": 13.3000},
    "actualFare": 780,
    "paymentConfirmed": true
  }'
```

## 6. Configurar IP da API

Para usar no dispositivo real, altere no `apiService.js`:

```javascript
// Para usar no dispositivo físico, substitua localhost pelo IP da máquina
const API_BASE_URL = 'http://SEU_IP:3000/api';
const SOCKET_URL = 'http://SEU_IP:3000';

// Exemplo:
// const API_BASE_URL = 'http://192.168.1.100:3000/api';
```

## 7. Recursos da API

✅ **Criação de solicitações** com validação completa
✅ **Sistema de aceitação/rejeição** para motoristas  
✅ **Atualizações em tempo real** via WebSocket
✅ **Rastreamento de localização** durante a corrida
✅ **Gestão completa do ciclo** da corrida
✅ **Cálculo automático** de preços e distâncias
✅ **Sistema de rating** e histórico
✅ **Rate limiting** para segurança
✅ **Logs detalhados** para debugging

A API está **100% funcional** e pronta para uso! 🚀