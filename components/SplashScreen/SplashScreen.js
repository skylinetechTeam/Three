import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable } from 'react-native';
import 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';



const Stack = createNativeStackNavigator();

const SplashScreen;() {
  return (
    <View style={{ flex: 1 , backgroundColor: 'white' }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="1" screenOptions={{headerShown: false}} >
          <Stack.Screen name="1" component={F} />
          <Stack.Screen name="2" component={F1} />
          <Stack.Screen name="3" component={F2} />
          <Stack.Screen name="4" component={F3} />
          <Stack.Screen name="5" component={F4} />  
          <Stack.Screen name="Login" component={LoginScreen}/>        
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </View>
  );
}
function F({ navigation }) {
   React.useEffect(() => {
     const timer = setTimeout(() => {
       navigation.replace('2'); 
     }, 3000);
 
     return () => clearTimeout(timer);
   }, [navigation]);
 
   return (
     <View style={{ flex: 1, backgroundColor: '#004AAD' }}>
         <View style={{flex:0.75, alignItems: 'flex-start', marginBottom: 20}}>
          <Image
          style={{height:'auto', width:'100%'}}
          source={require('/assets/Ellipse 820.png')}
          />
         </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            style={{ width: 172, height: 220 }}
             source={require('/assets/logo.png')}
          />
         </View>
         <View style={{flex:1}}>
          <View style={{ flex: 1, alignItems: 'center', }}>
            <Text style={{fontSize: 30,fontWeight:'bold', color:'white'}}>THREE</Text>
            <View>
              <View style={{flex:2}}>
              </View>
              <View style={{flex:1}}>
              </View>
            </View>
          </View><View style={{flex:1}}/>
         </View>
     </View>
   );
}
function F1({ navigation}) {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 20}}>
      <View style={{height:16}}/>
      <Pressable onPress={() => navigation.navigate('3')}
        style={{ flex: 1, flexDirection: 'column', backgroundColor: 'white' }}>
        <View style={{marginTop: 40, flex:1}}>
          <Image
            style={{ width: 356, height: 276, alignSelf: 'center' }}
            source={require('/assets/Anywhere you are.png')} />
        </View>
<View style={{ alignItems: 'center',marginTop:210 }}>
  <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>
    Toque, Partiu!
  </Text>

  <Text style={{ fontSize: 16, textAlign: 'center', paddingHorizontal: 50, color: 'gray' }}>
    Chame um táxi em segundos.
    Sem espera, sem enrolação. Você toca, a gente vai.
    Seu destino começa com um clique.
  </Text>
</View>
        <View style={{flex:1.5}}></View>
      </Pressable>      
    </View>
  );
}
function F2({ navigation}) {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 20 }}>
      <Pressable style={{ alignSelf: 'flex-end' }} onPress={() => navigation.navigate('2')}>
        <Text style={{ color: 'black', fontSize: 16 ,marginTop:20}}>Voltar</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('4')}
        style={{ flex: 1, flexDirection: 'column', backgroundColor: 'white' }}>
        <View style={{marginTop: 40, flex:1}}>
          <Image
            style={{ width: 356, height: 276, alignSelf: 'center' }}
            source={require('/assets/At anytime.png')} />
        </View>
        <View style={{ alignItems: 'center', padding: 20, marginTop:210}}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>
            Segurança
          </Text>
          <Text style={{ fontSize: 16, textAlign: 'center', paddingHorizontal: 50, color: 'gray'  }}>
            Do início ao fim, a gente cuida de você.{'\n'}
            Corridas monitoradas, motoristas avaliados e suporte na palma da mão.
          </Text>
        </View>
        <View style={{flex:1.5}}></View>
      </Pressable>      
    </View>
  );
}
function F3({ navigation}) {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 20 }}>
      <Pressable style={{ alignSelf: 'flex-end' }} onPress={() => navigation.navigate('3')}>
        <Text style={{ color: 'black', fontSize: 16, marginTop:20 }}>Voltar</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('5')}
         style={{ flex: 1, flexDirection: 'column', backgroundColor: 'white' }}>
        <View style={{marginTop: 40, flex:1}}>
          <Image
            style={{ width: 356, height: 276, alignSelf: 'center' }}
            source={require('/assets/Frame 1.png')} />
        </View>
        <View style={{ alignItems: 'center', padding: 20, marginTop:210 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>
            Pague do seu jeito
          </Text>
          <Text style={{ fontSize: 16, textAlign: 'center', paddingHorizontal: 50, color: 'gray'  }}>
            Cartão? Dinheiro? Tudo certo{"."}
            Sem complicação na hora de pagar{"."}
            Você escolhe, a corrida agradece.
          </Text>
        </View>
        <View style={{flex:1.5}}/>
      </Pressable>      
    </View>
  );
}
function F4({ navigation}) {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 20 }}>
      <Pressable style={{ alignSelf: 'flex-end' }} onPress={() => navigation.navigate('4')}>
        <Text style={{ color: 'black', fontSize: 16 ,marginTop:20}}>Voltar</Text>
      </Pressable>
      <View
        style={{ flex: 1, flexDirection: 'column', backgroundColor: 'white' }}>  
        <View style={{marginTop: 40, flex:1}}>
          <Image
            style={{ width: 356, height: 276, alignSelf: 'center' }}
            source={require('/assets/Welcome Screen.png')} 
          />
        </View>
        <View style={{ alignItems: 'center', padding: 20, marginTop:210 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>
            Bem-vindo
          </Text>
          <Text style={{ fontSize: 16, textAlign: 'center', paddingHorizontal: 40, color: 'gray' }}>
            Tenha uma melhor experiência de compartilhamento.
          </Text>
        </View>
        <View style={{flex:1.5}}></View>
          <Pressable onPress={() => navigation.navigate('1')}>   {/*Tela de criar conta*/}
            <View style={{ backgroundColor: '#1546eb', padding: 15, borderRadius: 5, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 16 }}>
                Criar conta
              </Text>
            </View>
          </Pressable> 
          <Pressable onPress={() => navigation.navigate('1')}>    {/*Tela de login*/}
            <View style={{ marginTop:8,marginBottom:40, backgroundColor: 'white',
                         padding: 15, borderRadius: 5, alignItems: 'center',
                         borderWidth:5,borderColor:'#1546eb' 
                        }}>
              <Text style={{ color: '#1546eb', fontSize: 16 }}>
                Entrar
              </Text>
            </View>
          </Pressable>                
         </View>    
    </View>
  );
}

export default SplashScreen; 
