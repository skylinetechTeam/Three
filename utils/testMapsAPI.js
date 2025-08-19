import { getHereApiKey, getDefaultLocation } from '../config/maps';

export const testHereMapsAPI = async () => {
  const apiKey = getHereApiKey();
  const defaultLocation = getDefaultLocation();
  
  console.log('🧪 Testing HERE Maps API...');
  console.log('🔑 API Key:', apiKey ? 'Present' : 'Missing');
  console.log('📍 Default Location:', defaultLocation);
  
  try {
    // Test the search API
    const searchUrl = `https://discover.search.hereapi.com/v1/discover?apikey=${apiKey}&q=Luanda&at=${defaultLocation.latitude},${defaultLocation.longitude}&limit=1`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (response.ok && data.items && data.items.length > 0) {
      console.log('✅ HERE Maps API is working correctly');
      console.log('📡 Response:', data);
      return { success: true, data };
    } else {
      console.log('❌ HERE Maps API returned an error');
      console.log('📡 Response:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log('❌ HERE Maps API test failed');
    console.log('📡 Error:', error);
    return { success: false, error: error.message };
  }
};

export const testMapHTML = () => {
  const apiKey = getHereApiKey();
  const defaultLocation = getDefaultLocation();
  
  const testHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HERE Map Test</title>
        <script type="text/javascript" src="https://js.api.here.com/v3/3.1/mapsjs-core.js"></script>
        <script type="text/javascript" src="https://js.api.here.com/v3/3.1/mapsjs-service.js"></script>
        <script type="text/javascript" src="https://js.api.here.com/v3/3.1/mapsjs-ui.js"></script>
        <script type="text/javascript" src="https://js.api.here.com/v3/3.1/mapsjs-mapevents.js"></script>
        <link rel="stylesheet" type="text/css" href="https://js.api.here.com/v3/3.1/mapsjs-ui.css" />
        <style>
            body, html { margin: 0; padding: 0; height: 100%; }
            #mapContainer { height: 100%; width: 100%; }
        </style>
    </head>
    <body>
        <div id="mapContainer"></div>
        
        <script>
            console.log('🧪 Testing HERE Maps initialization...');
            
            try {
                const platform = new H.service.Platform({
                    'apikey': '${apiKey}'
                });
                console.log('✅ Platform created successfully');
                
                const defaultLayers = platform.createDefaultLayers();
                console.log('✅ Default layers created successfully');
                
                const map = new H.Map(
                  document.getElementById('mapContainer'),
                  defaultLayers.raster.normal.map,
                  {
                    zoom: 15,
                    center: { lat: ${defaultLocation.latitude}, lng: ${defaultLocation.longitude} },
                    pixelRatio: window.devicePixelRatio || 1,
                    engineType: H.map.render.RenderEngine.EngineType.RASTER
                  }
                );
                console.log('✅ Map created successfully');
                
                const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
                const ui = H.ui.UI.createDefault(map, defaultLayers);
                console.log('✅ Map interactions enabled successfully');
                
                // Test marker creation
                const marker = new H.map.Marker({ lat: ${defaultLocation.latitude}, lng: ${defaultLocation.longitude} });
                map.addObject(marker);
                console.log('✅ Marker added successfully');
                
                console.log('🎉 All tests passed! HERE Maps is working correctly.');
                
            } catch (error) {
                console.error('❌ HERE Maps test failed:', error);
                document.body.innerHTML = '<h1>HERE Maps Test Failed</h1><p>' + error.message + '</p>';
            }
        </script>
    </body>
    </html>
  `;
  
  return testHTML;
};