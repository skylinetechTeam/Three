// Configuração das rotas permitidas para táxis coletivos
// Cada rota tem origem e destino específicos com coordenadas reais

// Coordenadas dos principais locais de Luanda
const LOCATIONS = {
    'Vila de Viana': { lat: -8.9167, lng: 13.3667 },
    '1° De Maio': { lat: -8.8295, lng: 13.2441 },
    'Kilamba': { lat: -8.9833, lng: 13.2167 },
    'Ponte Amarela': { lat: -8.8500, lng: 13.2600 },
    'Golf 2': { lat: -8.8940, lng: 13.2894 },
    'Sequele': { lat: -8.8200, lng: 13.2300 },
    'Estalagem': { lat: -8.8350, lng: 13.2450 },
    'Mutamba': { lat: -8.8390, lng: 13.2894 },
    'Benfica': { lat: -8.8600, lng: 13.2700 },
    'Talatona': { lat: -8.9500, lng: 13.1833 },
    'Kimbango': { lat: -8.8800, lng: 13.3200 },
    'Cuca': { lat: -8.8100, lng: 13.2200 },
    'Capalanga': { lat: -8.8580, lng: 13.3540 },
    'Desvio': { lat: -8.8700, lng: 13.2800 },
    'Zango Oito Mil': { lat: -8.8800, lng: 13.3800 },
    'Hoje Yenda': { lat: -8.8400, lng: 13.2600 },
    'Ilha': { lat: -8.7775, lng: 13.2437 },
    'Camama': { lat: -8.9043, lng: 13.2868 },
    'Zango 3': { lat: -8.8580, lng: 13.3540 }
  };
  
  export const COLLECTIVE_ROUTES = [
    {
      id: 'vila_viana_1_maio',
      origin: 'Vila de Viana',
      destination: '1° De Maio',
      price: 500, // AOA
      keywords: ['vila viana', 'viana', '1 maio', 'primeiro maio'],
      originCoords: LOCATIONS['Vila de Viana'],
      destinationCoords: LOCATIONS['1° De Maio']
    },
    {
      id: 'kilamba_ponte_amarela',
      origin: 'Kilamba',
      destination: 'Ponte Amarela',
      price: 500,
      keywords: ['kilamba', 'ponte amarela'],
      originCoords: LOCATIONS['Kilamba'],
      destinationCoords: LOCATIONS['Ponte Amarela']
    },
    {
      id: '1_maio_golf2',
      origin: '1° De Maio',
      destination: 'Golf 2',
      price: 500,
      keywords: ['1 maio', 'primeiro maio', 'golf 2', 'golf2'],
      originCoords: LOCATIONS['1° De Maio'],
      destinationCoords: LOCATIONS['Golf 2']
    },
    {
      id: 'sequele_estalagem',
      origin: 'Sequele',
      destination: 'Estalagem',
      price: 500,
      keywords: ['sequele', 'estalagem'],
      originCoords: LOCATIONS['Sequele'],
      destinationCoords: LOCATIONS['Estalagem']
    },
    {
      id: 'golf2_mutamba',
      origin: 'Golf 2',
      destination: 'Mutamba',
      price: 500,
      keywords: ['golf 2', 'golf2', 'mutamba'],
      originCoords: LOCATIONS['Golf 2'],
      destinationCoords: LOCATIONS['Mutamba']
    },
    {
      id: 'golf2_benfica',
      origin: 'Golf 2',
      destination: 'Benfica',
      price: 500,
      keywords: ['golf 2', 'golf2', 'benfica'],
      originCoords: LOCATIONS['Golf 2'],
      destinationCoords: LOCATIONS['Benfica']
    },
    {
      id: 'golf2_talatona',
      origin: 'Golf 2',
      destination: 'Talatona',
      price: 500,
      keywords: ['golf 2', 'golf2', 'talatona'],
      originCoords: LOCATIONS['Golf 2'],
      destinationCoords: LOCATIONS['Talatona']
    },
    {
      id: 'benfica_mutamba',
      origin: 'Benfica',
      destination: 'Mutamba',
      price: 500,
      keywords: ['benfica', 'mutamba'],
      originCoords: LOCATIONS['Benfica'],
      destinationCoords: LOCATIONS['Mutamba']
    },
    {
      id: 'kimbango_1_maio',
      origin: 'Kimbango',
      destination: '1° De Maio',
      price: 500,
      keywords: ['kimbango', '1 maio', 'primeiro maio'],
      originCoords: LOCATIONS['Kimbango'],
      destinationCoords: LOCATIONS['1° De Maio']
    },
    {
      id: 'cuca_vila_viana',
      origin: 'Cuca',
      destination: 'Vila de Viana',
      price: 500,
      keywords: ['cuca', 'vila viana', 'viana'],
      originCoords: LOCATIONS['Cuca'],
      destinationCoords: LOCATIONS['Vila de Viana']
    },
    {
      id: '1_maio_benfica',
      origin: '1° De Maio',
      destination: 'Benfica',
      price: 500,
      keywords: ['1 maio', 'primeiro maio', 'benfica'],
      originCoords: LOCATIONS['1° De Maio'],
      destinationCoords: LOCATIONS['Benfica']
    },
    {
      id: 'golf2_ponte_amarela',
      origin: 'Golf 2',
      destination: 'Ponte Amarela',
      price: 500,
      keywords: ['golf 2', 'golf2', 'ponte amarela'],
      originCoords: LOCATIONS['Golf 2'],
      destinationCoords: LOCATIONS['Ponte Amarela']
    },
    {
      id: 'capalanga_golf2',
      origin: 'Capalanga',
      destination: 'Golf 2',
      price: 500,
      keywords: ['capalanga', 'golf 2', 'golf2'],
      originCoords: LOCATIONS['Capalanga'],
      destinationCoords: LOCATIONS['Golf 2']
    },
    {
      id: 'kimbango_talatona',
      origin: 'Kimbango',
      destination: 'Talatona',
      price: 500,
      keywords: ['kimbango', 'talatona'],
      originCoords: LOCATIONS['Kimbango'],
      destinationCoords: LOCATIONS['Talatona']
    },
    {
      id: 'desvio_zango_8mil',
      origin: 'Desvio',
      destination: 'Zango Oito Mil',
      price: 500,
      keywords: ['desvio', 'zango 8', 'zango oito mil', 'zango 8000'],
      originCoords: LOCATIONS['Desvio'],
      destinationCoords: LOCATIONS['Zango Oito Mil']
    },
    {
      id: 'hoje_yenda_golf2',
      origin: 'Hoje Yenda',
      destination: 'Golf 2',
      price: 500,
      keywords: ['hoje yenda', 'yenda', 'golf 2', 'golf2'],
      originCoords: LOCATIONS['Hoje Yenda'],
      destinationCoords: LOCATIONS['Golf 2']
    },
    {
      id: '1_maio_ilha',
      origin: '1° De Maio',
      destination: 'Ilha',
      price: 500,
      keywords: ['1 maio', 'primeiro maio', 'ilha', 'ilha de luanda'],
      originCoords: LOCATIONS['1° De Maio'],
      destinationCoords: LOCATIONS['Ilha']
    },
    {
      id: 'camama_zango3',
      origin: 'Camama',
      destination: 'Zango 3',
      price: 500,
      keywords: ['camama', 'zango 3', 'zango3'],
      originCoords: LOCATIONS['Camama'],
      destinationCoords: LOCATIONS['Zango 3']
    },
    {
      id: 'capalanga_1_maio',
      origin: 'Capalanga',
      destination: '1° De Maio',
      price: 500,
      keywords: ['capalanga', '1 maio', 'primeiro maio'],
      originCoords: LOCATIONS['Capalanga'],
      destinationCoords: LOCATIONS['1° De Maio']
    }
  ];
  
  // Função para encontrar uma rota válida baseada no destino
  export const findCollectiveRoute = (destinationName) => {
    if (!destinationName) return null;
    
    const searchText = destinationName.toLowerCase();
    
    // Procurar por correspondência exata primeiro
    let route = COLLECTIVE_ROUTES.find(route => 
      route.destination.toLowerCase() === searchText ||
      route.origin.toLowerCase() === searchText
    );
    
    // Se não encontrar, procurar por palavras-chave
    if (!route) {
      route = COLLECTIVE_ROUTES.find(route => 
        route.keywords.some(keyword => 
          searchText.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(searchText)
        )
      );
    }
    
    return route;
  };
  
  // Função para verificar se uma rota é válida para coletivos
  export const isValidCollectiveRoute = (destinationName) => {
    return findCollectiveRoute(destinationName) !== null;
  };
  
  // Função para obter o preço de uma rota de coletivo
  export const getCollectiveRoutePrice = (destinationName) => {
    const route = findCollectiveRoute(destinationName);
    return route ? route.price : 500; // Preço padrão se não encontrar
  };
  
  // Função para obter coordenadas de um local
  export const getLocationCoordinates = (locationName) => {
    return LOCATIONS[locationName] || null;
  };
  
  // Função para obter informações da rota
  export const getCollectiveRouteInfo = (destinationName) => {
    const route = findCollectiveRoute(destinationName);
    if (!route) return null;
    
    return {
      id: route.id,
      origin: route.origin,
      destination: route.destination,
      price: route.price,
      routeName: `${route.origin} - ${route.destination}`,
      originCoords: route.originCoords,
      destinationCoords: route.destinationCoords
    };
  };
  
  // Função para obter todas as rotas disponíveis (para sugestões)
  export const getAllCollectiveRoutes = () => {
    return COLLECTIVE_ROUTES.map(route => ({
      id: route.id,
      name: `${route.origin} - ${route.destination}`,
      origin: route.origin,
      destination: route.destination,
      price: route.price,
      originCoords: route.originCoords,
      destinationCoords: route.destinationCoords
    }));
  };
  
  // Função para obter todas as localizações disponíveis
  export const getAllLocations = () => {
    return Object.keys(LOCATIONS).map(name => ({
      name,
      coordinates: LOCATIONS[name]
    }));
  };
  
  // Função para debug - listar todas as coordenadas
  export const logAllCoordinates = () => {
    console.log('📍 COORDENADAS DE TODOS OS LOCAIS:');
    Object.entries(LOCATIONS).forEach(([name, coords]) => {
      console.log(`${name}: lat ${coords.lat}, lng ${coords.lng}`);
    });
  };