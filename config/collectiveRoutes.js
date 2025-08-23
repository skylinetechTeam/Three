// Configuração das rotas permitidas para táxis coletivos
// Cada rota tem origem e destino específicos

export const COLLECTIVE_ROUTES = [
  {
    id: 'vila_viana_1_maio',
    origin: 'Vila de Viana',
    destination: '1° De Maio',
    price: 500, // AOA
    keywords: ['vila viana', 'viana', '1 maio', 'primeiro maio']
  },
  {
    id: 'kilamba_ponte_amarela',
    origin: 'Kilamba',
    destination: 'Ponte Amarela',
    price: 500,
    keywords: ['kilamba', 'ponte amarela']
  },
  {
    id: '1_maio_golf2',
    origin: '1° De Maio',
    destination: 'Golf 2',
    price: 500,
    keywords: ['1 maio', 'primeiro maio', 'golf 2', 'golf2']
  },
  {
    id: 'sequele_estalagem',
    origin: 'Sequele',
    destination: 'Estalagem',
    price: 500,
    keywords: ['sequele', 'estalagem']
  },
  {
    id: 'golf2_mutamba',
    origin: 'Golf 2',
    destination: 'Mutamba',
    price: 500,
    keywords: ['golf 2', 'golf2', 'mutamba']
  },
  {
    id: 'golf2_benfica',
    origin: 'Golf 2',
    destination: 'Benfica',
    price: 500,
    keywords: ['golf 2', 'golf2', 'benfica']
  },
  {
    id: 'golf2_talatona',
    origin: 'Golf 2',
    destination: 'Talatona',
    price: 500,
    keywords: ['golf 2', 'golf2', 'talatona']
  },
  {
    id: 'benfica_mutamba',
    origin: 'Benfica',
    destination: 'Mutamba',
    price: 500,
    keywords: ['benfica', 'mutamba']
  },
  {
    id: 'kimbango_1_maio',
    origin: 'Kimbango',
    destination: '1° De Maio',
    price: 500,
    keywords: ['kimbango', '1 maio', 'primeiro maio']
  },
  {
    id: 'cuca_vila_viana',
    origin: 'Cuca',
    destination: 'Vila de Viana',
    price: 500,
    keywords: ['cuca', 'vila viana', 'viana']
  },
  {
    id: '1_maio_benfica',
    origin: '1° De Maio',
    destination: 'Benfica',
    price: 500,
    keywords: ['1 maio', 'primeiro maio', 'benfica']
  },
  {
    id: 'golf2_ponte_amarela',
    origin: 'Golf 2',
    destination: 'Ponte Amarela',
    price: 500,
    keywords: ['golf 2', 'golf2', 'ponte amarela']
  },
  {
    id: 'capalanga_golf2',
    origin: 'Capalanga',
    destination: 'Golf 2',
    price: 500,
    keywords: ['capalanga', 'golf 2', 'golf2']
  },
  {
    id: 'kimbango_talatona',
    origin: 'Kimbango',
    destination: 'Talatona',
    price: 500,
    keywords: ['kimbango', 'talatona']
  },
  {
    id: 'desvio_zango_8mil',
    origin: 'Desvio',
    destination: 'Zango Oito Mil',
    price: 500,
    keywords: ['desvio', 'zango 8', 'zango oito mil', 'zango 8000']
  },
  {
    id: 'hoje_yenda_golf2',
    origin: 'Hoje Yenda',
    destination: 'Golf 2',
    price: 500,
    keywords: ['hoje yenda', 'yenda', 'golf 2', 'golf2']
  },
  {
    id: '1_maio_ilha',
    origin: '1° De Maio',
    destination: 'Ilha',
    price: 500,
    keywords: ['1 maio', 'primeiro maio', 'ilha', 'ilha de luanda']
  },
  {
    id: 'camama_zango3',
    origin: 'Camama',
    destination: 'Zango 3',
    price: 500,
    keywords: ['camama', 'zango 3', 'zango3']
  },
  {
    id: 'capalanga_1_maio',
    origin: 'Capalanga',
    destination: '1° De Maio',
    price: 500,
    keywords: ['capalanga', '1 maio', 'primeiro maio']
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

// Função para obter informações da rota
export const getCollectiveRouteInfo = (destinationName) => {
  const route = findCollectiveRoute(destinationName);
  if (!route) return null;
  
  return {
    id: route.id,
    origin: route.origin,
    destination: route.destination,
    price: route.price,
    routeName: `${route.origin} - ${route.destination}`
  };
};

// Função para obter todas as rotas disponíveis (para sugestões)
export const getAllCollectiveRoutes = () => {
  return COLLECTIVE_ROUTES.map(route => ({
    id: route.id,
    name: `${route.origin} - ${route.destination}`,
    origin: route.origin,
    destination: route.destination,
    price: route.price
  }));
};